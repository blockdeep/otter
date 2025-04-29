import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { useNavigate } from "react-router";

// Mock data for governance apps
const governanceApps = [
  {
    id: "bluemove",
    name: "BlueMove",
    logo: "/placeholder.svg?height=80&width=80",
    proposals: 12,
    description: "NFT Marketplace on Sui",
  },
  {
    id: "suiswap",
    name: "SuiSwap",
    logo: "/placeholder.svg?height=80&width=80",
    proposals: 8,
    description: "Decentralized Exchange",
  },
  {
    id: "cetus",
    name: "Cetus",
    logo: "/placeholder.svg?height=80&width=80",
    proposals: 15,
    description: "Concentrated Liquidity DEX",
  },
  {
    id: "suins",
    name: "SuiNS",
    logo: "/placeholder.svg?height=80&width=80",
    proposals: 5,
    description: "Sui Name Service",
  },
  {
    id: "turbos",
    name: "Turbos",
    logo: "/placeholder.svg?height=80&width=80",
    proposals: 7,
    description: "Perpetual DEX",
  },
  {
    id: "scallop",
    name: "Scallop",
    logo: "/placeholder.svg?height=80&width=80",
    proposals: 10,
    description: "Lending Protocol",
  },
];

export default function GovernancePage() {
  const navigate = useNavigate();

  const handleViewProposals = (appId) => {
    navigate(`/governance/${appId}/proposals`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6  mx-auto">
            <div className="flex flex-col items-start space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl md:text-5xl">
                Governance Overview
              </h1>
              <p className="text-muted-foreground md:text-xl max-w-[700px]">
                Explore and participate in governance for dApps built on Sui
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {governanceApps.map((app) => (
                <Card
                  key={app.id}
                  className="overflow-hidden border-border bg-card transition-all hover:shadow-sm"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-4">
                      <img
                        src={app.logo || "/placeholder.svg"}
                        alt={`${app.name} logo`}
                        className="h-12 w-12 rounded-full bg-accent p-2"
                      />
                      <CardTitle className="text-card-foreground">
                        {app.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {app.description}
                    </p>
                    <div className="mt-4 flex items-center">
                      <div className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                        {app.proposals} Proposals
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                      onClick={() => handleViewProposals(app.id)}
                    >
                      View Proposals <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
