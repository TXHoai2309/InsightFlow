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
    description: "Gom mọi cuộc trò chuyện, review và tín hiệu thị trường về một luồng dữ liệu duy nhất.",
    accent: "#14b8a6",
  },
  {
    icon: Zap,
    number: "02",
    title: "Nhận diện cơ hội",
    description: "AI phát hiện ý định mua, câu hỏi cần tư vấn và những khách hàng cần phản hồi sớm.",
    accent: "#f97316",
  },
  {
    icon: BellRing,
    number: "03",
    title: "Cảnh báo rủi ro",
    description: "Theo dõi chủ đề bất thường để đội ngũ nắm tình hình trước khi nó trở thành khủng hoảng.",
    accent: "#ef4444",
  },
  {
    icon: Workflow,
    number: "04",
    title: "Biến insight thành việc làm",
    description: "Phân công, theo dõi SLA và khép vòng phản hồi giữa Brand, Marketing, Sales và CSKH.",
    accent: "#2563eb",
  },
  {
    icon: Gauge,
    number: "05",
    title: "Đo sức khỏe thương hiệu",
    description: "Nhìn được cảm xúc, mức độ quan tâm và những điểm chạm đang tạo ảnh hưởng.",
    accent: "#8b5cf6",
  },
  {
    icon: Bot,
    number: "06",
    title: "Báo cáo có đề xuất",
    description: "Không chỉ đưa ra con số: AI tóm tắt điều đáng chú ý và gợi ý hành động tiếp theo.",
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
        <span className={`h-px w-8 ${inverse ? "bg-[#5eead4]" : "bg-[#0f766e]"}`} />
        <p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${inverse ? "text-[#5eead4]" : "text-[#0f766e]"}`}>{eyebrow}</p>
        <span className={`h-px w-8 ${inverse ? "bg-[#5eead4]" : "bg-[#0f766e]"}`} />
      </div>
      <h2 className={`font-display text-[32px] font-bold leading-[1.16] md:text-[44px] ${inverse ? "text-white" : "text-[#122235]"}`}>{title}</h2>
      <p className={`mx-auto mt-5 max-w-[640px] text-[16px] leading-7 md:text-[17px] ${inverse ? "text-slate-300" : "text-[#58677a]"}`}>{description}</p>
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
  { time: "08:00", mentions: 42 },
  { time: "09:00", mentions: 50 },
  { time: "10:00", mentions: 47 },
  { time: "11:00", mentions: 66 },
  { time: "12:00", mentions: 61 },
  { time: "13:00", mentions: 78 },
  { time: "14:00", mentions: 92 },
  { time: "15:00", mentions: 86 },
  { time: "16:00", mentions: 108 },
  { time: "17:00", mentions: 124 },
];

function LiveIntelligenceSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="intelligence" className="relative border-y border-[#cbdce2] bg-[#f4f8f9] px-6 py-20 md:px-10 md:py-28">
      <BorderRails />
      <div className="relative z-10 mx-auto max-w-[1180px]">
        <SectionIntro
          eyebrow="InsightFlow Live Intelligence"
          title="Không chỉ là dashboard. Đây là nhịp đập của thương hiệu."
          description="Một màn hình kết nối diễn biến thị trường, cảm xúc khách hàng và công việc đội ngũ theo thời gian thực."
        />

        <Reveal className="mt-14" delay={0.1}>
          <div className="overflow-hidden rounded-[8px] border border-[#9fb7c2] bg-white shadow-[0_28px_80px_rgba(18,45,61,0.16)]">
            <div className="flex flex-col gap-4 border-b border-[#cbdce2] bg-[#102536] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#5eead4]/35 bg-[#5eead4]/10 text-[#5eead4]"><Activity className="h-5 w-5" /></div>
                <div><p className="font-display text-[14px] font-bold">Brand Intelligence Center</p><p className="mt-0.5 text-[11px] text-slate-400">Tổng hợp tín hiệu theo thời gian thực</p></div>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#5eead4]/25 bg-[#5eead4]/10 px-3 py-1.5 text-[#99f6e4]"><PulseDot className="h-1.5 w-1.5" />Dữ liệu đang cập nhật</span>
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />17:42</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
              <div className="border-b border-[#cbdce2] p-5 md:p-7 lg:border-b-0 lg:border-r">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Thảo luận hôm nay", "8.428", "+18,6%", BarChart3],
                    ["Sắc thái tích cực", "71%", "+9,2%", TrendingUp],
                    ["Cơ hội mới", "128", "+24", Target],
                  ].map(([label, value, delta, Icon]) => {
                    const MetricIcon = Icon as typeof Target;
                    return (
                      <div key={label as string} className="rounded-[6px] border border-[#d2e0e5] bg-[#f8fbfc] p-4">
                        <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-[#66798a]">{label as string}</span><MetricIcon className="h-4 w-4 text-[#0f766e]" /></div>
                        <div className="mt-5 flex items-end justify-between gap-2"><span className="font-display text-[26px] font-bold text-[#122235]">{value as string}</span><span className="mb-1 text-[11px] font-bold text-[#0f766e]">{delta as string}</span></div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-[6px] border border-[#d2e0e5] p-4 md:p-5">
                  <div className="flex items-start justify-between"><div><p className="text-[13px] font-bold text-[#203549]">Độ quan tâm theo giờ</p><p className="mt-1 text-[11px] text-[#748596]">Số lượt đề cập đã chuẩn hóa</p></div><span className="rounded-full bg-[#dffaf3] px-3 py-1 text-[10px] font-bold text-[#0f766e]">Tăng nhanh</span></div>
                  <div className="mt-4 h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={intelligenceData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#8292a2", fontSize: 10 }} interval={1} />
                        <Tooltip contentStyle={{ border: "1px solid #b7cbd3", borderRadius: 6, boxShadow: "0 12px 30px rgba(18,45,61,.12)", fontSize: 12 }} cursor={{ stroke: "#b7cbd3", strokeDasharray: "4 4" }} />
                        <Line type="monotone" dataKey="mentions" stroke="#0f766e" strokeWidth={3} dot={{ r: 3, fill: "#ffffff", strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={!reduceMotion} animationDuration={1200} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-[#f8fbfc] p-5 md:p-7">
                <div className="flex items-center justify-between"><div><p className="text-[13px] font-bold text-[#203549]">AI đang chú ý</p><p className="mt-1 text-[11px] text-[#748596]">Ưu tiên theo tác động</p></div><Sparkles className="h-5 w-5 text-[#0f766e]" /></div>
                <div className="mt-5 space-y-3">
                  {[
                    ["Cơ hội", "Nhu cầu hỏi giá tăng 34%", "Sales", "#f97316"],
                    ["Rủi ro", "Giao hàng chậm được nhắc lại", "CSKH", "#ef4444"],
                    ["Xu hướng", "Video trải nghiệm đang lan tỏa", "Marketing", "#0ea5e9"],
                  ].map(([type, title, owner, color], index) => (
                    <motion.div key={title} initial={{ opacity: 0, x: reduceMotion ? 0 : 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: reduceMotion ? 0 : 0.25 + index * 0.12 }} className="rounded-[6px] border border-[#d2e0e5] bg-white p-4">
                      <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: color as string }}>{type}</span><span className="rounded-full bg-[#eef3f5] px-2.5 py-1 text-[10px] font-semibold text-[#526779]">{owner}</span></div>
                      <p className="mt-4 text-[14px] font-bold leading-6 text-[#203549]">{title}</p>
                      <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#e6eef1]"><motion.div className="h-full rounded-full" style={{ backgroundColor: color as string }} initial={{ width: 0 }} whileInView={{ width: `${82 - index * 13}%` }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : 0.8, delay: index * 0.1 }} /></div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 rounded-[6px] border border-[#9acbc4] bg-[#e9fbf7] p-4"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0f766e]">Đề xuất tiếp theo</p><p className="mt-2 text-[13px] leading-6 text-[#244b4a]">Ưu tiên phản hồi nhóm khách hàng có ý định mua trong 2 giờ tới.</p></div>
              </div>
            </div>

            <div className="overflow-hidden border-t border-[#cbdce2] bg-[#102536] py-3 text-white">
              <motion.div className="flex w-max items-center gap-10 whitespace-nowrap px-5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400" animate={reduceMotion ? undefined : { x: [0, -520] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}>
                {["Facebook · 2.840 tín hiệu", "TikTok · 1.926 tín hiệu", "YouTube · 864 tín hiệu", "Review · 592 tín hiệu", "Tin tức · 184 tín hiệu", "Website · 2.022 tín hiệu", "Facebook · 2.840 tín hiệu", "TikTok · 1.926 tín hiệu"].map((item, index) => <span key={`${item}-${index}`} className="inline-flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[#5eead4]" />{item}</span>)}
              </motion.div>
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
    <main className="overflow-hidden bg-[#f7fafc] font-sans text-[#122235] selection:bg-[#99f6e4] selection:text-[#102536]">
      <section className="relative isolate min-h-[760px] overflow-hidden bg-[#071728] pt-[72px] text-white">
        <Image src="/images/landing/insightflow-command-center.png" alt="Đội ngũ theo dõi dữ liệu thương hiệu cùng InsightFlow" fill priority sizes="100vw" className="object-cover object-[66%_center] opacity-75" />
        <div className="absolute inset-0 bg-[#071728]/65" />
        <div className="absolute inset-x-0 bottom-0 h-[180px] bg-[#071728]/70" />
        <BorderRails dark />

        <div className="relative mx-auto flex min-h-[688px] max-w-[1240px] flex-col justify-center px-6 pb-20 pt-20 md:px-10 lg:px-8">
          <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }} className="max-w-[720px]">
            <div className="inline-flex items-center gap-2 border border-white/20 bg-white/10 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#d8fffa] backdrop-blur-sm">
              <PulseDot />
              InsightFlow Intelligence Suite
            </div>
            <h1 className="mt-6 max-w-[780px] font-display text-[42px] font-bold leading-[1.08] md:text-[60px] lg:text-[68px]">
              Thương hiệu không nên <span className="text-[#5eead4]">đoán</span> khách hàng đang cần gì.
            </h1>
            <p className="mt-6 max-w-[610px] text-[17px] leading-8 text-slate-200 md:text-[19px]">
              InsightFlow biến những cuộc trò chuyện rải rác thành tín hiệu rõ ràng để thương hiệu tìm thấy cơ hội, phản hồi nhanh và lớn lên cùng khách hàng.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {!loading && user ? (
                <Link href={appRoute} className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[6px] border border-[#99f6e4] bg-[#2dd4bf] px-6 text-[15px] font-bold text-[#062c2b] shadow-[0_10px_30px_rgba(45,212,191,0.22)] transition hover:-translate-y-0.5 hover:bg-[#99f6e4]">
                  Mở không gian làm việc <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link href="#consultation" className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[6px] border border-[#99f6e4] bg-[#2dd4bf] px-6 text-[15px] font-bold text-[#062c2b] shadow-[0_10px_30px_rgba(45,212,191,0.22)] transition hover:-translate-y-0.5 hover:bg-[#99f6e4]">
                  Đăng ký tư vấn dùng thử <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <Link href="#workflow" className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[6px] border border-white/40 bg-white/5 px-6 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/15">
                Khám phá cách vận hành <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }} className="mt-12 grid max-w-[920px] grid-cols-1 gap-px overflow-hidden rounded-[8px] border border-white/25 bg-white/20 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:grid-cols-3">
            {[
              ["128", "Cơ hội cần được chạm tới", Target],
              ["07", "Tín hiệu rủi ro cần xem", AlertTriangle],
              ["82", "Điểm sức khỏe thương hiệu", ShieldCheck],
            ].map(([value, label, Icon]) => {
              const MetricIcon = Icon as typeof Target;
              return (
                <div key={label as string} className="bg-[#0a1d30]/90 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between"><MetricIcon className="h-4 w-4 text-[#5eead4]" /><span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Trực tiếp</span></div>
                  <p className="mt-5 text-[34px] font-extrabold leading-none text-white">{value as string}</p>
                  <p className="mt-2 text-[13px] font-medium text-slate-300">{label as string}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section id="solution" className="relative border-b border-[#dce7eb] bg-white px-6 py-20 md:px-10 md:py-28">
        <BorderRails />
        <SectionIntro eyebrow="Một góc nhìn mới" title="Khách hàng đang nói mỗi ngày. Câu hỏi là: thương hiệu có đang lắng nghe đúng chỗ?" description="CRM truyền thống ghi lại những gì đã xảy ra. InsightFlow giúp đội ngũ nhận ra điều sắp xảy ra từ cuộc trò chuyện thật ngoài thị trường." />
        <div className="mx-auto mt-14 grid max-w-[1180px] gap-4 md:grid-cols-3">
          {[
            [MessageSquareText, "Quá nhiều điểm chạm", "Bình luận, inbox, review, video và tin tức nằm tách rời, khiến dữ liệu khách hàng bị chia nhỏ."],
            [Eye, "Quá ít tín hiệu rõ ràng", "Đội ngũ thấy rất nhiều nội dung, nhưng thiếu ngữ cảnh để biết đâu là cơ hội, đâu là rủi ro."],
            [Flame, "Phản hồi thường quá muộn", "Khi một chủ đề trở nên rõ ràng thì nó thường đã lan rộng và tốn nhiều chi phí hơn để xử lý."],
          ].map(([Icon, title, description], index) => {
            const CardIcon = Icon as typeof Eye;
            return (
              <Reveal key={title as string} delay={index * 0.08}>
                <article className="group relative h-full overflow-hidden rounded-[8px] border border-[#cbdce2] bg-[#fbfdfd] p-6 shadow-[0_10px_30px_rgba(18,45,61,0.05)] transition duration-300 hover:-translate-y-1 hover:border-[#69b7aa] hover:shadow-[0_20px_48px_rgba(15,118,110,0.14)]">
                  <span className="absolute inset-x-0 top-0 h-[3px] bg-[#0f766e] transition-all group-hover:h-[5px]" />
                  <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-[#b9ddd6] bg-[#e9fbf7]"><CardIcon className="h-5 w-5 text-[#0f766e]" /></div><span className="font-display text-[11px] font-bold text-[#9aabb7]">0{index + 1}</span></div>
                  <h3 className="mt-9 font-display text-[20px] font-bold text-[#122235]">{title as string}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-[#607084]">{description as string}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="relative border-b border-[#cbe3df] bg-[#ecfdf9] px-6 py-20 md:px-10 md:py-28">
        <BorderRails />
        <div className="relative z-10 mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <Reveal>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#0f766e]">Tín hiệu được kết nối</p>
            <h2 className="mt-3 font-display text-[34px] font-bold leading-[1.16] text-[#122235] md:text-[46px]">Mỗi cuộc trò chuyện đều có thể là bước tiếp theo của tăng trưởng.</h2>
            <p className="mt-5 max-w-[520px] text-[17px] leading-8 text-[#58677a]">InsightFlow không dừng ở việc “nghe”. Hệ thống gắn bối cảnh, chấm mức độ ưu tiên và đưa tín hiệu đến đúng người để tạo ra hành động.</p>
            <div className="mt-8 space-y-4">
              {["AI phát hiện ý định mua và nhu cầu cần tư vấn", "Cảnh báo khi cảm xúc tiêu cực tăng bất thường", "Tự động gợi ý người phụ trách và phản hồi tiếp theo"].map((item) => (
                <div key={item} className="flex items-start gap-3 text-[15px] font-semibold leading-6 text-[#254053]"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0f766e]" />{item}</div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="rounded-[8px] border border-[#9fcfc6] bg-white p-4 shadow-[0_28px_70px_rgba(15,118,110,0.16)] md:p-6">
              <div className="flex items-center justify-between border-b border-[#e3edf0] pb-4">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center bg-[#dffaf3] text-[#0f766e]"><Sparkles className="h-5 w-5" /></div><div><p className="text-[14px] font-extrabold text-[#122235]">Bộ điều phối tín hiệu</p><p className="text-[12px] text-[#6b7b8e]">Luồng xử lý trong hôm nay</p></div></div>
                <span className="inline-flex items-center gap-2 border border-[#bde9dc] bg-[#ecfdf9] px-3 py-1.5 text-[11px] font-bold text-[#0f766e]"><PulseDot className="h-1.5 w-1.5" />Đang hoạt động</span>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Khách hàng hỏi giá gói dịch vụ", "Ý định mua cao", "Giao cho Sales", "#f97316"],
                  ["Review nhắc đến giao hàng chậm", "Cảnh báo cần theo dõi", "Giao cho CSKH", "#ef4444"],
                  ["Video đánh giá tăng lượt chia sẻ", "Cơ hội nội dung", "Giao cho Marketing", "#0ea5e9"],
                ].map(([title, status, assignee, color], index) => (
                  <motion.div key={title} initial={{ opacity: 0, x: reduceMotion ? 0 : 18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: reduceMotion ? 0 : 0.18 + index * 0.12, duration: 0.45 }} className="grid gap-3 border border-[#e1ebef] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color as string }} /><p className="text-[14px] font-bold text-[#1c2d40]">{title}</p></div><p className="mt-2 text-[12px] font-medium text-[#738397]">{status}</p></div>
                    <span className="w-fit bg-[#f2f7f8] px-3 py-1.5 text-[12px] font-bold text-[#42566a]">{assignee}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <LiveIntelligenceSection />

      <section id="workflow" className="relative border-y border-[#1e4353] bg-[#071728] px-6 py-20 text-white md:px-10 md:py-28">
        <BorderRails dark />
        <SectionIntro inverse eyebrow="Quy trình sống" title="Từ tín hiệu đầu tiên đến một phản hồi tạo khác biệt." description="InsightFlow giúp mọi đội chung một ngôn ngữ: nhìn thấy điều quan trọng, hiểu nó có ý nghĩa gì, rồi hành động có trách nhiệm." />
        <div className="mx-auto mt-16 grid max-w-[1180px] gap-4 lg:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.1}>
              <article className="group relative h-full overflow-hidden rounded-[8px] border border-white/18 bg-white/[0.045] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.12)] transition hover:border-[#5eead4]/50 hover:bg-white/[0.07]">
                <span className="absolute left-0 top-0 h-full w-[3px] bg-[#5eead4]/60 transition-all group-hover:bg-[#5eead4]" />
                <p className="text-[13px] font-bold tracking-[0.16em] text-[#5eead4]">{step.number}</p>
                <h3 className="mt-10 font-display text-[27px] font-bold">{step.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-slate-300">{step.description}</p>
                <div className="mt-8 border-t border-white/12 pt-4 text-[12px] font-bold uppercase tracking-[0.11em] text-[#9fb5c8]">{step.detail}</div>
                {index < workflowSteps.length - 1 && <ArrowRight className="absolute -right-7 top-1/2 z-10 hidden h-5 w-5 text-[#5eead4] lg:block" />}
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="modules" className="relative border-b border-[#dce7eb] bg-white px-6 py-20 md:px-10 md:py-28">
        <BorderRails />
        <SectionIntro eyebrow="Một hệ thống, nhiều năng lực" title="Đủ sâu cho đội vận hành. Đủ rõ cho người ra quyết định." description="Mỗi mô-đun cùng làm một việc: biến dữ liệu phân tán thành những quyết định đáng tin cậy hơn." />
        <div className="mx-auto mt-14 grid max-w-[1180px] gap-3 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Reveal key={module.title} delay={index * 0.06}>
                <motion.article whileHover={reduceMotion ? undefined : { y: -6 }} className="group relative h-full overflow-hidden rounded-[8px] border border-[#cbdce2] bg-[#fbfdfd] p-6 shadow-[0_8px_24px_rgba(18,34,53,0.04)] transition-shadow hover:border-[#9dbcc7] hover:shadow-[0_22px_48px_rgba(18,34,53,0.12)]">
                  <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" style={{ backgroundColor: module.accent }} />
                  <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center" style={{ color: module.accent, backgroundColor: `${module.accent}15` }}><Icon className="h-5 w-5" /></div><span className="text-[12px] font-extrabold text-[#9aa8b8]">{module.number}</span></div>
                  <h3 className="mt-10 font-display text-[20px] font-bold text-[#122235]">{module.title}</h3>
                  <p className="mt-3 text-[14px] leading-7 text-[#607084]">{module.description}</p>
                  <div className="mt-6 inline-flex items-center gap-1 text-[13px] font-bold text-[#0f766e]">Khám phá năng lực <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
                </motion.article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section id="use-cases" className="relative border-y border-[#cbdce2] bg-[#f1f7f8] px-6 py-20 md:px-10 md:py-28">
        <BorderRails />
        <SectionIntro eyebrow="Một nền tảng, một góc nhìn cho từng vai trò" title="Cùng một sự thật. Mỗi đội thấy đúng điều họ cần làm tiếp." description="Chọn vai trò để xem InsightFlow giúp đội ngũ chuyển từ theo dõi sang chủ động ra sao." />
        <div className="mx-auto mt-14 grid max-w-[1180px] gap-5 lg:grid-cols-[0.7fr_1.3fr]">
          <Reveal>
            <div className="rounded-[8px] border border-[#b9ced6] bg-white p-2 shadow-[0_12px_32px_rgba(18,45,61,0.07)]">
              {roleStories.map((story) => {
                const Icon = story.icon;
                const active = story.id === selectedRole;
                return (
                  <button key={story.id} type="button" onClick={() => setSelectedRole(story.id)} className={`flex w-full items-center gap-3 px-4 py-4 text-left transition ${active ? "bg-[#0f766e] text-white" : "text-[#405669] hover:bg-[#f1f7f8]"}`}>
                    <Icon className={`h-5 w-5 ${active ? "text-[#99f6e4]" : "text-[#0f766e]"}`} />
                    <span className="text-[15px] font-extrabold">{story.label}</span>
                    {active && <ChevronRight className="ml-auto h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </Reveal>

          <motion.div key={activeRole.id} initial={{ opacity: 0, x: reduceMotion ? 0 : 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.32 }} className="rounded-[8px] border border-[#315365] bg-[#102b3b] p-6 text-white shadow-[0_24px_60px_rgba(18,45,61,0.18)] md:p-8">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#5eead4]">{activeRole.eyebrow}</p>
            <h3 className="mt-3 max-w-[670px] font-display text-[30px] font-bold leading-[1.16] md:text-[39px]">{activeRole.title}</h3>
            <p className="mt-4 max-w-[700px] text-[16px] leading-7 text-slate-300">{activeRole.description}</p>
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {activeRole.metrics.map(([label, value, delta]) => (
                <div key={label} className="border border-white/12 bg-white/[0.05] p-4"><p className="text-[12px] font-semibold text-slate-400">{label}</p><p className="mt-5 text-[28px] font-extrabold">{value}</p><p className="mt-1 text-[12px] font-bold text-[#5eead4]">{delta}</p></div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="consultation" className="relative border-b border-[#dce7eb] bg-white px-6 py-20 md:px-10 md:py-28">
        <BorderRails />
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <Reveal className="lg:sticky lg:top-28">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#0f766e]">Dùng thử có định hướng</p>
            <h2 className="mt-3 font-display text-[36px] font-bold leading-[1.16] text-[#122235] md:text-[48px]">Mỗi thương hiệu cần một cách bắt đầu riêng.</h2>
            <p className="mt-5 max-w-[510px] text-[17px] leading-8 text-[#58677a]">Để buổi demo thực sự hữu ích, đội InsightFlow sẽ đọc bài toán của bạn trước: kênh cần theo dõi, nhu cầu ưu tiên và cách triển khai phù hợp.</p>
            <div className="mt-9 space-y-4">
              {["Đề xuất quy trình theo ngành hàng và mô hình đội ngũ", "Chọn chỉ số, kênh theo dõi và tình huống ưu tiên", "Demo xoay quanh bài toán thật, không phải bản trình diễn chung chung"].map((item) => <div key={item} className="flex gap-3 text-[15px] font-semibold leading-6 text-[#365064]"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0f766e]" />{item}</div>)}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-[8px] border border-[#afc6d0] bg-[#f9fcfd] p-5 shadow-[0_26px_70px_rgba(18,34,53,0.12)] md:p-7">
              {submitted ? (
                <div className="flex min-h-[500px] flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ccfbf1] text-[#0f766e]"><CheckCircle2 className="h-8 w-8" /></div><h3 className="mt-6 text-[28px] font-extrabold text-[#122235]">Thông tin của bạn đã đến nơi.</h3><p className="mt-3 max-w-[440px] text-[15px] leading-7 text-[#607084]">Đội InsightFlow sẽ liên hệ để tìm hiểu bài toán và sắp xếp buổi tư vấn phù hợp.</p><button type="button" onClick={() => { setSubmitted(false); setForm(initialFormState); }} className="mt-8 border border-[#b7c9d3] px-5 py-3 text-[14px] font-bold text-[#1d3a4b]">Gửi một yêu cầu khác</button></div>
              ) : (
                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-[13px] font-extrabold text-[#30495d]">Họ và tên *<input value={form.fullName} onChange={(event) => updateForm("fullName", event.target.value)} className={inputClass} placeholder="Nguyễn Văn A" /></label><label className="grid gap-2 text-[13px] font-extrabold text-[#30495d]">Email công việc *<input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} className={inputClass} placeholder="name@company.com" /></label></div>
                  <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-[13px] font-extrabold text-[#30495d]">Số điện thoại *<input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} className={inputClass} placeholder="090..." /></label><label className="grid gap-2 text-[13px] font-extrabold text-[#30495d]">Thương hiệu / doanh nghiệp *<input value={form.company} onChange={(event) => updateForm("company", event.target.value)} className={inputClass} placeholder="Tên doanh nghiệp" /></label></div>
                  <div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-[13px] font-extrabold text-[#30495d]">Ngành hàng<input value={form.industry} onChange={(event) => updateForm("industry", event.target.value)} className={inputClass} placeholder="F&B, bán lẻ, giáo dục..." /></label><label className="grid gap-2 text-[13px] font-extrabold text-[#30495d]">Quy mô đội ngũ<select value={form.teamSize} onChange={(event) => updateForm("teamSize", event.target.value)} className={inputClass}><option value="">Chọn quy mô</option><option value="1-10">1-10 người</option><option value="11-50">11-50 người</option><option value="51-200">51-200 người</option><option value="200+">Trên 200 người</option></select></label></div>
                  <div className="grid gap-2"><span className="text-[13px] font-extrabold text-[#30495d]">Kênh muốn theo dõi</span><div className="grid gap-2 sm:grid-cols-3">{channels.map((channel) => { const selected = form.channels.split(",").filter(Boolean).includes(channel); return <button key={channel} type="button" onClick={() => { const current = form.channels.split(",").filter(Boolean); updateForm("channels", (selected ? current.filter((item) => item !== channel) : [...current, channel]).join(",")); }} className={`h-11 border text-[13px] font-bold transition ${selected ? "border-[#0f766e] bg-[#dffaf3] text-[#0f766e]" : "border-[#d8e2ec] bg-white text-[#556b7d] hover:border-[#9acbc4]"}`}>{channel}</button>; })}</div></div>
                  <label className="grid gap-2 text-[13px] font-extrabold text-[#30495d]">Nhu cầu chính *<select value={form.need} onChange={(event) => updateForm("need", event.target.value)} className={inputClass}><option>Phát hiện khách hàng tiềm năng</option><option>Theo dõi sức khỏe thương hiệu</option><option>Cảnh báo khủng hoảng truyền thông</option><option>Báo cáo AI cho ban lãnh đạo</option><option>Tư vấn quy trình tổng thể</option></select></label>
                  <button type="submit" disabled={missingRequired} className="mt-2 inline-flex h-[54px] items-center justify-center gap-2 bg-[#0f766e] px-6 text-[15px] font-extrabold text-white transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:opacity-45">Gửi thông tin để nhận tư vấn <Send className="h-4 w-4" /></button>
                  <p className="text-[12px] leading-5 text-[#718094]">Khi gửi biểu mẫu, bạn đồng ý để InsightFlow liên hệ nhằm tư vấn về nhu cầu dùng thử và cách triển khai phù hợp.</p>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-[#2dd4bf] bg-[#0f766e] px-6 py-12 text-white md:px-10">
        <Reveal className="mx-auto flex max-w-[1180px] flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><p className="text-[28px] font-extrabold">Đừng để những tín hiệu tốt phải chờ được nhìn thấy.</p><p className="mt-2 text-[15px] text-teal-100">Bắt đầu bằng một cuộc trao đổi ngắn về đúng bài toán của thương hiệu bạn.</p></div><Link href="#consultation" className="inline-flex h-[50px] shrink-0 items-center justify-center gap-2 bg-white px-5 text-[14px] font-extrabold text-[#0f766e] transition hover:bg-[#dffaf3]">Đăng ký tư vấn <ArrowRight className="h-4 w-4" /></Link></Reveal>
      </section>
    </main>
  );
}
