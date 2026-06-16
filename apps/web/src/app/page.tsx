import TopNavBar from "@/components/home/TopNavBar";
import HeroSection from "@/components/home/HeroSection";
import PainPointsSection from "@/components/home/PainPointsSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import StatsBarSection from "@/components/home/StatsBarSection";
import DashboardPreviewSection from "@/components/home/DashboardPreviewSection";
import UseCasesSection from "@/components/home/UseCasesSection";
import BenefitsSection from "@/components/home/BenefitsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FinalCTASection from "@/components/home/FinalCTASection";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <>
      <TopNavBar />
      <main className="mt-16 overflow-hidden">
        <HeroSection />
        <PainPointsSection />
        <FeaturesSection />
        <StatsBarSection />
        <DashboardPreviewSection />
        <UseCasesSection />
        <BenefitsSection />
        <TestimonialsSection />
        <FinalCTASection />
      </main>
      <Footer />
    </>
  );
}
