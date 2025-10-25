"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, AlertCircle, FileText, Download, ArrowRight, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

type EligibilityStatus = "eligible" | "likely-eligible" | "not-eligible"

export default function ResultsPage() {
  const router = useRouter()
  const [selectedState, setSelectedState] = useState("")
  const [status, setStatus] = useState<EligibilityStatus>("eligible")
  const [confidenceScore, setConfidenceScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get state from session
    const state = sessionStorage.getItem("selectedState")
    if (state) {
      setSelectedState(state)
    }

    // Simulate analysis
    setTimeout(() => {
      setStatus("eligible")
      setConfidenceScore(85)
      setIsLoading(false)
    }, 2000)
  }, [])

  const getStatusConfig = () => {
    switch (status) {
      case "eligible":
        return {
          icon: CheckCircle,
          title: "You Appear Eligible for Expungement",
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/30",
          borderColor: "border-green-200 dark:border-green-800",
        }
      case "likely-eligible":
        return {
          icon: Info,
          title: "You May Be Eligible for Expungement",
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          borderColor: "border-blue-200 dark:border-blue-800",
        }
      case "not-eligible":
        return {
          icon: AlertCircle,
          title: "You May Not Be Eligible at This Time",
          color: "text-amber-600",
          bgColor: "bg-amber-50 dark:bg-amber-950/30",
          borderColor: "border-amber-200 dark:border-amber-800",
        }
    }
  }

  const config = getStatusConfig()
  const StatusIcon = config.icon

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container mx-auto flex flex-1 items-center justify-center px-4">
          <Card className="w-full max-w-md p-8 text-center">
            <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <h2 className="text-xl font-semibold">Analyzing Your Case</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We're reviewing your information against {selectedState} expungement laws...
            </p>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Progress Indicator */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              ✓
            </div>
            <div className="h-1 w-16 bg-primary" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              ✓
            </div>
            <div className="h-1 w-16 bg-primary" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              3
            </div>
          </div>

          {/* Results Header */}
          <Card className={`border-2 ${config.borderColor} ${config.bgColor} p-8`}>
            <div className="flex flex-col items-center text-center">
              <StatusIcon className={`h-16 w-16 ${config.color}`} />
              <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">{config.title}</h1>
              <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
                Based on the information you provided and the expungement laws in {selectedState}, our AI analysis has
                determined your eligibility status.
              </p>
            </div>
          </Card>

          {/* Confidence Score */}
          <Card className="mt-6 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Confidence Score</h2>
                <span className="text-2xl font-bold text-primary">{confidenceScore}%</span>
              </div>
              <Progress value={confidenceScore} className="h-3" />
              <p className="text-sm text-muted-foreground">
                This score reflects how confident we are in this determination based on the information provided and
                applicable laws.
              </p>
            </div>
          </Card>

          {/* Key Findings */}
          <Card className="mt-6 p-6">
            <h2 className="text-lg font-semibold">Key Findings</h2>
            <div className="mt-4 space-y-3">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="font-medium">Conviction Type Eligible</p>
                  <p className="text-sm text-muted-foreground">
                    Your misdemeanor conviction qualifies for expungement under {selectedState} law.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="font-medium">Waiting Period Met</p>
                  <p className="text-sm text-muted-foreground">
                    Sufficient time has passed since your conviction and completion of sentence.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="font-medium">No Disqualifying Factors</p>
                  <p className="text-sm text-muted-foreground">
                    No pending charges or recent convictions that would prevent expungement.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card className="mt-6 p-6">
            <h2 className="text-lg font-semibold">Next Steps</h2>
            <div className="mt-4 space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  1
                </div>
                <div>
                  <p className="font-medium">Download Your Eligibility Report</p>
                  <p className="text-sm text-muted-foreground">
                    Get a detailed PDF report of your eligibility determination and findings.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  2
                </div>
                <div>
                  <p className="font-medium">Complete Expungement Forms</p>
                  <p className="text-sm text-muted-foreground">
                    We'll help you fill out the required forms for {selectedState} automatically.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  3
                </div>
                <div>
                  <p className="font-medium">File With the Court</p>
                  <p className="text-sm text-muted-foreground">
                    Submit your completed forms to the appropriate court in {selectedState}.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Important Notice */}
          <Alert className="mt-6">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Important:</strong> This is an AI-generated assessment and does not constitute legal advice. We
              recommend consulting with a licensed attorney in {selectedState} to confirm your eligibility and assist
              with the filing process.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
            <Button size="lg" variant="outline" className="gap-2 bg-transparent">
              <FileText className="h-4 w-4" />
              Complete Forms
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/" className="gap-2">
                Return Home
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
