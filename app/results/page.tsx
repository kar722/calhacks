"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, AlertCircle, FileText, Download, ArrowRight, Info, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface KeyFinding {
  title: string
  description: string
}

interface RetrievedChunk {
  content: string
  metadata: {
    form_name?: string
    section_number?: number
    doc_type?: string
    section?: string
    condition_number?: number
    penal_codes?: string
    [key: string]: any
  }
}

interface EligibilityResults {
  eligible: boolean
  confidence: number
  key_findings: KeyFinding[]
  next_steps: string[]
  retrieved_chunks: RetrievedChunk[]
}

/**
 * Results Page Component
 * 
 * This component displays eligibility results from the FastAPI backend.
 * 
 * To integrate with the actual FastAPI endpoint:
 * 1. Remove the mockData and uncomment the fetch call
 * 2. Update the API endpoint URL to match your FastAPI server
 * 3. Ensure the endpoint returns JSON matching the EligibilityResults interface
 * 
 * Expected API Response Format:
 * {
 *   "eligible": boolean,
 *   "confidence": number (0-100),
 *   "key_findings": [{ title: string, description: string }],
 *   "next_steps": string[],
 *   "retrieved_chunks": [{ content: string, metadata: {...} }]
 * }
 */
export default function ResultsPage() {
  const router = useRouter()
  const [selectedState, setSelectedState] = useState("")
  const [results, setResults] = useState<EligibilityResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get state from session
    const state = sessionStorage.getItem("selectedState")
    if (state) {
      setSelectedState(state)
    }

    // TODO: Replace with actual API call when FastAPI endpoint is ready
    // For now, we'll use a mock fetch to demonstrate the structure
    const fetchResults = async () => {
      try {
        // TODO: Replace this URL with your actual FastAPI endpoint
        // const response = await fetch('http://localhost:8000/api/eligibility-check')
        // const data = await response.json()
        
        // Mock data for demonstration - replace with actual API call above
        const mockData: EligibilityResults = {
          eligible: true,
          confidence: 95,
          key_findings: [
            {
              title: "Conviction Type Eligible",
              description: "The convictions for Penal Code § 484(a) and Penal Code § 148(a)(1) are misdemeanors and are not among the excluded offenses for expungement."
            },
            {
              title: "Waiting Period Met",
              description: "More than one year has elapsed since the conviction date of May 14, 2021, and all probation terms have been completed."
            },
            {
              title: "No Disqualifying Factors",
              description: "The petitioner is not currently serving a sentence, not on probation, and has no pending charges."
            }
          ],
          next_steps: [
            "Download the CR-180 form for petitioning for dismissal.",
            "Complete the CR-180 form with the necessary details regarding the conviction.",
            "File the completed CR-180 form with the court in Los Angeles."
          ],
          retrieved_chunks: [
            {
              content: "Section 3: Misdemeanor or infraction with sentence other than probation (Pen. Code, § 1203.4a)\nProbation was not granted; more than one year has elapsed since judgment was pronounced. Petitioner has c...",
              metadata: {
                form_name: "CR-180",
                section_number: 3,
                doc_type: "form_petition",
                section: "section_3"
              }
            },
            {
              content: "Section 2: Felony or misdemeanor with probation granted (Pen. Code, § 1203.4)\nProbation was granted on the terms and conditions stated in the docket of the above-entitled court; the petitioner is not ...",
              metadata: {
                form_name: "CR-180",
                doc_type: "form_petition",
                section: "section_2",
                section_number: 2
              }
            },
            {
              content: "You are NOT eligible if: + Probation was revoked in a case and not later reinstated.",
              metadata: {
                doc_type: "eligibility_negative",
                condition_number: 4
              }
            },
            {
              content: "You are NOT eligible if: + You cannot dismiss any misdemeanor that is within the provisions of Z VC 42001 (b); or any violation of the following: Z PC 286(c); B PC 288;",
              metadata: {
                doc_type: "eligibility_negative",
                penal_codes: "Z PC 286, B PC 288",
                condition_number: 6
              }
            },
            {
              content: "Section 4: Misdemeanor conviction under Penal Code section 647(b) (Pen. Code, § 1203.49)\nPetitioner has completed a term of probation for a conviction under Penal Code section 647(b) and should be gra...",
              metadata: {
                section_number: 4,
                penal_codes: "Penal Code section 647",
                section: "section_4",
                doc_type: "form_petition",
                form_name: "CR-180"
              }
            }
          ]
        }
        
        setResults(mockData)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to load eligibility results. Please try again.")
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [])

  const getStatusConfig = () => {
    if (!results) {
      return {
        icon: Info,
        title: "Loading eligibility results...",
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/30",
        borderColor: "border-blue-200 dark:border-blue-800",
      }
    }

    if (results.eligible) {
      return {
        icon: CheckCircle,
        title: "You Appear Eligible for Expungement",
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/30",
        borderColor: "border-green-200 dark:border-green-800",
      }
    } else {
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

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container mx-auto flex flex-1 items-center justify-center px-4">
          <Card className="w-full max-w-md p-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">Error Loading Results</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (!results) {
    return null
  }

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
                <span className="text-2xl font-bold text-primary">{results.confidence}%</span>
              </div>
              <Progress value={results.confidence} className="h-3" />
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
              {results.key_findings.map((finding, index) => (
                <div key={index} className="flex gap-3">
                  {results.eligible ? (
                    <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-amber-600" />
                  )}
                  <div>
                    <p className="font-medium">{finding.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {finding.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Next Steps */}
          <Card className="mt-6 p-6">
            <h2 className="text-lg font-semibold">Next Steps</h2>
            <div className="mt-4 space-y-4">
              {results.next_steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Retrieved Chunks */}
          {results.retrieved_chunks && results.retrieved_chunks.length > 0 && (
            <Card className="mt-6 p-6">
              <h2 className="text-lg font-semibold">Relevant Legal References</h2>
              <div className="mt-4 space-y-4">
                {results.retrieved_chunks.map((chunk, index) => (
                  <div key={index} className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      {chunk.content}
                    </p>
                    {Object.keys(chunk.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {chunk.metadata.form_name && (
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            Form: {chunk.metadata.form_name}
                          </span>
                        )}
                        {chunk.metadata.section_number && (
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            Section {chunk.metadata.section_number}
                          </span>
                        )}
                        {chunk.metadata.doc_type && (
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {chunk.metadata.doc_type}
                          </span>
                        )}
                        {chunk.metadata.penal_codes && (
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {chunk.metadata.penal_codes}
                          </span>
                        )}
                        {chunk.metadata.condition_number && (
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            Condition {chunk.metadata.condition_number}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

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
