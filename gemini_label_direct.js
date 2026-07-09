const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load config
const envPath = path.join(process.cwd(), 'apps/web/.env.local');
let SUPABASE_URL = 'https://sftfkwswszkugnjqfafm.supabase.co';
let SUPABASE_ANON_KEY = 'sb_publishable_YvABq5BgqJmfJXcf-SvYjA_B-UbiTV_';
let rawKeys = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') SUPABASE_URL = value;
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = value;
      if (key === 'GEMINI_API_KEYS') rawKeys = value;
      if (key === 'GEMINI_API_KEY' && !rawKeys) rawKeys = value;
    }
  }
}

const API_KEYS = rawKeys
  ? rawKeys.split(/[,;\s]+/).map(k => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
  : [];

const ASSIGNEE = process.argv[2] || 'Person A';
let FILTER_PLATFORM = process.argv[3] || 'threads';

// Map 'news' CLI argument to database platform identifier 'news_html'
if (FILTER_PLATFORM === 'news') {
  FILTER_PLATFORM = 'news_html';
} else if (FILTER_PLATFORM === 'google_map') {
  FILTER_PLATFORM = 'google_maps';
}

const BATCH_SIZE = 30; // 30 items per request
const FETCH_LIMIT = 150;
const SUPABASE_WRITE_DELAY_MS = 500; // delay between Supabase write operations

if (API_KEYS.length === 0) {
  console.error('❌ Error: No Gemini API Keys found.');
  process.exit(1);
}

console.log(`🤖 Loaded ${API_KEYS.length} Gemini API Keys.`);
console.log(`Assignee: ${ASSIGNEE}`);
console.log(`Platform: ${FILTER_PLATFORM}`);

// Deferred assignment cleanup queue
const pendingAssignmentKeys = [];

// Track key states across loop runs
const permanentlyBlockedKeys = new Set(); // 403/401 errors (permanent)
const exhaustedKeys = new Map();          // 429 errors (cooldown timestamp map)

function getNextAvailableKeyIndex(currentIndex) {
  let next = currentIndex;
  const now = Date.now();
  for (let i = 0; i < API_KEYS.length; i++) {
    next = (next + 1) % API_KEYS.length;
    if (permanentlyBlockedKeys.has(next)) continue;
    
    const cooldownUntil = exhaustedKeys.get(next);
    if (cooldownUntil && now < cooldownUntil) continue;
    
    return next;
  }
  return -1;
}

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 32);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function request(table, query = '', init = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ''}`;
  const MAX_RETRIES = 12;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...(init.headers || {}),
        },
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const text = await response.text();
        const err = new Error(`Supabase ${table} HTTP ${response.status}: ${text}`);
        err.status = response.status;
        throw err;
      }
      const text = await response.text();
      if (!text) return null;
      return JSON.parse(text);
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;
      // Exponential backoff with jitter: 2s, 4s, 8s, 16s... capped at 60s
      const baseDelay = Math.min(2000 * Math.pow(2, attempt - 1), 60000);
      const jitter = Math.random() * baseDelay * 0.3;
      const delay = Math.round(baseDelay + jitter);
      console.warn(`⚠️ Supabase "${table}" failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);
      console.log(`⏳ Backoff ${(delay / 1000).toFixed(1)}s...`);
      await sleep(delay);
    }
  }
}

const MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-flash'
];

