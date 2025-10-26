import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ExternalLink, ArrowLeft, Scale, Users, BookOpen, Building, MapPin } from "lucide-react"

export default function ResourcesPage() {
  const resources = [
    {
      name: "LawHelpCA.org",
      description: "California's official legal aid site. Search 'criminal record clearing' or 'expungement alternatives' to find local help centers.",
      icon: Scale,
      link: "https://lawhelpca.org",
    },
    {
      name: "Clean Slate Program (California Courts)",
      description: "Explains eligibility, next steps if denied, and local court contacts for legal aid.",
      icon: Building,
      link: "https://www.courts.ca.gov/selfhelp-cleanslate.htm",
    },
    {
      name: "Root & Rebound",
      description: "A California nonprofit offering free reentry legal clinics and phone support (including for people ineligible right now).",
      icon: Users,
      link: "https://www.rootandrebound.org",
    },
    {
      name: "Legal Services for Prisoners with Children",
      description: "Offers 'All of Us or None' advocacy and guides on record clearing, parole, and reentry.",
      icon: BookOpen,
      link: "https://www.prisonerswithchildren.org",
    },
    {
      name: "California Reentry Council Network",
      description: "Connects people to county reentry programs offering employment, housing, and legal guidance.",
      icon: MapPin,
      link: "https://www.cdcr.ca.gov/adult-operations/reentry",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6 gap-2"
            asChild
          >
            <Link href="/results">
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </Link>
          </Button>

          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Legal Aid and Reentry Assistance
            </h1>
            <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
              Whether you're eligible now or need support for the future, these organizations can help you navigate
              the expungement process and access resources for reentry.
            </p>
          </div>

          {/* Resources Grid */}
          <div className="mt-12 space-y-6">
            {resources.map((resource, index) => {
              const Icon = resource.icon
              return (
                <Card key={index} className="p-6 transition-all hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{resource.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {resource.description}
                      </p>
                      <Button
                        variant="link"
                        className="mt-3 gap-2 p-0 h-auto"
                        asChild
                      >
                        <a href={resource.link} target="_blank" rel="noopener noreferrer">
                          Visit Website
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Additional Info Card */}
          <Card className="mt-8 bg-muted/30 p-8">
            <h2 className="text-xl font-semibold">Need More Help?</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              These organizations offer a range of services including:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Free legal consultations and clinics</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Assistance with filling out expungement forms</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Employment and housing support for people with records</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Advocacy for policy changes and record clearing initiatives</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Community reentry programs and peer support</span>
              </li>
            </ul>
          </Card>

          {/* CTA Section */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="outline" asChild>
              <Link href="/results" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Results
              </Link>
            </Button>
            <Button size="lg" asChild>
              <Link href="/">
                Return Home
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

