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
import { Upload, FileText, ArrowRight, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleContinue = () => {
    if (selectedState && uploadedFiles.length > 0) {
      // Store state and files in sessionStorage for next step
      sessionStorage.setItem("selectedState", selectedState)
      sessionStorage.setItem("uploadedFilesCount", uploadedFiles.length.toString())
      router.push("/conversation")
    }
  }

  const canContinue = selectedState && uploadedFiles.length > 0

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
              First, we need to know your state and review your court documents to determine your eligibility.
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
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Upload Court Documents</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload any court documents, conviction records, or case information you have. Accepted formats: PDF,
                  JPG, PNG.
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Your documents are encrypted and secure. We never share your information with third parties.
                </AlertDescription>
              </Alert>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-sm font-medium">Drag and drop files here, or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, or PNG (max 10MB per file)</p>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Continue Button */}
          <div className="mt-8 flex justify-end">
            <Button size="lg" onClick={handleContinue} disabled={!canContinue} className="gap-2">
              Continue to Voice Interview
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {!canContinue && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Please select your state and upload at least one document to continue
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
