import TopNavBar from "@/components/home/TopNavBar";
import AboutHeroSection from "@/components/ve-chung-toi/AboutHeroSection";
import MissionVisionSection from "@/components/ve-chung-toi/MissionVisionSection";
import CoreValuesSection from "@/components/ve-chung-toi/CoreValuesSection";
import TeamSection from "@/components/ve-chung-toi/TeamSection";
import PartnersSection from "@/components/ve-chung-toi/PartnersSection";
import AboutCTASection from "@/components/ve-chung-toi/AboutCTASection";

export const metadata = {
  title: "Về chúng tôi | InsightFlow - Giải pháp AI hàng đầu",
  description:
    "InsightFlow ra đời với sứ mệnh mang sức mạnh của AI hiện đại nhất để giúp các thương hiệu Việt Nam hiểu thấu khách hàng và làm chủ mọi xu hướng thảo luận.",
};

export default function VeChungToiPage() {
  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d]">
      <TopNavBar />
      <div className="pt-16">
        <AboutHeroSection />
        <MissionVisionSection />
        <CoreValuesSection />
        <TeamSection />
        <PartnersSection />
        <AboutCTASection />
      </div>
    </div>
  );
}
