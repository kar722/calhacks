import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Heart, Shield, Users, Target, ArrowRight } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Hero Section */}
          <div className="text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
              Empowering Second Chances Through Technology
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground leading-relaxed">
              ClearPath AI was created to break down the barriers that prevent people with past convictions from
              accessing the opportunities they deserve.
            </p>
          </div>

          {/* Mission Section */}
          <Card className="mt-12 p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Our Mission</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  We believe that everyone deserves a second chance. A criminal record shouldn't be a life sentence that
                  prevents people from finding employment, housing, or pursuing their dreams. Our mission is to make the
                  expungement process accessible, understandable, and achievable for everyone, regardless of their
                  background, education level, or financial resources.
                </p>
              </div>
            </div>
          </Card>

          {/* The Problem Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold">The Problem We're Solving</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold">Complex Legal Process</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Expungement laws vary widely by state and are often difficult to understand. Many eligible individuals
                  don't pursue expungement because they don't know where to start or can't afford legal help.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold">Language Barriers</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Legal documents and court processes are typically only available in English, creating barriers for
                  non-English speakers who could benefit from expungement.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold">High Costs</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Hiring an attorney for expungement can cost thousands of dollars, putting it out of reach for many
                  people who need it most.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold">Lack of Awareness</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Many people with eligible convictions don't even know that expungement is an option or that they might
                  qualify.
                </p>
              </Card>
            </div>
          </div>

          {/* Our Solution Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold">How We're Making a Difference</h2>
            <div className="mt-6 space-y-6">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI-Powered Guidance</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Our artificial intelligence understands the expungement laws in all 50 states and can quickly
                      assess your eligibility. We translate complex legal requirements into simple, clear guidance that
                      anyone can understand.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Accessible to All</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      ClearPath AI is available in multiple languages and uses voice technology so you can speak your
                      answers instead of filling out complicated forms. Our service is free because we believe access to
                      justice shouldn't depend on your ability to pay.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Empathetic Support</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      We understand that dealing with past convictions can be emotionally difficult. Our AI is designed
                      to guide you through the process with respect, dignity, and understanding—never judgment.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Our Values Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold">Our Values</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <Card className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">Privacy First</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Your information is always encrypted and confidential. We never share your data.
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">Equity & Access</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Everyone deserves access to justice, regardless of background or resources.
                </p>
              </Card>

              <Card className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">Empathy & Respect</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  We treat every person with dignity and understanding throughout their journey.
                </p>
              </Card>
            </div>
          </div>

          {/* Impact Section */}
          <Card className="mt-12 bg-primary/5 p-8">
            <h2 className="text-center text-2xl font-bold">Our Impact</h2>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">50</div>
                <p className="mt-2 text-sm text-muted-foreground">States Supported</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">2</div>
                <p className="mt-2 text-sm text-muted-foreground">Languages Available</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">Free</div>
                <p className="mt-2 text-sm text-muted-foreground">Always Free to Use</p>
              </div>
            </div>
          </Card>

          {/* CTA Section */}
          <Card className="mt-8 bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold">Ready to Clear Your Path?</h2>
            <p className="mt-2 text-muted-foreground">
              Take the first step toward a fresh start. Find out if you're eligible for expungement today.
            </p>
            <Button size="lg" asChild className="mt-6">
              <Link href="/start">
                Check Your Eligibility
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
