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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { getGovernanceInfo } from "@/lib/RPC";

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

interface GovernanceInfo {
  governanceModuleName: string;
  createProposalFunction: any;
  proposalKindEnum: any;
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
  const { toast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [governanceSystemId, setGovernanceSystemId] = useState("");
  const [govTokenId, setGovTokenId] = useState("");
  const [showVoteInputs, setShowVoteInputs] = useState(false);
  const [selectedVoteType, setSelectedVoteType] = useState<string>("");
  const [governanceInfo, setGovernanceInfo] = useState<GovernanceInfo | null>(
    null,
  );

  const API_URL =
    import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";

  // SUI hooks
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  // Vote type constants matching the Move contract
  const VOTE_YES = 0;
  const VOTE_NO = 1;
  const VOTE_ABSTAIN = 2;

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

    const fetchGovernanceInfo = async () => {
      if (!app) return;
      try {
        const info = await getGovernanceInfo(app);
        if (info) {
          setGovernanceInfo(info);
        }
      } catch (error) {
        console.error("Error fetching governance info:", error);
      }
    };

    if (proposalId) {
      fetchProposal();
      fetchGovernanceInfo();
    }
  }, [proposalId, app]);

  const handleBack = () => {
    navigate(`/governance/${app}/proposals`);
  };

  const handleVoteClick = (type: string) => {
    setSelectedVoteType(type);
    setShowVoteInputs(true);
  };

  const handleSubmitVote = () => {
    if (!governanceInfo) {
      setError("Governance information not loaded");
      return;
    }

    if (!governanceSystemId) {
      setError("Governance System ID is required");
      return;
    }

    if (!govTokenId) {
      setError("GOVTOKEN Coin ID is required");
      return;
    }

    if (!proposalId) {
      setError("Proposal ID is required");
      return;
    }

    setVoting(true);

    const tx = new Transaction();

    // Map vote type to contract constants
    let voteTypeValue: number;
    switch (selectedVoteType) {
      case "yes":
        voteTypeValue = VOTE_YES;
        break;
      case "no":
        voteTypeValue = VOTE_NO;
        break;
      case "abstain":
        voteTypeValue = VOTE_ABSTAIN;
        break;
      default:
        setError("Invalid vote type");
        setVoting(false);
        return;
    }

    // Build the transaction arguments
    const args = [
      tx.object(governanceSystemId), // &mut GovernanceSystem
      tx.object(proposalId), // proposal_id: ID
      tx.object(govTokenId), // &Coin<GOVTOKEN>
      tx.pure.u8(voteTypeValue), // vote_type: u8
      tx.object("0x6"), // &Clock (SUI system object)
    ];

    tx.moveCall({
      arguments: args,
      target: `${app}::${governanceInfo.governanceModuleName}::vote`,
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async ({ digest }) => {
          const { effects } = await suiClient.waitForTransaction({
            digest: digest,
            options: {
              showEffects: true,
            },
          });

          console.log("Vote transaction effects:", effects);

          toast({
            title: "Vote Cast Successfully",
            description: `Your ${selectedVoteType} vote has been recorded.`,
          });

          // Reset vote inputs
          setShowVoteInputs(false);
          setSelectedVoteType("");
          setGovernanceSystemId("");
          setGovTokenId("");

          // Refresh proposal data
          const res = await fetch(
            `${API_URL}/proposals?objectId=${proposalId}`,
          );
          if (res.ok) {
            const data = await res.json();
            const fetched = data?.data?.[0];
            if (fetched) {
              setProposal(fetched);
            }
          }
        },
        onError: (error) => {
          console.error("Error casting vote:", error);
          setError(error.message || "Failed to cast vote");
          toast({
            title: "Vote Failed",
            description: error.message || "Failed to cast vote",
            variant: "destructive",
          });
        },
        onSettled: () => {
          setVoting(false);
        },
      },
    );
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
                <Badge className={`${getStatusBadgeColor(status)} capitalize`}>
                  {status}
                </Badge>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                        <span className="text-sm text-muted-foreground">
                          {proposal.yes.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={percent(proposal.yes)}
                        className="[&>div]:bg-emerald-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-card-foreground">
                          No ({percent(proposal.no)}%)
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {proposal.no.toLocaleString()}
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
                        <span className="text-sm text-muted-foreground">
                          {proposal.abstain.toLocaleString()}
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

                    {/* Vote selection buttons */}
                    {!showVoteInputs && (
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleVoteClick("yes")}
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" /> Vote Yes
                        </Button>
                        <Button
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          onClick={() => handleVoteClick("no")}
                        >
                          <ThumbsDown className="mr-2 h-4 w-4" /> Vote No
                        </Button>
                        <Button
                          variant="outline"
                          className="border-border text-foreground hover:bg-secondary"
                          onClick={() => handleVoteClick("abstain")}
                        >
                          Abstain
                        </Button>
                      </div>
                    )}

                    {/* Vote inputs form */}
                    {showVoteInputs && (
                      <div className="space-y-4 border rounded-lg p-4 bg-background">
                        <h4 className="font-medium text-card-foreground">
                          Voting as:{" "}
                          <span className="capitalize text-primary">
                            {selectedVoteType}
                          </span>
                        </h4>

                        <div className="space-y-2">
                          <Label htmlFor="voteGovernanceSystemId">
                            Governance System ID
                          </Label>
                          <Input
                            id="voteGovernanceSystemId"
                            placeholder="Enter the governance system object ID (0x...)"
                            value={governanceSystemId}
                            onChange={(e) =>
                              setGovernanceSystemId(e.target.value)
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="voteGovTokenId">
                            Your GOVTOKEN Coin ID
                          </Label>
                          <Input
                            id="voteGovTokenId"
                            placeholder="Enter your governance token coin ID (0x...)"
                            value={govTokenId}
                            onChange={(e) => setGovTokenId(e.target.value)}
                            required
                          />
                        </div>

                        <div className="flex gap-4">
                          <Button
                            onClick={handleSubmitVote}
                            disabled={
                              voting || !governanceSystemId || !govTokenId
                            }
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            {voting
                              ? "Submitting Vote..."
                              : `Submit ${selectedVoteType.charAt(0).toUpperCase() + selectedVoteType.slice(1)} Vote`}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowVoteInputs(false);
                              setSelectedVoteType("");
                              setGovernanceSystemId("");
                              setGovTokenId("");
                              setError(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
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
