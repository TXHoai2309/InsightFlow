import TopNavBar from "@/components/home/TopNavBar";
import HeroSection from "@/components/home/HeroSection";
import TrustedBySection from "@/components/home/TrustedBySection";
import FeaturesSection from "@/components/home/FeaturesSection";
import DashboardPreviewSection from "@/components/home/DashboardPreviewSection";
import FinalCTASection from "@/components/home/FinalCTASection";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8f7ff 0%, #eef4ff 100%)" }}>
      <TopNavBar />
      <div className="pt-16">
        {/* Hero: SVG dashboard + KPI counters + animated blobs */}
        <HeroSection />

        {/* Social proof: trusted brands marquee */}
        <TrustedBySection />

        {/* Feature cards with stagger animation */}
        <FeaturesSection />

        {/* Brand intelligence dashboard preview */}
        <DashboardPreviewSection />

        {/* Final CTA */}
        <FinalCTASection />
      </div>
      {/* Footer is rendered by layout.tsx for this route — do NOT add Footer here */}
    </div>
  );
}
