import { ArrowLeft, Calendar, Clock, ThumbsDown, ThumbsUp } from "lucide-react";
import { useParams, useNavigate } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Mock data for proposal details
const proposalDetails = {
  bluemove: {
    "1": {
      title: "Implement Royalty Fee Structure for NFT Creators",
      description:
        "This proposal aims to implement a standardized royalty fee structure for NFT creators on the BlueMove marketplace. Creators will be able to set royalty fees between 1% and 10% that will be automatically distributed on secondary sales.",
      startTime: "2023-11-15T00:00:00Z",
      endTime: "2023-12-15T00:00:00Z",
      status: "active",
      votes: {
        yes: 65,
        no: 20,
        abstain: 15,
      },
    },
    "2": {
      title: "Add Support for NFT Collections with Multiple Creators",
      description:
        "This proposal seeks to add support for NFT collections with multiple creators, allowing for collaborative projects and fair distribution of royalties among all contributors.",
      startTime: "2023-11-01T00:00:00Z",
      endTime: "2023-11-30T00:00:00Z",
      status: "passed",
      votes: {
        yes: 80,
        no: 15,
        abstain: 5,
      },
    },
    "3": {
      title: "Reduce Platform Fee from 2.5% to 2%",
      description:
        "This proposal suggests reducing the platform fee from 2.5% to 2% to make BlueMove more competitive and attract more users to the marketplace.",
      startTime: "2023-11-01T00:00:00Z",
      endTime: "2023-11-20T00:00:00Z",
      status: "failed",
      votes: {
        yes: 40,
        no: 55,
        abstain: 5,
      },
    },
  },
  suiswap: {
    "1": {
      title: "Add New Liquidity Pool for SUI/USDC",
      description:
        "This proposal aims to add a new liquidity pool for SUI/USDC to facilitate trading between these two assets on SuiSwap.",
      startTime: "2023-11-20T00:00:00Z",
      endTime: "2023-12-20T00:00:00Z",
      status: "active",
      votes: {
        yes: 70,
        no: 20,
        abstain: 10,
      },
    },
    "2": {
      title: "Implement Fee Reduction for High Volume Traders",
      description:
        "This proposal suggests implementing a fee reduction mechanism for high volume traders to incentivize more trading activity on SuiSwap.",
      startTime: "2023-11-05T00:00:00Z",
      endTime: "2023-12-05T00:00:00Z",
      status: "active",
      votes: {
        yes: 60,
        no: 30,
        abstain: 10,
      },
    },
  },
};

// Helper function to get app name from ID
const getAppName = (appId) => {
  const appNames = {
    bluemove: "BlueMove",
    suiswap: "SuiSwap",
    cetus: "Cetus",
    suins: "SuiNS",
    turbos: "Turbos",
    scallop: "Scallop",
  };
  return appNames[appId] || appId;
};

// Helper function to format date
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Helper function to get status badge color
const getStatusBadgeColor = (status) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "passed":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "failed":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

export default function ProposalDetailsPage() {
  const { app, proposalId } = useParams();
  const navigate = useNavigate();
  const proposal = proposalDetails[app]?.[proposalId];
  const appName = getAppName(app);

  const handleBack = () => {
    navigate(`/governance/${app}/proposals`);
  };

  // If proposal doesn't exist in our mock data, show a placeholder
  if (!proposal) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-blue-50">
        <Navbar />
        <main className="flex-1 container px-4 md:px-6 py-12">
          <Button variant="ghost" className="mb-4" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Proposals
          </Button>
          <Card>
            <CardContent className="p-6">
              <p>Proposal not found.</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const handleVote = (voteType) => {
    // Handle voting logic here
    console.log(`Voted ${voteType} on proposal ${proposalId}`);
    // You could update state or send a request to your backend here
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-blue-50">
      <Navbar />
      <main className="flex-1">
        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="mb-8">
              <Button variant="ghost" className="mb-4" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Proposals
              </Button>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl">{proposal.title}</h1>
                <Badge className={`${getStatusBadgeColor(proposal.status)} capitalize`}>{proposal.status}</Badge>
              </div>
            </div>

            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-xl">Proposal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-gray-600">{proposal.description}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Start Time</p>
                      <p className="font-medium">{formatDate(proposal.startTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">End Time</p>
                      <p className="font-medium">{formatDate(proposal.endTime)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-4">Voting Results</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Yes ({proposal.votes.yes}%)</span>
                      </div>
                      <Progress
                        value={proposal.votes.yes}
                        className="h-2 bg-blue-100"
                        indicatorClassName="bg-green-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">No ({proposal.votes.no}%)</span>
                      </div>
                      <Progress value={proposal.votes.no} className="h-2 bg-blue-100" indicatorClassName="bg-red-500" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Abstain ({proposal.votes.abstain}%)</span>
                      </div>
                      <Progress
                        value={proposal.votes.abstain}
                        className="h-2 bg-blue-100"
                        indicatorClassName="bg-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {proposal.status === "active" && (
                  <div className="pt-4">
                    <h3 className="font-medium mb-4">Cast Your Vote</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleVote('yes')}>
                        <ThumbsUp className="mr-2 h-4 w-4" /> Vote Yes
                      </Button>
                      <Button className="bg-red-600 hover:bg-red-700" onClick={() => handleVote('no')}>
                        <ThumbsDown className="mr-2 h-4 w-4" /> Vote No
                      </Button>
                      <Button variant="outline" onClick={() => handleVote('abstain')}>Abstain</Button>
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