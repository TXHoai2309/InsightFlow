import {
  Label,
  Person,
  StoredLabel,
  StoredProgress,
  StoredThreadState,
} from '../types';

const DB_NAME = 'insightflow_labeling';
const DB_VERSION = 1;
const LABEL_STORE = 'labels';
const PROGRESS_STORE = 'progress';
const THREAD_STORE = 'thread_states';

const DARK_MODE_KEY = 'insightflow_darkmode';
const PERSON_KEY = 'insightflow_person';
const DAILY_GOAL_KEY = 'insightflow_daily_goal';
const DEFAULT_DAILY_GOAL = 100;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LABEL_STORE)) {
        const store = db.createObjectStore(LABEL_STORE, { keyPath: 'key' });
        store.createIndex('person', 'person');
      }
      if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
        db.createObjectStore(PROGRESS_STORE, { keyPath: 'person' });
      }
      if (!db.objectStoreNames.contains(THREAD_STORE)) {
        const store = db.createObjectStore(THREAD_STORE, { keyPath: 'key' });
        store.createIndex('person', 'person');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Không mở được IndexedDB.'));
  });
  return dbPromise;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
  });
}

function labelStorageKey(person: Person, entityKey: string): string {
  return `${person}|${entityKey}`;
}

function threadStorageKey(person: Person, threadId: string): string {
  return `${person}|${threadId}`;
}

export function getSavedPerson(): Person | null {
  return localStorage.getItem(PERSON_KEY) as Person | null;
}

export function savePerson(person: Person) {
  localStorage.setItem(PERSON_KEY, person);
}

export function getDarkMode(): boolean {
  const saved = localStorage.getItem(DARK_MODE_KEY);
  if (saved !== null) return saved === 'true';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
}

export function saveDarkMode(dark: boolean) {
  localStorage.setItem(DARK_MODE_KEY, String(dark));
}

export function getDailyGoal(): number {
  const saved = localStorage.getItem(DAILY_GOAL_KEY);
  if (saved !== null) {
    const value = Number.parseInt(saved, 10);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return DEFAULT_DAILY_GOAL;
}

export function saveDailyGoal(goal: number) {
  localStorage.setItem(DAILY_GOAL_KEY, String(goal));
}

export async function getAllLabels(person: Person): Promise<Record<string, StoredLabel>> {
  const db = await openDatabase();
  const transaction = db.transaction(LABEL_STORE, 'readonly');
  const index = transaction.objectStore(LABEL_STORE).index('person');
  const rows = await requestResult(index.getAll(person) as IDBRequest<StoredLabel[]>);
  const labels: Record<string, StoredLabel> = {};
  for (const row of rows) labels[row.entity_key] = row;
  return labels;
}

export async function saveLabel(
  person: Person,
  entityKey: string,
  label: Label,
  dataVersion: number,
  skipped = false,
): Promise<StoredLabel> {
  const stored: StoredLabel = {
    ...label,
    key: labelStorageKey(person, entityKey),
    person,
    entity_key: entityKey,
    labeled_by: person,
    labeled_at: new Date().toISOString(),
    skipped,
    data_version: dataVersion,
  };
  const db = await openDatabase();
  const transaction = db.transaction(LABEL_STORE, 'readwrite');
  transaction.objectStore(LABEL_STORE).put(stored);
  await transactionDone(transaction);
  return stored;
}

export async function getProgress(person: Person): Promise<StoredProgress | null> {
  const db = await openDatabase();
  const transaction = db.transaction(PROGRESS_STORE, 'readonly');
  const result = await requestResult(
    transaction.objectStore(PROGRESS_STORE).get(person) as IDBRequest<StoredProgress | undefined>,
  );
  return result ?? null;
}

export async function saveProgress(
  person: Person,
  index: number,
  threadId: string | null,
): Promise<void> {
  const progress: StoredProgress = {
    person,
    current_thread_index: index,
    current_thread_id: threadId,
    last_updated: new Date().toISOString(),
  };
  const db = await openDatabase();
  const transaction = db.transaction(PROGRESS_STORE, 'readwrite');
  transaction.objectStore(PROGRESS_STORE).put(progress);
  await transactionDone(transaction);
}

export async function getThreadStates(person: Person): Promise<Record<string, StoredThreadState>> {
  const db = await openDatabase();
  const transaction = db.transaction(THREAD_STORE, 'readonly');
  const index = transaction.objectStore(THREAD_STORE).index('person');
  const rows = await requestResult(index.getAll(person) as IDBRequest<StoredThreadState[]>);
  const states: Record<string, StoredThreadState> = {};
  for (const row of rows) states[row.thread_id] = row;
  return states;
}

export async function saveThreadState(
  person: Person,
  threadId: string,
  status: StoredThreadState['status'],
  dataVersion: number,
  versionToken: string,
): Promise<StoredThreadState> {
  const state: StoredThreadState = {
    key: threadStorageKey(person, threadId),
    person,
    thread_id: threadId,
    status,
    data_version: dataVersion,
    version_token: versionToken,
    completed_at: new Date().toISOString(),
  };
  const db = await openDatabase();
  const transaction = db.transaction(THREAD_STORE, 'readwrite');
  transaction.objectStore(THREAD_STORE).put(state);
  await transactionDone(transaction);
  return state;
}

export interface LabelStats {
  totalLabeled: number;
  totalSkipped: number;
  positive: number;
  negative: number;
  neutral: number;
  urgent: number;
  todayLabeled: number;
  intentHot: number;
  intentWarm: number;
  intentCold: number;
  intentNone: number;
}

export function computeStats(labels: Record<string, StoredLabel>): LabelStats {
  const today = new Date().toISOString().slice(0, 10);
  const stats: LabelStats = {
    totalLabeled: 0,
    totalSkipped: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    urgent: 0,
    todayLabeled: 0,
    intentHot: 0,
    intentWarm: 0,
    intentCold: 0,
    intentNone: 0,
  };

  for (const entry of Object.values(labels)) {
    if (entry.skipped) {
      stats.totalSkipped++;
      continue;
    }
    stats.totalLabeled++;
    if (entry.sentiment === 'positive') stats.positive++;
    else if (entry.sentiment === 'negative') stats.negative++;
    else if (entry.sentiment === 'neutral') stats.neutral++;
    if (entry.urgency === 'urgent') stats.urgent++;
    if (entry.labeled_at.startsWith(today)) stats.todayLabeled++;
    if (entry.intent === 'hot') stats.intentHot++;
    else if (entry.intent === 'warm') stats.intentWarm++;
    else if (entry.intent === 'cold') stats.intentCold++;
    else if (entry.intent === 'none') stats.intentNone++;
  }
  return stats;
}
