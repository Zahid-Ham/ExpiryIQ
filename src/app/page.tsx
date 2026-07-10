import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Logos } from "@/components/landing/logos"
import { Features } from "@/components/landing/features"
import { DashboardPreview } from "@/components/landing/dashboard-preview"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Benefits } from "@/components/landing/benefits"
import { FAQ } from "@/components/landing/faq"
import { CTA } from "@/components/landing/cta"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Logos />
        <Features />
        <DashboardPreview />
        <HowItWorks />
        <Benefits />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
