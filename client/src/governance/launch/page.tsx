import { useState } from 'react';
import { ArrowRight, Upload, FileCode, Check, AlertCircle } from "lucide-react";
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
import useContractProcessor from '@/hooks/useContractProcessor';

export default function LaunchGovernancePage() {
  const {
    contractCode,
    isProcessing,
    result,
    error,
    handleContractCodeChange,
    processContract,
    downloadGovernanceContract
  } = useContractProcessor();

  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState<File | null>(null);

  // After processing successfully, move to review tab
  if (result && activeTab === "upload") {
    setActiveTab("review");
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const uploadedFile = files[0];
      setFile(uploadedFile);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          handleContractCodeChange(result);
        }
      };
      reader.readAsText(uploadedFile);
    }
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
                <TabsTrigger value="review" disabled={!result}>Review Integration</TabsTrigger>
                <TabsTrigger value="deploy" disabled={!result}>Deploy Governance</TabsTrigger>
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
                          onChange={(e) => handleContractCodeChange(e.target.value)}
                        />
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>
                            {error}
                          </AlertDescription>
                        </Alert>
                      )}

                      {isProcessing && (
                        <div className="space-y-2">
                          <Progress value={isProcessing ? 50 : 0} className="w-full" />
                          <p className="text-sm text-muted-foreground">Analyzing contract and generating governance...</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={processContract}
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
                    {result ? (
                      <>
                        <Alert className="mb-6">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Important</AlertTitle>
                          <AlertDescription>
                            Review the generated code carefully. This module will control your dApp's governance processes.
                          </AlertDescription>
                        </Alert>

                        <div className="mb-6">
                          <h3 className="text-lg font-medium mb-2">Module Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-md">
                            <div>
                              <p className="text-sm font-medium">Package Name:</p>
                              <p className="font-mono">{result.moduleInfo.packageName}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Module Name:</p>
                              <p className="font-mono">{result.moduleInfo.moduleName}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-6">
                          <h3 className="text-lg font-medium mb-2">Governable Actions</h3>
                          <div className="space-y-2">
                            {result.governableActions.length > 0 ? (
                              result.governableActions.map((action, index) => (
                                <div key={index} className="bg-muted/50 p-3 rounded-md">
                                  <p className="font-mono font-medium">{action.name}</p>
                                  {action.parameters.length > 0 && (
                                    <div className="mt-1 pl-4">
                                      <p className="text-sm text-muted-foreground">Parameters:</p>
                                      {action.parameters.map((param, pIndex) => (
                                        <p key={pIndex} className="text-sm font-mono">
                                          {param.name}: {param.type}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p>No governable actions found in your contract.</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">Generated Governance Contract</h3>
                          <div className="bg-secondary/50 p-4 rounded-md overflow-auto max-h-[400px]">
                            <pre className="text-sm font-mono whitespace-pre">
                              {result.governanceContract}
                            </pre>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p>No contract has been processed yet. Please go back and upload a contract.</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto"
                      onClick={() => {
                        console.log("Back clicked");
                        
                        setActiveTab("upload");
                        console.log(activeTab);
                        
                      }}
                    >
                      Go Back
                    </Button>
                    {result && (
                      <>
                        <Button 
                          variant="secondary"
                          className="w-full sm:w-auto"
                          onClick={downloadGovernanceContract}
                        >
                          Download Contract
                        </Button>
                        <Button 
                          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                          onClick={() => setActiveTab("deploy")}
                        >
                          Continue to Deploy <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </>
                    )}
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

                      <div className="space-y-4">
                        <h3 className="font-medium">Next Steps</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>Download your generated governance contract</li>
                          <li>Run the SUI CLI command to publish it to the network</li>
                          <li>Connect your existing dApp to the new governance contract</li>
                          <li>Distribute governance tokens to your community</li>
                        </ol>
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
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={downloadGovernanceContract}
                    >
                      Download Contract
                    </Button>
                    <Button 
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Deploy via CLI <ArrowRight className="ml-2 h-4 w-4" />
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