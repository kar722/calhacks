"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, ArrowRight, Info, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const BACKEND_URL = "http://127.0.0.1:8000"

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
]

export default function StartPage() {
  const router = useRouter()
  const [selectedState, setSelectedState] = useState<string>("")
  const [courtSummons, setCourtSummons] = useState<File | null>(null)
  const [policeReport, setPoliceReport] = useState<File | null>(null)
  const [courtSentencing, setCourtSentencing] = useState<File | null>(null)
  const [draggingField, setDraggingField] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (field === "summons") setCourtSummons(file)
      else if (field === "police") setPoliceReport(file)
      else if (field === "sentencing") setCourtSentencing(file)
    }
  }

  const handleDragOver = (e: React.DragEvent, field: string) => {
    e.preventDefault()
    setDraggingField(field)
  }

  const handleDragLeave = () => {
    setDraggingField(null)
  }

  const handleDrop = (e: React.DragEvent, field: string) => {
    e.preventDefault()
    setDraggingField(null)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (field === "summons") setCourtSummons(file)
      else if (field === "police") setPoliceReport(file)
      else if (field === "sentencing") setCourtSentencing(file)
    }
  }

  const removeFile = (field: string) => {
    if (field === "summons") setCourtSummons(null)
    else if (field === "police") setPoliceReport(null)
    else if (field === "sentencing") setCourtSentencing(null)
  }

  const handleContinue = async () => {
    if (!selectedState || (!courtSummons && !policeReport && !courtSentencing)) {
      setError("Please select your state and upload at least one document")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create FormData with the PDF files
      const formData = new FormData()
      
      if (courtSummons) {
        formData.append("summons", courtSummons)
      }
      if (courtSentencing) {
        formData.append("sentencing", courtSentencing)
      }
      if (policeReport) {
        formData.append("police", policeReport)
      }

      // Call the backend PDF parser endpoint
      const response = await fetch(`${BACKEND_URL}/extract`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Failed to parse PDFs: ${response.statusText}`)
      }

      // Parse the JSON response
      const parsedData = await response.json()
      
      // Log the response for debugging
      console.log("📄 PDF Parser Response:", parsedData)
      console.log("================================")
      console.log("Case Number:", parsedData.case_number)
      console.log("Name:", parsedData.name)
      console.log("City/County:", parsedData.city_or_county)
      console.log("Violations:", parsedData.violations_charged_with)
      console.log("================================")

      // Store the parsed data in sessionStorage for the next page
      sessionStorage.setItem("selectedState", selectedState)
      sessionStorage.setItem("parsedCaseData", JSON.stringify(parsedData))
      
      const filesCount = [courtSummons, policeReport, courtSentencing].filter(Boolean).length
      sessionStorage.setItem("uploadedFilesCount", filesCount.toString())

      // Navigate to the next page
      router.push("/conversation")
    } catch (err) {
      console.error("Error parsing PDFs:", err)
      setError(err instanceof Error ? err.message : "Failed to parse documents. Please try again.")
      setIsLoading(false)
    }
  }

  const canContinue = selectedState && (courtSummons || policeReport || courtSentencing)

  const renderUploadBox = (field: string, label: string, description: string) => {
    const isDragging = draggingField === field
    const file = field === "summons" ? courtSummons : field === "police" ? policeReport : courtSentencing
    
    return (
      <div className="space-y-2">
        <Label className="text-sm font-semibold">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div
          onDragOver={(e) => handleDragOver(e, field)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, field)}
          className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <input
            type="file"
            id={`file-upload-${field}`}
            accept=".pdf"
            onChange={(e) => handleFileChange(e, field)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          {!file && (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-xs font-medium">Drag and drop or click to upload PDF</p>
            </>
          )}
          {file && (
            <div className="flex items-center gap-3 p-2">
              <FileText className="h-8 w-8 text-primary" />
              <div className="text-center">
                <p className="text-xs font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(field)
                }}
                className="text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Progress Indicator */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              1
            </div>
            <div className="h-1 w-16 bg-primary" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              2
            </div>
            <div className="h-1 w-16 bg-muted" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
              3
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">Let's Get Started</h1>
            <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
              First, we need to know your state and review your court documents to determine your eligibility. Please upload your court summons, police report, and court sentencing documents.
            </p>
          </div>

          {/* State Selection */}
          <Card className="mt-8 p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="state" className="text-base font-semibold">
                  Select Your State
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Expungement laws vary by state. We'll use this to provide accurate guidance.
                </p>
              </div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger id="state" className="w-full">
                  <SelectValue placeholder="Choose your state..." />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Document Upload */}
          <Card className="mt-6 p-6">
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">Upload Court Documents</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload your court documents. Accepted format: PDF only.
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Your documents are encrypted and secure. We never share your information with third parties.
                </AlertDescription>
              </Alert>

              {/* Three Separate Upload Boxes */}
              <div className="grid gap-4 md:grid-cols-1">
                {renderUploadBox(
                  "summons",
                  "Court Summons",
                  "Upload your court summons document"
                )}
                {renderUploadBox(
                  "police",
                  "Police Report",
                  "Upload your police report or incident report"
                )}
                {renderUploadBox(
                  "sentencing",
                  "Court Sentencing",
                  "Upload your court sentencing or conviction record"
                )}
              </div>
            </div>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Continue Button */}
          <div className="mt-8 flex justify-end">
            <Button 
              size="lg" 
              onClick={handleContinue} 
              disabled={!canContinue || isLoading} 
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing Documents...
                </>
              ) : (
                <>
                  Continue to Voice Interview
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {!canContinue && !isLoading && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Please select your state and upload at least one court document to continue
            </p>
          )}

          {isLoading && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Extracting information from your documents using AI...
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
