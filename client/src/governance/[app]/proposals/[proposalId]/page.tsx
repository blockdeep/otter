import { ArrowLeft, Calendar, Clock, ThumbsDown, ThumbsUp } from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface Proposal {
  id: number;
  objectId: string;
  title: string;
  creator: string;
  executed: boolean;
  governanceAddress: string;
  status: string | null;
  threshold: string;
  votingEndsAt: string;
  yes: number;
  no: number;
  abstain: number;
}

const getAppName = (appId: string) => {
  const appNames: Record<string, string> = {
    bluemove: "BlueMove",
    suiswap: "SuiSwap",
    cetus: "Cetus",
    suins: "SuiNS",
    turbos: "Turbos",
    scallop: "Scallop",
  };
  return appNames[appId] || appId;
};

const formatDate = (ms: number) => {
  const date = new Date(ms);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

export default function ProposalDetailsPage() {
  const { app, proposalId } = useParams();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL =
    import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/proposals?objectId=${proposalId}`);
        if (!res.ok)
          throw new Error(`Failed to load proposal: ${res.statusText}`);
        const data = await res.json();
        const fetched = data?.data?.[0];
        if (!fetched) throw new Error("Proposal not found.");
        setProposal(fetched);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    if (proposalId) fetchProposal();
  }, [proposalId]);

  const handleBack = () => {
    navigate(`/governance/${app}/proposals`);
  };

  const handleVote = (type: string) => {
    console.log(`Voted ${type} on proposal ${proposalId}`);
    // Add vote API logic here
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading proposal...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!proposal || error) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 container px-4 md:px-6 py-12 mx-auto">
          <Button
            variant="ghost"
            className="mb-4 text-foreground hover:text-primary"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Proposals
          </Button>
          <Card className="border-border">
            <CardContent className="p-6">
              <p className="text-card-foreground">
                {error || "Proposal not found."}
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const totalVotes = proposal.yes + proposal.no + proposal.abstain || 1;
  const percent = (v: number) => Math.round((v / totalVotes) * 100);
  const status = proposal.status ?? "active";
  const formattedEndTime = formatDate(Number(proposal.votingEndsAt));

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
                Back to Proposals
              </Button>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tighter text-foreground sm:text-3xl md:text-4xl">
                  {proposal.title}
                </h1>
                {/* <Badge className={`${getStatusBadgeColor(status)} capitalize`}>
                  {status}
                </Badge> */}
              </div>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xl text-card-foreground">
                  Proposal Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">End Time</p>
                      <p className="font-medium text-card-foreground">
                        {formattedEndTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Threshold</p>
                      <p className="font-medium text-card-foreground">
                        {Number(proposal.threshold).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-border" />

                <div>
                  <h3 className="font-medium mb-4 text-card-foreground">
                    Voting Results
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-card-foreground">
                          Yes ({percent(proposal.yes)}%)
                        </span>
                      </div>
                      <Progress value={percent(proposal.yes)} className="[&>div]:bg-emerald-500"/>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-card-foreground">
                          No ({percent(proposal.no)}%)
                        </span>
                      </div>
                      <Progress
                        value={percent(proposal.no)}
                        className="[&>div]:bg-red-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-card-foreground">
                          Abstain ({percent(proposal.abstain)}%)
                        </span>
                      </div>
                      <Progress
                        value={percent(proposal.abstain)}
                        className="[&>div]:bg-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {status === "active" && (
                  <div className="pt-4">
                    <h3 className="font-medium mb-4 text-card-foreground">
                      Cast Your Vote
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleVote("yes")}
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" /> Vote Yes
                      </Button>
                      <Button
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        onClick={() => handleVote("no")}
                      >
                        <ThumbsDown className="mr-2 h-4 w-4" /> Vote No
                      </Button>
                      <Button
                        variant="outline"
                        className="border-border text-foreground hover:bg-secondary"
                        onClick={() => handleVote("abstain")}
                      >
                        Abstain
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
