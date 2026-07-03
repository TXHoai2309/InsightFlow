import React from 'react';
import { LabelStats } from '../utils/storage';
import { PendingAssignmentCounts, PlatformFilter } from '../utils/supabaseRest';

interface SidebarProps {
  stats: LabelStats;
  postCount: number;
  itemCount: number;
  pendingCounts: PendingAssignmentCounts | null;
  pendingCountsLoading: boolean;
  platform: PlatformFilter;
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

export default function Sidebar({
  stats,
  postCount,
  itemCount,
  pendingCounts,
  pendingCountsLoading,
  platform,
}: SidebarProps) {
  const total = stats.totalLabeled + stats.totalSkipped;
  const pctOf = (n: number) => total === 0 ? 0 : Math.round((n / total) * 100);

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

      {/* Full pending queue */}
      <div className="card p-4">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Hàng chờ toàn bộ
        </h3>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          Nền tảng: <span className="capitalize">{platform.replace('_', ' ')}</span> · Không phụ thuộc lô đang tải
        </p>
        {pendingCountsLoading ? (
          <div className="flex items-center justify-center gap-2 py-5 text-sm text-gray-500">
            <span className="h-4 w-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
            Đang đếm dữ liệu...
          </div>
        ) : pendingCounts ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-blue-100 bg-blue-50 p-3 dark:border-blue-900/40 dark:bg-blue-900/20">
              <div className="text-xs text-blue-700 dark:text-blue-300">Post chưa gán</div>
              <div className="mt-1 text-2xl font-bold text-blue-900 dark:text-blue-100">
                {pendingCounts.posts.toLocaleString()}
              </div>
            </div>
            <div className="rounded-md border border-amber-100 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-900/20">
              <div className="text-xs text-amber-700 dark:text-amber-300">Comment chưa gán</div>
              <div className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-100">
                {pendingCounts.comments.toLocaleString()}
              </div>
            </div>
            <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-900/40 dark:bg-emerald-900/20">
              <div className="text-xs text-emerald-700 dark:text-emerald-300">Post đã gán</div>
              <div className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {pendingCounts.labeledPosts.toLocaleString()}
              </div>
            </div>
            <div className="rounded-md border border-teal-100 bg-teal-50 p-3 dark:border-teal-900/40 dark:bg-teal-900/20">
              <div className="text-xs text-teal-700 dark:text-teal-300">Comment đã gán</div>
              <div className="mt-1 text-2xl font-bold text-teal-900 dark:text-teal-100">
                {pendingCounts.labeledComments.toLocaleString()}
              </div>
            </div>
            <div className="col-span-2 flex justify-between border-t border-gray-100 pt-3 text-sm dark:border-surface-600">
              <span className="text-gray-600 dark:text-gray-400">Tổng còn lại</span>
              <span className="font-bold">{(pendingCounts.posts + pendingCounts.comments).toLocaleString()}</span>
            </div>
            <div className="col-span-2 flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tổng đã gán</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                {(pendingCounts.labeledPosts + pendingCounts.labeledComments).toLocaleString()}
              </span>
            </div>
            <div className="col-span-2 flex justify-between rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-surface-700/40">
              <span className="text-gray-600 dark:text-gray-400">Thread hoàn tất</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {pendingCounts.completedThreads.toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-gray-500">Không tải được số liệu hàng chờ.</p>
        )}
      </div>
    </div>
  );
}
