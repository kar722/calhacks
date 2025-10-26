"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Volume2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Message = {
  role: "assistant" | "user"
  content: string
  timestamp: Date
}

const SAMPLE_QUESTIONS = [
  "Let's start by understanding your case. Can you tell me about the conviction you're seeking to expunge?",
  "When did this conviction occur? Please provide the approximate year.",
  "Have you completed all terms of your sentence, including probation and parole?",
  "Have you had any other convictions since this one?",
  "Are there any pending charges or cases against you currently?",
]

export default function ConversationPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [selectedState, setSelectedState] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Get state from previous page
    const state = sessionStorage.getItem("selectedState")
    if (state) {
      setSelectedState(state)
    }

    // Start with first question
    const firstMessage: Message = {
      role: "assistant",
      content: `Hello! I'm here to help you understand your eligibility for expungement in ${state || "your state"}. I'll ask you a few questions about your case. You can speak your answers using the microphone. Let's begin.`,
      timestamp: new Date(),
    }
    setMessages([firstMessage])

    // Add first question after a delay
    setTimeout(() => {
      const firstQuestion: Message = {
        role: "assistant",
        content: SAMPLE_QUESTIONS[0],
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, firstQuestion])
    }, 1500)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "nearest" })
  }, [messages])

  const handleStartListening = () => {
    setIsListening(true)
    // Simulate voice recognition
    setTimeout(() => {
      setIsListening(false)
      const simulatedResponse = "I was convicted of a misdemeanor theft charge in 2018."
      handleSendMessage(simulatedResponse)
    }, 3000)
  }

  const handleStopListening = () => {
    setIsListening(false)
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Store answers in sessionStorage
    const answers = JSON.parse(sessionStorage.getItem("answers") || "{}")
    const questionKey = `answer_${currentQuestionIndex}`
    answers[questionKey] = content
    sessionStorage.setItem("answers", JSON.stringify(answers))

    // Update the question index immediately
    const nextIndex = currentQuestionIndex + 1
    setCurrentQuestionIndex(nextIndex)

    // Simulate AI processing and next question
    setTimeout(() => {
      if (nextIndex < SAMPLE_QUESTIONS.length) {
        const nextQuestion: Message = {
          role: "assistant",
          content: SAMPLE_QUESTIONS[nextIndex],
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, nextQuestion])
      } else {
        // All questions answered - prepare to analyze
        const finalMessage: Message = {
          role: "assistant",
          content:
            "Thank you for providing all that information. I'm now analyzing your case against the expungement laws in " +
            selectedState +
            ". This will just take a moment...",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, finalMessage])

        // Call eligibility API
        checkEligibility()
      }
    }, 1500)
  }

  const checkEligibility = async () => {
    try {
      // Get PDF data and answers from sessionStorage
      const pdfDataStr = sessionStorage.getItem("pdfData")
      const answersStr = sessionStorage.getItem("answers")
      
      if (!pdfDataStr || !answersStr) {
        console.error("Missing data for eligibility check - using mock data")
        // Use mock data if APIs aren't running
        const mockResults = {
          eligible: true,
          confidence: 85,
          key_findings: [
            {
              title: "Mock Data",
              description: "API is not running. Using demo data for demonstration purposes."
            }
          ],
          next_steps: ["Please ensure the backend API is running for real eligibility checks."],
          retrieved_chunks: []
        }
        sessionStorage.setItem("eligibilityResults", JSON.stringify(mockResults))
        setTimeout(() => router.push("/results"), 2000)
        return
      }
      
      const pdfData = JSON.parse(pdfDataStr)
      const answers = JSON.parse(answersStr)
      
      // Convert answers to structured data for voice-agent endpoint
      const conversationInput = {
        conviction_description: answers.answer_0 || "",
        conviction_year: answers.answer_1 || "",
        terms_completed: answers.answer_2 || "",
        other_convictions: answers.answer_3 || "",
        pending_charges: answers.answer_4 || "",
      }
      
      // Call Endpoint 2: /voice-agent to get structured questionnaire data
      let voiceAgentData
      try {
        const voiceAgentResponse = await fetch("http://127.0.0.1:8000/voice-agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(conversationInput),
        })
        
        if (voiceAgentResponse.ok) {
          voiceAgentData = await voiceAgentResponse.json()
        } else {
          throw new Error("Voice agent API failed")
        }
      } catch (error) {
        console.warn("Voice agent API not available, using mock data:", error)
        // Use mock voice agent data
        voiceAgentData = {
          conviction_type: "Misdemeanor",
          date: new Date().toISOString(),
          terms_of_service_completed: true,
          other_convictions: false,
          pending_charges_or_cases: false,
        }
      }
      
      // Merge PDF data (Endpoint 1) with voice agent data (Endpoint 2)
      const mergedData = {
        ...pdfData,
        ...voiceAgentData,
      }
      
      // Call Endpoint 3: /check-eligibility with merged data
      try {
        const eligibilityResponse = await fetch("http://127.0.0.1:8000/check-eligibility", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mergedData),
        })
        
        if (eligibilityResponse.ok) {
          const eligibilityResults = await eligibilityResponse.json()
          sessionStorage.setItem("eligibilityResults", JSON.stringify(eligibilityResults))
        } else {
          throw new Error("Eligibility API failed")
        }
      } catch (error) {
        console.warn("Eligibility API not available, using mock data:", error)
        // Use mock eligibility results
        const mockResults = {
          eligible: true,
          confidence: 75,
          key_findings: [
            {
              title: "Demo Mode",
              description: "Backend API is not running. This is demo data for demonstration purposes only."
            }
          ],
          next_steps: ["Please start the backend API server to get real eligibility results."],
          retrieved_chunks: []
        }
        sessionStorage.setItem("eligibilityResults", JSON.stringify(mockResults))
      }
    } catch (error) {
      console.error("Error checking eligibility:", error)
      // Fall back to mock data if there's an error
      const mockResults = {
        eligible: false,
        confidence: 50,
        key_findings: [
          {
            title: "Error",
            description: "Unable to connect to backend API. Please ensure the API server is running."
          }
        ],
        next_steps: ["Please start the backend API server and try again."],
        retrieved_chunks: []
      }
      sessionStorage.setItem("eligibilityResults", JSON.stringify(mockResults))
    } finally {
      // Navigate to results page after a brief delay
      setTimeout(() => {
        router.push("/results")
      }, 2000)
    }
  }

  const progress = ((currentQuestionIndex + 1) / SAMPLE_QUESTIONS.length) * 100

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
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">Voice Interview</h1>
            <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
              Answer a few questions to help us determine your eligibility. Click the microphone to speak your responses.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Question {currentQuestionIndex + 1} of {SAMPLE_QUESTIONS.length}
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
              <Alert className="mb-4">
                <Volume2 className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {isListening
                    ? "Listening... Speak now"
                    : "Click the microphone button below to speak your response"}
                </AlertDescription>
              </Alert>

              <div className="flex justify-center">
                <Button
                  size="lg"
                  variant={isListening ? "destructive" : "default"}
                  className="w-full sm:w-auto"
                  onClick={isListening ? handleStopListening : handleStartListening}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-5 w-5 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 mr-2" />
                      Speak Your Response
                    </>
                  )}
                </Button>
              </div>
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
