import TopNavBar from "@/components/home/TopNavBar";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import DashboardPreviewSection from "@/components/home/DashboardPreviewSection";
import FinalCTASection from "@/components/home/FinalCTASection";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f9f9ff]">
      <TopNavBar />
      <div className="pt-16">
        <HeroSection />
        <FeaturesSection />
        <DashboardPreviewSection />
        <FinalCTASection />
      </div>
    </div>
  );
}
