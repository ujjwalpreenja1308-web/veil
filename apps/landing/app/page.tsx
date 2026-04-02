import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import SocialProof from '@/components/SocialProof'
import WhatBreaks from '@/components/WhatBreaks'
import BeforeAfter from '@/components/BeforeAfter'
import HowItWorks from '@/components/HowItWorks'
import { Features } from '@/components/blocks/features-10'
import { GridFeatures } from '@/components/blocks/grid-features'
import Performance from '@/components/Performance'
import CostControl from '@/components/CostControl'
import CtaSection from '@/components/CtaSection'
import Footer from '@/components/Footer'
import { GridLines } from '@/components/ui/grid-lines'
import PricingSection from '@/components/ui/pricing-section'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#080810] overflow-x-hidden">
      <Navbar />
      <Hero />
      <SocialProof />
      {/* Grid lines start here — below hero and marquee */}
      <div className="relative">
        <GridLines />
        <WhatBreaks />
        <BeforeAfter />
        <HowItWorks />
        <Features />
        <GridFeatures />
        <Performance />
        <CostControl />
        <PricingSection />
        <CtaSection />
        <Footer />
      </div>
    </main>
  )
}
