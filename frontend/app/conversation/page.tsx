"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Message = {
  role: "assistant" | "user"
  content: string
  timestamp: Date
}

const QUESTIONS = [
  {
    key: "conviction_type",
    text: "Let's start by understanding your case. Can you tell me about the conviction you're seeking to expunge?",
  },
  {
    key: "date",
    text: "When did this conviction occur? Please provide the date.",
  },
  {
    key: "terms_of_service_completed",
    text: "Have you completed all terms of your sentence, including probation and parole?",
  },
  {
    key: "other_convictions",
    text: "Have you had any other convictions since this one?",
  },
  {
    key: "pending_charges_or_cases",
    text: "Are there any pending charges or cases against you currently?",
  },
]

type Responses = {
  conviction_type: string
  date: string
  terms_of_service_completed: boolean
  other_convictions: boolean
  pending_charges_or_cases: boolean
}

export default function ConversationPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userInput, setUserInput] = useState("")
  const [responses, setResponses] = useState<Partial<Responses>>({})
  const [selectedState, setSelectedState] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Get state from previous page
    const state = sessionStorage.getItem("selectedState")
    if (state) {
      setSelectedState(state)
    }

    // Start with welcome message
    const welcomeMessage: Message = {
      role: "assistant",
      content: `Hello! I'm here to help you understand your eligibility for expungement in ${state || "your state"}. I'll ask you a few questions about your case. Let's begin.`,
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])

    // Add first question after a short delay
    setTimeout(() => {
      const firstQuestion: Message = {
        role: "assistant",
        content: QUESTIONS[0].text,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, firstQuestion])
    }, 1000)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages])

  const processAnswer = (answer: string): string | boolean => {
    const normalized = answer.toLowerCase().trim()
    
    // For boolean questions (last 3 questions)
    if (currentQuestionIndex >= 2) {
      // Check for positive responses
      if (normalized.match(/\b(yes|yeah|yep|ya|y|correct|right|true|completed|done|finished|i do|sure|of course|absolutely|definitely)\b/)) {
        return true
      }
      // Check for negative responses
      if (normalized.match(/\b(no|nope|nah|never|none|zero|i haven't|wrong|false|didn't|no i have not)\b/)) {
        return false
      }
      // Default to false if unclear
      return false
    }
    
    // For date question, try to parse it
    if (currentQuestionIndex === 1) {
      // Try to extract a date from the answer
      const dateMatch = normalized.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\b/i)
      if (dateMatch) {
        const [, month, day, year] = dateMatch
        const monthMap: { [key: string]: string } = {
          january: "01", february: "02", march: "03", april: "04",
          may: "05", june: "06", july: "07", august: "08",
          september: "09", october: "10", november: "11", december: "12"
        }
        const monthNum = monthMap[month.toLowerCase()]
        return `${year}-${monthNum}-${day.padStart(2, '0')}`
      }
    }
    
    // Return the answer as-is for text questions
    return answer
  }

  const handleSubmitAnswer = () => {
    if (!userInput.trim()) return

    const currentQuestion = QUESTIONS[currentQuestionIndex]
    const processedAnswer = processAnswer(userInput)

    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: userInput,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Save the response
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.key]: processedAnswer,
    }))

    // Clear input
    setUserInput("")

    // Move to next question or finish
    const nextIndex = currentQuestionIndex + 1
    setCurrentQuestionIndex(nextIndex)

    if (nextIndex < QUESTIONS.length) {
      // Add next question
      setTimeout(() => {
        const nextQuestion: Message = {
          role: "assistant",
          content: QUESTIONS[nextIndex].text,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, nextQuestion])
      }, 500)
    } else {
      // All questions answered
      setTimeout(() => {
        const finalMessage: Message = {
          role: "assistant",
          content: "Thank you for providing all that information. I'm now analyzing your case against the expungement laws. This will just take a moment...",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, finalMessage])
        
        // Proceed to eligibility check
        handleCheckEligibility()
      }, 1000)
    }
  }

  const handleCheckEligibility = async () => {
    try {
      // Save responses to sessionStorage as JSON
      sessionStorage.setItem("voiceAgentResponses", JSON.stringify(responses))
      
      // Get PDF data from sessionStorage (it's stored as "parsedCaseData" from start/page.tsx)
      const pdfDataStr = sessionStorage.getItem("parsedCaseData")
      
      // Merge responses with PDF data
      const responseData: any = {
        ...responses,
      }
      
      if (pdfDataStr) {
        const pdfData = JSON.parse(pdfDataStr)
        // Merge the PDF data into the response data
        Object.assign(responseData, pdfData)
      }

      // Call the backend eligibility API
      try {
        const eligibilityResponse = await fetch("http://127.0.0.1:8000/check-eligibility", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(responseData),
        })

        if (eligibilityResponse.ok) {
          const eligibilityResults = await eligibilityResponse.json()
          sessionStorage.setItem("eligibilityResults", JSON.stringify(eligibilityResults))
        } else {
          throw new Error("Eligibility API failed")
        }
      } catch (error) {
        console.warn("Eligibility API not available, using mock data:", error)
        // Use mock results
        const mockResults = {
          eligible: true,
          confidence: 75,
          key_findings: [{
            title: "Demo Mode",
            description: "Backend API is not running. This is demo data."
          }],
          next_steps: ["Please start the backend API server for real results."],
          retrieved_chunks: []
        }
        sessionStorage.setItem("eligibilityResults", JSON.stringify(mockResults))
      }

      // Navigate to results page
      router.push("/results")
    } catch (error) {
      console.error("Error checking eligibility:", error)
      router.push("/results")
    }
  }

  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100

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
              2
            </div>
            <div className="h-1 w-16 bg-muted" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              3
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">Questionnaire</h1>
            <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
              Answer a few questions to help us determine your eligibility.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Question {currentQuestionIndex + 1} of {QUESTIONS.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Conversation Area */}
          <Card className="mt-8 flex h-[500px] flex-col">
            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`mt-1 text-xs ${
                        message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4">
              {currentQuestionIndex < QUESTIONS.length && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSubmitAnswer()
                  }}
                  className="space-y-4"
                >
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    autoFocus
                  />
                  <Button type="submit" className="w-full" disabled={!userInput.trim()}>
                    Submit Answer
                  </Button>
                </form>
              )}
              
              {/* Debug: Show collected responses */}
              {Object.keys(responses).length > 0 && (
                <Alert className="mt-4">
                  <AlertDescription>
                    <strong>Collected responses (JSON format):</strong>
                    <pre className="mt-2 text-xs overflow-auto">
                      {JSON.stringify(responses, null, 2)}
                    </pre>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>

          {/* Help Text */}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Your responses are confidential and encrypted. We use this information only to assess your eligibility.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
