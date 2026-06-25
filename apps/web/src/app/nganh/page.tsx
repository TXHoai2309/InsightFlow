import TopNavBar from "@/components/home/TopNavBar";
import IndustryHeroSection from "@/components/nganh/IndustryHeroSection";
import IndustryGridSection from "@/components/nganh/IndustryGridSection";
import IndustryBentoSection from "@/components/nganh/IndustryBentoSection";
import FinalCTASection from "@/components/home/FinalCTASection";

export const metadata = {
  title: "Ngành | InsightFlow AI Media Monitoring",
  description:
    "Hệ thống AI của InsightFlow được tinh chỉnh để thấu hiểu ngôn ngữ và hành vi khách hàng trong từng ngành nghề chuyên biệt tại Việt Nam.",
};

export default function NganhPage() {
  return (
    <div className="min-h-screen bg-app text-app-primary">
      <TopNavBar />
      <div className="pt-16">
        <IndustryHeroSection />
        <IndustryGridSection />
        <IndustryBentoSection />
        <FinalCTASection />
      </div>
    </div>
  );
}
