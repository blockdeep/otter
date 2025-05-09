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
import { useEffect, useState } from "react";

// Interface for governance data
interface GovernanceApp {
  id: number;
  address: string;
  projectName: string;
  details: string;
  active: boolean;
  createdAt: string;
  proposals: Array<any>; // You might want to define a more specific type for proposals
}

// Interface for API response
interface ApiResponse {
  data: GovernanceApp[];
  page: number;
  pageSize: number;
  total: number;
}

export default function GovernancePage() {
  const navigate = useNavigate();
  const [governanceApps, setGovernanceApps] = useState<GovernanceApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API base URL - update this to match your server
  const API_URL =
    import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";

  useEffect(() => {
    const fetchGovernanceApps = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/governances?active=true`);

        if (!response.ok) {
          throw new Error(
            `Error fetching governance data: ${response.statusText}`,
          );
        }

        const data: ApiResponse = await response.json();
        setGovernanceApps(data.data);
      } catch (err) {
        console.error("Error fetching governance apps:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch governance apps",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchGovernanceApps();
  }, [API_URL]);

  const handleViewProposals = (address: string) => {
    // Navigate to the proposals page with the app ID
    navigate(`/governance/${address}/proposals`);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading governance data...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-6 bg-destructive/10 rounded-lg">
            <h2 className="text-lg font-bold text-destructive mb-2">
              Error Loading Data
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-start space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl md:text-5xl">
                Governance Overview
              </h1>
              <p className="text-muted-foreground md:text-xl max-w-[700px]">
                Explore and participate in governance for dApps built on Sui
              </p>
            </div>

            {governanceApps.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No governance applications found.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {governanceApps.map((app) => (
                  <Card
                    key={app.id}
                    className="overflow-hidden border-border bg-card transition-all hover:shadow-sm"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-4">
                        {/* <img
                          src={getProjectLogo(app.projectName)}
                          alt={`${app.projectName} logo`}
                          className="h-12 w-12 rounded-full bg-accent p-2"
                        /> */}
                        <CardTitle className="text-card-foreground">
                          {app.projectName}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {app.details}
                      </p>
                      <div className="mt-4 flex items-center">
                        <div className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                          {app.proposals.length} Proposals
                        </div>
                        <div className="ml-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                          Active
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">Address:</span>{" "}
                        {app.address.substring(0, 8)}...
                        {app.address.substring(app.address.length - 8)}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors border border-zinc-600"
                        onClick={() => handleViewProposals(app.address)}
                      >
                        View Proposals <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
