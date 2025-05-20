import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import otterTogetherImg from "@/public/Otter-together.png";

export default function About() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6 grid gap-12 lg:grid-cols-2 items-center">
            {/* Left: Text Content */}
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-primary">
                Meet OTTER 🦦
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-prose">
                OTTER is a community-first governance framework built for the Sui ecosystem.
                We help dApps launch and scale decentralized governance — faster, easier, and more transparently.
              </p>
              <p className="text-muted-foreground text-base md:text-lg">
                From DAOs to DeFi protocols, OTTER empowers your users with real on-chain decision-making.
              </p>
              <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/5">
                <a href="/governance/launch">Launch Governance</a>
              </Button>
            </div>

            {/* Right: Otter Illustration */}
            <div className="w-full max-w-lg mx-auto">
              <div className="rounded-xl overflow-hidden border border-border shadow-sm bg-card">
                <img
                  src={otterTogetherImg}
                  alt="Group of otters deciding on governance proposals"
                  className="w-full h-auto object-cover"
                />
              </div>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Otters in consensus. Very serious governance.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
