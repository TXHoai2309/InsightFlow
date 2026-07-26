"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import TopNavBar from "@/components/home/TopNavBar";

const GUIDE_WELCOME_SESSION_KEY = "insightflow-guide-welcome-seen";

const tocItems = [
  { id: "tong-quan", label: "Tổng quan điều hành" },
  { id: "vai-tro", label: "Vai trò & Phân quyền" },
  { id: "dang-nhap", label: "Đăng nhập" },
  { id: "huong-dan-vai-tro", label: "Hướng dẫn theo vai trò" },
  { id: "tinh-nang-chung", label: "Tính năng chung" },
  { id: "faq", label: "FAQ" },
];

const roleTabs = [
  { id: "admin", label: "Admin" },
  { id: "brand-manager", label: "Quản lý Thương hiệu" },
  { id: "canh-bao", label: "Xử lý Cảnh báo" },
  { id: "khach-hang", label: "Xử lý Khách hàng" },
  { id: "de-cap", label: "Đề cập" },
  { id: "bao-cao", label: "Báo cáo" },
  { id: "van-hanh", label: "Vận hành" },
];

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduceMotion ? 0 : 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function UserGuidePage() {
  const [activeSection, setActiveSection] = useState("tong-quan");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("admin");
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (window.sessionStorage.getItem(GUIDE_WELCOME_SESSION_KEY) !== "true") {
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (!showWelcome) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        window.sessionStorage.setItem(GUIDE_WELCOME_SESSION_KEY, "true");
        setShowWelcome(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showWelcome]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    const observerOptions = {
      rootMargin: "-20% 0px -80% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    tocItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileTocOpen(false);
    }
  };

  const closeWelcome = () => {
    window.sessionStorage.setItem(GUIDE_WELCOME_SESSION_KEY, "true");
    setShowWelcome(false);
  };

  const openSectionFromWelcome = (id: string) => {
    closeWelcome();
    window.setTimeout(() => scrollToSection(id), 120);
  };

  return (
    <div className="min-h-screen bg-[#FCFBFF] dark:bg-[#13141f]">
      <TopNavBar />

      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[#171331]/65 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeWelcome();
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="guide-welcome-title"
              aria-describedby="guide-welcome-description"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 24, scale: reduceMotion ? 1 : 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.99 }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative grid max-h-[calc(100vh-32px)] w-full max-w-[920px] overflow-y-auto rounded-[28px] border border-white/30 bg-white shadow-[0_30px_100px_rgba(22,17,56,0.35)] dark:border-white/10 dark:bg-[#1B1C2A] lg:grid-cols-[0.85fr_1.15fr]"
            >
              <button
                type="button"
                onClick={closeWelcome}
                className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF6] dark:border-white/10 dark:bg-white/10 dark:text-white"
                aria-label="Đóng hướng dẫn nhanh"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="relative overflow-hidden bg-gradient-to-br from-[#6D5EF6] via-[#7659EA] to-[#4F46C8] p-7 text-white md:p-9">
                <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
                <div className="absolute -bottom-16 -right-12 h-52 w-52 rounded-full bg-[#B6ABFF]/30 blur-3xl" />
                <div className="relative">
                  <div className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em]">
                    Tài liệu chính thức
                  </div>
                  <h2 id="guide-welcome-title" className="mt-5 max-w-[360px] font-display text-[30px] font-extrabold leading-tight md:text-[36px]">
                    Chào mừng đến với InsightFlow
                  </h2>
                  <p id="guide-welcome-description" className="mt-4 max-w-[360px] text-[14px] leading-[1.75] text-white/85">
                    Chọn nội dung cần xem để đi thẳng tới phần phù hợp. Tài liệu được thiết kế cho Ban lãnh đạo và đội ngũ vận hành.
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    {[
                      ["07", "nhóm nguồn dữ liệu"],
                      ["04", "nhóm chỉ số điều hành"],
                      ["04", "vai trò nghiệp vụ"],
                      ["01", "quy trình thống nhất"],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                        <div className="text-[22px] font-extrabold">{value}</div>
                        <div className="mt-1 text-[11px] leading-snug text-white/70">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-16 md:p-9 md:pt-16 lg:pt-9">
                <div className="text-[12px] font-extrabold uppercase tracking-[0.15em] text-[#6D5EF6]">
                  Bạn muốn xem nội dung nào?
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      id: "tong-quan",
                      icon: "📊",
                      title: "Tổng quan điều hành",
                      description: "Chỉ số lãnh đạo và luồng dữ liệu.",
                    },
                    {
                      id: "vai-tro",
                      icon: "🛡️",
                      title: "Vai trò & phân quyền",
                      description: "Trách nhiệm của từng nhóm người dùng.",
                    },
                    {
                      id: "huong-dan-vai-tro",
                      icon: "👥",
                      title: "Hướng dẫn theo vai trò",
                      description: "Quy trình thao tác nghiệp vụ chi tiết.",
                    },
                    {
                      id: "faq",
                      icon: "💬",
                      title: "Câu hỏi thường gặp",
                      description: "Tra cứu nhanh các tình huống phổ biến.",
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openSectionFromWelcome(item.id)}
                      className="group rounded-2xl border border-[#E8E4FA] bg-[#FCFBFF] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#BEB5FF] hover:bg-[#F6F3FF] hover:shadow-[0_12px_30px_rgba(91,79,224,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF6] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm dark:bg-white/10" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span>
                          <span className="block text-[14px] font-bold text-[#1B1B4A] dark:text-white">{item.title}</span>
                          <span className="mt-1 block text-[12px] leading-[1.5] text-[#6B7090] dark:text-slate-300">{item.description}</span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={closeWelcome}
                  className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#6D5EF6] px-5 text-sm font-bold text-white transition hover:bg-[#5B4FE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5EF6] focus-visible:ring-offset-2"
                >
                  Xem toàn bộ tài liệu
                </button>
                <p className="mt-3 text-center text-[11px] text-[#8A8FA8] dark:text-slate-400">
                  Hộp giới thiệu chỉ tự mở một lần trong phiên trình duyệt.
                </p>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative isolate overflow-hidden border-b border-[#E9E5FF] bg-[#F8F7FF] pb-12 pt-[96px] dark:border-white/10 dark:bg-[#141421] md:pb-16 md:pt-[112px]">
        <div className="absolute inset-x-0 top-0 -z-20 h-[78%] bg-[radial-gradient(circle_at_78%_18%,rgba(166,151,255,0.34),transparent_34%),radial-gradient(circle_at_14%_12%,rgba(109,94,246,0.16),transparent_30%)]" />
        <div className="absolute right-[-140px] top-[-180px] -z-10 h-[520px] w-[520px] rounded-full border-[90px] border-[#8B7CF6]/10" />
        <div className="absolute left-1/2 top-[72px] -z-10 h-px w-[min(1180px,90vw)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#BFB8F6]/55 to-transparent" />

        <div className="relative z-10 mx-auto grid max-w-[1200px] items-center gap-10 px-6 md:px-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[670px]"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DCD6FF] bg-white/85 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#6557E8] shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-[#BDB5FF]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Cẩm nang vận hành chính thức
            </div>

            <h1 className="mt-6 max-w-[640px] font-display text-[40px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#17173B] dark:text-white md:text-[56px]">
              Tài liệu hướng dẫn sử dụng InsightFlow
            </h1>
            <p className="mt-5 max-w-[610px] text-[16px] leading-[1.75] text-[#626681] dark:text-slate-300 md:text-[17px]">
              Tài liệu dành cho Ban lãnh đạo và đội ngũ vận hành, giúp đọc đúng chỉ số, hiểu rõ trách nhiệm và xử lý nghiệp vụ nhất quán.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => scrollToSection("tong-quan")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#6557E8] px-6 text-[14px] font-bold text-white shadow-[0_14px_30px_rgba(101,87,232,0.25)] transition hover:-translate-y-0.5 hover:bg-[#5749D8] hover:shadow-[0_18px_36px_rgba(101,87,232,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6557E8] focus-visible:ring-offset-2"
              >
                Bắt đầu đọc tài liệu
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => setShowWelcome(true)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#DCD8F4] bg-white px-6 text-[14px] font-bold text-[#29294D] shadow-sm transition hover:-translate-y-0.5 hover:border-[#BFB7FF] hover:bg-[#FBFAFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6557E8] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                <BookOpen className="h-4 w-4 text-[#6557E8]" aria-hidden="true" />
                Chọn nội dung nhanh
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#E1DEF3] pt-5 text-[12px] font-semibold text-[#737793] dark:border-white/10 dark:text-slate-400">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#55C67A]" />
                Cập nhật theo hệ thống hiện tại
              </span>
              <span>07 nhóm nguồn dữ liệu</span>
              <span>04 vai trò nghiệp vụ</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: reduceMotion ? 0 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute -inset-5 -z-10 rounded-[36px] bg-gradient-to-br from-[#7667EC]/16 to-[#A79CFF]/6 blur-xl" />
              <div className="overflow-hidden rounded-[26px] border border-[#E2DFFC] bg-white shadow-[0_24px_65px_rgba(67,56,151,0.15)] dark:border-white/10 dark:bg-[#1B1C2A]">
                <div className="flex items-start justify-between border-b border-[#EEECFA] px-6 py-5 dark:border-white/10">
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#6D5EF6]">Lối tắt nội dung</div>
                    <div className="mt-1 text-[20px] font-extrabold text-[#1B1B42] dark:text-white">Bạn muốn tìm hiểu gì?</div>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0EDFF] text-[#6557E8] dark:bg-white/10">
                    <BookOpen className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>

                <div className="grid gap-2.5 p-4">
                  {[
                    { id: "tong-quan", icon: LayoutDashboard, title: "Tổng quan điều hành", text: "Đọc chỉ số và luồng dữ liệu" },
                    { id: "vai-tro", icon: ShieldCheck, title: "Vai trò & phân quyền", text: "Hiểu trách nhiệm từng nhóm" },
                    { id: "huong-dan-vai-tro", icon: UsersRound, title: "Quy trình nghiệp vụ", text: "Thao tác theo từng vai trò" },
                    { id: "faq", icon: CircleHelp, title: "Câu hỏi thường gặp", text: "Tra cứu tình huống phổ biến" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className="group flex items-center gap-4 rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-[#E1DCFF] hover:bg-[#F8F6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6557E8] dark:hover:border-white/10 dark:hover:bg-white/5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EDFF] text-[#6557E8] transition group-hover:bg-[#6557E8] group-hover:text-white dark:bg-white/10">
                        <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-bold text-[#242447] dark:text-white">{item.title}</span>
                        <span className="mt-0.5 block text-[12px] text-[#8588A0] dark:text-slate-400">{item.text}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-[#B2AEC9] transition group-hover:translate-x-0.5 group-hover:text-[#6557E8]" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative bg-[#FCFBFF] dark:bg-[#13141f]">
        <div className="mx-auto max-w-[1250px] px-6 md:px-10 lg:px-12 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
            {/* Sidebar TOC - Desktop */}
            <aside className="hidden lg:block">
              <div className="sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
                <h3 className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[#6D5EF6] mb-4">
                  Mục lục
                </h3>
                <nav className="flex flex-col gap-1">
                  {tocItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`text-left px-3 py-2 rounded-lg text-[14px] font-medium transition-all ${
                        activeSection === item.id
                          ? "border-l-2 border-[#6D5EF6] bg-[#6D5EF6]/10 text-[#6D5EF6] font-semibold"
                          : "text-[#6B7090] dark:text-slate-400 hover:text-[#6D5EF6] hover:bg-[#6D5EF6]/5"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Mobile TOC Toggle */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setMobileTocOpen(!mobileTocOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 shadow-sm"
              >
                <span className="text-[14px] font-semibold text-[#1B1B4A] dark:text-white">Mục lục</span>
                {mobileTocOpen ? <X className="h-5 w-5 text-[#6D5EF6]" /> : <Menu className="h-5 w-5 text-[#6D5EF6]" />}
              </button>
              {mobileTocOpen && (
                <div className="mt-2 rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
                  <nav className="flex flex-col gap-1">
                    {tocItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`text-left px-3 py-2 rounded-lg text-[14px] font-medium transition-all ${
                          activeSection === item.id
                            ? "border-l-2 border-[#6D5EF6] bg-[#6D5EF6]/10 text-[#6D5EF6] font-semibold"
                            : "text-[#6B7090] dark:text-slate-400 hover:text-[#6D5EF6] hover:bg-[#6D5EF6]/5"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </nav>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="space-y-16">
              <section id="tong-quan" className="scroll-mt-24">
                <Reveal>
                  <h2 className="font-display text-[32px] font-extrabold text-[#1B1B4A] dark:text-white tracking-tight mb-4">
                    InsightFlow là gì?
                  </h2>
                  
                  {/* 3 Key Features */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-2xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-4xl mb-4">🔊</div>
                      <h3 className="font-display text-[20px] font-bold text-[#1B1B4A] dark:text-white mb-3">Lắng nghe</h3>
                      <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                        Thu thập dữ liệu công khai từ 7 nhóm nguồn: Facebook, TikTok, YouTube, Threads, Google Maps, Tin tức và BeFood.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-4xl mb-4">🧠</div>
                      <h3 className="font-display text-[20px] font-bold text-[#1B1B4A] dark:text-white mb-3">Hiểu đúng</h3>
                      <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                        AI phân tích cảm xúc (tích cực / tiêu cực / trung lập), phát hiện chủ đề nóng, đánh giá mức độ rủi ro và tín hiệu mua hàng.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-4xl mb-4">⚡</div>
                      <h3 className="font-display text-[20px] font-bold text-[#1B1B4A] dark:text-white mb-3">Hành động nhanh</h3>
                      <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                        Phân công đúng người xử lý, theo dõi SLA, hỗ trợ phản hồi bằng mẫu có sẵn và tổng hợp báo cáo chuyên sâu.
                      </p>
                    </div>
                  </div>

                  {/* Executive reading guide */}
                  <div className="mt-12 rounded-3xl border border-[#DED8FF] bg-gradient-to-br from-white via-[#FBFAFF] to-[#F2EFFF] p-6 shadow-sm dark:border-white/10 dark:from-white/10 dark:via-white/5 dark:to-[#6D5EF6]/10 md:p-8">
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                      <div>
                        <div className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#6D5EF6]">
                          Dành cho Ban lãnh đạo
                        </div>
                        <h3 className="mt-2 font-display text-[25px] font-extrabold tracking-tight text-[#1B1B4A] dark:text-white">
                          Bốn nhóm chỉ số cần theo dõi
                        </h3>
                      </div>
                      <p className="max-w-[420px] text-[14px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                        Các chỉ số này giúp đánh giá nhanh sức khỏe thương hiệu, rủi ro truyền thông, cơ hội kinh doanh và hiệu quả vận hành.
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          icon: "🛡️",
                          title: "Sức khỏe thương hiệu",
                          description: "Điểm tổng hợp từ lượng đề cập, cảm xúc và xu hướng thảo luận.",
                        },
                        {
                          icon: "🚨",
                          title: "Rủi ro & khủng hoảng",
                          description: "Số cảnh báo, mức độ ưu tiên, nguyên nhân và diễn biến rủi ro.",
                        },
                        {
                          icon: "🎯",
                          title: "Cơ hội khách hàng",
                          description: "Lead tiềm năng, mức độ quan tâm và tỷ lệ chuyển đổi theo kỳ.",
                        },
                        {
                          icon: "⏱️",
                          title: "Hiệu suất vận hành",
                          description: "SLA, khối lượng công việc và kết quả xử lý của đội ngũ.",
                        },
                      ].map((metric) => (
                        <div
                          key={metric.title}
                          className="rounded-2xl border border-[#ECE9FF] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="text-2xl" aria-hidden="true">{metric.icon}</div>
                          <h4 className="mt-3 text-[15px] font-bold text-[#1B1B4A] dark:text-white">
                            {metric.title}
                          </h4>
                          <p className="mt-2 text-[13px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                            {metric.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data Flow Diagram */}
                  <div className="mt-12">
                    <h3 className="font-display text-[24px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-6">
                      Luồng dữ liệu
                    </h3>
                    
                    {/* Desktop: Horizontal */}
                    <div className="hidden md:grid md:grid-cols-6 md:gap-4">
                      {[
                        { num: "01", icon: "📡", label: "Thu thập dữ liệu" },
                        { num: "02", icon: "🤖", label: "AI Phân tích" },
                        { num: "03", icon: "🛡️", label: "Admin Kiểm duyệt" },
                        { num: "04", icon: "🏢", label: "Xuất bản cho Brand" },
                        { num: "05", icon: "👥", label: "Đội ngũ xử lý" },
                        { num: "06", icon: "📊", label: "Báo cáo" },
                      ].map((step, i) => (
                        <div key={i} className="relative">
                          <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-4 text-center shadow-sm">
                            <div className="text-[10px] font-bold text-[#6D5EF6] mb-2">{step.num}</div>
                            <div className="text-2xl mb-2">{step.icon}</div>
                            <div className="text-[13px] font-semibold text-[#1B1B4A] dark:text-white">{step.label}</div>
                          </div>
                          {i < 5 && (
                            <div className="absolute top-1/2 -right-2 w-4 h-0.5 bg-[#6D5EF6]/30 -translate-y-1/2 hidden md:block" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Mobile: Vertical */}
                    <div className="md:hidden space-y-4">
                      {[
                        { num: "01", icon: "📡", label: "Thu thập dữ liệu" },
                        { num: "02", icon: "🤖", label: "AI Phân tích" },
                        { num: "03", icon: "🛡️", label: "Admin Kiểm duyệt" },
                        { num: "04", icon: "🏢", label: "Xuất bản cho Brand" },
                        { num: "05", icon: "👥", label: "Đội ngũ xử lý" },
                        { num: "06", icon: "📊", label: "Báo cáo" },
                      ].map((step, i) => (
                        <div key={i} className="relative pl-8">
                          <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-[#6D5EF6] text-white text-[10px] font-bold flex items-center justify-center">
                            {step.num}
                          </div>
                          <div className="absolute left-3 top-6 bottom-[-16px] w-0.5 bg-[#6D5EF6]/30 last:hidden" />
                          <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{step.icon}</span>
                              <span className="text-[15px] font-semibold text-[#1B1B4A] dark:text-white">{step.label}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </section>

              <section id="vai-tro" className="scroll-mt-24">
                <Reveal delay={0.1}>
                  <h2 className="font-display text-[32px] font-extrabold text-[#1B1B4A] dark:text-white tracking-tight mb-4">
                    Hệ thống Vai trò & Phân quyền
                  </h2>
                  <p className="text-[17px] leading-[1.7] text-[#6B7090] dark:text-slate-300 mb-8">
                    Mỗi vai trò chỉ thấy đúng menu và dữ liệu thuộc quyền của mình.
                  </p>

                  {/* Role Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Admin Card */}
                    <div className="rounded-2xl border-l-4 border-l-[#3B82F6] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-3xl">🛡️</div>
                        <div className="flex-1">
                          <h3 className="font-display text-[20px] font-bold text-[#1B1B4A] dark:text-white mb-1">Admin</h3>
                          <div className="text-[13px] font-semibold text-[#3B82F6]">Trang chính: /admin</div>
                        </div>
                      </div>
                      <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300 mb-4">
                        Quản trị hệ thống, kiểm duyệt dữ liệu AI, quản lý tài khoản Brand Manager, giám sát crawler.
                      </p>
                      <div className="mb-4">
                        <div className="text-[13px] font-semibold text-[#1B1B4A] dark:text-white mb-2">Menu:</div>
                        <div className="flex flex-wrap gap-2">
                          {["Tạo tài khoản Brand", "Danh sách Brand", "Yêu cầu tư vấn", "Tiến trình cào", "Gắn nhãn dữ liệu"].map((item) => (
                            <span key={item} className="px-3 py-1 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-[12px] font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 p-3">
                        <p className="text-[13px] font-semibold text-[#EF4444]">
                          ⚠️ Admin KHÔNG tham gia xử lý nghiệp vụ của brand.
                        </p>
                      </div>
                    </div>

                    {/* Brand Manager Card */}
                    <div className="rounded-2xl border-l-4 border-l-[#8B5CF6] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-3xl">🏢</div>
                        <div className="flex-1">
                          <h3 className="font-display text-[20px] font-bold text-[#1B1B4A] dark:text-white mb-1">Quản lý thương hiệu</h3>
                          <div className="text-[13px] font-semibold text-[#8B5CF6]">Trang chính: /dashboard</div>
                        </div>
                      </div>
                      <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300 mb-4">
                        Quản lý toàn bộ nghiệp vụ thương hiệu, nhân viên, cảnh báo, khách hàng và báo cáo điều hành.
                      </p>
                      <div>
                        <div className="text-[13px] font-semibold text-[#1B1B4A] dark:text-white mb-2">Menu:</div>
                        <div className="flex flex-wrap gap-2">
                          {["Tổng quan", "Nhân viên", "Đề cập", "Cảnh báo", "Khách hàng", "Báo cáo"].map((item) => (
                            <span key={item} className="px-3 py-1 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-[12px] font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Crisis Employee Card */}
                    <div className="rounded-2xl border-l-4 border-l-[#EF4444] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-3xl">🚨</div>
                        <div className="flex-1">
                          <h3 className="font-display text-[20px] font-bold text-[#1B1B4A] dark:text-white mb-1">Nhân viên xử lý khủng hoảng</h3>
                          <div className="text-[13px] font-semibold text-[#EF4444]">Trang chính: /alerts</div>
                        </div>
                      </div>
                      <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300 mb-4">
                        Xử lý cảnh báo rủi ro, bài viết tiêu cực, escalation khẩn cấp.
                      </p>
                      <div>
                        <div className="text-[13px] font-semibold text-[#1B1B4A] dark:text-white mb-2">Menu:</div>
                        <div className="flex flex-wrap gap-2">
                          {["Vận hành", "Đề cập", "Cảnh báo", "Báo cáo"].map((item) => (
                            <span key={item} className="px-3 py-1 rounded-full bg-[#EF4444]/10 text-[#EF4444] text-[12px] font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Lead Employee Card */}
                    <div className="rounded-2xl border-l-4 border-l-[#F97316] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-3xl">🎯</div>
                        <div className="flex-1">
                          <h3 className="font-display text-[20px] font-bold text-[#1B1B4A] dark:text-white mb-1">Nhân viên xử lý khách hàng tiềm năng</h3>
                          <div className="text-[13px] font-semibold text-[#F97316]">Trang chính: /leads</div>
                        </div>
                      </div>
                      <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300 mb-4">
                        Chăm sóc khách hàng tiềm năng, phân loại Hot/Warm/Cold, tư vấn và chốt đơn.
                      </p>
                      <div>
                        <div className="text-[13px] font-semibold text-[#1B1B4A] dark:text-white mb-2">Menu:</div>
                        <div className="flex flex-wrap gap-2">
                          {["Vận hành", "Đề cập", "Khách hàng", "Báo cáo"].map((item) => (
                            <span key={item} className="px-3 py-1 rounded-full bg-[#F97316]/10 text-[#F97316] text-[12px] font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </section>

              <section id="dang-nhap" className="scroll-mt-24">
                <Reveal delay={0.2}>
                  <h2 className="font-display text-[32px] font-extrabold text-[#1B1B4A] dark:text-white tracking-tight mb-4">
                    Đăng nhập & Quản lý Tài khoản
                  </h2>

                  {/* 3.1 Đăng nhập */}
                  <div className="mt-8">
                    <h3 className="font-display text-[24px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-6">
                      3.1 Đăng nhập
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          step: "Bước 1",
                          content: "Truy cập InsightFlow → Bấm 'Đăng nhập' trên thanh điều hướng (hoặc vào /login)."
                        },
                        {
                          step: "Bước 2",
                          content: "Nhập email và mật khẩu đã được cấp."
                        },
                        {
                          step: "Bước 3",
                          content: "Hệ thống tự chuyển đến trang phù hợp theo vai trò:",
                          subSteps: [
                            "Admin → /admin",
                            "Quản lý thương hiệu → /dashboard",
                            "Nhân viên khủng hoảng → /alerts",
                            "Nhân viên lead → /leads"
                          ]
                        }
                      ].map((item, i) => (
                        <div key={i} className="relative pl-12">
                          <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-[#6D5EF6] text-white text-[14px] font-bold flex items-center justify-center">
                            {i + 1}
                          </div>
                          <div className="absolute left-5 top-10 bottom-[-16px] w-0.5 bg-[#6D5EF6]/30 last:hidden" />
                          <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                            <p className="text-[15px] font-semibold text-[#1B1B4A] dark:text-white mb-2">{item.step}</p>
                            <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300">{item.content}</p>
                            {item.subSteps && (
                              <ul className="mt-3 space-y-1 ml-4">
                                {item.subSteps.map((sub, j) => (
                                  <li key={j} className="text-[14px] text-[#6B7090] dark:text-slate-300 list-disc">
                                    {sub}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3.2 Đổi mật khẩu lần đầu */}
                  <div className="mt-12">
                    <h3 className="font-display text-[24px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-6">
                      3.2 Đổi mật khẩu lần đầu
                    </h3>
                    <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <span className="text-[#6D5EF6] mt-1">•</span>
                          <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                            Nếu tài khoản được tạo bởi Admin/Brand Manager, bạn nhận mật khẩu tạm.
                          </p>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-[#6D5EF6] mt-1">•</span>
                          <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                            Hệ thống yêu cầu đổi mật khẩu ngay khi đăng nhập lần đầu.
                          </p>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-[#6D5EF6] mt-1">•</span>
                          <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                            <span className="font-semibold text-[#1B1B4A] dark:text-white">Yêu cầu:</span> tối thiểu 8 ký tự, có chữ hoa, chữ thường, số.
                          </p>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* 3.3 Quên mật khẩu */}
                  <div className="mt-12">
                    <h3 className="font-display text-[24px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-6">
                      3.3 Quên mật khẩu
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          step: "Bước 1",
                          content: "Bấm 'Quên mật khẩu?' ở trang đăng nhập."
                        },
                        {
                          step: "Bước 2",
                          content: "Nhập email → Bấm gửi."
                        },
                        {
                          step: "Bước 3",
                          content: "Kiểm tra hộp thư → Click link reset → Đặt mật khẩu mới."
                        }
                      ].map((item, i) => (
                        <div key={i} className="relative pl-12">
                          <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-[#6D5EF6] text-white text-[14px] font-bold flex items-center justify-center">
                            {i + 1}
                          </div>
                          <div className="absolute left-5 top-10 bottom-[-16px] w-0.5 bg-[#6D5EF6]/30 last:hidden" />
                          <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                            <p className="text-[15px] font-semibold text-[#1B1B4A] dark:text-white mb-2">{item.step}</p>
                            <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300">{item.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              </section>

              <section id="huong-dan-vai-tro" className="scroll-mt-24">
                <Reveal delay={0.3}>
                  <h2 className="font-display text-[32px] font-extrabold text-[#1B1B4A] dark:text-white tracking-tight mb-4">
                    Hướng dẫn theo vai trò
                  </h2>
                  <p className="text-[17px] leading-[1.7] text-[#6B7090] dark:text-slate-300 mb-8">
                    Chọn vai trò để xem hướng dẫn chi tiết.
                  </p>

                  {/* Tab Navigation - Desktop */}
                  <div className="hidden md:flex border-b border-[#ECE9FF] dark:border-white/10 mb-8">
                    {roleTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 text-[15px] font-medium transition-all border-b-2 -mb-px ${
                          activeTab === tab.id
                            ? "border-[#6D5EF6] text-[#6D5EF6]"
                            : "border-transparent text-[#6B7090] dark:text-slate-400 hover:text-[#6D5EF6]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Navigation - Mobile */}
                  <div className="md:hidden mb-6">
                    <button
                      onClick={() => setMobileTabOpen(!mobileTabOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 shadow-sm"
                    >
                      <span className="text-[14px] font-semibold text-[#1B1B4A] dark:text-white">
                        {roleTabs.find((t) => t.id === activeTab)?.label}
                      </span>
                      {mobileTabOpen ? <ChevronUp className="h-5 w-5 text-[#6D5EF6]" /> : <ChevronDown className="h-5 w-5 text-[#6D5EF6]" />}
                    </button>
                    {mobileTabOpen && (
                      <div className="mt-2 rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 shadow-sm overflow-hidden">
                        {roleTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setActiveTab(tab.id);
                              setMobileTabOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-[14px] font-medium transition-all ${
                              activeTab === tab.id
                                ? "bg-[#6D5EF6]/10 text-[#6D5EF6]"
                                : "text-[#6B7090] dark:text-slate-400 hover:bg-[#6D5EF6]/5"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* TAB 1: Admin */}
                      {activeTab === "admin" && (
                        <div id="admin" className="scroll-mt-24">
                          <h3 className="font-display text-[28px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-6">
                            Hướng dẫn dành cho Admin
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                              {
                                icon: "👥",
                                name: "Tạo tài khoản Brand Manager",
                                route: "/admin/create-brand-manager",
                                description: "Nhập: tên công ty, email Brand Manager, tên thương hiệu. Hệ thống tạo tài khoản + gửi thông tin đăng nhập tự động. Brand Manager sau đó tự tạo nhân viên cho brand."
                              },
                              {
                                icon: "📋",
                                name: "Danh sách Brand Manager",
                                route: "/admin/brand-managers",
                                description: "Xem tất cả tài khoản Brand Manager. Xem trạng thái, thương hiệu quản lý. Khóa / mở khóa tài khoản."
                              },
                              {
                                icon: "💬",
                                name: "Yêu cầu tư vấn",
                                route: "/admin/consultations",
                                description: "Xem yêu cầu dùng thử từ form landing page. Quản lý trạng thái: Mới → Đang liên hệ → Đã xử lý."
                              },
                              {
                                icon: "🔄",
                                name: "Tiến trình cào dữ liệu",
                                route: "/admin/crawl-operations",
                                description: "Giám sát trạng thái crawler. Xem số bài viết/bình luận đã thu thập theo brand."
                              },
                              {
                                icon: "🏷️",
                                name: "Gắn nhãn dữ liệu",
                                route: "/labeling_tool",
                                description: "Kiểm duyệt và gán nhãn: sentiment, topic, relevance, urgency, intent. Phục vụ huấn luyện/kiểm thử NLP."
                              }
                            ].map((module, i) => (
                              <div key={i} className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                  <div className="text-3xl">{module.icon}</div>
                                  <div className="flex-1">
                                    <h4 className="font-display text-[18px] font-bold text-[#1B1B4A] dark:text-white mb-1">{module.name}</h4>
                                    <div className="text-[12px] font-semibold text-[#6D5EF6] mb-2">{module.route}</div>
                                    <p className="text-[14px] leading-[1.6] text-[#6B7090] dark:text-slate-300">{module.description}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TAB 2: Brand Manager */}
                      {activeTab === "brand-manager" && (
                        <div id="brand-manager" className="scroll-mt-24">
                          <h3 className="font-display text-[28px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-6">
                            Hướng dẫn dành cho Quản lý Thương hiệu
                          </h3>
                          <div className="space-y-6">
                            {[
                              {
                                icon: "📊",
                                name: "Tổng quan thương hiệu",
                                route: "/dashboard",
                                description: "Điểm sức khỏe thương hiệu (Health Score). Tỷ lệ cảm xúc (biểu đồ Tích cực/Trung lập/Tiêu cực). Phân tích AI: tóm tắt rủi ro + gợi ý hành động. Hàng đợi cần xử lý (cảnh báo, lead). Tab Crisis Monitoring: chủ đề rủi ro, biểu đồ xu hướng. Tab Lead Monitoring: tín hiệu mua, điểm Lead, Hot/Warm/Cold. Tab Phân tích nền tảng: thống kê theo Facebook, TikTok..."
                              },
                              {
                                icon: "👥",
                                name: "Nhân viên",
                                route: "/team",
                                description: "Xem danh sách nhân viên. Thêm nhân viên: nhập email, tên, chọn vai trò. Gán quyền: Alerts, Leads, hoặc cả hai (Dual). Theo dõi trạng thái: Hoạt động, Tạm khóa, Chưa kích hoạt. Xuất Excel."
                              },
                              {
                                icon: "📝",
                                name: "Đề cập",
                                route: "/mentions",
                                description: "Xem chi tiết ở tab Đề cập"
                              },
                              {
                                icon: "🚨",
                                name: "Cảnh báo",
                                route: "/alerts",
                                description: "Xem chi tiết ở tab Cảnh báo. BM có quyền chỉnh sửa trực tiếp mức độ rủi ro. Phê duyệt / Từ chối yêu cầu sửa nhãn từ nhân viên."
                              },
                              {
                                icon: "🎯",
                                name: "Khách hàng tiềm năng",
                                route: "/leads",
                                description: "Xem chi tiết ở tab Khách hàng"
                              },
                              {
                                icon: "✏️",
                                name: "Duyệt yêu cầu sửa nhãn",
                                route: "/label-requests",
                                description: "Xem yêu cầu sửa nhãn từ nhân viên. So sánh nhãn cũ vs đề xuất (5 trường: Cảm xúc, Rủi ro, Chủ đề, Liên quan, Ý định mua). Phê duyệt / Từ chối / Chỉnh sửa lại. Xem audit log."
                              },
                              {
                                icon: "📈",
                                name: "Báo cáo",
                                route: "/reports",
                                description: "Xem chi tiết ở tab Báo cáo"
                              }
                            ].map((module, i) => (
                              <div key={i} className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                  <div className="text-3xl">{module.icon}</div>
                                  <div className="flex-1">
                                    <h4 className="font-display text-[18px] font-bold text-[#1B1B4A] dark:text-white mb-1">{module.name}</h4>
                                    <div className="text-[12px] font-semibold text-[#8B5CF6] mb-2">{module.route}</div>
                                    <p className="text-[14px] leading-[1.6] text-[#6B7090] dark:text-slate-300">{module.description}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TAB 3: Xử lý Cảnh báo */}
                      {activeTab === "canh-bao" && (
                        <div id="canh-bao" className="scroll-mt-24">
                          <h3 className="font-display text-[28px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-2">
                            Quy trình xử lý Cảnh báo / Khủng hoảng
                          </h3>
                          <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300 mb-8">
                            Dành cho Nhân viên xử lý khủng hoảng & Brand Manager
                          </p>

                          <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm mb-8">
                            <p className="text-[14px] leading-[1.6] text-[#6B7090] dark:text-slate-300 mb-2">
                              <span className="font-semibold text-[#1B1B4A] dark:text-white">Giao diện:</span> chia 2 cột
                            </p>
                            <ul className="space-y-1 ml-4 text-[13px] text-[#6B7090] dark:text-slate-300">
                              <li className="list-disc">Cột trái: Hàng chờ ưu tiên (Risk Score, SLA, bộ lọc)</li>
                              <li className="list-disc">Cột phải: Widget Trending, Hoạt động đội ngũ, Hiệu suất</li>
                            </ul>
                          </div>

                          <h4 className="font-display text-[20px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-6">
                            Quy trình 7 bước
                          </h4>
                          <div className="space-y-4">
                            {[
                              "Chọn cảnh báo từ hàng chờ",
                              "Nhận xử lý (bấm 'Nhận xử lý' để khóa cho bạn)",
                              "Mở nguồn & Sao chép mẫu phản hồi",
                              "Liên hệ khách hàng (Gọi / Zalo / Email)",
                              "Ghi chú kết quả trao đổi",
                              "Chọn kết quả phản hồi (dropdown)",
                              "Hoàn tất — đóng vụ việc"
                            ].map((step, i) => (
                              <div key={i} className="relative pl-12">
                                <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-[#EF4444] text-white text-[14px] font-bold flex items-center justify-center">
                                  {i + 1}
                                </div>
                                <div className="absolute left-5 top-10 bottom-[-16px] w-0.5 bg-[#EF4444]/30 last:hidden" />
                                <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
                                  <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300">{step}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-12">
                            <h4 className="font-display text-[20px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-4">
                              Chi tiết vụ việc (/alerts/[id])
                            </h4>
                            <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                              <p className="text-[14px] font-semibold text-[#1B1B4A] dark:text-white mb-3">Widget &quot;Quản lý &amp; Sửa nhãn&quot; gồm 3 tab:</p>
                              <ul className="space-y-2 ml-4 text-[13px] text-[#6B7090] dark:text-slate-300">
                                <li className="list-disc">Tab Sửa nhãn (Nhân viên): đề xuất thay đổi 5 trường nhãn</li>
                                <li className="list-disc">Tab Chờ duyệt (Brand Manager): phê duyệt/từ chối</li>
                                <li className="list-disc">Tab Lịch sử: nhật ký thay đổi</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 4: Xử lý Khách hàng */}
                      {activeTab === "khach-hang" && (
                        <div id="khach-hang" className="scroll-mt-24">
                          <h3 className="font-display text-[28px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-2">
                            Quy trình xử lý Khách hàng Tiềm năng (Lead)
                          </h3>
                          <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300 mb-8">
                            Dành cho Nhân viên xử lý Lead & Brand Manager
                          </p>

                          <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm mb-8">
                            <p className="text-[14px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                              <span className="font-semibold text-[#1B1B4A] dark:text-white">Tính năng:</span> phân loại Hot/Warm/Cold, bộ lọc, chế độ xem
                            </p>
                          </div>

                          <h4 className="font-display text-[20px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-6">
                            Quy trình 7 bước
                          </h4>
                          <div className="space-y-4">
                            {[
                              "Chọn khách hàng từ danh sách",
                              "Nhận xử lý (khóa lead cho bạn)",
                              "Xem hồ sơ (lịch sử tương tác, thông tin liên hệ)",
                              "Mở nguồn & Sao chép mẫu tư vấn",
                              "Ghi chú tư vấn",
                              "Chọn kết quả (Đã tư vấn, Đã chốt đơn, Không quan tâm...)",
                              "Lưu kết quả — hoàn tất hồ sơ"
                            ].map((step, i) => (
                              <div key={i} className="relative pl-12">
                                <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-[#F97316] text-white text-[14px] font-bold flex items-center justify-center">
                                  {i + 1}
                                </div>
                                <div className="absolute left-5 top-10 bottom-[-16px] w-0.5 bg-[#F97316]/30 last:hidden" />
                                <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
                                  <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300">{step}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TAB 5: Đề cập */}
                      {activeTab === "de-cap" && (
                        <div id="de-cap" className="scroll-mt-24">
                          <h3 className="font-display text-[28px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-2">
                            Trang Đề cập (Mentions)
                          </h3>
                          <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300 mb-8">
                            Dành cho tất cả vai trò (trừ Admin)
                          </p>

                          <div className="space-y-6">
                            <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                              <h4 className="font-display text-[18px] font-bold text-[#1B1B4A] dark:text-white mb-4">Bảng tổng hợp đề cập</h4>
                              <ul className="space-y-2 ml-4 text-[13px] text-[#6B7090] dark:text-slate-300">
                                <li className="list-disc">Cột: Nền tảng, Tác giả, Cảm xúc, Chủ đề, Thời gian, Nội dung</li>
                              </ul>
                            </div>

                            <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                              <h4 className="font-display text-[18px] font-bold text-[#1B1B4A] dark:text-white mb-4">Bộ lọc</h4>
                              <ul className="space-y-2 ml-4 text-[13px] text-[#6B7090] dark:text-slate-300">
                                <li className="list-disc">Nền tảng, Cảm xúc, Thời gian, Từ khóa, Loại (Bài viết/Bình luận)</li>
                              </ul>
                            </div>

                            <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                              <h4 className="font-display text-[18px] font-bold text-[#1B1B4A] dark:text-white mb-4">Thống kê</h4>
                              <ul className="space-y-2 ml-4 text-[13px] text-[#6B7090] dark:text-slate-300">
                                <li className="list-disc">Tổng đề cập, tỷ lệ cảm xúc, phân bổ nền tảng</li>
                              </ul>
                            </div>

                            <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                              <h4 className="font-display text-[18px] font-bold text-[#1B1B4A] dark:text-white mb-4">Tính năng khác</h4>
                              <ul className="space-y-2 ml-4 text-[13px] text-[#6B7090] dark:text-slate-300">
                                <li className="list-disc">Xuất CSV</li>
                                <li className="list-disc">Chi tiết (/mentions/[id]): nội dung đầy đủ, bình luận, bộ lọc bình luận</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 6: Báo cáo */}
                      {activeTab === "bao-cao" && (
                        <div id="bao-cao" className="scroll-mt-24">
                          <h3 className="font-display text-[28px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-2">
                            Trung tâm Báo cáo
                          </h3>
                          <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300 mb-8">
                            Nội dung báo cáo khác nhau theo vai trò
                          </p>

                          <div className="space-y-4">
                            <div className="rounded-xl border-l-4 border-l-[#8B5CF6] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                              <h4 className="font-display text-[18px] font-bold text-[#1B1B4A] dark:text-white mb-2">Brand Manager</h4>
                              <p className="text-[14px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                                Báo cáo toàn diện (cảm xúc, chủ đề, đề cập, hiệu suất đội)
                              </p>
                            </div>

                            <div className="rounded-xl border-l-4 border-l-[#EF4444] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                              <h4 className="font-display text-[18px] font-bold text-[#1B1B4A] dark:text-white mb-2">Nhân viên khủng hoảng</h4>
                              <p className="text-[14px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                                Vụ việc đã xử lý, SLA, tỷ lệ hoàn thành
                              </p>
                            </div>

                            <div className="rounded-xl border-l-4 border-l-[#F97316] border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                              <h4 className="font-display text-[18px] font-bold text-[#1B1B4A] dark:text-white mb-2">Nhân viên lead</h4>
                              <p className="text-[14px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                                Lead đã chốt, tỷ lệ chuyển đổi, hiệu suất tư vấn
                              </p>
                            </div>

                            <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                              <h4 className="font-display text-[18px] font-bold text-[#1B1B4A] dark:text-white mb-4">Xuất báo cáo</h4>
                              <ul className="space-y-2 ml-4 text-[13px] text-[#6B7090] dark:text-slate-300">
                                <li className="list-disc">Xuất PDF & Excel</li>
                                <li className="list-disc">Modal preview trước khi tải</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 7: Vận hành */}
                      {activeTab === "van-hanh" && (
                        <div id="van-hanh" className="scroll-mt-24">
                          <h3 className="font-display text-[28px] font-bold text-[#1B1B4A] dark:text-white tracking-tight mb-2">
                            Trang Vận hành
                          </h3>
                          <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300 mb-8">
                            Dành cho Nhân viên khủng hoảng & Nhân viên lead
                          </p>

                          <div className="space-y-6">
                            <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                              <h4 className="font-display text-[18px] font-bold text-[#1B1B4A] dark:text-white mb-4">Tổng quan công việc trong ngày</h4>
                            </div>

                            <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                              <h4 className="font-display text-[18px] font-bold text-[#1B1B4A] dark:text-white mb-4">Thống kê</h4>
                              <ul className="space-y-2 ml-4 text-[13px] text-[#6B7090] dark:text-slate-300">
                                <li className="list-disc">Đã nhận</li>
                                <li className="list-disc">Đang xử lý</li>
                                <li className="list-disc">Đã hoàn tất</li>
                              </ul>
                            </div>

                            <div className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-5 shadow-sm">
                              <h4 className="font-display text-[18px] font-bold text-[#1B1B4A] dark:text-white mb-4">Danh sách ưu tiên</h4>
                              <p className="text-[14px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                                Cần xử lý hôm nay
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Reveal>
              </section>

              <section id="tinh-nang-chung" className="scroll-mt-24">
                <Reveal delay={0.4}>
                  <h2 className="font-display text-[32px] font-extrabold text-[#1B1B4A] dark:text-white tracking-tight mb-4">
                    Tính năng chung
                  </h2>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        icon: "🌓",
                        title: "Giao diện Sáng/Tối",
                        description: "Bấm biểu tượng mặt trời/mặt trăng trên thanh điều hướng để chuyển đổi. Tùy chọn được lưu cho lần truy cập sau."
                      },
                      {
                        icon: "🎯",
                        title: "Tour hướng dẫn tương tác",
                        description: "Khi vào mỗi trang lần đầu, hệ thống hiển thị tour step-by-step, highlight các thành phần và giải thích cách dùng. Có thể bỏ qua hoặc xem lại."
                      },
                      {
                        icon: "🔍",
                        title: "Tìm kiếm & Bộ lọc",
                        description: "Mọi trang đều có bộ lọc mạnh: thương hiệu, nền tảng, thời gian, cảm xúc, mức rủi ro. Thu hẹp dữ liệu nhanh để tập trung xử lý."
                      },
                      {
                        icon: "⚡",
                        title: "Real-time cập nhật",
                        description: "Dữ liệu cảnh báo và vận hành đồng bộ real-time. Vụ việc mới hoặc thay đổi trạng thái tự động cập nhật giao diện."
                      }
                    ].map((feature, i) => (
                      <div key={i} className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">{feature.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-display text-[20px] font-bold text-[#1B1B4A] dark:text-white mb-3">
                              {feature.title}
                            </h3>
                            <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </section>

              <section id="faq" className="scroll-mt-24">
                <Reveal delay={0.5}>
                  <h2 className="font-display text-[32px] font-extrabold text-[#1B1B4A] dark:text-white tracking-tight mb-4">
                    Câu hỏi thường gặp
                  </h2>

                  <div className="mt-8 space-y-4">
                    {[
                      {
                        id: "faq1",
                        q: "Tôi quên mật khẩu thì làm sao?",
                        a: "Vào trang đăng nhập, bấm 'Quên mật khẩu?', nhập email và kiểm tra hộp thư để nhận link đặt lại mật khẩu."
                      },
                      {
                        id: "faq2",
                        q: "Tôi không thấy menu Khách hàng (Leads) trong sidebar?",
                        a: "Tài khoản của bạn được gán vai trò Nhân viên xử lý khủng hoảng, không có quyền truy cập module Lead. Liên hệ Quản lý thương hiệu nếu cần bổ sung quyền."
                      },
                      {
                        id: "faq3",
                        q: "Dữ liệu đề cập cập nhật bao lâu một lần?",
                        a: "Crawler chạy mỗi 1–2 tiếng. Dữ liệu mới được AI phân tích và kiểm duyệt trước khi hiển thị trên dashboard."
                      },
                      {
                        id: "faq4",
                        q: "Tôi có thể sửa nhãn AI nếu thấy sai không?",
                        a: "Có. Nhân viên gửi yêu cầu sửa nhãn qua tab 'Sửa nhãn' trong trang chi tiết vụ việc. Quản lý thương hiệu sẽ duyệt yêu cầu này."
                      },
                      {
                        id: "faq5",
                        q: "Brand Manager tạo nhân viên ở đâu?",
                        a: "Vào menu Nhân viên → Thêm nhân viên mới → Nhập email, tên và chọn vai trò (Nhân viên khủng hoảng hoặc Nhân viên lead)."
                      },
                      {
                        id: "faq6",
                        q: "Admin có xử lý cảnh báo hay lead không?",
                        a: "Không. Admin chỉ quản trị hệ thống và kiểm duyệt chất lượng dữ liệu. Nghiệp vụ brand thuộc về Brand Manager và nhân viên."
                      },
                      {
                        id: "faq7",
                        q: "Báo cáo có thể xuất ra file không?",
                        a: "Có. Hỗ trợ xuất PDF và Excel với đầy đủ biểu đồ và số liệu chi tiết."
                      },
                      {
                        id: "faq8",
                        q: "Tôi có thể dùng thử InsightFlow không?",
                        a: "Có. Quay lại trang chủ và điền form 'Đăng ký dùng thử' ở cuối trang, hoặc bấm nút 'Tư vấn dùng thử' trên thanh điều hướng."
                      }
                    ].map((faq) => (
                      <div key={faq.id} className="rounded-xl border border-[#ECE9FF] dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden shadow-sm">
                        <button
                          onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#6D5EF6]/5 transition-colors"
                        >
                          <span className="text-[15px] font-semibold text-[#1B1B4A] dark:text-white pr-4">
                            {faq.q}
                          </span>
                          <span className="flex-shrink-0 text-[#6D5EF6] transition-transform duration-200">
                            {openFaq === faq.id ? "−" : "+"}
                          </span>
                        </button>
                        <AnimatePresence>
                          {openFaq === faq.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-4 pt-2">
                                <p className="text-[15px] leading-[1.6] text-[#6B7090] dark:text-slate-300">
                                  {faq.a}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </section>
            </div>
          </div>
        </div>
      </section>

      {/* Back to Top Button */}
      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-[#6D5EF6] text-white shadow-lg hover:scale-110 transition-transform duration-200 flex items-center justify-center"
          aria-label="Back to top"
        >
          <ChevronUp className="h-6 w-6" />
        </motion.button>
      )}
    </div>
  );
}
