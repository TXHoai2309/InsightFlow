"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  Bot,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Eye,
  Flame,
  Gauge,
  Megaphone,
  MessageSquareText,
  RadioTower,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
  Workflow,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDefaultRouteForRole } from "@/lib/rbac";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  channels: string;
  need: string;
  teamSize: string;
};

const initialFormState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  industry: "",
  channels: "",
  need: "Phát hiện khách hàng tiềm năng",
  teamSize: "",
};

const channels = ["Facebook", "TikTok", "YouTube", "Review", "Tin tức", "Website"];

const modules = [
  {
    icon: RadioTower,
    number: "01",
    title: "Lắng nghe đa kênh",
    description: "Gom hội thoại từ mọi nền tảng vào một luồng dữ liệu duy nhất, real-time.",
    accent: "#14b8a6",
  },
  {
    icon: Zap,
    number: "02",
    title: "Nhận diện cơ hội",
    description: "AI phát hiện tín hiệu mua, câu hỏi tư vấn và phản hồi cần xử lý sớm.",
    accent: "#f97316",
  },
  {
    icon: BellRing,
    number: "03",
    title: "Cảnh báo rủi ro",
    description: "Theo dõi dấu hiệu bất thường để xử lý trước khi thành khủng hoảng.",
    accent: "#ef4444",
  },
  {
    icon: ClipboardList,
    number: "04",
    title: "Biến insight thành việc làm",
    description: "Tự động phân công theo SLA, khớp đúng người giữa Brand, Marketing và CSKH.",
    accent: "#2563eb",
  },
  {
    icon: Gauge,
    number: "05",
    title: "Đo sức khỏe thương hiệu",
    description: "Một điểm số duy nhất phản ánh cảm xúc và mức quan tâm dành cho thương hiệu.",
    accent: "#8b5cf6",
  },
  {
    icon: Bot,
    number: "06",
    title: "Báo cáo có đề xuất",
    description: "Không chỉ đưa số liệu: AI tóm tắt điều đáng chú ý và gợi ý hành động tiếp theo.",
    accent: "#0ea5e9",
  },
];

const workflowSteps = [
  {
    number: "01",
    title: "Nhìn thấy",
    description: "Tất cả tín hiệu từ khách hàng, thị trường và truyền thông xuất hiện đúng lúc.",
    detail: "Listening + AI classification",
  },
  {
    number: "02",
    title: "Hiểu đúng",
    description: "AI gom cụm chủ đề, xác định mức độ ưu tiên và làm rõ điều gì đang diễn ra.",
    detail: "Sentiment + priority score",
  },
  {
    number: "03",
    title: "Hành động nhanh",
    description: "Chuyển insight đến đúng người, theo dõi phản hồi và đo lường kết quả sau cùng.",
    detail: "Workflow + brand health",
  },
];

