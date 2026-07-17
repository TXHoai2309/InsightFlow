import React from 'react';
import { Person, PERSONS } from '../types';

interface PersonModalProps {
  onSelect: (person: Person) => void;
}

const PERSON_META: Record<Person, { icon: string; range: string }> = {
  'Person A': { icon: '👤', range: 'data_person_A.json' },
  'Person B': { icon: '👥', range: 'data_person_B.json' },
  'Person C': { icon: '🧑‍💻', range: 'data_person_C.json' },
  'Person D': { icon: '🧑‍🎨', range: 'data_person_D.json' },
};

export default function PersonModal({ onSelect }: PersonModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card max-w-sm w-full mx-4 p-8 flex flex-col items-center gap-6 shadow-2xl">
        {/* Logo */}
        <div className="text-4xl">🏷️</div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            InsightFlow Labeling
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            AI Media Monitoring — Gán nhãn dữ liệu
          </p>
        </div>

        <div className="w-full">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
            Chọn người gán nhãn:
          </p>
          <div className="flex flex-col gap-2.5">
            {PERSONS.map(person => {
              const meta = PERSON_META[person];
              return (
                <button
                  key={person}
                  onClick={() => onSelect(person)}
                  className="w-full py-3 px-5 rounded-xl border-2 border-gray-200 dark:border-surface-600
                             hover:border-blue-500 dark:hover:border-blue-500
                             hover:bg-blue-50 dark:hover:bg-blue-900/20
                             text-gray-800 dark:text-gray-200 font-semibold text-sm
                             transition-all duration-150 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span>{meta.icon}</span>
                    <span>{person}</span>
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-sans">
                    {meta.range}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Mỗi người tải file JSON riêng từ <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">pipeline/labeling_queue/</code>
        </p>
      </div>
    </div>
  );
}
