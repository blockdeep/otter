import { ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { useState } from "react";

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

export default function CreateProposalPage() {
  const { app } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const API_URL =
    import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:50000";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [threshold, setThreshold] = useState("50"); // Default to 50%
  const [votingPeriod, setVotingPeriod] = useState("3"); // Default to 3 days
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  // SUI WORK
  const suiClient = useSuiClient();
  const {
    mutate: signAndExecute,
    isSuccess,
    isPending,
  } = useSignAndExecuteTransaction();

  const handleCreateProposal = () => {
    const tx = new Transaction();

    tx.moveCall({
  		arguments: [],
  		target: `${app}::counter::create_proposal`,
  	});

  }

  const handleBack = () => {
    navigate(`/governance/${app}/proposals`);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6 mx-auto max-w-3xl">
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
                Create a new governance proposal for {appName.substring(0, 8)}{" "}
                ... {appName.substring(appName.length - 8)}
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
                    <Textarea
                      id="description"
                      placeholder="Describe the proposal in detail"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-32"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="threshold">Passing Threshold (%)</Label>
                      <Select value={threshold} onValueChange={setThreshold}>
                        <SelectTrigger id="threshold">
                          <SelectValue placeholder="Select threshold" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">
                            50% (Simple Majority)
                          </SelectItem>
                          <SelectItem value="66">
                            66% (Super Majority)
                          </SelectItem>
                          <SelectItem value="75">
                            75% (High Consensus)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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
                      disabled={submitting}
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
