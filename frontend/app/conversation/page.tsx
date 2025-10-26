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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    // Simulate AI processing and next question
    setTimeout(() => {
      const nextIndex = currentQuestionIndex + 1
      if (nextIndex < SAMPLE_QUESTIONS.length) {
        const nextQuestion: Message = {
          role: "assistant",
          content: SAMPLE_QUESTIONS[nextIndex],
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, nextQuestion])
        setCurrentQuestionIndex(nextIndex)
      } else {
        // All questions answered
        const finalMessage: Message = {
          role: "assistant",
          content:
            "Thank you for providing all that information. I'm now analyzing your case against the expungement laws in " +
            selectedState +
            ". This will just take a moment...",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, finalMessage])

        // Navigate to results after a delay
        setTimeout(() => {
          router.push("/results")
        }, 3000)
      }
    }, 1500)
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
          <Card className="mt-8 flex min-h-[400px] flex-col">
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
