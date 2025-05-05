import { ArrowRight, Upload, FileCode, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

export default function LaunchGovernancePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState(null);
  const [contractCode, setContractCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [generatedGovernance, setGeneratedGovernance] = useState("");
  const [isDeployReady, setIsDeployReady] = useState(false);

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      // Here you would normally read the file content
      const reader = new FileReader();
      reader.onload = (e) => {
        setContractCode(e.target.result);
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleProcessContract = () => {
    if (!contractCode) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus("Analyzing contract structure...");
    
    // Simulate processing steps with progress updates
    const timer1 = setTimeout(() => {
      setProcessingProgress(25);
      setProcessingStatus("Identifying contract parameters...");
    }, 1500);

    const timer2 = setTimeout(() => {
      setProcessingProgress(50);
      setProcessingStatus("Generating governance interfaces...");
    }, 3000);

    const timer3 = setTimeout(() => {
      setProcessingProgress(75);
      setProcessingStatus("Compiling governance module...");
    }, 4500);

    const timer4 = setTimeout(() => {
      setProcessingProgress(100);
      setProcessingStatus("Governance contract generated successfully!");
      setIsProcessing(false);
      setIsDeployReady(true);
      setActiveTab("review");
      
      // Mock generated governance contract
      setGeneratedGovernance(`module sui_governance::app_governance {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    
    // Your custom app contract integration
    use your_package::your_module;
    
    // Governance parameters
    const MIN_VOTING_DELAY: u64 = 86400; // 1 day in seconds
    const MIN_VOTING_PERIOD: u64 = 259200; // 3 days in seconds
    const MIN_QUORUM_VOTES: u64 = 500000000; // 500 SUI

    // ... [governance contract implementation]
    // ... [proposal creation and voting logic]
    // ... [execution mechanism for your specific app contract]
}`);
      
    }, 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  const handleDeploy = () => {
    navigate("/governance/deploy-success");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-start space-y-4 mb-8">
              <h1 className="text-3xl font-bold tracking-tighter text-foreground sm:text-4xl md:text-5xl">
                Launch Your Governance
              </h1>
              <p className="text-muted-foreground md:text-xl max-w-[700px]">
                Connect your dApp to our unified governance platform in three simple steps
              </p>
            </div>

            <Card className="border-border bg-card mb-8">
              <CardHeader>
                <CardTitle className="text-card-foreground">Getting Started</CardTitle>
                <CardDescription>
                  Our platform helps you implement governance for your SUI dApp without changing your existing contracts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <FileCode className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">1. Upload Your Contract</h3>
                      <p className="text-sm text-muted-foreground">Provide your dApp's smart contract</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">2. Review Integration</h3>
                      <p className="text-sm text-muted-foreground">Check the generated governance module</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <Check className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">3. Deploy</h3>
                      <p className="text-sm text-muted-foreground">Launch your governance module</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">Upload Contract</TabsTrigger>
                <TabsTrigger value="review" disabled={!isDeployReady}>Review Integration</TabsTrigger>
                <TabsTrigger value="deploy" disabled={!isDeployReady}>Deploy Governance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Your Contract</CardTitle>
                    <CardDescription>
                      Provide your dApp's smart contract code to generate a compatible governance module
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-6">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          id="contract-upload"
                          className="hidden"
                          accept=".move"
                          onChange={handleFileUpload}
                        />
                        <label htmlFor="contract-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="h-10 w-10 text-muted-foreground" />
                          <h3 className="font-medium text-lg">Upload Contract File</h3>
                          <p className="text-sm text-muted-foreground">
                            Drag and drop your .move file or click to browse
                          </p>
                          {file && (
                            <div className="mt-2 text-primary font-medium">
                              {file.name} ({Math.round(file.size / 1024)} KB)
                            </div>
                          )}
                        </label>
                      </div>

                      <div>
                        <h3 className="mb-2 font-medium">Or paste your contract code:</h3>
                        <Textarea
                          placeholder="Paste your Move contract code here..."
                          className="min-h-[300px] font-mono text-sm"
                          value={contractCode}
                          onChange={(e) => setContractCode(e.target.value)}
                        />
                      </div>

                      {isProcessing && (
                        <div className="space-y-2">
                          <Progress value={processingProgress} className="w-full" />
                          <p className="text-sm text-muted-foreground">{processingStatus}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handleProcessContract}
                      disabled={!contractCode || isProcessing}
                    >
                      Process Contract <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="review" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Governance Module</CardTitle>
                    <CardDescription>
                      Check the automatically generated governance module for your dApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Important</AlertTitle>
                      <AlertDescription>
                        Review the generated code carefully. This module will control your dApp's governance processes.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="bg-secondary/50 p-4 rounded-md overflow-auto max-h-[400px]">
                      <pre className="text-sm font-mono whitespace-pre">
                        {generatedGovernance}
                      </pre>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto"
                      onClick={() => setActiveTab("upload")}
                    >
                      Go Back
                    </Button>
                    <Button 
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => setActiveTab("deploy")}
                    >
                      Continue to Deploy <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="deploy" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Deploy Your Governance Module</CardTitle>
                    <CardDescription>
                      Finalize and deploy your governance module to the Sui network
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <Alert>
                        <Check className="h-4 w-4" />
                        <AlertTitle>Ready to Deploy</AlertTitle>
                        <AlertDescription>
                          Your governance module has been generated and is ready to be deployed to the Sui network.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="bg-secondary/30 p-4 rounded-md">
                        <h3 className="font-medium mb-2">Deployment Details</h3>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <span className="text-muted-foreground">Network</span>
                            <span className="font-mono">Sui Mainnet</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <span className="text-muted-foreground">Gas Budget</span>
                            <span className="font-mono">30,000,000 MIST</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-border/50">
                            <span className="text-muted-foreground">Governance Token</span>
                            <span className="font-mono">Optional - Deploy later</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                    <Button 
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => setActiveTab("review")}
                    >
                      Go Back
                    </Button>
                    <Button 
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={handleDeploy}
                    >
                      Deploy Governance <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}