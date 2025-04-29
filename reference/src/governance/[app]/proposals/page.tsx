import { ArrowLeft, Clock } from "lucide-react";
import { useParams, useNavigate, Outlet } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

// Mock data for proposals
const proposalsByApp = {
  bluemove: [
    {
      id: "1",
      title: "Implement Royalty Fee Structure for NFT Creators",
      endTime: "2023-12-15T00:00:00Z",
      status: "active",
    },
    {
      id: "2",
      title: "Add Support for NFT Collections with Multiple Creators",
      endTime: "2023-11-30T00:00:00Z",
      status: "passed",
    },
    {
      id: "3",
      title: "Reduce Platform Fee from 2.5% to 2%",
      endTime: "2023-11-20T00:00:00Z",
      status: "failed",
    },
  ],
  suiswap: [
    {
      id: "1",
      title: "Add New Liquidity Pool for SUI/USDC",
      endTime: "2023-12-20T00:00:00Z",
      status: "active",
    },
    {
      id: "2",
      title: "Implement Fee Reduction for High Volume Traders",
      endTime: "2023-12-05T00:00:00Z",
      status: "active",
    },
  ],
  cetus: [
    {
      id: "1",
      title: "Upgrade to Concentrated Liquidity V2",
      endTime: "2023-12-25T00:00:00Z",
      status: "active",
    },
    {
      id: "2",
      title: "Add Support for Multiple Fee Tiers",
      endTime: "2023-12-10T00:00:00Z",
      status: "active",
    },
    {
      id: "3",
      title: "Implement Protocol Fee for Treasury",
      endTime: "2023-11-28T00:00:00Z",
      status: "passed",
    },
  ],
  suins: [
    {
      id: "1",
      title: "Add Support for Subdomain Registration",
      endTime: "2023-12-18T00:00:00Z",
      status: "active",
    },
    {
      id: "2",
      title: "Implement Domain Renewal Fee Structure",
      endTime: "2023-11-25T00:00:00Z",
      status: "passed",
    },
  ],
  turbos: [
    {
      id: "1",
      title: "Add New Trading Pairs for Perpetuals",
      endTime: "2023-12-22T00:00:00Z",
      status: "active",
    },
    {
      id: "2",
      title: "Implement Dynamic Funding Rate",
      endTime: "2023-12-08T00:00:00Z",
      status: "active",
    },
  ],
  scallop: [
    {
      id: "1",
      title: "Add Support for New Collateral Types",
      endTime: "2023-12-30T00:00:00Z",
      status: "active",
    },
    {
      id: "2",
      title: "Adjust Interest Rate Model Parameters",
      endTime: "2023-12-15T00:00:00Z",
      status: "active",
    },
    {
      id: "3",
      title: "Implement Liquidation Fee Reduction",
      endTime: "2023-11-22T00:00:00Z",
      status: "passed",
    },
  ],
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

// Helper function to format remaining time
const formatTimeRemaining = (endTimeStr) => {
  const endTime = new Date(endTimeStr);
  const now = new Date();

  if (endTime <= now) {
    return "Ended";
  }

  const diffMs = endTime - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h remaining`;
  }
  return `${diffHours}h remaining`;
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

export default function ProposalsPage() {
  const { app } = useParams();
  const navigate = useNavigate();
  const proposals = proposalsByApp[app] || [];
  const appName = getAppName(app);

  const handleBack = () => {
    navigate("/governance");
  };

  const handleViewDetails = (proposalId) => {
    navigate(`/governance/${app}/proposals/${proposalId}`);
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
                Back to Governance
              </Button>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{appName} Proposals</h1>
              <p className="mt-2 text-gray-500 md:text-xl">View and vote on governance proposals for {appName}</p>
            </div>

            <div className="space-y-4">
              {proposals.map((proposal) => (
                <Card key={proposal.id} className="overflow-hidden border-blue-100">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <CardTitle className="text-xl">
                        <span
                          onClick={() => handleViewDetails(proposal.id)}
                          className="hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          {proposal.title}
                        </span>
                      </CardTitle>
                      <Badge className={`${getStatusBadgeColor(proposal.status)} capitalize`}>{proposal.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="mr-2 h-4 w-4" />
                      <span>{formatTimeRemaining(proposal.endTime)}</span>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleViewDetails(proposal.id)}>
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}