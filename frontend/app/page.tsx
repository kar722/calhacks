import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Shield, FileText, MessageSquare, CheckCircle, Globe, HelpCircle } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
            Clear Your Record, Reclaim Your Future
          </h1>
          <p className="mt-6 text-pretty text-lg text-muted-foreground leading-relaxed md:text-xl">
            ClearPath AI empowers individuals with past convictions to regain opportunities by simplifying the
            expungement process through empathetic AI assistance.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/start">Get Started Here!</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
              <Link href="/faqs">
                <HelpCircle className="mr-2 h-4 w-4" />
                Need Help?
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>Available in English and Spanish</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">How ClearPath AI Works</h2>
            <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
              Our AI-powered platform guides you through every step of the expungement process with clarity and
              compassion.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">Step 1: Upload Documents</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Select your state and securely upload your court summons, police report, and sentencing documents.
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">Step 2: Voice Conversation</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Answer questions through our voice assistant to determine your eligibility.
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">Step 3: Get Results</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Receive your eligibility determination with a confidence score and next steps.
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">Step 4: Complete Forms</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                If eligible, we'll help fill out your expungement forms automatically.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Built on Trust and Accessibility
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
              We remove legal and technical barriers to record clearance, one conversation at a time.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">Privacy First</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Your information is encrypted and secure. We never share your data.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">Accessible to All</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Available in multiple languages with simple, clear guidance.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">Empathetic Support</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Our AI is designed to guide you with understanding and respect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">Ready to Start Your Journey?</h2>
            <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
              Take the first step toward clearing your record and opening new opportunities.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/start">Get Started Here!</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
