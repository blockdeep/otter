import { ArrowLeft, Eye, Edit3 } from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGovernanceInfo } from "@/lib/RPC";
import Walrus from "@/lib/Walrus";

interface GovernanceInfo {
  governanceModuleName: string;
  createProposalFunction: any;
  proposalKindEnum: any;
}

export default function CreateProposalPage() {
  const { app } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const API_URL =
    import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [votingPeriodSeconds, setVotingPeriodSeconds] = useState("259200"); // Default 3 days
  const [proposalKind, setProposalKind] = useState<string>("");
  const [governanceSystemId, setGovernanceSystemId] = useState("");
  const [govTokenId, setGovTokenId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Governance info state
  const [governanceInfo, setGovernanceInfo] = useState<GovernanceInfo | null>(
    null,
  );
  const [additionalArgs, setAdditionalArgs] = useState<Record<string, string>>(
    {},
  );

  // SUI WORK
  const suiClient = useSuiClient();
  const {
    mutate: signAndExecute,
    isSuccess,
    isPending,
  } = useSignAndExecuteTransaction();

  useEffect(() => {
    const fetchGovernanceInfo = async () => {
      if (!app) return;

      try {
        setLoading(true);
        const info = await getGovernanceInfo(app);

        if (info) {
          setGovernanceInfo(info);

          // Set default proposal kind if available
          if (info.proposalKindEnum && info.proposalKindEnum.variants) {
            const firstVariant = Object.keys(info.proposalKindEnum.variants)[0];
            if (firstVariant) {
              setProposalKind(firstVariant);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching governance info:", error);
        setError("Failed to load governance information");
      } finally {
        setLoading(false);
      }
    };

    fetchGovernanceInfo();
  }, [app]);

  const formatParameterType = (parameter: any): string => {
    if (typeof parameter === "string") {
      return parameter;
    }

    if (parameter.Struct) {
      return `${parameter.Struct.name}`;
    }

    if (parameter.Reference && parameter.Reference.Struct) {
      return `&${parameter.Reference.Struct.name}`;
    }

    if (parameter.MutableReference && parameter.MutableReference.Struct) {
      return `&mut ${parameter.MutableReference.Struct.name}`;
    }

    return JSON.stringify(parameter);
  };

  const getAdditionalParameters = () => {
    if (!governanceInfo?.createProposalFunction?.parameters) return [];

    // Skip the first 9 parameters and the last (TxContext)
    // 0: &mut GovernanceSystem (handled by governanceSystemId)
    // 1: &Coin<GOVTOKEN> (handled by govTokenId)
    // 2: title (String)
    // 3: description (String)
    // 4: voting_period_seconds (u64)
    // 5: &Clock (handled by SUI SDK)
    // 6: proposal_kind (u8)
    // 7: threshold (u64) - skip this
    // 8+: additional parameters
    const params = governanceInfo.createProposalFunction.parameters;
    return params.slice(7, params.length - 1);
  };

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
    if (remainingSeconds > 0 || parts.length === 0)
      parts.push(
        `${remainingSeconds} second${remainingSeconds !== 1 ? "s" : ""}`,
      );

    return parts.join(", ");
  };

  const handleCreateProposal = async (e: any) => {
    e.preventDefault();

    if (!governanceInfo) {
      setError("Governance information not loaded");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }

    if (!proposalKind) {
      setError("Proposal kind is required");
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

    const tx = new Transaction();

    const proposalKindInt = Object.keys(
      governanceInfo?.proposalKindEnum.variants,
    ).indexOf(proposalKind);

    const uploadResponse = await Walrus.uploadText(description, {
      epochs: 2,      // Store for 2 epochs
      deletable: true // Make the blob deletable
    });
    
    if (!uploadResponse.newlyCreated && !uploadResponse.alreadyCertified) {
      throw new Error('Upload failed: No blob information returned');
    }
    
    // Determine if this is a new blob or an already existing one
    const isNewBlob = !!uploadResponse.newlyCreated;
    
    // Get the blob ID
    const blobId = isNewBlob 
      ? uploadResponse.newlyCreated?.blobObject.blobId 
      : uploadResponse.alreadyCertified?.blobId;
    
    if (!blobId) {
      throw new Error('Failed to get blob ID from response');
    }
    
    console.log(`\nUpload ${isNewBlob ? 'completed (new blob)' : 'found existing blob'}`);
    console.log(`Blob ID: ${blobId}`);

    // Prepare arguments for the transaction based on the function signature
    const args: any[] = [
      tx.object(governanceSystemId), // &mut GovernanceSystem
      tx.object(govTokenId), // &Coin<GOVTOKEN>
      tx.pure.string(title), // title: String
      tx.pure.string(blobId), // description: String
      tx.pure.u64(parseInt(votingPeriodSeconds)), // voting_period_seconds: u64
      tx.object("0x6"), // &Clock (SUI system object)
      tx.pure.u8(proposalKindInt), // proposal_kind: u8 (enum variant)
    ];

    // Add additional parameters if they exist
    const additionalParams = getAdditionalParameters();
    additionalParams.forEach((param: string, index: number) => {
      const value = additionalArgs[`arg${index}`];
      if (value) {
        // Parse the value based on parameter type
        if (param.includes("u64")) {
          args.push(tx.pure.u64(parseInt(value)));
        } else if (param.includes("u32")) {
          args.push(tx.pure.u32(parseInt(value)));
        } else if (param.includes("u8")) {
          args.push(tx.pure.u8(parseInt(value)));
        } else if (param.includes("String")) {
          args.push(tx.pure.string(value));
        } else if (param.includes("bool")) {
          args.push(tx.pure.bool(value === "true"));
        } else {
          // For object references
          args.push(tx.object(value));
        }
      }
    });

    tx.moveCall({
      arguments: args,
      target: `${app}::${governanceInfo.governanceModuleName}::create_proposal`,
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

          console.log("Efffects of transasction", effects);

          toast({
            title: "Proposal Created",
            description:
              "Your governance proposal has been successfully created.",
          });

          // Reset form
          setTitle("");
          setDescription("");
          setVotingPeriodSeconds("259200");
          setProposalKind("");
          setGovernanceSystemId("");
          setGovTokenId("");
          setAdditionalArgs({});

          // Navigate to proposals list
          navigate(`/governance/${app}/proposals`);
        },
        onError: (error) => {
          setError(error.message || "Failed to create proposal");
          console.error("Error creating proposal:", error);
        },
      },
    );
  };

  const handleBack = () => {
    navigate(`/governance/${app}/proposals`);
  };

  const appName = app || "Project";

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">
              Loading governance information...
            </p>
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
          <div className="container px-4 md:px-6 mx-auto max-w-4xl">
            <div className="mb-8">
              <Button
                variant="ghost"
                className="mb-4 text-foreground hover:text-primary"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Proposals
              </Button>
              <h1 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
                Create Proposal
              </h1>
              <p className="mt-2 text-muted-foreground md:text-xl">
                Create a new governance proposal for {appName.substring(0, 8)}
                ...{appName.substring(appName.length - 8)}
              </p>
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
                  Proposal Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProposal} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="governanceSystemId">
                      Governance System ID
                    </Label>
                    <Input
                      id="governanceSystemId"
                      placeholder="Enter the governance system object ID (0x...)"
                      value={governanceSystemId}
                      onChange={(e) => setGovernanceSystemId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="govTokenId">GOVTOKEN Coin ID</Label>
                    <Input
                      id="govTokenId"
                      placeholder="Enter the governance token coin ID (0x...)"
                      value={govTokenId}
                      onChange={(e) => setGovTokenId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter proposal title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <p className="text-sm text-muted-foreground">
                      Write your proposal description using Markdown syntax.
                    </p>
                    <Tabs defaultValue="write" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                          value="write"
                          className="flex items-center gap-2"
                        >
                          <Edit3 className="h-4 w-4" />
                          Write
                        </TabsTrigger>
                        <TabsTrigger
                          value="preview"
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="write" className="mt-2">
                        <Textarea
                          id="description"
                          placeholder="Describe the proposal in detail..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="min-h-64 font-mono"
                          required
                        />
                      </TabsContent>
                      <TabsContent value="preview" className="mt-2">
                        <div className="min-h-64 p-4 border rounded-md bg-background prose prose-sm max-w-none dark:prose-invert">
                          {description ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {description}
                            </ReactMarkdown>
                          ) : (
                            <div className="text-muted-foreground italic">
                              No description provided.
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="votingPeriod">
                      Voting Period (Seconds)
                    </Label>
                    <Input
                      id="votingPeriod"
                      type="number"
                      placeholder="Enter voting period in seconds"
                      value={votingPeriodSeconds}
                      onChange={(e) => setVotingPeriodSeconds(e.target.value)}
                      required
                    />
                    {votingPeriodSeconds &&
                      parseInt(votingPeriodSeconds) > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Duration: {formatTime(parseInt(votingPeriodSeconds))}
                        </p>
                      )}
                  </div>

                  {/* Proposal Kind Selection */}
                  {governanceInfo?.proposalKindEnum && (
                    <div className="space-y-2 text-black">
                      <Label htmlFor="proposalKind" className="text-black">
                        Proposal Kind
                      </Label>
                      <Select
                        value={proposalKind}
                        onValueChange={setProposalKind}
                      >
                        <SelectTrigger id="proposalKind">
                          <SelectValue placeholder="Select proposal kind" />
                        </SelectTrigger>
                        <SelectContent className="text-black bg-white">
                          {Object.keys(
                            governanceInfo.proposalKindEnum.variants,
                          ).map((variant) => (
                            <SelectItem key={variant} value={variant}>
                              {variant}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Additional Parameters */}
                  {getAdditionalParameters().length > 0 && (
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">
                        Additional Parameters
                      </Label>
                      {getAdditionalParameters().map(
                        (param: string, index: number) => (
                          <div key={index} className="space-y-2">
                            <Label htmlFor={`arg${index}`}>Arg{index}</Label>
                            <Input
                              id={`arg${index}`}
                              placeholder={formatParameterType(param)}
                              value={additionalArgs[`arg${index}`] || ""}
                              onChange={(e) =>
                                setAdditionalArgs((prev) => ({
                                  ...prev,
                                  [`arg${index}`]: e.target.value,
                                }))
                              }
                            />
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="mr-4"
                      onClick={handleBack}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={submitting || loading}
                    >
                      {submitting ? "Creating..." : "Create Proposal"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
