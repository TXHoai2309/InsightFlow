import TopNavBar from "@/components/home/TopNavBar";
import Footer from "@/components/home/Footer";
import IndustryHeroSection from "@/components/nganh/IndustryHeroSection";
import IndustryGridSection from "@/components/nganh/IndustryGridSection";
import IndustryBentoSection from "@/components/nganh/IndustryBentoSection";
import IndustryCTASection from "@/components/nganh/IndustryCTASection";

export const metadata = {
  title: "Ngành | InsightFlow AI Media Monitoring",
  description:
    "Hệ thống AI của InsightFlow được tinh chỉnh để thấu hiểu ngôn ngữ và hành vi khách hàng trong từng ngành nghề chuyên biệt tại Việt Nam.",
};

export default function NganhPage() {
  return (
    <div className="min-h-screen bg-[#f9f9ff]">
      <TopNavBar />
      <div className="pt-16">
        <IndustryHeroSection />
        <IndustryGridSection />
        <IndustryBentoSection />
        <IndustryCTASection />
        <Footer />
      </div>
    </div>
  );
}
