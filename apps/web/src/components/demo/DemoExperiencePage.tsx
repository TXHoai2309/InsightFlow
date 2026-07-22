"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BellRing,
  ChevronRight,
  FileChartColumn,
  Flame,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";

type DemoView = "overview" | "alerts" | "leads" | "reports";

const NAV_ITEMS: Array<{ id: DemoView; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "alerts", label: "Cảnh báo", icon: BellRing },
  { id: "leads", label: "Khách hàng tiềm năng", icon: UsersRound },
  { id: "reports", label: "Báo cáo", icon: FileChartColumn },
];

const DEMO_MENTIONS = [
  { source: "Facebook", author: "Nguyễn Minh Anh", content: "Không gian đẹp, nhân viên hỗ trợ rất nhiệt tình.", sentiment: "Tích cực", reach: "12.4K", time: "8 phút trước" },
  { source: "TikTok", author: "Trần Khánh", content: "Mình cần báo giá số lượng lớn cho sự kiện cuối tháng.", sentiment: "Tiềm năng", reach: "8.7K", time: "16 phút trước" },
  { source: "Google", author: "Hoàng Linh", content: "Đơn hàng giao chậm và chưa nhận được phản hồi hỗ trợ.", sentiment: "Tiêu cực", reach: "3.2K", time: "24 phút trước" },
  { source: "YouTube", author: "Food Review VN", content: "Trải nghiệm mới khá thú vị, mức giá phù hợp.", sentiment: "Trung lập", reach: "21.8K", time: "41 phút trước" },
];

const DEMO_ALERTS = [
  { id: 1, title: "Phản ánh thời gian giao hàng", source: "Google", severity: "Cao", score: 86, owner: "Nguyễn An", status: "Đang xử lý", content: "Khách hàng phản ánh đơn giao trễ và chưa nhận được cập nhật từ cửa hàng." },
  { id: 2, title: "Thảo luận tăng nhanh trên TikTok", source: "TikTok", severity: "Nghiêm trọng", score: 94, owner: "Chưa phân công", status: "Mới", content: "Lượng bình luận tiêu cực tăng 230% trong 2 giờ gần nhất quanh chủ đề chất lượng." },
  { id: 3, title: "Đánh giá trải nghiệm tại cửa hàng", source: "Facebook", severity: "Trung bình", score: 68, owner: "Lê Phương", status: "Theo dõi", content: "Một bài đăng đang nhận nhiều chia sẻ và cần tiếp tục theo dõi phản hồi cộng đồng." },
];

const DEMO_LEADS = [
  { name: "Trần Khánh", source: "TikTok", intent: "Hot", need: "Báo giá 200 phần cho sự kiện", score: 96, status: "Cần xử lý" },
  { name: "Công ty Minh Long", source: "Facebook", intent: "Hot", need: "Tìm đối tác cung cấp định kỳ", score: 91, status: "Đang tư vấn" },
  { name: "Nguyễn Hương", source: "Instagram", intent: "Warm", need: "Hỏi chương trình thành viên", score: 78, status: "Follow-up" },
  { name: "Phạm Tuấn", source: "Google", intent: "Warm", need: "Xin thông tin nhượng quyền", score: 74, status: "Mới" },
];

const TREND_DATA = [42, 55, 48, 64, 58, 72, 81, 76, 90, 84, 96, 88];

function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-violet-700">
      <Sparkles size={13} /> Dữ liệu demo
    </span>
  );
}

