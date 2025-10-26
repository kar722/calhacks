import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { HelpCircle, ArrowRight } from "lucide-react"

export default function FAQsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
              Find answers to common questions about expungement and how ClearPath AI can help you.
            </p>
          </div>

          <Card className="mt-12 p-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">What is expungement?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Expungement is a legal process that allows you to have certain criminal convictions removed or sealed
                  from your record. Once expunged, the conviction is typically hidden from public view, including
                  background checks by employers and landlords. The specific rules and benefits vary by state.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">How does ClearPath AI work?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  ClearPath AI uses artificial intelligence to analyze your case information and court documents against
                  your state's expungement laws. Through a simple voice or text conversation, we gather the necessary
                  information to determine your eligibility and provide guidance on next steps. The entire process is
                  secure, confidential, and designed to be accessible to everyone.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">Is my information secure?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes. We take your privacy seriously. All information you provide is encrypted both in transit and at
                  rest. We never share your personal information or case details with third parties. Your data is used
                  solely to assess your eligibility and assist you with the expungement process.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">What types of convictions can be expunged?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Eligibility varies by state, but generally, misdemeanors and some non-violent felonies may qualify for
                  expungement. Factors include the type of offense, how long ago it occurred, whether you completed your
                  sentence, and your criminal history since then. Serious violent crimes and sex offenses are typically
                  not eligible. ClearPath AI will help determine if your specific conviction qualifies in your state.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">How long does the expungement process take?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  The timeline varies by state and court. After filing your petition, it typically takes 3-6 months to
                  receive a decision. Some states have faster processes, while others may take longer. ClearPath AI
                  provides an eligibility assessment in minutes, and we can help you prepare the necessary forms
                  immediately. The actual court processing time is beyond our control.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger className="text-left">Do I need a lawyer?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  While ClearPath AI can help you understand your eligibility and prepare forms, we are not a substitute
                  for legal advice. Many people successfully complete the expungement process on their own, especially
                  for straightforward cases. However, if your case is complex or you're unsure about any aspect of the
                  process, we recommend consulting with a licensed attorney in your state.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger className="text-left">How much does ClearPath AI cost?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  ClearPath AI's eligibility assessment is free. Our mission is to make expungement accessible to
                  everyone. There may be court filing fees required by your state when you submit your expungement
                  petition, which vary by jurisdiction. Some states offer fee waivers for those who cannot afford them.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger className="text-left">What if I'm not eligible for expungement?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  If you're not currently eligible, ClearPath AI will explain why and, when possible, tell you when you
                  might become eligible. Some states have waiting periods or other requirements that must be met first.
                  We can also provide information about alternative options, such as record sealing or certificates of
                  rehabilitation, depending on your state's laws.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9">
                <AccordionTrigger className="text-left">Which states does ClearPath AI support?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  ClearPath AI currently supports all 50 U.S. states. Each state has different expungement laws, and our
                  AI is trained on the specific requirements for each jurisdiction. We regularly update our system to
                  reflect changes in state laws and court procedures.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10">
                <AccordionTrigger className="text-left">Can I use ClearPath AI in Spanish?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Yes! ClearPath AI is available in both English and Spanish. Our voice assistant can understand and
                  respond in either language, and all forms and documentation can be provided in your preferred
                  language. We're committed to making expungement accessible to all communities.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* CTA Section */}
          <Card className="mt-8 bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold">Still Have Questions?</h2>
            <p className="mt-2 text-muted-foreground">
              The best way to get answers is to start your eligibility assessment.
            </p>
            <Button size="lg" asChild className="mt-6">
              <Link href="/start">
                Get Started Now
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
