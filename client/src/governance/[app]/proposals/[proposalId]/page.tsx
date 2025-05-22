import {
  ArrowLeft,
  Calendar,
  Clock,
  ThumbsDown,
  ThumbsUp,
  CheckCircle,
  Play,
  Copy,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Walrus, { blobToString } from "@/lib/Walrus";
import { API_BASE_URL } from "@/config";

interface Proposal {
  id: number;
  objectId: string;
  title: string;
  creator: string;
  executed: boolean;
  governanceAddress: string;
  status: number | null;
  threshold: string;
  votingEndsAt: string;
  yes: number;
  no: number;
  abstain: number;
  description?: string; // Optional Walrus blob ID
}

interface GovernanceInfo {
  governanceModuleName: string;
  createProposalFunction: any;
  proposalKindEnum: any;
}

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

// Status constants matching the Move contract
const PROPOSAL_STATUS_ACTIVE = 0;
const PROPOSAL_STATUS_PASSED = 1;
const PROPOSAL_STATUS_REJECTED = 2;
const PROPOSAL_STATUS_EXECUTED = 3;
const PROPOSAL_STATUS_CANCELLED = 4;

const getStatusBadgeColor = (status: number) => {
  switch (status) {
    case PROPOSAL_STATUS_ACTIVE:
      return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400";
    case PROPOSAL_STATUS_PASSED:
      return "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20";
    case PROPOSAL_STATUS_REJECTED:
      return "bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20";
    case PROPOSAL_STATUS_EXECUTED:
      return "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
    case PROPOSAL_STATUS_CANCELLED:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400";
    default:
      return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  }
};

const getStatusLabel = (status: number) => {
  switch (status) {
    case PROPOSAL_STATUS_ACTIVE:
      return "Active";
    case PROPOSAL_STATUS_PASSED:
      return "Passed";
    case PROPOSAL_STATUS_REJECTED:
      return "Rejected";
    case PROPOSAL_STATUS_EXECUTED:
      return "Executed";
    case PROPOSAL_STATUS_CANCELLED:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

// Utility function to truncate text with ellipsis
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// TODO: Code need to be refactored. Move code to seperate components.
export default function ProposalDetailsPage() {
  const { app, proposalId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [governanceSystemId, setGovernanceSystemId] = useState("");
  const [govTokenId, setGovTokenId] = useState("");
  const [counterObjectId, setCounterObjectId] = useState("");
  const [showVoteInputs, setShowVoteInputs] = useState(false);
  const [showFinalizeInputs, setShowFinalizeInputs] = useState(false);
  const [showExecuteInputs, setShowExecuteInputs] = useState(false);
  const [selectedVoteType, setSelectedVoteType] = useState<string>("");
  const [governanceInfo, setGovernanceInfo] = useState<GovernanceInfo | null>(
    null,
  );

  // Walrus description states
  const [descriptionContent, setDescriptionContent] = useState<string>("");
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  // SUI hooks
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  // Vote type constants matching the Move contract
  const VOTE_YES = 0;
  const VOTE_NO = 1;
  const VOTE_ABSTAIN = 2;

  // Function to fetch description from Walrus
  const fetchDescription = async (blobId: string) => {
    setDescriptionLoading(true);
    setDescriptionError(null);

    try {
      const downloadedData = await Walrus.downloadBlob(blobId);
      const downloadedText = await blobToString(downloadedData);
      setDescriptionContent(downloadedText);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load description";
      setDescriptionError(errorMessage);
      console.error("Error fetching description from Walrus:", err);
    } finally {
      setDescriptionLoading(false);
    }
  };

  // Function to copy blob ID to clipboard
  const copyBlobId = async (blobId: string) => {
    try {
      await navigator.clipboard.writeText(blobId);
      toast({
        title: "Copied!",
        description: "Blob ID copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy blob ID to clipboard.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/proposals?objectId=${proposalId}`);
        if (!res.ok)
          throw new Error(`Failed to load proposal: ${res.statusText}`);
        const data = await res.json();
        const fetched = data?.data?.[0];
        if (!fetched) throw new Error("Proposal not found.");
        setProposal(fetched);

        // Fetch description if available
        if (fetched.description) {
          fetchDescription(fetched.description);
        }
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

  // Helper function to determine proposal state
  const getProposalState = () => {
    if (!proposal) return null;
    const now = Date.now();
    const votingEndsAt = Number(proposal.votingEndsAt);
    const hasTimeEnded = now > votingEndsAt;
    const status = proposal.status;

    if (status === PROPOSAL_STATUS_ACTIVE && !hasTimeEnded) {
      return { state: "voting", label: "Active - Voting" };
    } else if (status === PROPOSAL_STATUS_ACTIVE && hasTimeEnded) {
      return { state: "finalize", label: "Ready to Finalize" };
    } else if (status === PROPOSAL_STATUS_PASSED) {
      return { state: "execute", label: "Passed - Ready to Execute" };
    } else if (status === PROPOSAL_STATUS_EXECUTED) {
      return { state: "executed", label: "Executed" };
    } else if (status === PROPOSAL_STATUS_REJECTED) {
      return { state: "rejected", label: "Rejected" };
    } else if (status === PROPOSAL_STATUS_CANCELLED) {
      return { state: "cancelled", label: "Cancelled" };
    }
    return { state: "unknown", label: getStatusLabel(status || 0) };
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
            `${API_BASE_URL}/proposals?objectId=${proposalId}`,
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

  const handleFinalizeProposal = () => {
    if (!governanceInfo) {
      setError("Governance information not loaded");
      return;
    }
    if (!governanceSystemId) {
      setError("Governance System ID is required");
      return;
    }
    if (!proposalId) {
      setError("Proposal ID is required");
      return;
    }

    setFinalizing(true);
    const tx = new Transaction();

    const args = [
      tx.object(governanceSystemId), // &mut GovernanceSystem
      tx.object(proposalId), // proposal_id: ID
      tx.object("0x6"), // &Clock (SUI system object)
    ];

    tx.moveCall({
      arguments: args,
      target: `${app}::${governanceInfo.governanceModuleName}::finalize_proposal`,
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
          console.log("Finalize transaction effects:", effects);
          toast({
            title: "Proposal Finalized",
            description: "The proposal has been successfully finalized.",
          });
          // Reset finalize inputs
          setShowFinalizeInputs(false);
          setGovernanceSystemId("");
          // Refresh proposal data
          const res = await fetch(
            `${API_BASE_URL}/proposals?objectId=${proposalId}`,
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
          console.error("Error finalizing proposal:", error);
          setError(error.message || "Failed to finalize proposal");
          toast({
            title: "Finalization Failed",
            description: error.message || "Failed to finalize proposal",
            variant: "destructive",
          });
        },
        onSettled: () => {
          setFinalizing(false);
        },
      },
    );
  };

  const handleExecuteProposal = () => {
    if (!governanceInfo) {
      setError("Governance information not loaded");
      return;
    }
    if (!governanceSystemId) {
      setError("Governance System ID is required");
      return;
    }
    if (!counterObjectId) {
      setError("Counter Object ID is required for execution");
      return;
    }
    if (!proposalId) {
      setError("Proposal ID is required");
      return;
    }

    setExecuting(true);
    const tx = new Transaction();

    const args = [
      tx.object(governanceSystemId), // &mut GovernanceSystem
      tx.object(proposalId), // proposal_id: ID
      tx.object(counterObjectId), // &mut Counter (specific to the contract being governed)
    ];

    tx.moveCall({
      arguments: args,
      target: `${app}::${governanceInfo.governanceModuleName}::execute_proposal`,
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
          console.log("Execute transaction effects:", effects);
          toast({
            title: "Proposal Executed",
            description: "The proposal has been successfully executed!",
          });
          // Reset execute inputs
          setShowExecuteInputs(false);
          setGovernanceSystemId("");
          setCounterObjectId("");
          // Refresh proposal data
          const res = await fetch(
            `${API_BASE_URL}/proposals?objectId=${proposalId}`,
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
          console.error("Error executing proposal:", error);
          setError(error.message || "Failed to execute proposal");
          toast({
            title: "Execution Failed",
            description: error.message || "Failed to execute proposal",
            variant: "destructive",
          });
        },
        onSettled: () => {
          setExecuting(false);
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
  const formattedEndTime = formatDate(Number(proposal.votingEndsAt));
  const proposalState = getProposalState();

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
                <Badge
                  className={`${getStatusBadgeColor(proposal.status || 0)} capitalize`}
                >
                  {proposalState?.label}
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
                <div className="flex flex-col sm:flex-row gap-12">
                  <div className="flex items-start flex-col">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-primary" />
                      <p className="text-sm text-muted-foreground">End Time</p>
                    </div>
                    <p className="font-medium text-card-foreground">
                      {formattedEndTime}
                    </p>
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-primary" />
                      <p className="text-sm text-muted-foreground">Threshold</p>
                    </div>
                    <p className="font-medium text-card-foreground">
                      {Number(proposal.threshold).toLocaleString()}
                    </p>
                  </div>
                  {proposal.description && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center">
                        <ExternalLink className="mr-2 h-5 w-5 text-primary" />
                        <p className="text-sm text-muted-foreground">
                          Description Blob ID
                        </p>
                      </div>
                      <div className="flex items-center">
                        <code className="text-xs font-mono text-card-foreground bg-muted px-2 py-1 rounded">
                          {truncateText(proposal.description, 20)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyBlobId(proposal.description!)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
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
                {/* Action buttons based on proposal state */}
                {proposalState?.state === "voting" && (
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
                {/* Finalize Proposal */}
                {proposalState?.state === "finalize" && (
                  <div className="pt-4">
                    <h3 className="font-medium mb-4 text-card-foreground">
                      Finalize Proposal
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Voting period has ended. Finalize this proposal to
                      determine if it passed or failed.
                    </p>
                    {!showFinalizeInputs && (
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setShowFinalizeInputs(true)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Finalize
                        Proposal
                      </Button>
                    )}
                    {showFinalizeInputs && (
                      <div className="space-y-4 border rounded-lg p-4 bg-background">
                        <div className="space-y-2">
                          <Label htmlFor="finalizeGovernanceSystemId">
                            Governance System ID
                          </Label>
                          <Input
                            id="finalizeGovernanceSystemId"
                            placeholder="Enter the governance system object ID (0x...)"
                            value={governanceSystemId}
                            onChange={(e) =>
                              setGovernanceSystemId(e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="flex gap-4">
                          <Button
                            onClick={handleFinalizeProposal}
                            disabled={finalizing || !governanceSystemId}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {finalizing ? "Finalizing..." : "Confirm Finalize"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowFinalizeInputs(false);
                              setGovernanceSystemId("");
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
                {/* Execute Proposal */}
                {proposalState?.state === "execute" && (
                  <div className="pt-4">
                    <h3 className="font-medium mb-4 text-card-foreground">
                      Execute Proposal
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This proposal has passed and is ready to be executed. This
                      will perform the proposed action.
                    </p>
                    {!showExecuteInputs && (
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => setShowExecuteInputs(true)}
                      >
                        <Play className="mr-2 h-4 w-4" /> Execute Proposal
                      </Button>
                    )}
                    {showExecuteInputs && (
                      <div className="space-y-4 border rounded-lg p-4 bg-background">
                        <div className="space-y-2">
                          <Label htmlFor="executeGovernanceSystemId">
                            Governance System ID
                          </Label>
                          <Input
                            id="executeGovernanceSystemId"
                            placeholder="Enter the governance system object ID (0x...)"
                            value={governanceSystemId}
                            onChange={(e) =>
                              setGovernanceSystemId(e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="counterObjectId">
                            Counter Object ID
                          </Label>
                          <Input
                            id="counterObjectId"
                            placeholder="Enter the counter object ID that this proposal will modify (0x...)"
                            value={counterObjectId}
                            onChange={(e) => setCounterObjectId(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex gap-4">
                          <Button
                            onClick={handleExecuteProposal}
                            disabled={
                              executing ||
                              !governanceSystemId ||
                              !counterObjectId
                            }
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {executing ? "Executing..." : "Confirm Execute"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowExecuteInputs(false);
                              setGovernanceSystemId("");
                              setCounterObjectId("");
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
                {/* Information for completed states */}
                {proposalState?.state === "executed" && (
                  <div className="pt-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Proposal Executed</AlertTitle>
                      <AlertDescription>
                        This proposal has been successfully executed and the
                        proposed changes have been implemented.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                {proposalState?.state === "rejected" && (
                  <div className="pt-4">
                    <Alert variant="destructive">
                      <AlertTitle>Proposal Rejected</AlertTitle>
                      <AlertDescription>
                        This proposal was rejected either due to insufficient
                        votes or failing to meet the required threshold.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proposal Description Section */}
            {proposal.description && (
              <Card className="border-border bg-card mt-6">
                <CardHeader>
                  <CardTitle className="text-xl text-card-foreground">
                    Proposal Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {descriptionLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">
                        Loading description...
                      </div>
                    </div>
                  )}

                  {descriptionError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error Loading Description</AlertTitle>
                      <AlertDescription>
                        {descriptionError}
                        <Button
                          variant="link"
                          className="ml-2 h-auto p-0"
                          onClick={() =>
                            fetchDescription(proposal.description!)
                          }
                        >
                          Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {!descriptionLoading &&
                    !descriptionError &&
                    descriptionContent && (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {descriptionContent}
                        </ReactMarkdown>
                      </div>
                    )}

                  {!descriptionLoading &&
                    !descriptionError &&
                    !descriptionContent && (
                      <div className="text-muted-foreground text-center py-8">
                        No description content available
                      </div>
                    )}
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
