import { ArrowLeft, Clock } from "lucide-react";
import { useParams, useNavigate, Outlet } from "react-router";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

// Types
interface Proposal {
  id: number;
  objectId: string;
  creator: string;
  title: string;
  status: number;
  votingEndsAt: string;
  threshold: string;
  yes: number;
  no: number;
  abstain: number;
  executed: boolean;
  governanceAddress: string;
}

// Status mapping
const statusToText = {
  0: "active",
  1: "passed",
  2: "failed",
};

// Badge color helper
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "passed":
      return "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20";
    case "failed":
      return "bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20";
    default:
      return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  }
};

// Time remaining formatter
const formatTimeRemaining = (endTimeStr: string) => {
  const endTime = Math.floor(parseInt(endTimeStr) / 1000);
  const now = Math.floor(Date.now() / 1000);

  if (endTime <= now) return "Ended";

  const diffMs = endTime - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );

  return diffDays > 0
    ? `${diffDays}d ${diffHours}h remaining`
    : `${diffHours}h remaining`;
};

export default function ProposalsPage() {
  const { app } = useParams();
  const navigate = useNavigate();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL =
    import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/proposals`);
        if (!response.ok)
          throw new Error(`Failed to fetch proposals: ${response.statusText}`);
        const result = await response.json();
        const filtered = result.data.filter(
          (p: Proposal) => p.governanceAddress === app,
        );

        setProposals(filtered);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (app) fetchProposals();
  }, [API_URL, app]);

  const handleBack = () => {
    navigate("/governance");
  };

  const handleViewDetails = (proposalId: string) => {
    navigate(`/governance/${app}/proposals/${proposalId}`);
  };

  const appName = app || "Project";

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading proposals...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-6 bg-destructive/10 rounded-lg">
            <h2 className="text-lg font-bold text-destructive mb-2">
              Error Loading Proposals
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
            <div className="mb-8">
              <Button
                variant="ghost"
                className="mb-4 text-foreground hover:text-primary"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Governance
              </Button>
              <h1 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl md:text-5xl">
              </h1>
              <p className="mt-2 text-muted-foreground md:text-xl">
                View and vote on governance proposals for {appName.substring(0,8)} ... {appName.substring(appName.length - 8)}
              </p>
            </div>

            <div className="space-y-4">
              {proposals.map((proposal) => {
                return (
                  <Card
                    key={proposal.id}
                    className="overflow-hidden border-border bg-card"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <CardTitle
                          className="text-xl text-card-foreground hover:text-primary transition-colors cursor-pointer"
                          onClick={() => handleViewDetails(proposal.objectId)}
                        >
                          {proposal.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>
                          {formatTimeRemaining(proposal.votingEndsAt)}
                        </span>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          className="bg-primary hover:bg-primary/90 text-primary-foreground border border-zinc-300"
                          onClick={() => handleViewDetails(proposal.objectId)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
