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
  const [threshold, setThreshold] = useState("50");
  const [votingPeriod, setVotingPeriod] = useState("3");
  const [proposalKind, setProposalKind] = useState<string>("");
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
          console.log("Governance Module:", info.governanceModuleName);
          console.log("Create Proposal Function:", info.createProposalFunction);
          console.log("Proposal Kind Enum:", info.proposalKindEnum);

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

    // Skip the first 7 parameters (the standard ones)
    return governanceInfo.createProposalFunction.parameters.slice(7);
  };

  const renderProposalKindFields = () => {
    if (!governanceInfo?.proposalKindEnum?.variants || !proposalKind)
      return null;

    const selectedVariant =
      governanceInfo.proposalKindEnum.variants[proposalKind];

    if (!selectedVariant || selectedVariant.length === 0) return null;

    return (
      <div className="space-y-4 border-t pt-4 mt-4">
        <Label className="text-sm font-medium">Proposal Kind Parameters</Label>
        {selectedVariant.map((field: any, index: number) => (
          <div key={index} className="space-y-2">
            <Label htmlFor={`kind-${field.name}`}>{field.name}</Label>
            <Input
              id={`kind-${field.name}`}
              placeholder={`Enter ${field.type} value`}
              value={additionalArgs[`kind-${field.name}`] || ""}
              onChange={(e) =>
                setAdditionalArgs((prev) => ({
                  ...prev,
                  [`kind-${field.name}`]: e.target.value,
                }))
              }
            />
          </div>
        ))}
      </div>
    );
  };

  const handleCreateProposal = () => {
    if (!governanceInfo) {
      setError("Governance information not loaded");
      return;
    }

    const tx = new Transaction();

    // Prepare arguments for the transaction
    const args: any[] = [
      // Add your arguments here based on the function signature
    ];

    tx.moveCall({
      arguments: args,
      target: `${app}::${governanceInfo.governanceModuleName}::create_proposal`,
    });

    signAndExecute({ transaction: tx });
  };

  const handleBack = () => {
    navigate(`/governance/${app}/proposals`);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }

    if (!proposalKind) {
      setError("Proposal kind is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      // Calculate voting end time (current time + voting period in days)
      const votingEndsAt =
        Date.now() + parseInt(votingPeriod) * 24 * 60 * 60 * 1000;

      const response = await fetch(`${API_URL}/proposals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          governanceAddress: app,
          title,
          description,
          threshold,
          votingEndsAt: votingEndsAt.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create proposal: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Proposal Created",
        description: "Your governance proposal has been successfully created.",
      });

      // Redirect to the proposals list
      navigate(`/governance/${app}/proposals`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setSubmitting(false);
    }
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
                <form onSubmit={handleSubmit} className="space-y-6">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="votingPeriod">Voting Period (Days)</Label>
                      <Select
                        value={votingPeriod}
                        onValueChange={setVotingPeriod}
                      >
                        <SelectTrigger id="votingPeriod">
                          <SelectValue placeholder="Select voting period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Day</SelectItem>
                          <SelectItem value="3">3 Days</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="14">14 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Proposal Kind Selection */}
                  {governanceInfo?.proposalKindEnum && (
                    <div className="space-y-2">
                      <Label htmlFor="proposalKind">Proposal Kind</Label>
                      <Select
                        value={proposalKind}
                        onValueChange={setProposalKind}
                      >
                        <SelectTrigger id="proposalKind">
                          <SelectValue placeholder="Select proposal kind" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(
                            governanceInfo.proposalKindEnum.variants,
                          ).map((variant) => (
                            <SelectItem key={variant} value={variant}>
                              {variant}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {renderProposalKindFields()}
                    </div>
                  )}

                  {/* Additional Parameters */}
                  {getAdditionalParameters().length > 0 && (
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">
                        Additional Parameters
                      </Label>
                      {getAdditionalParameters().map((param, index) => (
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
                      ))}
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
