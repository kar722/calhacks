import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import Image from "next/image"

export default function TeamPage() {
  const teamMembers = [
    { name: "Karthik Valluri", image: "/karthiklinkedin.jpeg", major: "Data Science", year: "Sophomore", school: "UC Berkeley", hometown: "San Diego" },
    { name: "Sierra Meisel", image: "/sierralinkedin.jpeg", major: "Data Science", year: "Sophomore", school: "UC Berkeley", hometown: "Cupertino" },
    { name: "Thomas Lien", image: "/thomaslinkedin.jpeg", major: "Electrical Engineering", year: "Sophomore", school: "UCLA", hometown: "San Diego" },
    { name: "Alisha Luc", image: "/alishalinkedin.jpeg", major: "Data Science", year: "Sophomore", school: "UC Berkeley", hometown: "Cupertino" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Our Team
            </h1>
            <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
              Meet the dedicated individuals behind ClearPath AI
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-2">
            {teamMembers.map((member) => (
              <Card key={member.name} className="flex flex-col items-center p-6">
                <div className="relative mb-4 h-48 w-48 overflow-hidden rounded-full">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">School: {member.school}</p>
                <p className="mt-1 text-sm text-muted-foreground">Major: {member.major}</p>
                <p className="mt-1 text-sm text-muted-foreground">Year: {member.year}</p>
                <p className="mt-1 text-sm text-muted-foreground">Hometown: {member.hometown}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