const roleStories = [
  {
    id: "brand",
    label: "Brand Manager",
    icon: Building2,
    eyebrow: "Giữ thương hiệu luôn đi trước",
    title: "Nhận diện tín hiệu trước khi thị trường kịp đổi chiều.",
    description: "Theo dõi sức khỏe thương hiệu, rủi ro truyền thông và các chủ đề khách hàng đang quan tâm mà không phải ghép báo cáo thủ công.",
    metrics: [
      ["Brand health", "82", "+8.4%"],
      ["Cảnh báo mới", "07", "Cần xem"],
      ["Sắc thái tích cực", "68%", "+12%"],
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    eyebrow: "Từ ồn ào thành insight",
    title: "Biết điều gì đang chạm được tới khách hàng.",
    description: "So sánh nguồn thảo luận, phát hiện chủ đề đang tăng trưởng và tìm dữ liệu cho chiến dịch tiếp theo.",
    metrics: [
      ["Chủ đề tăng tốc", "14", "+36%"],
      ["Điểm chạm", "6.8K", "7 ngày"],
      ["Tỷ lệ tích cực", "71%", "+9%"],
    ],
  },
  {
    id: "revenue",
    label: "Sales & CSKH",
    icon: UsersRound,
    eyebrow: "Không để cơ hội trôi qua",
    title: "Nhận đúng khách hàng, đúng thời điểm cần phản hồi.",
    description: "Ưu tiên những hội thoại có ý định mua hoặc nguy cơ rời bỏ, sau đó giao ngay đến đội phụ trách.",
    metrics: [
      ["Lead nóng", "128", "+24 hôm nay"],
      ["Đúng SLA", "94%", "+6%"],
      ["Chờ phản hồi", "19", "Cần xử lý"],
    ],
  },
  {
    id: "leader",
    label: "Lãnh đạo",
    icon: BriefcaseBusiness,
    eyebrow: "Một góc nhìn chung",
    title: "Ra quyết định từ bức tranh toàn cảnh, không phải cảm giác.",
    description: "Tập hợp chỉ số thương hiệu, hiệu quả vận hành và phản hồi thị trường vào một nơi để lãnh đạo nắm được diễn biến thật.",
    metrics: [
      ["Xu hướng thị trường", "Tăng", "3 phân khúc"],
      ["Hiệu quả phản hồi", "89%", "+11%"],
      ["Báo cáo AI", "06", "Tuần này"],
    ],
  },
] as const;

type RoleId = (typeof roleStories)[number]["id"];

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduceMotion ? 0 : 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionIntro({ eyebrow, title, description, inverse = false }: { eyebrow: string; title: string; description: string; inverse?: boolean }) {
  return (
    <Reveal className="mx-auto max-w-[760px] text-center">
      <div className="mx-auto mb-5 flex w-fit items-center gap-3">
        <span className={`h-px w-8 ${inverse ? "bg-[#9B8CFF]" : "bg-[#6D5EF6]/30"}`} />
        <p className={`text-[13px] font-extrabold uppercase tracking-[0.16em] ${inverse ? "text-[#9B8CFF]" : "text-[#6D5EF6]"}`}>{eyebrow}</p>
        <span className={`h-px w-8 ${inverse ? "bg-[#9B8CFF]" : "bg-[#6D5EF6]/30"}`} />
      </div>
      <h2 className={`font-display text-[36px] font-extrabold leading-[1.1] md:text-[42px] ${inverse ? "text-white" : "text-[#1B1B4A] tracking-tight"}`}>{title}</h2>
      <p className={`mx-auto mt-6 max-w-[640px] text-[17px] leading-[1.7] ${inverse ? "text-slate-300" : "text-[#6B7090]"}`}>{description}</p>
    </Reveal>
  );
}

function PulseDot({ className = "" }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  return <motion.span className={`inline-block h-2 w-2 rounded-full bg-[#2dd4bf] ${className}`} animate={reduceMotion ? undefined : { scale: [1, 1.55, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />;
}

function BorderRails({ dark = false }: { dark?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 left-1/2 z-0 w-[calc(100%-32px)] max-w-[1280px] -translate-x-1/2 border-x ${dark ? "border-white/10" : "border-[#dce7eb]"}`}
    />
  );
}

const intelligenceData = [
  { time: "08:00", mentions: 42, positive: 30, negative: 12 },
  { time: "09:00", mentions: 50, positive: 38, negative: 12 },
  { time: "10:00", mentions: 47, positive: 32, negative: 15 },
  { time: "11:00", mentions: 66, positive: 40, negative: 26 },
  { time: "12:00", mentions: 61, positive: 45, negative: 16 },
  { time: "13:00", mentions: 78, positive: 50, negative: 28 },
  { time: "14:00", mentions: 92, positive: 65, negative: 27 },
  { time: "15:00", mentions: 86, positive: 60, negative: 26 },
  { time: "16:00", mentions: 108, positive: 80, negative: 28 },
  { time: "17:00", mentions: 124, positive: 90, negative: 34 },
];

function LiveIntelligenceSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="intelligence" className="relative border-y border-[#ECE9FF] dark:border-white/10 bg-gradient-to-b from-white to-[#F7F5FF] dark:from-[#0A0612] dark:to-[#0A0612]/50 px-6 pb-24 pt-16 md:pb-32 md:pt-20 overflow-hidden">
      {/* Vercel grid in light mode */}
      <div className="absolute inset-0 bg-vercel-grid opacity-10 pointer-events-none" />
      {/* Glows */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#6D5EF6] blur-[200px] opacity-[0.08] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#9B8CFF] blur-[200px] opacity-[0.08] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-[1200px]">
        <Reveal className="text-center mx-auto max-w-[800px]">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#6D5EF6] mb-4">Live Intelligence</p>
          <h2 className="font-display text-[32px] md:text-[42px] font-extrabold leading-[1.1] text-[#1B1B4A] tracking-tight">
            Không chỉ là dashboard. Đây là <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-[#6D5EF6] to-[#9B8CFF] bg-clip-text text-transparent">nhịp đập của thương hiệu.</span>
          </h2>
        </Reveal>

        <Reveal className="mt-20 relative mx-auto max-w-[1000px]">
          {/* Main CSS Dashboard Abstraction (Replacing Image) */}
          <div className="relative w-full rounded-[24px] glass-panel p-2 md:p-3 shadow-[0_40px_100px_rgba(109,94,246,0.15)] backdrop-blur-2xl transition-transform duration-500 hover:-translate-y-2">
            <div className="overflow-hidden rounded-[16px] border border-white/40 dark:border-white/10 bg-[#FCFBFF]/90 dark:bg-[#0A0612]/90 shadow-inner flex flex-col min-h-[500px]">
              
              {/* Header with Avatars & Running Counter */}
              <div className="flex items-center justify-between border-b border-[#ECE9FF] dark:border-white/10 px-4 md:px-6 py-4 bg-white/50 dark:bg-white/5">
                <div className="flex gap-4 items-center">
                   <span className="text-[16px] md:text-[18px] font-display font-bold bg-gradient-to-r from-[#6D5EF6] to-[#9B8CFF] bg-clip-text text-transparent hidden sm:block">Live Command Center</span>
                   <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />
                   {/* Counter */}
                   <span className="font-mono font-bold text-[#1B1B4A] dark:text-white flex items-center gap-2">
                     <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#34D399]"></span></span>
                     <span className="tabular-nums opacity-90 text-[14px] md:text-[16px]">2,459,102</span>
                     <span className="text-[11px] text-[#6B7090] font-sans ml-1 uppercase tracking-wider hidden sm:inline-block">Mentions</span>
                   </span>
                </div>
                {/* Avatars */}
                <div className="flex -space-x-3 group relative cursor-pointer hidden sm:flex">
                  <div className="w-8 h-8 rounded-full border-2 border-[#FCFBFF] dark:border-[#0A0612] bg-[#1877F2] flex items-center justify-center text-[14px] text-white font-bold shadow-sm z-30">f</div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#FCFBFF] dark:border-[#0A0612] bg-black flex items-center justify-center text-[14px] text-white font-bold shadow-sm z-20">𝕏</div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#FCFBFF] dark:border-[#0A0612] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-sm z-10"><div className="w-3 h-3 border-2 border-white rounded-[4px] relative"><div className="absolute top-[1px] right-[1px] w-[2px] h-[2px] bg-white rounded-full" /></div></div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#FCFBFF] dark:border-[#0A0612] bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[10px] text-[#1B1B4A] dark:text-white font-bold shadow-sm z-0">+2</div>
                  <div className="absolute -bottom-8 right-0 bg-[#1B1B4A] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-40 shadow-sm">Đang theo dõi 5 kênh</div>
                </div>
              </div>

              {/* Dashboard Body */}
              <div className="flex flex-col md:flex-row flex-1 p-4 md:p-6 gap-6 bg-[url('/vercel-grid.svg')] bg-repeat opacity-[0.99] dark:opacity-90">
                {/* Left: Glowing Line Chart & KPI */}
                <div className="flex-1 flex flex-col gap-6">
                   <div className="flex gap-4">
                     <div className="flex-1 glass-panel rounded-[16px] p-4 md:p-5">
                       <p className="text-[12px] font-bold uppercase tracking-wider text-[#6B7090] dark:text-slate-400">Total Mentions</p>
                       <p className="text-[28px] md:text-[36px] font-bold text-[#1B1B4A] dark:text-white font-display mt-1">45.2K</p>
                       <div className="flex items-center gap-1 text-[#34D399] text-[12px] font-bold mt-2"><TrendingUp className="w-3 h-3" /> +12.5%</div>
                     </div>
                     <div className="flex-1 glass-panel rounded-[16px] p-4 md:p-5">
                       <p className="text-[12px] font-bold uppercase tracking-wider text-[#6B7090] dark:text-slate-400">Brand Health</p>
                       <p className="text-[28px] md:text-[36px] font-bold text-[#1B1B4A] dark:text-white font-display mt-1">92<span className="text-[16px] text-[#6B7090]">/100</span></p>
                       <div className="flex items-center gap-1 text-[#34D399] text-[12px] font-bold mt-2"><TrendingUp className="w-3 h-3" /> Tích cực</div>
                     </div>
                   </div>
                   
                   {/* Glowing Line Chart Area */}
                   <div className="flex-1 glass-panel rounded-[16px] p-5 relative overflow-hidden flex flex-col min-h-[220px]">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-[14px] font-bold text-[#1B1B4A] dark:text-white">Sentiment Trend</p>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#6D5EF6] shadow-[0_0_8px_#6D5EF6]" /><span className="text-[10px] font-bold text-[#6B7090]">Điểm hiện tại</span></div>
                          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" /><span className="text-[10px] font-bold text-[#6B7090]">Trung bình 7 ngày</span></div>
                        </div>
                      </div>
                      
                      <div className="flex-1 w-full relative">
                        <div className="absolute inset-0 flex flex-col justify-between opacity-10">
                          <div className="h-px w-full bg-[#1B1B4A] dark:bg-white" />
                          <div className="h-px w-full bg-[#1B1B4A] dark:bg-white" />
                          <div className="h-px w-full bg-[#1B1B4A] dark:bg-white" />
                          <div className="h-px w-full bg-[#1B1B4A] dark:bg-white" />
                        </div>
                        {/* Smooth curved SVG line chart */}
                        <svg viewBox="0 0 400 120" className="w-full h-full preserve-3d overflow-visible relative z-10">
                          <defs>
                            <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#9B8CFF" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#6D5EF6" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M0 100 Q 50 20, 100 60 T 200 40 T 300 80 T 400 20 L 400 120 L 0 120 Z" fill="url(#glow)" />
                          <path d="M0 100 Q 50 20, 100 60 T 200 40 T 300 80 T 400 20" fill="none" stroke="#6D5EF6" strokeWidth="4" className="drop-shadow-[0_0_12px_rgba(109,94,246,0.6)]" />
                          
                          <circle cx="200" cy="40" r="5" fill="#fff" stroke="#6D5EF6" strokeWidth="3" className="animate-pulse shadow-[0_0_15px_#6D5EF6]" />
                          <circle cx="400" cy="20" r="5" fill="#fff" stroke="#6D5EF6" strokeWidth="3" className="animate-pulse shadow-[0_0_15px_#6D5EF6]" />
                        </svg>
                      </div>
                   </div>
                </div>

                {/* Right: Live Feed & Heatmap */}
                <div className="w-full md:w-[300px] flex flex-col gap-6">
                   {/* Heatmap Abstraction */}
                   <div className="glass-panel rounded-[16px] p-5">
                     <p className="text-[14px] font-bold text-[#1B1B4A] dark:text-white mb-3">Activity Heatmap</p>
                     <div className="grid grid-cols-7 gap-1.5">
                       {Array.from({length: 28}).map((_, i) => (
                         <div key={i} className={`h-4 md:h-5 rounded-[4px] ${[2,7,12,14,20,25].includes(i) ? 'bg-[#6D5EF6]' : [1,5,8,15,22,27].includes(i) ? 'bg-[#9B8CFF]' : 'bg-[#ECE9FF] dark:bg-white/10'}`} style={{ opacity: Math.random() * 0.5 + 0.5, animation: `pulse 3s infinite ${i * 0.15}s` }} />
                       ))}
                     </div>
                      <div className="grid grid-cols-7 gap-1.5 mt-1.5">
                        {['T2','T3','T4','T5','T6','T7','CN'].map(day => (
                          <div key={day} className="text-[9px] font-bold text-[#6B7090] text-center">{day}</div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-3 text-[9px] font-bold text-[#6B7090]">
                        <span>Thấp</span>
                        <div className="flex gap-1">
                          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#ECE9FF] dark:bg-white/10" />
                          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#9B8CFF]" />
                          <div className="w-2.5 h-2.5 rounded-[2px] bg-[#6D5EF6]" />
                        </div>
                        <span>Cao</span>
                      </div>
                   </div>
                   
                   {/* Live Comments Feed */}
                   <div className="flex-1 glass-panel rounded-[16px] p-5 flex flex-col gap-3 overflow-hidden relative">
                     <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white dark:from-[#0A0612] to-transparent z-10 rounded-b-[16px]" />
                     <p className="text-[14px] font-bold text-[#1B1B4A] dark:text-white mb-2 flex justify-between items-center">
                       <span>Live Feed</span> 
                       <span className="flex h-2.5 w-2.5 rounded-full bg-[#ef4444] animate-ping shadow-[0_0_8px_#ef4444]" />
                     </p>
                     
                     <div className="flex flex-col gap-3 relative z-0">
                       <div className="p-3 rounded-[12px] bg-white/80 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-sm text-[12px] text-[#6B7090] dark:text-slate-300 transform transition-transform hover:scale-[1.02]">
                         <div className="flex items-center justify-between mb-1">
                           <p className="font-bold text-[#1B1B4A] dark:text-white">@nguyen_minh</p>
                           <span className="text-[10px] text-[#34D399] font-bold bg-[#34D399]/10 px-2 py-0.5 rounded-full">Positive</span>
                         </div>
                         Dịch vụ dạo này tốt lên hẳn, đáng khen 👍
                       </div>
                       <div className="p-3 rounded-[12px] bg-white/80 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-sm text-[12px] text-[#6B7090] dark:text-slate-300 transform transition-transform hover:scale-[1.02]">
                         <div className="flex items-center justify-between mb-1">
                           <p className="font-bold text-[#1B1B4A] dark:text-white">@tuananh9x</p>
                           <span className="text-[10px] text-[#ef4444] font-bold bg-[#ef4444]/10 px-2 py-0.5 rounded-full">Negative</span>
                         </div>
                         App bị lỗi gì mà không login được?
                       </div>
                       <div className="p-3 rounded-[12px] bg-white/80 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-sm text-[12px] text-[#6B7090] dark:text-slate-300 transform transition-transform hover:scale-[1.02]">
                         <div className="flex items-center justify-between mb-1">
                           <p className="font-bold text-[#1B1B4A] dark:text-white">@hoanglan_pr</p>
                           <span className="text-[10px] text-[#34D399] font-bold bg-[#34D399]/10 px-2 py-0.5 rounded-full">Positive</span>
                         </div>
                         Thiết kế mới đẹp xuất sắc!
                       </div>
                     </div>
                   </div>
                </div>
              </div>

            </div>
            {/* Floating Mini Cards */}
            <div className="absolute -top-6 -left-6 md:-left-8 animate-float z-20 hidden lg:flex">
              <div className="glass-panel rounded-[16px] px-4 py-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ef4444]/10 text-[#ef4444]"><Flame className="h-4 w-4" /></div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-[#1B1B4A] dark:text-white">Trending</span>
                  <span className="text-[11px] font-medium text-[#ef4444]">#SựKiệnMới</span>
                </div>
              </div>
            </div>
             
            <div className="absolute top-[40%] -right-6 md:-right-8 animate-float-delayed z-20 hidden lg:flex" style={{ animationDelay: '1.5s' }}>
              <div className="glass-panel rounded-[16px] px-4 py-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6D5EF6]/10 text-[#6D5EF6]"><CheckCircle2 className="h-4 w-4" /></div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-[#1B1B4A] dark:text-white">System Sync</span>
                  <span className="text-[11px] font-medium text-[#6B7090] dark:text-slate-300">Đã cập nhật</span>
                </div>
              </div>
            </div>
          </div>

        </Reveal>
      </div>
    </section>
  );
}

export default function BrandLandingPage() {
  const { user, profile, role, loading } = useAuth();
  const reduceMotion = useReducedMotion();
  const appRoute = profile?.defaultRoute || getDefaultRouteForRole(role);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [submitted, setSubmitted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleId>("brand");
  const activeRole = roleStories.find((story) => story.id === selectedRole) ?? roleStories[0];

  const missingRequired = useMemo(
    () => !form.fullName || !form.email || !form.phone || !form.company || !form.need,
    [form],
  );

  const updateForm = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!missingRequired) setSubmitted(true);
  };

  const inputClass = "h-12 w-full rounded-[8px] border border-[#d8e2ec] bg-white px-4 text-[14px] font-medium text-[#1c2d40] outline-none transition placeholder:text-[#95a3b4] focus:border-[#0f766e] focus:ring-4 focus:ring-[#ccfbf1]";

  return (
    <main className="overflow-hidden bg-[#FCFBFF] font-sans text-[#1B1B4A] selection:bg-[#9B8CFF]/30 selection:text-[#6D5EF6]">
      <section className="relative isolate min-h-[720px] overflow-hidden pt-[88px] pb-[88px] md:pt-[120px] md:pb-[88px]">
        {/* Nền tổng thể */}
        <div className="absolute inset-0 -z-20 hero-bg-gradient" />
        {/* Glow layer phía sau dashboard */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full blur-[160px] bg-[#9B8CFF] opacity-30 -z-10 pointer-events-none" />

        <div className="mx-auto max-w-[1250px] px-6 md:px-10 lg:px-12 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6 md:gap-12 items-center">
          {/* Cột trái: Nội dung */}
          <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }} className="max-w-[720px] z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#6D5EF6]/20 bg-[#6D5EF6]/10 px-4 py-2 text-[13px] font-bold text-[#6D5EF6] backdrop-blur-sm mb-6">
              ✨ AI Brand Monitoring
            </div>
            
            <h1 className="font-display text-[38px] md:text-[56px] font-extrabold leading-[1.1] text-[#1B1B4A] tracking-tight">
              Hiểu khách hàng <br className="hidden lg:block" />
              <span className="bg-gradient-to-r from-[#6D5EF6] to-[#9B8CFF] bg-clip-text text-transparent">trước khi họ lên tiếng.</span>
            </h1>
            
            <p className="mt-6 max-w-[610px] text-[17px] leading-[1.7] text-[#6B7090]">
              InsightFlow biến những cuộc trò chuyện rải rác thành tín hiệu rõ ràng để thương hiệu tìm thấy cơ hội, phản hồi nhanh và lớn lên cùng khách hàng.
            </p>
            
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              {!loading && user ? (
                <Link href={appRoute} className="inline-flex h-[52px] px-8 items-center justify-center gap-2 rounded-[24px] bg-gradient-to-br from-[#6D5EF6] to-[#5B4FE0] text-[16px] font-bold text-white shadow-[0_18px_50px_rgba(109,94,246,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(109,94,246,0.12)]">
                  Vào Dashboard <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <Link href="#consultation" className="inline-flex h-[52px] px-8 items-center justify-center gap-2 rounded-[24px] bg-gradient-to-br from-[#6D5EF6] to-[#5B4FE0] text-[16px] font-bold text-white shadow-[0_18px_50px_rgba(109,94,246,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(109,94,246,0.12)]">
                  Đăng ký tư vấn dùng thử <ArrowRight className="h-5 w-5" />
                </Link>
              )}
              <Link href="#workflow" className="inline-flex h-[52px] px-8 items-center justify-center gap-2 rounded-[24px] bg-white/80 border border-[#ECE9FF] text-[16px] font-bold text-[#1B1B4A] backdrop-blur-sm shadow-[0_18px_50px_rgba(109,94,246,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#6D5EF6]/30">
                Xem Demo <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            {/* Hàng 4 số liệu */}
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { value: "500+", label: "Doanh nghiệp", icon: Building2 },
                { value: "2M+", label: "Dữ liệu/ngày", icon: RadioTower },
                { value: "98%", label: "Độ chính xác", icon: CheckCircle2 },
                { value: "24/7", label: "Cảnh báo sớm", icon: BellRing },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div key={i} whileHover={{ y: -4 }} className="rounded-[24px] border border-[#ECE9FF] bg-white/50 p-4 shadow-[0_18px_50px_rgba(109,94,246,0.04)] backdrop-blur-sm transition-shadow hover:shadow-[0_30px_60px_rgba(109,94,246,0.08)] group flex flex-col items-start justify-center">
                    <Icon className="h-6 w-6 text-[#9B8CFF] mb-2 transition-transform group-hover:scale-110" />
                    <p className="font-display text-[22px] font-extrabold text-[#1B1B4A] leading-[1.1]">{stat.value}</p>
                    <p className="mt-1 text-[13px] font-medium text-[#6B7090]">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Cột phải: CSS Dashboard Mockup (Premium & Larger) */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative mt-12 lg:mt-0 z-10 hidden sm:block w-full">
            {/* Dashboard Mockup - Pure CSS */}
            <div className="relative w-full rounded-[24px] border border-white/60 dark:border-white/10 bg-white/40 dark:bg-black/40 p-2 shadow-[0_40px_80px_rgba(109,94,246,0.15)] backdrop-blur-2xl transition-transform duration-500 hover:-translate-y-2">
              <div className="overflow-hidden rounded-[16px] border border-[#ECE9FF] dark:border-white/10 bg-[#FCFBFF] dark:bg-[#0A0612] shadow-inner flex flex-col h-[400px] md:h-[500px]">
                {/* Header */}
                <div className="flex h-12 items-center justify-between border-b border-[#ECE9FF] dark:border-white/10 px-4 bg-white/50 dark:bg-white/5">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#ef4444]" />
                    <div className="h-3 w-3 rounded-full bg-[#f59e0b]" />
                    <div className="h-3 w-3 rounded-full bg-[#34D399]" />
                  </div>
                  <div className="flex gap-2 text-[11px] font-bold text-[#6D5EF6] bg-[#6D5EF6]/10 px-2 py-0.5 rounded-full">
                    Dữ liệu trực tiếp <span className="animate-pulse">●</span>
                  </div>
                </div>
                {/* Body */}
                <div className="flex flex-1 p-4 md:p-6 gap-6 overflow-hidden relative">
                  {/* Mentions Sidebar */}
                  <div className="w-[180px] hidden md:flex flex-col gap-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7090] dark:text-slate-400 mb-1">Mentions gần đây</div>
                    <div className="flex flex-col gap-2">
                      <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 p-2 rounded-[8px] shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-4 h-4 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center text-[8px] font-bold">f</div>
                          <span className="text-[9px] font-bold text-[#1B1B4A] dark:text-white">Ẩn danh</span>
                        </div>
                        <p className="text-[10px] text-[#6B7090] dark:text-slate-400 line-clamp-2">Sản phẩm dùng khá mượt, nhưng giá hơi cao so với mặt bằng.</p>
                        <div className="mt-1.5 bg-[#f59e0b]/10 text-[#f59e0b] text-[8px] font-bold px-1.5 py-0.5 rounded w-max">Trung tính</div>
                      </div>
                      <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 p-2 rounded-[8px] shadow-sm">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-4 h-4 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white flex items-center justify-center text-[8px] font-bold">t</div>
                          <span className="text-[9px] font-bold text-[#1B1B4A] dark:text-white">User123</span>
                        </div>
                        <p className="text-[10px] text-[#6B7090] dark:text-slate-400 line-clamp-2">Dịch vụ quá tuyệt, support phản hồi trong 5 phút! 🚀</p>
                        <div className="mt-1.5 bg-[#34D399]/10 text-[#34D399] text-[8px] font-bold px-1.5 py-0.5 rounded w-max">Positive</div>
                      </div>
                    </div>
                  </div>
                  {/* Main Area */}
                  <div className="flex-1 flex flex-col gap-4">
                    {/* KPI Row */}
                    <div className="flex gap-4">
                      <div className="h-24 flex-1 rounded-[12px] bg-white dark:bg-white/5 border border-[#ECE9FF] dark:border-white/10 p-4 shadow-sm relative overflow-hidden flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-[#34D399]/10 text-[#34D399] flex items-center justify-center"><TrendingUp className="w-3 h-3" /></div>
                          <span className="text-[11px] font-bold text-[#6B7090]">Sức khỏe thương hiệu</span>
                        </div>
                        <div className="text-[20px] font-extrabold text-[#1B1B4A] dark:text-white">86/100</div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#34D399] to-transparent opacity-50" />
                      </div>
                      <div className="h-24 flex-1 rounded-[12px] bg-white dark:bg-white/5 border border-[#ECE9FF] dark:border-white/10 p-4 shadow-sm relative overflow-hidden flex flex-col justify-center">
                         <div className="flex items-center gap-2 mb-1">
                           <div className="w-6 h-6 rounded-full bg-[#ef4444]/10 text-[#ef4444] flex items-center justify-center"><AlertTriangle className="w-3 h-3" /></div>
                           <span className="text-[11px] font-bold text-[#6B7090]">Cảnh báo rủi ro</span>
                         </div>
                         <div className="text-[20px] font-extrabold text-[#1B1B4A] dark:text-white">2</div>
                         <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ef4444] to-transparent opacity-50" />
                      </div>
                    </div>
                    {/* Big Chart Area */}
                    <div className="flex-1 rounded-[16px] bg-gradient-to-br from-[#F5F3FF]/50 to-white dark:from-[#6D5EF6]/5 dark:to-transparent border border-[#ECE9FF] dark:border-white/10 p-4 flex flex-col justify-end gap-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-vercel-grid opacity-10 dark:opacity-5 pointer-events-none" />
                      {/* Fake Chart Bars/Lines */}
                      <div className="flex items-end justify-between h-full w-full opacity-80 px-4 pb-2 z-10">
                        {[40, 60, 35, 80, 50, 90, 70, 100, 60, 85].map((h, i) => (
                          <div key={i} className="w-8 rounded-t-md bg-gradient-to-t from-[#6D5EF6]/10 to-[#6D5EF6] transition-all duration-1000" style={{ height: `${h}%`, animation: `pulse 2s infinite ${i * 0.1}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Floating Badges */}
            <div className="absolute -top-6 -right-6 md:-right-10 animate-float z-20">
              <div className="glass-panel rounded-[16px] px-4 py-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ef4444]/10 text-[#ef4444]"><AlertTriangle className="h-4 w-4" /></div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-[#1B1B4A] dark:text-white">Crisis Alert</span>
                  <span className="text-[11px] font-medium text-[#ef4444]">Nguy cơ cao</span>
                </div>
              </div>
            </div>

            <div className="absolute top-[30%] -left-6 md:-left-12 animate-float-delayed z-20">
              <div className="glass-panel rounded-[16px] px-4 py-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#34D399]/10 text-[#34D399]"><TrendingUp className="h-4 w-4" /></div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-[#1B1B4A] dark:text-white">Sentiment +92%</span>
                  <span className="text-[11px] font-medium text-[#34D399]">Tăng đột biến</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-[15%] -right-8 md:-right-12 animate-float z-20" style={{ animationDelay: '1.5s' }}>
              <div className="glass-panel rounded-[16px] px-4 py-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6D5EF6]/10 text-[#6D5EF6]"><Sparkles className="h-4 w-4" /></div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-[#1B1B4A] dark:text-white">AI Summary</span>
                  <span className="text-[11px] font-medium text-[#6B7090] dark:text-slate-300">Đã cập nhật</span>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 left-12 md:left-20 animate-float-delayed z-20" style={{ animationDelay: '2s' }}>
              <div className="glass-panel rounded-[16px] px-4 py-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9]"><TrendingUp className="h-4 w-4" /></div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold text-[#1B1B4A] dark:text-white">Trending Topic</span>
                  <span className="text-[11px] font-medium text-[#0ea5e9]">#ThietKeCaoCap</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="solution" className="relative border-b border-[#ECE9FF] bg-[#F5F3FF] px-6 pb-[88px] pt-[50px] md:px-10 md:pt-[70px] overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-[-200px] left-[-150px] w-[500px] h-[500px] bg-[#9B8CFF] blur-[180px] opacity-[0.15] rounded-full pointer-events-none" />
        <div className="absolute top-[20%] right-[-100px] w-[600px] h-[600px] bg-[#6D5EF6] blur-[180px] opacity-[0.1] rounded-full pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-[900px] text-center">
          <Reveal>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#6D5EF6] mb-4">AI Brand Insights</p>
            <h2 className="font-display text-[32px] md:text-[42px] font-extrabold leading-[1.1] text-[#1B1B4A] tracking-tight">
              Khách hàng đang nói mỗi ngày.<br />
              <span className="bg-gradient-to-r from-[#6D5EF6] to-[#9B8CFF] bg-clip-text text-transparent">Thương hiệu</span> của bạn<br />
              đã thực sự lắng nghe?
            </h2>
            <p className="mx-auto mt-6 max-w-[640px] text-[17px] leading-[1.7] text-[#6B7090]">
              CRM lưu dữ liệu quá khứ. InsightFlow đọc tín hiệu thị trường hiện tại để bạn không bỏ lỡ bất kỳ cơ hội nào.
            </p>
          </Reveal>

          {/* Statistics */}
          <Reveal delay={0.1}>
            <div className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-8 md:gap-16 rounded-[24px] border border-[#ECE9FF] bg-white/60 px-8 py-4 shadow-[0_18px_50px_rgba(109,94,246,0.04)] backdrop-blur-md">
              <div className="flex flex-col items-center">
                <span className="font-display text-[24px] font-extrabold text-[#6D5EF6]">2 triệu+</span>
                <span className="text-[13px] font-medium text-[#6B7090]">Mentions/ngày</span>
              </div>
              <div className="h-10 w-px bg-[#ECE9FF] hidden sm:block" />
              <div className="flex flex-col items-center">
                <span className="font-display text-[24px] font-extrabold text-[#6D5EF6]">87%</span>
                <span className="text-[13px] font-medium text-[#6B7090]">AI Accuracy</span>
              </div>
              <div className="h-10 w-px bg-[#ECE9FF] hidden sm:block" />
              <div className="flex flex-col items-center">
                <span className="font-display text-[24px] font-extrabold text-[#6D5EF6]">24/7</span>
                <span className="text-[13px] font-medium text-[#6B7090]">Realtime Alert</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Dashboard Mini Illustration */}
        <div className="mx-auto max-w-[1000px] mt-12 relative z-10 hidden sm:block">
          <Reveal delay={0.2} className="relative mx-auto w-[80%] max-w-[800px]">
             {/* Advanced Insights UI */}
             <div className="rounded-[24px] border border-white/80 dark:border-white/10 bg-white/50 dark:bg-black/40 p-4 shadow-[0_40px_80px_rgba(109,94,246,0.12)] backdrop-blur-xl">
               <div className="flex flex-col md:flex-row gap-6">
                 {/* Left Column: Data Stream Pipeline */}
                 <div className="w-full md:w-1/3 flex flex-col gap-4">
                   <div className="glass-panel p-5 rounded-[16px] flex flex-col gap-4">
                     <p className="text-[14px] font-bold text-[#1B1B4A] dark:text-white">Nguồn dữ liệu Realtime</p>
                     
                     <div className="flex flex-col gap-3">
                       {/* Facebook */}
                       <div className="flex items-start gap-3 bg-white/80 dark:bg-white/5 border border-[#ECE9FF] dark:border-white/10 p-3 rounded-[12px] hover:-translate-y-1 transition-transform relative shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex shrink-0 items-center justify-center text-[14px] font-bold mt-0.5">f</div>
                         <div className="flex-1">
                           <div className="flex justify-between items-start mb-1">
                             <div className="flex flex-col">
                               <div className="flex items-center gap-2"><span className="text-[11px] font-bold text-[#1B1B4A] dark:text-white">Live Reviews</span><span className="text-[9px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-[#6B7090]">Facebook</span></div>
                               <p className="text-[12px] leading-snug text-[#6B7090] dark:text-slate-300 mt-1 line-clamp-2">Sản phẩm này rất đáng tiền, điểm 10 cho dịch vụ!</p>
                             </div>
                             <PulseDot className="bg-[#1877F2] shrink-0 ml-2 mt-1" />
                           </div>
                         </div>
                       </div>
                       
                       {/* X/Twitter */}
                       <div className="flex items-start gap-3 bg-white/80 dark:bg-white/5 border border-[#ECE9FF] dark:border-white/10 p-3 rounded-[12px] hover:-translate-y-1 transition-transform relative shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white flex shrink-0 items-center justify-center text-[14px] font-bold mt-0.5">𝕏</div>
                         <div className="flex-1">
                           <div className="flex justify-between items-start mb-1">
                             <div className="flex flex-col">
                               <div className="flex items-center gap-2"><span className="text-[11px] font-bold text-[#1B1B4A] dark:text-white">Feedback</span><span className="text-[9px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-[#6B7090]">X</span></div>
                               <p className="text-[12px] leading-snug text-[#6B7090] dark:text-slate-300 mt-1 line-clamp-2">Giao diện mới nhìn sang hẳn 👍</p>
                             </div>
                             <PulseDot className="bg-black dark:bg-white shrink-0 ml-2 mt-1" />
                           </div>
                         </div>
                       </div>
                       
                       {/* Mention (Crisis) */}
                       <div className="flex items-start gap-3 bg-[#ef4444]/5 border border-[#ef4444]/20 p-3 rounded-[12px] hover:-translate-y-1 transition-transform relative shadow-sm">
                         <div className="w-8 h-8 rounded-full bg-[#ef4444]/10 text-[#ef4444] flex shrink-0 items-center justify-center mt-0.5"><AlertTriangle className="w-4 h-4" /></div>
                         <div className="flex-1">
                           <div className="flex justify-between items-start mb-1">
                             <div className="flex flex-col">
                               <div className="flex items-center gap-2"><span className="text-[11px] font-bold text-[#ef4444]">Crisis Detected</span><span className="text-[9px] bg-[#ef4444]/10 px-1.5 py-0.5 rounded text-[#ef4444]">Mention</span></div>
                               <p className="text-[12px] leading-snug text-[#ef4444]/90 mt-1 line-clamp-2">Ai dùng app này rồi review giúp mình với, thấy dạo này lỗi nhiều quá?</p>
                             </div>
                             <PulseDot className="bg-[#ef4444] shrink-0 ml-2 mt-1" />
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Right Column: Sentiment Line Chart */}
                 <div className="w-full md:w-2/3 glass-panel p-6 rounded-[16px] flex flex-col min-h-[300px]">
                   <div className="flex items-center justify-between mb-8">
                     <div>
                       <p className="text-[18px] font-bold text-[#1B1B4A] dark:text-white">Xu hướng cảm xúc</p>
                       <p className="text-[13px] text-[#6B7090] dark:text-slate-400 mt-1">24 giờ qua</p>
                     </div>
                     <div className="flex gap-4 text-[13px] font-medium text-[#1B1B4A] dark:text-slate-200">
                       <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#34D399] shadow-[0_0_10px_rgba(52,211,153,0.5)]" /> Tích cực</span>
                       <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> Tiêu cực</span>
                     </div>
                   </div>
                   <div className="flex-1 w-full h-full relative">
                     <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                       <LineChart data={intelligenceData}>
                         <Tooltip 
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)' }}
                           itemStyle={{ fontWeight: 'bold' }}
                         />
                         <Line type="monotone" dataKey="positive" name="Tích cực" stroke="#34D399" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                         <Line type="monotone" dataKey="negative" name="Tiêu cực" stroke="#ef4444" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               </div>
             </div>
             
             {/* Floating Mini Cards */}
             <div className="absolute -left-12 top-1/4 animate-float hidden md:flex">
               <div className="glass-panel items-center gap-3 rounded-full px-5 py-3 flex">
                 <span className="text-[18px]">💬</span>
                 <span className="text-[13px] font-bold text-[#1B1B4A] dark:text-white">Live Reviews</span>
               </div>
             </div>
             <div className="absolute -right-10 top-1/3 animate-float-delayed z-20 hidden md:flex">
               <div className="glass-panel items-center gap-3 rounded-full px-5 py-3 flex">
                 <div className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                 <span className="text-[13px] font-bold text-[#34D399]">1.2M Data points</span>
               </div>
             </div>
             <div className="absolute -left-6 bottom-10 animate-float z-20 hidden md:flex" style={{ animationDelay: '1s' }}>
               <div className="glass-panel items-center gap-3 rounded-full px-5 py-3 flex">
                 <span className="text-[18px]">⚠️</span>
                 <span className="text-[13px] font-bold text-[#ef4444]">Crisis Detected</span>
               </div>
             </div>
          </Reveal>
        </div>

        {/* 3 Cards */}
        <div className="mx-auto mt-16 sm:mt-24 max-w-[1200px] relative z-10">
          <div className="grid gap-6 md:grid-cols-3 relative">
            {/* Connecting Line (Desktop only) */}
            <div className="hidden md:block absolute top-[50px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-[#6D5EF6]/20 to-transparent -z-10" />

            {[
              [MessageSquareText, "Quá nhiều điểm chạm", "Bình luận, inbox, review, video và tin tức nằm tách rời, khiến dữ liệu khách hàng bị chia nhỏ.", "bg-gradient-to-br from-[#6D5EF6] to-[#9B8CFF]"],
              [Eye, "Thiếu tín hiệu rõ ràng", "Đội ngũ thấy rất nhiều nội dung, nhưng thiếu ngữ cảnh để biết đâu là cơ hội, đâu là rủi ro.", "bg-gradient-to-br from-[#34D399] to-[#059669]"],
              [Flame, "Phản hồi thường quá muộn", "Khi một chủ đề trở nên rõ ràng thì nó thường đã lan rộng và tốn nhiều chi phí hơn để xử lý.", "bg-gradient-to-br from-[#ef4444] to-[#dc2626]"],
            ].map(([Icon, title, description, gradientClass], index) => {
              const CardIcon = Icon as typeof Eye;
              return (
                <Reveal key={title as string} delay={0.3 + index * 0.1}>
                  <div className="group relative h-full flex flex-col rounded-[24px] border border-[#ECE9FF] bg-white p-6 shadow-[0_18px_50px_rgba(109,94,246,0.04)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(109,94,246,0.12)]">
                    <div className="flex items-center justify-between mb-6">
                      <div className={`flex h-[48px] w-[48px] items-center justify-center rounded-[16px] text-white ${gradientClass as string} shadow-md`}>
                        <CardIcon className="h-6 w-6" />
                      </div>
                      <span className="font-display text-[14px] font-extrabold text-[#C8C4D6]">0{index + 1}</span>
                    </div>
                    {/* Small illustration abstraction */}
                    <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-[#F5F3FF] to-transparent mb-6 group-hover:from-[#9B8CFF]/20 transition-colors" />
                    
                    <h3 className="font-display text-[22px] font-bold text-[#1B1B4A] mb-3">{title as string}</h3>
                    <p className="text-[17px] leading-[1.7] text-[#6B7090] mb-6 flex-1">{description as string}</p>
                    
                    <div className="mt-auto flex items-center text-[15px] font-bold text-[#6D5EF6] opacity-80 transition-opacity group-hover:opacity-100">
                      Khám phá <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative bg-white px-6 py-[88px] md:px-10 overflow-hidden">
        {/* Soft Purple Glow Behind Dashboard */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#9B8CFF] blur-[160px] opacity-[0.15] pointer-events-none rounded-full" />

        <div className="relative z-10 mx-auto max-w-[1200px] flex flex-col items-center">
          {/* Text Section */}
          <Reveal className="text-center max-w-[800px]">
            <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#6D5EF6] mb-4">Tín hiệu được kết nối</p>
            <h2 className="font-display text-[32px] md:text-[42px] font-extrabold leading-[1.1] text-[#1B1B4A] tracking-tight">
              Mỗi cuộc trò chuyện đều có thể là <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-[#6D5EF6] to-[#9B8CFF] bg-clip-text text-transparent">bước tiếp theo của tăng trưởng.</span>
            </h2>
            <p className="mt-6 text-[17px] leading-[1.7] text-[#6B7090]">
              InsightFlow không dừng ở việc "nghe". Hệ thống gắn bối cảnh, chấm mức độ ưu tiên và đưa tín hiệu đến đúng người để tạo ra hành động ngay lập tức.
            </p>
          </Reveal>

          {/* Visual Pipeline Layout (Replacing Image) */}
          <Reveal delay={0.2} className="relative mt-20 w-full max-w-[1000px] mx-auto z-10">
            <div className="glass-panel p-8 md:p-12 rounded-[32px] flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#34D399] blur-[150px] opacity-[0.1] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#6D5EF6] blur-[150px] opacity-[0.1] rounded-full pointer-events-none" />
              
              {/* Animated Connecting Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ECE9FF] dark:via-white/10 to-transparent -z-10 hidden md:block" />
              <div className="absolute top-1/2 left-[15%] w-[30%] h-1 bg-gradient-to-r from-transparent via-[#6D5EF6] to-transparent -z-10 hidden md:block" style={{ animation: 'slideRight 3s infinite linear' }} />
              
              {/* Step 1: Sources */}
              <div className="flex flex-col items-center gap-4 z-10 w-full md:w-auto mb-8 md:mb-0">
                <div className="flex gap-2">
                  <div className="w-12 h-12 rounded-[16px] bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20 flex items-center justify-center font-bold text-[20px] shadow-sm">f</div>
                  <div className="w-12 h-12 rounded-[16px] bg-black/5 dark:bg-white/10 text-black dark:text-white border border-black/10 dark:border-white/20 flex items-center justify-center font-bold text-[20px] shadow-sm">t</div>
                  <div className="w-12 h-12 rounded-[16px] bg-[#1c1c1e]/5 dark:bg-white/10 text-[#1c1c1e] dark:text-white border border-[#1c1c1e]/10 dark:border-white/20 flex items-center justify-center font-bold text-[20px] shadow-sm">@</div>
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-bold text-[#1B1B4A] dark:text-white">Đa nền tảng</p>
                  <p className="text-[12px] text-[#6B7090] dark:text-slate-400">Dữ liệu thô</p>
                </div>
              </div>

              {/* Step 2: AI Processing */}
              <div className="flex flex-col items-center gap-4 z-10 w-full md:w-auto mb-8 md:mb-0 relative">
                <div className="absolute inset-0 bg-[#6D5EF6] blur-[40px] opacity-20 rounded-full" />
                <div className="h-[140px] w-[180px] rounded-[24px] bg-white/90 dark:bg-[#0A0612]/90 border border-[#6D5EF6]/30 p-4 shadow-[0_20px_40px_rgba(109,94,246,0.15)] backdrop-blur-xl flex flex-col justify-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#6D5EF6]/10 text-[#6D5EF6] flex items-center justify-center"><Bot className="w-3 h-3" /></div>
                    <span className="text-[12px] font-bold text-[#1B1B4A] dark:text-white">AI Phân loại</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#34D399]/10 text-[#34D399] flex items-center justify-center"><Activity className="w-3 h-3" /></div>
                    <span className="text-[12px] font-bold text-[#1B1B4A] dark:text-white">Cảm xúc</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#ef4444]/10 text-[#ef4444] flex items-center justify-center"><AlertTriangle className="w-3 h-3" /></div>
                    <span className="text-[12px] font-bold text-[#1B1B4A] dark:text-white">Rủi ro</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Action */}
              <div className="flex flex-col items-center gap-4 z-10 w-full md:w-auto">
                <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#6D5EF6] to-[#9B8CFF] text-white flex items-center justify-center shadow-[0_20px_40px_rgba(109,94,246,0.3)]">
                  <Send className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-bold text-[#1B1B4A] dark:text-white">Sales & Marketing</p>
                  <p className="text-[12px] text-[#6B7090] dark:text-slate-400">Hành động tức thì</p>
                </div>
              </div>

            </div>

          </Reveal>
        </div>
      </section>

      <LiveIntelligenceSection />

      <section id="workflow" className="relative border-y border-[#ECE9FF] dark:border-white/10 bg-gradient-to-b from-[#F7F5FF] to-white dark:from-[#0A0612]/50 dark:to-[#0A0612] px-6 py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-vercel-grid opacity-[0.04] dark:opacity-[0.02] pointer-events-none" />
        
        <SectionIntro eyebrow="Quy trình sống" title="Từ tín hiệu đầu tiên đến một phản hồi tạo khác biệt." description="InsightFlow giúp mọi đội chung một ngôn ngữ: nhìn thấy điều quan trọng, hiểu nó có ý nghĩa gì, rồi hành động có trách nhiệm." />
        
        <div className="relative z-10 mx-auto mt-28 max-w-[1200px]">
          {/* Connecting Line with Animation */}
          <div className="hidden lg:block absolute top-[48px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-[#ECE9FF] dark:via-white/10 to-transparent -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,#6D5EF6_50%,transparent_100%)] w-[30%] animate-slide-right opacity-50 dark:opacity-80" />
          </div>

          <div className="grid gap-8 md:gap-10 lg:grid-cols-3 max-w-[1100px] mx-auto">
            {workflowSteps.map((step, index) => {
              const isCenter = index === 1;
              return (
                <Reveal key={step.number} delay={index * 0.15}>
                  <article className={`group relative flex flex-col items-center text-center h-full transition-transform duration-500 ${isCenter ? 'lg:-translate-y-4' : ''}`}>
                    {/* Step Icon / Number */}
                    <div className={`w-[96px] h-[96px] rounded-full bg-white dark:bg-[#0A0612] border-[6px] border-[#F5F3FF] dark:border-white/5 flex items-center justify-center mb-8 transition-all duration-300 group-hover:scale-110 group-hover:border-[#6D5EF6]/20 dark:group-hover:border-[#6D5EF6]/20 relative z-10 ${isCenter ? 'ring-4 ring-[#6D5EF6]/20 dark:ring-[#6D5EF6]/40 shadow-[0_0_40px_rgba(109,94,246,0.3)] animate-pulse-slow' : 'shadow-[0_18px_50px_rgba(109,94,246,0.08)]'}`}>
                      <span className={`font-display text-[26px] font-bold ${isCenter ? 'bg-gradient-to-r from-[#6D5EF6] to-[#9B8CFF] bg-clip-text text-transparent' : 'text-[#6D5EF6] dark:text-[#9B8CFF]'}`}>{step.number}</span>
                    </div>

                    {/* Content Card */}
                    <div className={`w-full h-full rounded-[32px] glass-panel p-8 md:p-10 transition-all duration-500 flex flex-col ${isCenter ? 'border border-[#6D5EF6]/30 dark:border-[#6D5EF6]/30 shadow-[0_30px_80px_rgba(109,94,246,0.15)] group-hover:shadow-[0_40px_100px_rgba(109,94,246,0.25)] group-hover:-translate-y-3' : 'border border-[#ECE9FF] dark:border-white/10 shadow-[0_18px_50px_rgba(109,94,246,0.04)] group-hover:shadow-[0_30px_60px_rgba(109,94,246,0.12)] group-hover:-translate-y-2'}`}>
                      <h3 className="font-display text-[24px] font-bold text-[#1B1B4A] dark:text-white">{step.title}</h3>
                      <p className="mt-5 text-[17px] leading-[1.7] text-[#6B7090] dark:text-slate-400 flex-1">{step.description}</p>
                      
                      <div className={`mt-8 inline-flex mx-auto items-center gap-2 rounded-full px-5 py-2.5 text-[13px] md:text-[14px] font-bold uppercase tracking-[0.11em] transition-colors ${isCenter ? 'bg-gradient-to-r from-[#6D5EF6] to-[#9B8CFF] text-white shadow-md' : 'bg-[#F5F3FF] dark:bg-white/5 text-[#6D5EF6] dark:text-[#9B8CFF]'}`}>
                        {step.detail}
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="modules" className="relative border-b border-[#ECE9FF] dark:border-white/10 bg-gradient-to-b from-white to-[#F7F9FF] dark:from-[#0A0612] dark:to-[#0A0612]/50 px-6 py-24 md:py-32 overflow-hidden">
        {/* Soft Grid Background */}
        <div className="absolute inset-0 bg-vercel-grid opacity-30 dark:opacity-5 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#6D5EF6] blur-[200px] opacity-[0.05] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <SectionIntro eyebrow="Một hệ thống, nhiều năng lực" title="Đủ sâu cho đội vận hành. Đủ rõ cho người ra quyết định." description="Mỗi mô-đun cùng làm một việc: biến dữ liệu phân tán thành những quyết định đáng tin cậy hơn." />
          <div className="mt-20 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <Reveal key={module.title} delay={index * 0.1}>
                  <motion.article 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -8 }} 
                    className="group relative h-full flex flex-col min-h-[460px] overflow-hidden rounded-[32px] glass-panel border border-[#ECE9FF] dark:border-white/10 p-8 transition-all duration-300 hover:-translate-y-[4px] hover:border-[#7C5CFF]/30 hover:shadow-[0_30px_60px_rgba(109,94,246,0.12)]"
                  >
                    <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-gradient-to-br from-[#6D5EF6]/20 to-transparent blur-[30px] group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                    
                    <div className="flex flex-col gap-6 mb-8 relative z-10">
                      <div className="flex h-[64px] w-[64px] items-center justify-center rounded-[20px] bg-gradient-to-br from-[#6D5EF6] to-[#9B8CFF] shadow-[0_10px_30px_rgba(109,94,246,0.3)] transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-display text-[24px] font-bold text-[#1B1B4A] dark:text-white">{module.title}</h3>
                    </div>
                    
                    <p className="text-[16px] leading-[1.7] text-[#6B7090] dark:text-slate-400 mb-10 flex-1 relative z-10">{module.description}</p>
                    
                    {/* Dynamic Mini UI Preview */}
                    <div className="mt-auto mb-8 h-[100px] w-full rounded-[20px] border border-[#ECE9FF] dark:border-white/10 bg-[#F5F3FF] dark:bg-white/5 p-4 relative overflow-hidden group-hover:bg-white dark:group-hover:bg-white/10 transition-colors z-10 shadow-inner flex flex-col justify-center">
                      {index === 0 && (
                        <div className="flex flex-col items-center justify-center gap-3 w-full">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[14px] font-bold text-[#1877F2]">f</div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] opacity-80 flex items-center justify-center"><div className="w-3 h-3 border-2 border-white rounded-[4px] relative"><div className="absolute top-[1px] right-[1px] w-[2px] h-[2px] bg-white rounded-full" /></div></div>
                            <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[14px] font-bold text-black dark:text-white">t</div>
                            <div className="w-8 h-8 rounded-full bg-[#0068FF]/10 flex items-center justify-center text-[12px] font-bold text-[#0068FF]">Z</div>
                          </div>
                          <div className="relative w-full h-1.5 rounded-full bg-[#6D5EF6]/20 mt-1">
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#6D5EF6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                              128 tin nhắn mới
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#6D5EF6]" />
                          </div>
                        </div>
                      )}
                      
                      {index === 1 && (
                        <div className="flex flex-col justify-center gap-2.5 w-full px-2">
                          <div className="flex items-start gap-2 max-w-[85%]">
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-1">
                              <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 p-1.5 px-2 rounded-[10px] rounded-tl-sm shadow-sm">
                                <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-white/20 mb-1" />
                                <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-white/20" />
                              </div>
                              <div className="bg-[#f97316]/10 text-[#f97316] text-[9px] font-bold px-1.5 py-0.5 rounded-md w-max shadow-sm border border-[#f97316]/20">
                                Muốn mua
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2 max-w-[85%] ml-auto flex-row-reverse">
                            <div className="w-6 h-6 rounded-full bg-[#6D5EF6]/10 text-[#6D5EF6] shrink-0 mt-0.5 flex items-center justify-center"><Bot className="w-3 h-3" /></div>
                            <div className="flex flex-col gap-1 items-end">
                              <div className="bg-[#6D5EF6] text-white p-1.5 px-2 rounded-[10px] rounded-tr-sm shadow-sm">
                                <div className="w-16 h-1.5 rounded-full bg-white/60 mb-1" />
                                <div className="w-10 h-1.5 rounded-full bg-white/60" />
                              </div>
                              <div className="bg-[#34D399]/10 text-[#34D399] text-[9px] font-bold px-1.5 py-0.5 rounded-md w-max shadow-sm border border-[#34D399]/20">
                                Hỏi giá
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {index === 2 && (
                        <div className="flex flex-col justify-center gap-3 w-full">
                          <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-[#34D399]" />
                              <div className="w-4 h-[1px] bg-slate-200 dark:bg-white/10" />
                              <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                              <div className="w-4 h-[1px] bg-slate-200 dark:bg-white/10" />
                              <div className="w-3 h-3 rounded-full bg-[#ef4444] animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                            </div>
                            <div className="bg-[#ef4444]/10 text-[#ef4444] p-1 rounded-md"><AlertTriangle className="w-3 h-3" /></div>
                          </div>
                          <div className="w-full rounded-[10px] border border-[#ef4444]/30 bg-[#ef4444]/5 p-2 flex gap-3 items-center relative overflow-hidden shadow-sm">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ef4444] animate-pulse" />
                            <div className="w-6 h-6 rounded-full bg-[#ef4444]/20 flex shrink-0 items-center justify-center"><div className="w-2 h-2 rounded-full bg-[#ef4444]" /></div>
                            <div className="flex-1">
                              <div className="w-3/4 h-2 rounded-full bg-[#ef4444]/60 mb-1.5" />
                              <div className="w-1/2 h-1.5 rounded-full bg-[#ef4444]/30" />
                            </div>
                          </div>
                        </div>
                      )}

                      {index === 3 && (
                        <div className="flex gap-2 h-full w-full text-[8px] font-bold pt-1">
                          {/* To Do */}
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="text-[#6B7090] dark:text-slate-400">Cần làm</div>
                            <div className="w-full rounded-[6px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1.5 shadow-sm">
                              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/20 mb-1.5" />
                              <div className="flex items-center justify-between">
                                <div className="bg-[#8b5cf6]/10 text-[#8b5cf6] px-1 py-0.5 rounded-[4px] leading-none">Brand</div>
                                <div className="w-3 h-3 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center text-[6px]">T</div>
                              </div>
                            </div>
                          </div>
                          {/* In Progress */}
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="text-[#6B7090] dark:text-slate-400">Đang xử lý</div>
                            <div className="w-full rounded-[6px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1.5 shadow-sm">
                              <div className="w-3/4 h-1.5 rounded-full bg-slate-200 dark:bg-white/20 mb-1.5" />
                              <div className="flex items-center justify-between">
                                <div className="bg-[#f97316]/10 text-[#f97316] px-1 py-0.5 rounded-[4px] leading-none">Sales</div>
                                <div className="w-3 h-3 rounded-full bg-[#f97316] text-white flex items-center justify-center text-[6px]">M</div>
                              </div>
                            </div>
                          </div>
                          {/* Done */}
                          <div className="flex-1 flex flex-col gap-1.5 opacity-60">
                            <div className="text-[#6B7090] dark:text-slate-400">Xong</div>
                            <div className="w-full rounded-[6px] bg-white dark:bg-white/5 border border-[#34D399]/30 p-1.5 border-dashed">
                              <div className="w-1/2 h-1.5 rounded-full bg-slate-200 dark:bg-white/20 mb-1.5" />
                              <div className="flex items-center justify-between">
                                <div className="bg-[#14b8a6]/10 text-[#14b8a6] px-1 py-0.5 rounded-[4px] leading-none">CSKH</div>
                                <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-white/20" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {index === 4 && (
                        <div className="flex flex-col items-center justify-center h-full relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#8b5cf6] blur-[24px] opacity-20 rounded-full animate-pulse" />
                          <svg className="w-20 h-12" viewBox="0 0 100 50">
                            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" className="text-slate-200 dark:text-white/10" strokeWidth="8" strokeLinecap="round" />
                            <path d="M 10 50 A 40 40 0 0 1 70 20" fill="none" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-[dash_2s_ease-out_forwards]" strokeDasharray="120" strokeDashoffset="0" />
                          </svg>
                          <div className="absolute bottom-0 flex flex-col items-center">
                            <span className="text-[18px] font-bold text-[#1B1B4A] dark:text-white leading-none">82</span>
                            <span className="text-[10px] text-[#34D399] font-bold mt-0.5 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" /> +4</span>
                          </div>
                        </div>
                      )}

                      {index === 5 && (
                        <div className="flex flex-col h-full gap-2 justify-center w-full">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="bg-[#0ea5e9]/10 p-1.5 rounded-lg"><ClipboardList className="w-4 h-4 text-[#0ea5e9]" /></div>
                            <div className="flex-1">
                              <div className="w-20 h-2 rounded-full bg-slate-200 dark:bg-white/20 mb-1.5" />
                              <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-white/10" />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20 shrink-0" />
                            <div className="w-3/4 h-2 rounded-full bg-slate-200 dark:bg-white/10" />
                          </div>
                          
                          <div className="flex items-start gap-2 ml-1 bg-[#6D5EF6]/5 border border-[#6D5EF6]/10 p-2 rounded-lg relative overflow-hidden mt-1">
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#6D5EF6]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-[#6D5EF6] mt-1 shrink-0" />
                            <div className="flex flex-col gap-1.5 w-full">
                              <div className="w-[85%] h-2 rounded-full bg-[#6D5EF6]/60" />
                              <div className="w-[60%] h-2 rounded-full bg-[#6D5EF6]/40" />
                            </div>
                            <div className="absolute right-2 top-1.5 bg-[#6D5EF6] text-white text-[7px] font-bold px-1.5 py-0.5 rounded shadow-sm">AI ĐỀ XUẤT</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center text-[15px] font-bold text-[#6D5EF6] dark:text-[#9B8CFF] opacity-80 group-hover:opacity-100 transition-opacity relative z-10">
                      Khám phá năng lực <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-2" />
                    </div>
                  </motion.article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="use-cases" className="relative border-y border-[#ECE9FF] dark:border-white/10 bg-gradient-to-b from-[#F7F9FF] to-white dark:from-[#0A0612]/50 dark:to-[#0A0612] px-6 py-24 md:py-32 overflow-hidden">
        {/* Glow */}
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[#9B8CFF] blur-[180px] opacity-[0.08] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <SectionIntro eyebrow="Một nền tảng, một góc nhìn cho từng vai trò" title="Cùng một sự thật. Mỗi đội thấy đúng điều họ cần làm tiếp." description="Chọn vai trò để xem InsightFlow giúp đội ngũ chuyển từ theo dõi sang chủ động ra sao." />
          
          <div className="mt-20 grid gap-8 lg:grid-cols-[320px_1fr]">
            <Reveal>
              <div className="flex flex-col gap-2 rounded-[24px] border border-[#ECE9FF] bg-white p-4 shadow-[0_18px_50px_rgba(109,94,246,0.04)]">
                {roleStories.map((story) => {
                  const Icon = story.icon;
                  const active = story.id === selectedRole;
                  return (
                    <button key={story.id} type="button" onClick={() => setSelectedRole(story.id)} className={`group relative flex w-full items-center gap-4 rounded-[16px] px-5 py-5 text-left transition-all duration-300 ${active ? "bg-gradient-to-r from-[#F5F3FF] to-white shadow-sm border border-[#ECE9FF]" : "hover:bg-[#F5F3FF]/50 border border-transparent"}`}>
                      {active && <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#6D5EF6]" />}
                      <div className={`flex h-12 w-12 items-center justify-center rounded-[12px] transition-colors ${active ? "bg-[#6D5EF6] text-white shadow-md" : "bg-[#F5F3FF] text-[#6D5EF6] group-hover:bg-[#6D5EF6]/10"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-[17px] font-extrabold transition-colors ${active ? "text-[#1B1B4A]" : "text-[#6B7090] group-hover:text-[#1B1B4A]"}`}>{story.label}</span>
                      {active && <ChevronRight className="ml-auto h-5 w-5 text-[#6D5EF6]" />}
                    </button>
                  );
                })}
              </div>
            </Reveal>

            <motion.div 
              key={activeRole.id} 
              initial={{ opacity: 0, scale: 0.98, x: reduceMotion ? 0 : 20 }} 
              animate={{ opacity: 1, scale: 1, x: 0 }} 
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }} 
              className="relative overflow-hidden rounded-[24px] border border-[#ECE9FF] bg-white p-8 shadow-[0_30px_60px_rgba(109,94,246,0.12)] md:p-12 lg:w-full"
            >
              {/* Decorative background in panel */}
              <div className="absolute -right-20 -top-20 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#6D5EF6] to-[#9B8CFF] blur-[100px] opacity-[0.15] pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">
                <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#6D5EF6]">{activeRole.eyebrow}</p>
                <h3 className="mt-4 max-w-[670px] font-display text-[32px] font-bold leading-[1.2] md:text-[36px] text-[#1B1B4A]">{activeRole.title}</h3>
                <p className="mt-6 max-w-[700px] text-[17px] leading-[1.7] text-[#6B7090]">{activeRole.description}</p>
                
                <div className="mt-auto pt-12 grid gap-4 sm:grid-cols-3">
                  {activeRole.metrics.map(([label, value, delta]) => {
                    const isPositive = delta.includes('+') || delta.includes('Tăng');
                    const isNeutral = delta.includes('Tuần này') || delta.includes('Cần xử lý') || delta.includes('Cần xem') || delta.includes('phân khúc') || delta.includes('ngày');
                    
                    return (
                      <div key={label} className="rounded-[20px] border border-[#ECE9FF] dark:border-white/10 bg-[#F7F9FF] dark:bg-white/5 p-5 shadow-sm transition-all duration-300 hover:shadow-[0_20px_40px_rgba(109,94,246,0.1)] hover:-translate-y-1 hover:bg-white dark:hover:bg-white/10">
                        <div className="flex items-center gap-2 mb-3 text-[#6B7090] dark:text-slate-400">
                          {label.includes('Cảnh báo') || label.includes('Chờ') ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                          <p className="text-[12px] font-bold uppercase tracking-wider">{label}</p>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <p className="font-display text-[38px] font-extrabold text-[#1B1B4A] dark:text-white leading-none">{value}</p>
                        </div>
                        <div className={`mt-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold ${isPositive ? 'bg-[#34D399]/10 text-[#34D399]' : isNeutral ? 'bg-slate-200 dark:bg-white/10 text-[#6B7090] dark:text-slate-300' : 'bg-[#ef4444]/10 text-[#ef4444]'}`}>
                          {!isNeutral && <TrendingUp className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`} />}
                          {delta}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="consultation" className="relative border-y border-[#ECE9FF] dark:border-white/10 bg-gradient-to-b from-white to-[#F5F3FF] dark:from-[#0A0612] dark:to-[#0A0612]/50 px-6 pt-12 pb-24 md:pt-16 md:pb-32 overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-[20%] left-[-100px] w-[600px] h-[600px] bg-[#9B8CFF] blur-[200px] opacity-[0.1] rounded-full pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-100px] w-[600px] h-[600px] bg-[#6D5EF6] blur-[200px] opacity-[0.1] rounded-full pointer-events-none" />

        <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start relative z-10">
          <Reveal className="lg:sticky lg:top-28">
            <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#6D5EF6]">Dùng thử có định hướng</p>
            <h2 className="mt-4 font-display text-[32px] md:text-[42px] font-bold leading-[1.1] text-[#1B1B4A] dark:text-white">Mỗi thương hiệu cần một cách bắt đầu riêng.</h2>
            <p className="mt-6 max-w-[510px] text-[17px] leading-[1.7] text-[#6B7090] dark:text-slate-300">Để buổi demo thực sự hữu ích, đội InsightFlow sẽ đọc bài toán của bạn trước: kênh cần theo dõi, nhu cầu ưu tiên và cách triển khai phù hợp.</p>
            <div className="mt-10 space-y-5">
              {["Đề xuất quy trình theo ngành hàng và mô hình đội ngũ", "Chọn chỉ số, kênh theo dõi và tình huống ưu tiên", "Demo xoay quanh bài toán thật, không phải bản trình diễn chung chung"].map((item) => (
                <div key={item} className="flex gap-4 text-[16px] font-medium leading-[1.6] text-[#1B1B4A] dark:text-white">
                  <div className="flex-shrink-0 mt-1 h-6 w-6 rounded-full bg-[#34D399]/20 text-[#34D399] flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  {item}
                </div>
              ))}
            </div>

            {/* Enhanced Social Proof & Trust Signal */}
            <div className="mt-12 rounded-[32px] bg-white dark:bg-white/5 p-8 border border-[#ECE9FF] dark:border-white/10 max-w-[460px] shadow-[0_30px_60px_rgba(109,94,246,0.08)] transition-all duration-500 hover:shadow-[0_40px_80px_rgba(109,94,246,0.12)]">
              <div className="flex items-center gap-5 mb-6">
                <div className="flex -space-x-4">
                  {[
                    "https://i.pravatar.cc/100?img=1",
                    "https://i.pravatar.cc/100?img=2",
                    "https://i.pravatar.cc/100?img=3",
                    "https://i.pravatar.cc/100?img=4",
                    "https://i.pravatar.cc/100?img=5"
                  ].map((src, i) => (
                    <img key={i} src={src} alt="User avatar" className="h-14 w-14 rounded-full border-[3px] border-white dark:border-[#0A0612] object-cover shadow-sm transition-transform hover:-translate-y-1 hover:z-10 relative" />
                  ))}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="flex gap-1 text-[#f59e0b] text-[18px]">
                    ★★★★★
                  </div>
                  <span className="text-[14px] font-bold text-[#1B1B4A] dark:text-white mt-1">Hơn 300+ thương hiệu</span>
                  <span className="text-[12px] font-medium text-[#6B7090] dark:text-slate-400">đã tin tưởng sử dụng</span>
                </div>
              </div>
              
              <div className="pt-6 border-t border-[#ECE9FF] dark:border-white/10">
                <p className="text-[12px] font-bold uppercase tracking-wider text-[#6B7090] dark:text-slate-400 mb-4">Các đối tác tiêu biểu</p>
                <div className="flex items-center gap-6">
                  {/* Generic Logos replacing real ones */}
                  <div className="flex items-center gap-2 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                    <div className="w-6 h-6 bg-[#2563eb] rounded-md shadow-sm" />
                    <span className="font-bold text-[#1B1B4A] dark:text-white text-[15px]">Techcom</span>
                  </div>
                  <div className="flex items-center gap-2 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                    <div className="w-6 h-6 bg-[#ef4444] rounded-full shadow-sm" />
                    <span className="font-bold text-[#1B1B4A] dark:text-white text-[15px]">VinFast</span>
                  </div>
                  <div className="flex items-center gap-2 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                    <div className="w-6 h-6 bg-[#10b981] rounded-sm rotate-45 scale-75 shadow-sm" />
                    <span className="font-bold text-[#1B1B4A] dark:text-white text-[15px]">Mobi</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="w-full max-w-[600px] mx-auto lg:ml-auto rounded-[28px] border border-white/80 dark:border-white/10 bg-white/70 dark:bg-[#0A0612]/60 p-8 shadow-[0_30px_60px_rgba(109,94,246,0.12)] backdrop-blur-xl md:p-10">
              {submitted ? (
                <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#34D399]/10 text-[#34D399] mb-6">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h3 className="font-display text-[32px] font-extrabold text-[#1B1B4A] dark:text-white">Thông tin của bạn đã đến nơi.</h3>
                  <p className="mt-4 max-w-[440px] text-[17px] leading-[1.7] text-[#6B7090] dark:text-slate-300">Đội InsightFlow sẽ liên hệ để tìm hiểu bài toán và sắp xếp buổi tư vấn phù hợp.</p>
                  <button type="button" onClick={() => { setSubmitted(false); setForm(initialFormState); }} className="mt-8 rounded-full border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 px-8 py-4 text-[15px] font-bold text-[#1B1B4A] dark:text-white transition-all hover:bg-[#F5F3FF] dark:hover:bg-white/10 hover:border-[#6D5EF6]/30 shadow-sm">Gửi một yêu cầu khác</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid gap-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="grid gap-2 text-[14px] font-extrabold text-[#1B1B4A] dark:text-white">
                      Họ và tên *
                      <input value={form.fullName} onChange={(event) => updateForm("fullName", event.target.value)} className="h-14 rounded-[16px] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-[#0A0612]/50 px-4 text-[15px] text-[#1B1B4A] dark:text-white outline-none transition focus:border-[#6D5EF6] focus:ring-4 focus:ring-[#6D5EF6]/10 placeholder:text-slate-400" placeholder="Nguyễn Văn A" />
                    </label>
                    <label className="grid gap-2 text-[14px] font-extrabold text-[#1B1B4A] dark:text-white">
                      Email công việc *
                      <input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} className="h-14 rounded-[16px] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-[#0A0612]/50 px-4 text-[15px] text-[#1B1B4A] dark:text-white outline-none transition focus:border-[#6D5EF6] focus:ring-4 focus:ring-[#6D5EF6]/10 placeholder:text-slate-400" placeholder="name@company.com" />
                    </label>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="grid gap-2 text-[14px] font-extrabold text-[#1B1B4A] dark:text-white">
                      Số điện thoại *
                      <input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} className="h-14 rounded-[16px] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-[#0A0612]/50 px-4 text-[15px] text-[#1B1B4A] dark:text-white outline-none transition focus:border-[#6D5EF6] focus:ring-4 focus:ring-[#6D5EF6]/10 placeholder:text-slate-400" placeholder="090..." />
                    </label>
                    <label className="grid gap-2 text-[14px] font-extrabold text-[#1B1B4A] dark:text-white">
                      Thương hiệu / doanh nghiệp *
                      <input value={form.company} onChange={(event) => updateForm("company", event.target.value)} className="h-14 rounded-[16px] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-[#0A0612]/50 px-4 text-[15px] text-[#1B1B4A] dark:text-white outline-none transition focus:border-[#6D5EF6] focus:ring-4 focus:ring-[#6D5EF6]/10 placeholder:text-slate-400" placeholder="Tên doanh nghiệp" />
                    </label>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="grid gap-2 text-[14px] font-extrabold text-[#1B1B4A] dark:text-white">
                      Ngành hàng
                      <input value={form.industry} onChange={(event) => updateForm("industry", event.target.value)} className="h-14 rounded-[16px] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-[#0A0612]/50 px-4 text-[15px] text-[#1B1B4A] dark:text-white outline-none transition focus:border-[#6D5EF6] focus:ring-4 focus:ring-[#6D5EF6]/10 placeholder:text-slate-400" placeholder="F&B, bán lẻ..." />
                    </label>
                    <label className="grid gap-2 text-[14px] font-extrabold text-[#1B1B4A] dark:text-white">
                      Quy mô đội ngũ
                      <select value={form.teamSize} onChange={(event) => updateForm("teamSize", event.target.value)} className="h-14 rounded-[16px] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-[#0A0612]/50 px-4 text-[15px] text-[#6B7090] dark:text-slate-300 outline-none transition focus:border-[#6D5EF6] focus:ring-4 focus:ring-[#6D5EF6]/10">
                        <option value="">Chọn quy mô</option>
                        <option value="1-10">1-10 người</option>
                        <option value="11-50">11-50 người</option>
                        <option value="51-200">51-200 người</option>
                        <option value="200+">Trên 200 người</option>
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-3">
                    <span className="text-[14px] font-extrabold text-[#1B1B4A] dark:text-white">Kênh muốn theo dõi</span>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {channels.map((channel) => {
                        const selected = form.channels.split(",").filter(Boolean).includes(channel);
                        return (
                          <button key={channel} type="button" onClick={() => { const current = form.channels.split(",").filter(Boolean); updateForm("channels", (selected ? current.filter((item) => item !== channel) : [...current, channel]).join(",")); }} className={`h-12 rounded-[12px] border text-[14px] font-bold transition-all ${selected ? "border-[#6D5EF6] bg-[#6D5EF6]/10 text-[#6D5EF6]" : "border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-[#0A0612]/50 text-[#6B7090] dark:text-slate-300 hover:border-[#6D5EF6]/40"}`}>
                            {channel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <label className="grid gap-2 text-[14px] font-extrabold text-[#1B1B4A] dark:text-white">
                    Nhu cầu chính *
                    <select value={form.need} onChange={(event) => updateForm("need", event.target.value)} className="h-14 rounded-[16px] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-[#0A0612]/50 px-4 text-[15px] text-[#6B7090] dark:text-slate-300 outline-none transition focus:border-[#6D5EF6] focus:ring-4 focus:ring-[#6D5EF6]/10">
                      <option>Phát hiện khách hàng tiềm năng</option>
                      <option>Theo dõi sức khỏe thương hiệu</option>
                      <option>Cảnh báo khủng hoảng truyền thông</option>
                      <option>Báo cáo AI cho ban lãnh đạo</option>
                      <option>Tư vấn quy trình tổng thể</option>
                    </select>
                  </label>
                  <button type="submit" disabled={missingRequired} className="mt-6 inline-flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#1B1B4A] hover:bg-[#2A2A6A] px-8 text-[16px] font-bold text-white shadow-[0_12px_24px_rgba(27,27,74,0.15)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(27,27,74,0.25)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none">
                    Gửi thông tin để nhận tư vấn <Send className="h-5 w-5" />
                  </button>
                  <p className="mt-3 text-center text-[13px] leading-[1.6] text-[#6B7090]">Khi gửi biểu mẫu, bạn đồng ý để InsightFlow liên hệ nhằm tư vấn về nhu cầu dùng thử và cách triển khai phù hợp.</p>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#6D5DF6] via-[#8B5CF6] to-[#5B4BDB] px-6 py-12 md:py-16 text-white md:px-10" style={{ boxShadow: "0 0 120px rgba(109,93,246,0.35)" }}>
        <div className="absolute inset-0 bg-vercel-grid opacity-10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[400px] rounded-full bg-white blur-[150px] opacity-10 pointer-events-none" />
        
        <Reveal className="relative z-10 mx-auto flex max-w-[900px] flex-col items-center text-center">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[14px] font-bold text-white backdrop-blur-md">
            <span className="text-[16px]">🚀</span> Theo dõi thương hiệu bằng AI
          </p>
          <h2 className="font-display text-[32px] md:text-[56px] font-extrabold text-white leading-[1.1] tracking-tight">
            Đừng để khủng hoảng xuất hiện trước khi bạn biết.
          </h2>
          <p className="mt-4 md:mt-6 text-[16px] md:text-[18px] text-white/80 max-w-[600px]">
            Phát hiện khủng hoảng sớm • Theo dõi cảm xúc • Báo cáo AI • Không cần cài đặt
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#consultation" className="inline-flex h-[60px] items-center justify-center rounded-[18px] bg-white px-[36px] text-[16px] font-extrabold text-linear-primary shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-[1.04] hover:-translate-y-[3px] hover:shadow-[0_30px_60px_rgba(0,0,0,0.2)]">
              Đặt lịch Demo
            </Link>
            <Link href="/dashboard" className="inline-flex h-[60px] items-center justify-center rounded-[18px] border border-white/30 bg-white/10 px-[36px] text-[16px] font-extrabold text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.04] hover:-translate-y-[3px] hover:bg-white/20">
              Liên hệ
            </Link>
          </div>

          <div className="mt-10 md:mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-16 border-t border-white/20 pt-8 md:pt-10">
            <div className="text-center">
              <p className="font-display text-[32px] font-extrabold text-white">500+</p>
              <p className="mt-1 text-[13px] font-bold uppercase tracking-wider text-white/70">Doanh nghiệp</p>
            </div>
            <div className="text-center">
              <p className="font-display text-[32px] font-extrabold text-white">98%</p>
              <p className="mt-1 text-[13px] font-bold uppercase tracking-wider text-white/70">Accuracy</p>
            </div>
            <div className="text-center">
              <p className="font-display text-[32px] font-extrabold text-white">2M+</p>
              <p className="mt-1 text-[13px] font-bold uppercase tracking-wider text-white/70">Mentions</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="font-display text-[32px] font-extrabold text-white">24/7</p>
              <p className="mt-1 text-[13px] font-bold uppercase tracking-wider text-white/70">Realtime</p>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