async function callGemini(apiKey, items, type = 'comment') {
  const systemInstruction = `You are a professional social media comment and post classifier in Vietnamese, specializing in customer reviews/feedback for food, beverage, and retail brands.
Analyze the provided ${type}s and label each according to the following fields:
1. relevance: boolean.
   - true: Relevant post/comment, customer feedback, review, inquiry, check-in, or tagging friends to see the product.
   - false: Spam, advertisement, completely unrelated posts/shares, or meaningless gibberish ("GIPHY", "No comment").
2. sentiment: "positive" | "negative" | "neutral".
   - "positive": Expresses satisfaction ("siu ngonnn", "ngon xỉu", "đáng đồng tiền"), or tagging friends to share good vibes.
   - "negative": Complaints about service delay, wrong size, poor quality, bad attitude.
   - "neutral": Informational, neutral questions, or general statements.
3. topic: array of strings. Choose one or more from:
   - "quality": Food/drink taste, quality, size issues, hygiene ("ngon xỉu", "sạch sẽ").
   - "price": Price, expensive, cheap, value for money ("đáng đồng tiền").
   - "service": Staff service, packaging, delivery speed ("đóng gói tốt", "làm hơi lâu").
   - "location": Shop environment, layout, spaces ("mai xuống quán em đi").
   - "promotion": Promotions, vouchers, contests, events.
   - "recruitment": Job listings, recruitment details.
   - "other": Default if no other topics fit.
4. urgency: "none" | "low" | "medium" | "high" | "urgent".
   - "high" / "urgent": Serious complaints, brand attacks.
   - "medium": Ordinary complaints ("làm hơi lâu").
   - "none": Default for positive/neutral comments.
5. intent: "none" | "hot" | "warm" | "cold".
   - "hot": Active buying/inquiry intent ("Quan tâm", "ib shop ơi", "tư vấn tuyển dụng").
   - "warm": General inquiries ("Ủa ly giữ nhiệt bán đâu nhỉ", "Bộ sưu tập này bao nhiêu vậy ạ").
   - "cold": Casual mentions, tag-only comments ("Ly này bn?", "Lê Thị Thu Phương", "Anh Tram Ngoc").
   - "none": Unrelated comments/spam.

Special Rule for Friend Tagging Comments (Only applies to comments):
Comments that consist ONLY of person names (tagging friends, like "Lê Thị Thu Phương", "Nguyễn Mỹ", "@NguyenVanA") or casual invitations ("Trang Nguyễn mai xuống quán em đi =))))))") must be labeled as:
- relevance: true, sentiment: "positive", topic: ["other"], urgency: "none", intent: "cold"

Few-shot Examples:
- "siu ngonnn, Ngon xỉu, Đóng gói tốt, Đáng đồng tiền, Sạch sẽ" -> {"relevance": true, "sentiment": "positive", "topic": ["quality", "price", "service", "location"], "urgency": "none", "intent": "cold"}
- "Làm hơi lâu" -> {"relevance": true, "sentiment": "negative", "topic": ["service"], "urgency": "medium", "intent": "none"}
- "Quan tâm" -> {"relevance": true, "sentiment": "positive", "topic": ["quality"], "urgency": "none", "intent": "hot"}
- "Lê Thị Thu Phương" -> {"relevance": true, "sentiment": "positive", "topic": ["other"], "urgency": "none", "intent": "cold"}
- "Bộ sưu tập này bao nhiêu vậy ạ" -> {"relevance": true, "sentiment": "positive", "topic": ["other"], "urgency": "none", "intent": "warm"}
- "No comment" -> {"relevance": false, "sentiment": "neutral", "topic": ["other"], "urgency": "none", "intent": "none"}

Return a valid JSON array of objects:
{ "index": number, "relevance": boolean, "sentiment": string, "topic": string[], "urgency": string, "intent": string }
Do NOT return markdown, explanation, or any other text. Only return the JSON array.`;

  const itemText = items.map((c, i) => `[Index ${i}]: "${c.text.replace(/"/g, '\\"')}"`).join('\n');
  let lastErr = null;

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${type.toUpperCase()}s to analyze:\n${itemText}` }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        })
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        const err = new Error(`Gemini API ${model} HTTP ${response.status}: ${text}`);
        if (response.status === 403 || response.status === 401) {
          err.isBlocked = true;
          throw err;
        }
        if (response.status === 429 && text.includes('RESOURCE_EXHAUSTED')) {
          err.isQuotaExhausted = true;
        }
        throw err;
      }

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error(`Empty response from Gemini API model ${model}.`);

      try {
        return JSON.parse(rawText.trim());
      } catch (err) {
        console.error(`Failed to parse Gemini output for model ${model}:`, rawText.slice(0, 200));
        throw err;
      }

    } catch (err) {
      if (err.isBlocked) throw err;
      lastErr = err;
      console.warn(`⚠️ Model ${model} failed: ${err.message}. Trying next model...`);
    }
  }

  throw lastErr || new Error('All Gemini models failed.');
}

async function startLabeling() {
  const BATCH_DELAY_MS = 6200;
  const platformPrefix = FILTER_PLATFORM;

  // Flush deferred assignment cleanups in one batch
  async function flushAssignments() {
    if (pendingAssignmentKeys.length === 0) return;
    const keys = pendingAssignmentKeys.splice(0);
    try {
      const CHUNK = 40;
      for (let i = 0; i < keys.length; i += CHUNK) {
        const chunk = keys.slice(i, i + CHUNK);
        const types = [...new Set(chunk.map(k => k.type))];
        for (const type of types) {
          const entityKeys = chunk.filter(k => k.type === type).map(k => k.key);
          const assignments = await request('labeling_assignments', `platform=eq.${FILTER_PLATFORM}&entity_type=eq.${type}&status=in.(unassigned,assigned,updated_review)&entity_key=in.(${entityKeys.map(encodeURIComponent).join(',')})`);
          console.log(`[flushAssignments] Found ${assignments ? assignments.length : 0} assignments to clean up from ${entityKeys.length} keys.`);
          if (assignments && assignments.length > 0) {
            const ids = assignments.map(a => a.assignment_id);
            const now = new Date().toISOString();
            console.log(`[flushAssignments] Updating ${ids.length} assignments to status completed...`);
            await request('labeling_assignments', `assignment_id=in.(${ids.map(encodeURIComponent).join(',')})`, {
              method: 'PATCH', body: JSON.stringify({ status: 'completed', completed_at: now, updated_at: now }),
              headers: { Prefer: 'return=minimal' }
            });
          }
          await sleep(SUPABASE_WRITE_DELAY_MS);
        }
      }
    } catch (e) {
      console.warn(`⚠️ Assignment cleanup failed (non-critical): ${e.message}`);
    }
  }

  while (true) {
    let keyIndex = 0;
    let totalProcessed = 0;
    let keysExhausted = false;

    // Reset daily exhausted keys at start of each outer loop run, keep 403 blocks permanently
    exhaustedKeys.clear();
    console.log(`\n🔄 Starting a new labeling loop run...`);
    console.log(`🔑 Active keys for this run: ${API_KEYS.length - permanentlyBlockedKeys.size}/${API_KEYS.length}`);

    // ==========================================
    // PHASE 1: PROCESS POSTS
    // ==========================================
    console.log(`\n🔍 PHASE 1: Processing posts...`);

    const annotatedPostIds = new Set();
    console.log(`📥 Fetching labeled post IDs from server...`);
    let offset = 0;
    while (true) {
      try {
        const batch = await request('annotations', `assignee=eq.${ASSIGNEE}&platform=eq.${FILTER_PLATFORM}&entity_type=eq.post&status=in.(completed,skipped)&select=post_id&limit=1000&offset=${offset}`);
        if (!batch || batch.length === 0) break;
        for (const a of batch) { if (a.post_id) annotatedPostIds.add(a.post_id); }
        if (batch.length < 1000) break;
        offset += 1000;
      } catch (e) { console.warn(`⚠️ Fetch failed at offset ${offset}: ${e.message}`); break; }
    }
    console.log(`💡 Found ${annotatedPostIds.size} already-labeled posts.`);

    let lastPostId = '';
    let postsExhausted = false;

    while (!postsExhausted) {
      const totalUnavailable = permanentlyBlockedKeys.size + exhaustedKeys.size;
      if (totalUnavailable >= API_KEYS.length) {
        console.warn('⚠️ All API keys are exhausted. Pausing posts phase.');
        keysExhausted = true;
        break;
      }

      console.log(`Fetching posts (cursor: ${lastPostId || 'start'})...`);
      let posts = null;
      let fetchAttempts = 0;
      const cursorFilter = lastPostId ? `&post_id=gt.${encodeURIComponent(lastPostId)}` : '';
      while (fetchAttempts < 5) {
        try {
          posts = await request('posts', `platform=eq.${FILTER_PLATFORM}&select=post_id,payload_json,data_version&order=post_id.asc&limit=${FETCH_LIMIT}${cursorFilter}`);
          break;
        } catch (err) {
          fetchAttempts++;
          console.warn(`⚠️ Error fetching posts (attempt ${fetchAttempts}/5): ${err.message}`);
          if (fetchAttempts >= 5) throw err;
          await sleep(5000);
        }
      }

      if (!posts || posts.length === 0) {
        console.log('✅ Reached the end of posts table.');
        postsExhausted = true;
        break;
      }
      lastPostId = posts[posts.length - 1].post_id;

      for (const p of posts) {
        if (annotatedPostIds.has(p.post_id) || (p.payload_json?.text || p.text || '').trim().length === 0) {
          pendingAssignmentKeys.push({ type: 'post', key: `${platformPrefix}:post:${p.post_id}` });
        }
      }
      if (pendingAssignmentKeys.length >= 150) {
        await flushAssignments();
      }

      const unlabeledPosts = posts.map(p => ({
        ...p,
        text: p.payload_json?.text || p.text || ''
      })).filter(p => !annotatedPostIds.has(p.post_id) && p.text.trim().length > 0);

      console.log(`Found ${unlabeledPosts.length}/${posts.length} unlabeled posts in this chunk.`);
      if (unlabeledPosts.length === 0) {
        await flushAssignments();
        continue;
      }

      const batches = [];
      for (let i = 0; i < unlabeledPosts.length; i += BATCH_SIZE) {
        batches.push(unlabeledPosts.slice(i, i + BATCH_SIZE));
      }

      for (let i = 0; i < batches.length; i++) {
        const totalUnavailable = permanentlyBlockedKeys.size + exhaustedKeys.size;
        if (totalUnavailable >= API_KEYS.length) {
          keysExhausted = true;
          break;
        }

        const batch = batches[i];
        let activeKeyIndex = keyIndex;
        while (permanentlyBlockedKeys.has(activeKeyIndex) || exhaustedKeys.has(activeKeyIndex)) {
          activeKeyIndex = (activeKeyIndex + 1) % API_KEYS.length;
        }
        keyIndex = (activeKeyIndex + 1) % API_KEYS.length;

        let attempts = 0, success = false;
        while (attempts < 5 && !success) {
          const totalUnavailableInner = permanentlyBlockedKeys.size + exhaustedKeys.size;
          if (totalUnavailableInner >= API_KEYS.length) {
            keysExhausted = true;
            break;
          }
          try {
            console.log(`- Post Batch ${i + 1}/${batches.length} | Key[${activeKeyIndex}] | ${batch.length} items`);
            const labels = await callGemini(API_KEYS[activeKeyIndex], batch, 'post');

            const annotationsToUpsert = [], revisionsToInsert = [];
            const now = new Date().toISOString();

            for (let j = 0; j < batch.length; j++) {
              const item = batch[j];
              const lbl = labels.find(l => l.index === j) || { relevance: true, sentiment: 'neutral', topic: ['other'], urgency: 'none', intent: 'none' };
              const mappedEntityKey = `${platformPrefix}:post:${item.post_id}`;
              const annotationId = digest(`${ASSIGNEE}|${mappedEntityKey}`);
              const irrelevant = lbl.relevance === false;

              annotationsToUpsert.push({
                annotation_id: annotationId,
                entity_key: mappedEntityKey,
                platform: FILTER_PLATFORM,
                entity_type: 'post',
                post_id: item.post_id,
                comment_id: null,
                assignee: ASSIGNEE,
                label: JSON.stringify({
                  sentiment: irrelevant ? 'neutral' : (lbl.sentiment || 'neutral'),
                  topic: irrelevant ? ['other'] : (Array.isArray(lbl.topic) ? lbl.topic : ['other']),
                  relevance: typeof lbl.relevance === 'boolean' ? lbl.relevance : true,
                  urgency: irrelevant ? 'none' : (lbl.urgency || 'none'),
                  intent: irrelevant ? 'none' : (lbl.intent || 'none'),
                  skipped: irrelevant
                }),
                note: null, status: 'completed', labeled_version: item.data_version || 1, needs_review: false, updated_at: now
              });

              revisionsToInsert.push({
                revision_id: `${annotationId}_${Date.now()}`,
                annotation_id: annotationId,
                revision: Math.floor(Date.now() / 1000),
                data_version: item.data_version || 1,
                label: annotationsToUpsert[annotationsToUpsert.length - 1].label,
                note: null, annotator: ASSIGNEE, created_at: now
              });
            }

            // Save to Supabase (throttled)
            const S = 50;
            for (let k = 0; k < annotationsToUpsert.length; k += S) {
              await request('annotations', 'on_conflict=entity_key,assignee', {
                method: 'POST', body: JSON.stringify(annotationsToUpsert.slice(k, k + S)),
                headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
              });
              await sleep(SUPABASE_WRITE_DELAY_MS);
              await request('annotation_revisions', '', {
                method: 'POST', body: JSON.stringify(revisionsToInsert.slice(k, k + S)),
                headers: { Prefer: 'return=minimal' }
              });
              await sleep(SUPABASE_WRITE_DELAY_MS);
            }

            // Defer assignment cleanup instead of doing it per-batch
            const postIdsInBatch = batch.map(b => b.post_id);
            for (const id of postIdsInBatch) {
              pendingAssignmentKeys.push({ type: 'post', key: `${platformPrefix}:post:${id}` });
            }

            // Flush assignments every 5 batches
            if (pendingAssignmentKeys.length >= 150) {
              await flushAssignments();
            }

            totalProcessed += batch.length;
            console.log(`  ✅ Done. Total processed: ${totalProcessed}`);
            success = true;

            const nextKey = getNextAvailableKeyIndex(activeKeyIndex);
            if (nextKey !== -1) keyIndex = nextKey;
            await sleep(BATCH_DELAY_MS);

          } catch (err) {
            if (err.isBlocked) {
              permanentlyBlockedKeys.add(activeKeyIndex);
              console.warn(`🔒 Key[${activeKeyIndex}] is blocked (403/401). Permanent blacklist. Remaining keys: ${API_KEYS.length - permanentlyBlockedKeys.size}`);
              const next = getNextAvailableKeyIndex(activeKeyIndex);
              if (next === -1) { keysExhausted = true; break; }
              activeKeyIndex = next;
              continue;
            }
            if (err.message.includes('429')) {
              exhaustedKeys.set(activeKeyIndex, Date.now() + 60000); // 60s cooldown
              console.warn(`⏳ Key[${activeKeyIndex}] got 429: ${err.message}. Cooling down for 60s. Rotating...`);
              
              console.log(`⏳ Sleeping 15s to let shared project rate limits clear...`);
              await sleep(15000); // 15s delay before trying next key to prevent shared project rate limits from failing immediately
              const next = getNextAvailableKeyIndex(activeKeyIndex);
              if (next === -1) {
                console.log(`⏳ All active keys are currently in cooldown. Sleeping 20s...`);
                await sleep(20000);
              } else {
                activeKeyIndex = next;
              }
            } else {
              attempts++;
              console.warn(`⚠️ Batch error (attempt ${attempts}/5): ${err.message}`);
              if (attempts >= 5) break;
              await sleep(3000 * attempts);
            }
          }
        }
      }
    }

    // ==========================================
    // PHASE 2: PROCESS COMMENTS (scan comments table directly, like Phase 1 for posts)
    // ==========================================
    if (!keysExhausted) {
      console.log(`\n🔍 PHASE 2: Processing comments...`);

      const annotatedCommentIds = new Set();
      console.log(`📥 Fetching labeled comment IDs from server...`);
      let offset = 0;
      while (true) {
        try {
          const batch = await request('annotations', `assignee=eq.${ASSIGNEE}&platform=eq.${FILTER_PLATFORM}&entity_type=eq.comment&status=in.(completed,skipped)&select=comment_id&limit=1000&offset=${offset}`);
          if (!batch || batch.length === 0) break;
          for (const a of batch) { if (a.comment_id) annotatedCommentIds.add(a.comment_id); }
          if (batch.length < 1000) break;
          offset += 1000;
        } catch (e) { console.warn(`⚠️ Fetch failed at offset ${offset}: ${e.message}`); break; }
      }
      console.log(`💡 Found ${annotatedCommentIds.size} already-labeled comments.`);

      // Cursor-based pagination over the comments table (same approach as Phase 1 for posts)
      let lastPostId = '';
      let lastCommentId = '';
      let commentsExhausted = false;

      while (!commentsExhausted) {
        const totalUnavailable = permanentlyBlockedKeys.size + exhaustedKeys.size;
        if (totalUnavailable >= API_KEYS.length) {
          console.warn('⚠️ All API keys are exhausted. Pausing comments phase.');
          keysExhausted = true;
          break;
        }

        console.log(`Fetching comments from table (cursor: ${lastPostId || 'start'}/${lastCommentId || 'start'})...`);
        let comments = null;
        let fetchAttempts = 0;
        // Cursor: fetch rows where (post_id, comment_id) > (lastPostId, lastCommentId)
        const cursorFilter = lastPostId
          ? `&or=(post_id.gt.${encodeURIComponent(lastPostId)},and(post_id.eq.${encodeURIComponent(lastPostId)},comment_id.gt.${encodeURIComponent(lastCommentId)}))`
          : '';
        while (fetchAttempts < 5) {
          try {
            comments = await request('comments', `platform=eq.${FILTER_PLATFORM}&select=comment_id,post_id,text,data_version&order=post_id.asc,comment_id.asc&limit=${FETCH_LIMIT}${cursorFilter}`);
            break;
          } catch (err) {
            fetchAttempts++;
            console.warn(`⚠️ Error fetching comments (attempt ${fetchAttempts}/5): ${err.message}`);
            if (fetchAttempts >= 5) throw err;
            await sleep(5000);
          }
        }

        if (!comments || comments.length === 0) {
          console.log('✅ Reached the end of comments table.');
          commentsExhausted = true;
          break;
        }

        // Advance cursor to the last item in this chunk
        lastPostId = comments[comments.length - 1].post_id;
        lastCommentId = comments[comments.length - 1].comment_id;

        // Mark already-labeled or empty comments for assignment cleanup
        for (const c of comments) {
          if (annotatedCommentIds.has(c.comment_id) || (c.text || '').trim().length === 0) {
            pendingAssignmentKeys.push({ type: 'comment', key: `${platformPrefix}:comment:${c.post_id}:${c.comment_id}` });
          }
        }
        if (pendingAssignmentKeys.length >= 150) {
          await flushAssignments();
        }

        const unlabeledComments = comments.filter(
          c => !annotatedCommentIds.has(c.comment_id) && (c.text || '').trim().length > 0
        );

        console.log(`Found ${unlabeledComments.length}/${comments.length} unlabeled comments in this chunk.`);
        if (unlabeledComments.length === 0) {
          await flushAssignments();
          continue;
        }

        const batches = [];
        for (let i = 0; i < unlabeledComments.length; i += BATCH_SIZE) {
          batches.push(unlabeledComments.slice(i, i + BATCH_SIZE));
        }

        for (let i = 0; i < batches.length; i++) {
          const totalUnavailable = permanentlyBlockedKeys.size + exhaustedKeys.size;
          if (totalUnavailable >= API_KEYS.length) {
            keysExhausted = true;
            break;
          }

          const batch = batches[i];
          let activeKeyIndex = keyIndex;
          while (permanentlyBlockedKeys.has(activeKeyIndex) || exhaustedKeys.has(activeKeyIndex)) {
            activeKeyIndex = (activeKeyIndex + 1) % API_KEYS.length;
          }
          keyIndex = (activeKeyIndex + 1) % API_KEYS.length;

          let attempts = 0, success = false;
          while (attempts < 5 && !success) {
            const totalUnavailableInner = permanentlyBlockedKeys.size + exhaustedKeys.size;
            if (totalUnavailableInner >= API_KEYS.length) {
              keysExhausted = true;
              break;
            }
            try {
              console.log(`- Comment Batch ${i + 1}/${batches.length} | Key[${activeKeyIndex}] | ${batch.length} items`);
              const labels = await callGemini(API_KEYS[activeKeyIndex], batch, 'comment');

              const annotationsToUpsert = [], revisionsToInsert = [];
              const now = new Date().toISOString();

              for (let j = 0; j < batch.length; j++) {
                const item = batch[j];
                const lbl = labels.find(l => l.index === j) || { relevance: true, sentiment: 'neutral', topic: ['other'], urgency: 'none', intent: 'none' };
                const mappedEntityKey = `${platformPrefix}:comment:${item.post_id}:${item.comment_id}`;
                const annotationId = digest(`${ASSIGNEE}|${mappedEntityKey}`);
                const irrelevant = lbl.relevance === false;

                annotationsToUpsert.push({
                  annotation_id: annotationId,
                  entity_key: mappedEntityKey,
                  platform: FILTER_PLATFORM,
                  entity_type: 'comment',
                  post_id: item.post_id,
                  comment_id: item.comment_id,
                  assignee: ASSIGNEE,
                  label: JSON.stringify({
                    sentiment: irrelevant ? 'neutral' : (lbl.sentiment || 'neutral'),
                    topic: irrelevant ? ['other'] : (Array.isArray(lbl.topic) ? lbl.topic : ['other']),
                    relevance: typeof lbl.relevance === 'boolean' ? lbl.relevance : true,
                    urgency: irrelevant ? 'none' : (lbl.urgency || 'none'),
                    intent: irrelevant ? 'none' : (lbl.intent || 'none'),
                    skipped: irrelevant
                  }),
                  note: null, status: 'completed', labeled_version: item.data_version || 1, needs_review: false, updated_at: now
                });

                revisionsToInsert.push({
                  revision_id: `${annotationId}_${Date.now()}`,
                  annotation_id: annotationId,
                  revision: Math.floor(Date.now() / 1000),
                  data_version: item.data_version || 1,
                  label: annotationsToUpsert[annotationsToUpsert.length - 1].label,
                  note: null, annotator: ASSIGNEE, created_at: now
                });
              }

              // Save to Supabase (throttled)
              const S = 50;
              for (let k = 0; k < annotationsToUpsert.length; k += S) {
                await request('annotations', 'on_conflict=entity_key,assignee', {
                  method: 'POST', body: JSON.stringify(annotationsToUpsert.slice(k, k + S)),
                  headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
                });
                await sleep(SUPABASE_WRITE_DELAY_MS);
                await request('annotation_revisions', '', {
                  method: 'POST', body: JSON.stringify(revisionsToInsert.slice(k, k + S)),
                  headers: { Prefer: 'return=minimal' }
                });
                await sleep(SUPABASE_WRITE_DELAY_MS);
              }

              // Defer assignment cleanup
              for (const item of batch) {
                pendingAssignmentKeys.push({ type: 'comment', key: `${platformPrefix}:comment:${item.post_id}:${item.comment_id}` });
                // Add to local cache so we don't re-process if seen again
                annotatedCommentIds.add(item.comment_id);
              }

              if (pendingAssignmentKeys.length >= 150) {
                await flushAssignments();
              }

              totalProcessed += batch.length;
              console.log(`  ✅ Done. Total processed: ${totalProcessed}`);
              success = true;

              const nextKey = getNextAvailableKeyIndex(activeKeyIndex);
              if (nextKey !== -1) keyIndex = nextKey;
              await sleep(BATCH_DELAY_MS);

            } catch (err) {
              if (err.isBlocked) {
                permanentlyBlockedKeys.add(activeKeyIndex);
                console.warn(`🔒 Key[${activeKeyIndex}] is blocked (403/401). Permanent blacklist. Remaining keys: ${API_KEYS.length - permanentlyBlockedKeys.size}`);
                const next = getNextAvailableKeyIndex(activeKeyIndex);
                if (next === -1) { keysExhausted = true; break; }
                activeKeyIndex = next;
                continue;
              }
              if (err.message.includes('429')) {
                exhaustedKeys.set(activeKeyIndex, Date.now() + 60000); // 60s cooldown
                console.warn(`⏳ Key[${activeKeyIndex}] got 429: ${err.message}. Cooling down for 60s. Rotating...`);

                console.log(`⏳ Sleeping 15s to let shared project rate limits clear...`);
                await sleep(15000); // 15s delay before trying next key to prevent shared project rate limits from failing immediately
                const next = getNextAvailableKeyIndex(activeKeyIndex);
                if (next === -1) {
                  console.log(`⏳ All active keys are currently in cooldown. Sleeping 20s...`);
                  await sleep(20000);
                } else {
                  activeKeyIndex = next;
                }
              } else {
                attempts++;
                console.warn(`⚠️ Batch error (attempt ${attempts}/5): ${err.message}`);
                if (attempts >= 5) break;
                await sleep(3000 * attempts);
              }
            }
          }
        }
      }
    }

    // Flush any remaining deferred assignments
    await flushAssignments();

    if (keysExhausted) {
      const waitMinutes = 5;
      console.log(`\n⏳ [EXHAUSTED] All keys exhausted daily project quota.`);
      console.log(`⏳ Sleeping for ${waitMinutes} minutes to wait for 24h rolling quota window recovery, then retrying...`);
      await sleep(waitMinutes * 60 * 1000);
    } else {
      console.log(`\n🎉 SUCCESS! All posts and comments on platform "${FILTER_PLATFORM}" have been labeled.`);
      process.exit(0);
    }
  }
}

startLabeling().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