export function DemoExperiencePage() {
  const [activeView, setActiveView] = useState<DemoView>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState(2);

  const filteredMentions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return DEMO_MENTIONS;
    return DEMO_MENTIONS.filter((item) =>
      `${item.author} ${item.content} ${item.source}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  const selectedAlert = DEMO_ALERTS.find((item) => item.id === selectedAlertId) || DEMO_ALERTS[0];

  const selectView = (view: DemoView) => {
    setActiveView(view);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F6FB] text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-[#11152A] text-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <button type="button" onClick={() => selectView("overview")} className="flex items-center gap-3 text-left">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-black">IF</span>
            <span><span className="block text-lg font-black">InsightFlow</span><span className="block text-[10px] uppercase tracking-[0.18em] text-violet-300">Interactive demo</span></span>
          </button>
          <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden" aria-label="Đóng menu"><X size={18} /></button>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" onClick={() => selectView(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${activeView === item.id ? "bg-violet-500 text-white shadow-lg shadow-violet-950/30" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                <Icon size={19} /><span>{item.label}</span>{activeView === item.id && <ChevronRight className="ml-auto" size={16} />}
              </button>
            );
          })}
        </nav>

        <div className="m-4 rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4">
          <ShieldCheck className="text-violet-300" size={22} />
          <p className="mt-3 text-sm font-bold">Môi trường an toàn</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">Toàn bộ số liệu trên trang này là dữ liệu minh họa và không liên kết dữ liệu khách hàng thật.</p>
        </div>
      </aside>

      {sidebarOpen && <button type="button" className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Đóng lớp menu" />}

      <div className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-xl border border-slate-200 p-2.5 text-slate-700 lg:hidden" aria-label="Mở menu"><Menu size={20} /></button>
            <div className="min-w-0"><p className="truncate text-lg font-black">{NAV_ITEMS.find((item) => item.id === activeView)?.label}</p><p className="truncate text-xs text-slate-500">Khám phá InsightFlow với dữ liệu mẫu</p></div>
          </div>
          <div className="flex items-center gap-3">
            <DemoBadge />
            <Link href="/#consultation" className="hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 sm:inline-flex"><ArrowLeft size={16} /> Quay lại đăng ký</Link>
          </div>
        </header>

        <main className="p-[clamp(14px,2vw,32px)]">
          {activeView === "overview" && <OverviewView query={query} setQuery={setQuery} mentions={filteredMentions} onNavigate={selectView} />}
          {activeView === "alerts" && <AlertsView selectedAlert={selectedAlert} onSelect={setSelectedAlertId} />}
          {activeView === "leads" && <LeadsView />}
          {activeView === "reports" && <ReportsView />}
        </main>
      </div>
    </div>
  );
}

function OverviewView({ query, setQuery, mentions, onNavigate }: { query: string; setQuery: (value: string) => void; mentions: typeof DEMO_MENTIONS; onNavigate: (view: DemoView) => void }) {
  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#171B38] via-[#242052] to-[#49399A] p-[clamp(20px,3vw,36px)] text-white shadow-xl sm:flex-row sm:items-center">
        <div><DemoBadge /><h1 className="mt-4 text-2xl font-black sm:text-3xl">Tổng quan thương hiệu trong một màn hình</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100">Theo dõi thảo luận, phát hiện khủng hoảng và nhận diện khách hàng tiềm năng theo thời gian thực.</p></div>
        <div className="grid shrink-0 grid-cols-2 gap-3"><HeroMetric value="1,284" label="Đề cập hôm nay" /><HeroMetric value="82%" label="Sắc thái tích cực" /></div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<MessageSquareText size={21} />} label="Tổng đề cập" value="24,680" change="+18.4%" tone="violet" />
        <Kpi icon={<BellRing size={21} />} label="Cảnh báo cần xử lý" value="12" change="3 ưu tiên cao" tone="rose" />
        <Kpi icon={<UsersRound size={21} />} label="Lead tiềm năng" value="186" change="+26 tuần này" tone="amber" />
        <Kpi icon={<TrendingUp size={21} />} label="Tỷ lệ tích cực" value="82.4%" change="+4.2%" tone="emerald" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.7fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><div><h2 className="font-black">Xu hướng thảo luận</h2><p className="mt-1 text-xs text-slate-500">12 khoảng thời gian gần nhất</p></div><span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Tăng trưởng ổn định</span></div>
          <div className="mt-6 flex h-48 items-end gap-[2.5%] border-b border-slate-200 px-2">
            {TREND_DATA.map((value, index) => <div key={index} className="group relative flex-1 rounded-t-lg bg-gradient-to-t from-violet-600 to-violet-300 transition hover:from-indigo-600 hover:to-indigo-300" style={{ height: `${value}%` }}><span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 text-[10px] font-bold group-hover:block">{value}</span></div>)}
          </div>
          <div className="mt-3 flex justify-between text-[10px] font-semibold text-slate-400"><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-black">Phân bố cảm xúc</h2>
          <div className="mx-auto mt-5 grid h-36 w-36 place-items-center rounded-full" style={{ background: "conic-gradient(#10b981 0 68%, #f59e0b 68% 82%, #ef4444 82% 100%)" }}><div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center"><span><strong className="block text-2xl">68%</strong><small className="text-slate-500">Tích cực</small></span></div></div>
          <div className="mt-5 space-y-2"><Legend color="bg-emerald-500" label="Tích cực" value="68%" /><Legend color="bg-amber-500" label="Trung lập" value="14%" /><Legend color="bg-rose-500" label="Tiêu cực" value="18%" /></div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-black">Đề cập mới nhất</h2><p className="mt-1 text-xs text-slate-500">Dữ liệu mô phỏng đa nền tảng</p></div><label className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trong dữ liệu demo..." className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label></div>
        <div className="divide-y divide-slate-100">{mentions.map((item) => <MentionRow key={`${item.source}-${item.author}`} item={item} />)}{mentions.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Không có dữ liệu mẫu phù hợp.</p>}</div>
        <button type="button" onClick={() => onNavigate("alerts")} className="flex w-full items-center justify-center gap-2 border-t border-slate-200 p-4 text-sm font-bold text-violet-700 hover:bg-violet-50">Khám phá hàng chờ cảnh báo <ChevronRight size={16} /></button>
      </section>
    </div>
  );
}

function AlertsView({ selectedAlert, onSelect }: { selectedAlert: typeof DEMO_ALERTS[number]; onSelect: (id: number) => void }) {
  return <div className="space-y-5"><DemoIntro icon={<BellRing />} title="Trung tâm cảnh báo khủng hoảng" description="AI ưu tiên các tín hiệu tiêu cực theo mức độ, độ lan truyền và phạm vi tiếp cận." />
    <div className="grid min-h-[620px] gap-4 xl:grid-cols-[minmax(320px,38%)_minmax(0,1fr)]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="font-black">Danh sách cảnh báo</h2><p className="mt-1 text-xs text-slate-500">3 tình huống mẫu cần đánh giá</p></div><div className="space-y-3 p-3">{DEMO_ALERTS.map((item) => <button key={item.id} type="button" onClick={() => onSelect(item.id)} className={`w-full rounded-xl border p-4 text-left transition ${selectedAlert.id === item.id ? "border-violet-400 bg-violet-50 ring-2 ring-violet-100" : "border-slate-200 hover:border-violet-200 hover:bg-slate-50"}`}><div className="flex items-start justify-between gap-3"><span className="text-sm font-black">{item.title}</span><span className={`rounded-full px-2 py-1 text-[10px] font-black ${item.score >= 90 ? "bg-rose-100 text-rose-700" : item.score >= 80 ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`}>{item.score}/100</span></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{item.content}</p><div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500"><span>{item.source} · {item.severity}</span><span>{item.status}</span></div></button>)}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-violet-600">Chi tiết cảnh báo mẫu</p><h2 className="mt-2 text-xl font-black">{selectedAlert.title}</h2><p className="mt-1 text-sm text-slate-500">{selectedAlert.source} · Người phụ trách: {selectedAlert.owner}</p></div><span className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-black text-rose-700">Rủi ro {selectedAlert.score}/100</span></div><div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-black uppercase text-amber-700">Lý do ưu tiên</p><p className="mt-2 text-sm leading-6 text-slate-700">Tốc độ thảo luận tăng nhanh, sắc thái chủ đạo tiêu cực và có khả năng ảnh hưởng hình ảnh thương hiệu.</p></div><div className="mt-5 rounded-2xl border border-slate-200 p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Nội dung phát hiện</p><p className="mt-3 text-base leading-7">{selectedAlert.content}</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><MiniMetric label="Lượt tiếp cận" value="28.4K" /><MiniMetric label="Bình luận" value="386" /><MiniMetric label="Tốc độ tăng" value="+230%" /></div></div><div className="mt-5 rounded-2xl bg-slate-900 p-5 text-white"><div className="flex items-center gap-2"><Sparkles className="text-violet-300" size={19} /><p className="font-black">Gợi ý xử lý của AI</p></div><ol className="mt-3 space-y-2 text-sm leading-6 text-slate-300"><li>1. Xác minh nội dung và nguồn phát sinh.</li><li>2. Chủ động liên hệ khách hàng với thông điệp xin lỗi.</li><li>3. Ghi nhận minh chứng và theo dõi diễn biến trong 24 giờ.</li></ol></div></section>
    </div></div>;
}

function LeadsView() {
  return <div className="space-y-5"><DemoIntro icon={<UsersRound />} title="Quản lý khách hàng tiềm năng" description="Tự động phát hiện ý định mua hàng và ưu tiên cơ hội có khả năng chuyển đổi cao." /><section className="grid gap-3 sm:grid-cols-3"><Kpi icon={<Flame size={21} />} label="Hot Lead" value="24" change="Cần xử lý ngay" tone="rose" /><Kpi icon={<Activity size={21} />} label="Đang tư vấn" value="38" change="8 follow-up hôm nay" tone="amber" /><Kpi icon={<TrendingUp size={21} />} label="Đã chuyển đổi" value="16" change="Tỷ lệ 21.6%" tone="emerald" /></section><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-5"><h2 className="font-black">Cơ hội bán hàng nổi bật</h2><p className="mt-1 text-xs text-slate-500">Xếp hạng tự động theo ý định và tín hiệu mua</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Khách hàng</th><th className="px-5 py-3">Nhu cầu</th><th className="px-5 py-3">Nguồn</th><th className="px-5 py-3">Điểm</th><th className="px-5 py-3">Trạng thái</th></tr></thead><tbody className="divide-y divide-slate-100">{DEMO_LEADS.map((lead) => <tr key={lead.name} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-bold">{lead.name}</p><p className="mt-1 text-xs text-slate-500">{lead.intent} Lead</p></td><td className="px-5 py-4 text-sm text-slate-600">{lead.need}</td><td className="px-5 py-4 text-sm font-semibold">{lead.source}</td><td className="px-5 py-4"><span className="font-black text-violet-700">{lead.score}/100</span></td><td className="px-5 py-4"><span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">{lead.status}</span></td></tr>)}</tbody></table></div></section><section className="grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">Phễu chuyển đổi</h2><div className="mt-5 space-y-3"><FunnelRow label="Đã phát hiện" value={186} width="100%" color="bg-violet-500" /><FunnelRow label="Đã liên hệ" value={112} width="76%" color="bg-indigo-500" /><FunnelRow label="Đang tư vấn" value={54} width="52%" color="bg-blue-500" /><FunnelRow label="Chuyển đổi" value={16} width="28%" color="bg-emerald-500" /></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">Nguồn Lead hiệu quả</h2><div className="mt-5 space-y-4"><ProgressRow label="TikTok" value="38%" width="38%" /><ProgressRow label="Facebook" value="29%" width="29%" /><ProgressRow label="Google" value="21%" width="21%" /><ProgressRow label="Instagram" value="12%" width="12%" /></div></div></section></div>;
}

function ReportsView() {
  return <div className="space-y-5"><DemoIntro icon={<BarChart3 />} title="Báo cáo điều hành" description="Tổng hợp hiệu suất theo dõi thương hiệu, xử lý khủng hoảng và chuyển đổi Lead." /><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi icon={<MessageSquareText size={21} />} label="Đề cập đã phân tích" value="24.6K" change="Trong 30 ngày" tone="violet" /><Kpi icon={<BellRing size={21} />} label="Cảnh báo đã xử lý" value="94%" change="SLA trung bình 18 phút" tone="rose" /><Kpi icon={<UsersRound size={21} />} label="Lead đã liên hệ" value="78%" change="145/186 Lead" tone="amber" /><Kpi icon={<TrendingUp size={21} />} label="Tăng trưởng tích cực" value="+12.8%" change="So với kỳ trước" tone="emerald" /></section><section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]"><div className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-black">Hiệu suất theo tuần</h2><div className="mt-6 space-y-5">{[["Tuần 1",72,48],["Tuần 2",81,56],["Tuần 3",76,68],["Tuần 4",92,74]].map(([label, mentions, leads]) => <div key={String(label)}><div className="mb-2 flex justify-between text-xs font-bold"><span>{label}</span><span className="text-slate-400">Đề cập / Lead</span></div><div className="space-y-1.5"><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-violet-500" style={{ width: `${mentions}%` }} /></div><div className="h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-emerald-500" style={{ width: `${leads}%` }} /></div></div></div>)}</div></div><div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-800 p-6 text-white"><Sparkles className="text-violet-200" /><h2 className="mt-4 text-xl font-black">Tóm tắt bởi AI</h2><p className="mt-3 text-sm leading-6 text-violet-100">Sắc thái thương hiệu đang cải thiện. TikTok tạo nhiều cơ hội mới nhất, trong khi phản ánh giao hàng là chủ đề cần ưu tiên.</p><div className="mt-6 space-y-3"><Insight text="Tích cực tăng 12.8%" /><Insight text="SLA xử lý nhanh hơn 6 phút" /><Insight text="Hot Lead tăng 18%" /></div></div></section></div>;
}

function DemoIntro({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) { return <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-violet-700">{icon}<span className="text-xs font-black uppercase tracking-wider">InsightFlow Demo</span></div><h1 className="mt-3 text-2xl font-black">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div><DemoBadge /></section>; }
function HeroMetric({ value, label }: { value: string; label: string }) { return <div className="min-w-32 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"><strong className="text-2xl font-black">{value}</strong><span className="mt-1 block text-[11px] text-violet-100">{label}</span></div>; }
function Kpi({ icon, label, value, change, tone }: { icon: React.ReactNode; label: string; value: string; change: string; tone: "violet" | "rose" | "amber" | "emerald" }) { const styles = { violet: "bg-violet-50 text-violet-700", rose: "bg-rose-50 text-rose-700", amber: "bg-amber-50 text-amber-700", emerald: "bg-emerald-50 text-emerald-700" }; return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`grid h-11 w-11 place-items-center rounded-xl ${styles[tone]}`}>{icon}</div><p className="mt-4 text-xs font-bold text-slate-500">{label}</p><div className="mt-1 flex items-end justify-between gap-2"><strong className="text-2xl font-black">{value}</strong><span className="text-[11px] font-bold text-slate-500">{change}</span></div></div>; }
function Legend({ color, label, value }: { color: string; label: string; value: string }) { return <div className="flex items-center text-xs"><span className={`mr-2 h-2.5 w-2.5 rounded-full ${color}`} /><span className="text-slate-500">{label}</span><strong className="ml-auto">{value}</strong></div>; }
function MentionRow({ item }: { item: typeof DEMO_MENTIONS[number] }) { const tone = item.sentiment === "Tích cực" ? "bg-emerald-50 text-emerald-700" : item.sentiment === "Tiêu cực" ? "bg-rose-50 text-rose-700" : item.sentiment === "Tiềm năng" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"; return <article className="grid gap-3 p-5 transition hover:bg-slate-50 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center"><div><p className="text-xs font-black">{item.source}</p><p className="mt-1 text-[10px] text-slate-400">{item.time}</p></div><div className="min-w-0"><p className="text-sm font-bold">{item.author}</p><p className="mt-1 truncate text-xs text-slate-500">{item.content}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${tone}`}>{item.sentiment}</span><span className="text-xs font-bold text-slate-500">{item.reach}</span></div></article>; }
function MiniMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div>; }
function FunnelRow({ label, value, width, color }: { label: string; value: number; width: string; color: string }) { return <div className="mx-auto" style={{ width }}><div className={`flex h-12 items-center justify-between rounded-xl px-4 text-white ${color}`}><span className="text-xs font-bold">{label}</span><strong>{value}</strong></div></div>; }
function ProgressRow({ label, value, width }: { label: string; value: string; width: string }) { return <div><div className="mb-1.5 flex justify-between text-xs font-bold"><span>{label}</span><span>{value}</span></div><div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-violet-500" style={{ width }} /></div></div>; }
function Insight({ text }: { text: string }) { return <div className="flex items-center gap-2 rounded-xl bg-white/10 p-3 text-sm font-bold"><ShieldCheck size={16} className="text-emerald-300" />{text}</div>; }
