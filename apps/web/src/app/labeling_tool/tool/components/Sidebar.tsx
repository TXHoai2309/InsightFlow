import React, { useState } from 'react';
import { LabelStats } from '../utils/storage';
import { saveDailyGoal } from '../utils/storage';

interface SidebarProps {
  stats: LabelStats;
  postCount: number;
  itemCount: number;
  dailyGoal: number;
  onDailyGoalChange: (goal: number) => void;
}

function StatBar({ pct, colorClass }: { pct: number; colorClass: string }) {
  return (
    <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export default function Sidebar({ stats, postCount, itemCount, dailyGoal, onDailyGoalChange }: SidebarProps) {
  const [goalInput, setGoalInput] = useState(String(dailyGoal));
  const [goalSaved, setGoalSaved] = useState(false);

  const total = stats.totalLabeled + stats.totalSkipped;
  const pctOf = (n: number) => total === 0 ? 0 : Math.round((n / total) * 100);
  const todayPct = dailyGoal > 0 ? Math.min(Math.round((stats.todayLabeled / dailyGoal) * 100), 100) : 0;

  const handleSetGoal = () => {
    const n = parseInt(goalInput, 10);
    if (!isNaN(n) && n > 0) {
      saveDailyGoal(n);
      onDailyGoalChange(n);
      setGoalSaved(true);
      setTimeout(() => setGoalSaved(false), 1500);
    }
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Stats card */}
      <div className="card p-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
          📊 Thống kê
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Threads:</span>
            <span className="font-semibold">{postCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Items cần gán:</span>
            <span className="font-semibold">{itemCount.toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-100 dark:border-surface-600 pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Đã gán nhãn:</span>
              <span className="font-semibold">{stats.totalLabeled.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Đã bỏ qua:</span>
              <span className="font-semibold">{stats.totalSkipped.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {total > 0 && (
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Tích cực
                </span>
                <span className="text-gray-500">{stats.positive} ({pctOf(stats.positive)}%)</span>
              </div>
              <StatBar pct={pctOf(stats.positive)} colorClass="bg-emerald-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  Tiêu cực
                </span>
                <span className="text-gray-500">{stats.negative} ({pctOf(stats.negative)}%)</span>
              </div>
              <StatBar pct={pctOf(stats.negative)} colorClass="bg-red-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                  Trung tính
                </span>
                <span className="text-gray-500">{stats.neutral} ({pctOf(stats.neutral)}%)</span>
              </div>
              <StatBar pct={pctOf(stats.neutral)} colorClass="bg-gray-400" />
            </div>
            {stats.crisis > 0 && (
              <div className="text-xs text-red-500 dark:text-red-400 font-semibold pt-1">
                🚨 Crisis: {stats.crisis} items
              </div>
            )}
          </div>
        )}

        {/* Intent stats */}
        {total > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-surface-600">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">🎯 INTENT</div>
            <div className="space-y-1.5">
              {([
                { key: 'intentHot',  emoji: '🔥', label: 'Hot',  color: 'bg-orange-500', val: stats.intentHot  },
                { key: 'intentWarm', emoji: '🌡️', label: 'Warm', color: 'bg-yellow-500', val: stats.intentWarm },
                { key: 'intentCold', emoji: '🧊', label: 'Cold', color: 'bg-blue-400',   val: stats.intentCold },
                { key: 'intentNone', emoji: '➖', label: 'None', color: 'bg-gray-400',   val: stats.intentNone },
              ] as const).map(({ emoji, label, color, val }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-600 dark:text-gray-400">{emoji} {label}</span>
                    <span className="text-gray-500">{val} ({pctOf(val)}%)</span>
                  </div>
                  <StatBar pct={pctOf(val)} colorClass={color} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Daily goal card */}
      <div className="card p-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
          🎯 Mục tiêu hôm nay
        </h3>

        {/* Configurable goal input */}
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            min={1}
            max={9999}
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSetGoal(); }}
            className="select-control flex-1 text-center text-sm font-semibold"
            placeholder="100"
          />
          <button
            onClick={handleSetGoal}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${goalSaved
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
              }`}
          >
            {goalSaved ? '✓ Đã lưu' : 'Set'}
          </button>
        </div>

        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">
            {stats.todayLabeled} / {dailyGoal} items
            {stats.todayLabeled >= dailyGoal && ' 🔥'}
          </span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">{todayPct}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${todayPct}%` }}
          />
        </div>
        {stats.todayLabeled >= dailyGoal && dailyGoal > 0 && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">
            🎉 Đạt mục tiêu! Xuất sắc!
          </p>
        )}
      </div>

      {/* Hotkeys cheatsheet */}
      <div className="card p-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
          ⌨️ Phím tắt
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div className="col-span-2 font-semibold text-gray-700 dark:text-gray-300 mt-0">Cảm xúc</div>
          <div><kbd className="kbd">1</kbd> Tích cực</div>
          <div><kbd className="kbd">2</kbd> Tiêu cực</div>
          <div className="col-span-2"><kbd className="kbd">3</kbd> Trung tính</div>
          <div className="col-span-2 font-semibold text-gray-700 dark:text-gray-300 mt-2">Chủ đề</div>
          <div><kbd className="kbd">q</kbd> Chất lượng</div>
          <div><kbd className="kbd">w</kbd> Giá</div>
          <div><kbd className="kbd">e</kbd> Dịch vụ</div>
          <div><kbd className="kbd">r</kbd> Địa điểm</div>
          <div><kbd className="kbd">t</kbd> Khuyến mãi</div>
          <div><kbd className="kbd">y</kbd> Khác</div>
          <div className="col-span-2 font-semibold text-gray-700 dark:text-gray-300 mt-2">Liên quan &amp; Mức độ</div>
          <div><kbd className="kbd">a</kbd> Có LQ</div>
          <div><kbd className="kbd">s</kbd> Không LQ</div>
          <div><kbd className="kbd">z</kbd> Bình thường</div>
          <div><kbd className="kbd">x</kbd> Đáng chú ý</div>
          <div className="col-span-2"><kbd className="kbd">c</kbd> 🚨 Crisis</div>
          <div className="col-span-2 font-semibold text-gray-700 dark:text-gray-300 mt-2">Intent</div>
          <div><kbd className="kbd">h</kbd> 🔥 Hot</div>
          <div><kbd className="kbd">m</kbd> 🌡️ Warm</div>
          <div><kbd className="kbd">b</kbd> 🧊 Cold</div>
          <div><kbd className="kbd">n</kbd> ➖ None</div>
          <div className="col-span-2 font-semibold text-gray-700 dark:text-gray-300 mt-2">Điều hướng</div>
          <div><kbd className="kbd">Tab</kbd> Item tiếp</div>
          <div><kbd className="kbd">Enter</kbd> Next thread</div>
          <div><kbd className="kbd">→</kbd> Thread sau</div>
          <div><kbd className="kbd">←</kbd> Thread trước</div>
          <div className="col-span-2"><kbd className="kbd">Space</kbd> Bỏ qua thread</div>
        </div>
      </div>
    </div>
  );
}
