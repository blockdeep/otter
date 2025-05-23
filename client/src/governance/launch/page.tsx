import { useState, useEffect } from "react";
import {
  ArrowRight,
  Upload,
  FileCode,
  Check,
  AlertCircle,
  List,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useContractProcessor from "@/hooks/useContractProcessor";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// TODO: Need a lot of refactoring
// 1. As it's a multistep form, all steps can be moved to it's seperate component
// 2. This file should behave as a single source of truth for the form
// 3. Avoid using useEffect, use TanStack Query instead
export default function LaunchGovernancePage() {
  const {
    contractCode,
    packageId,
    inputMethod,
    isProcessing,
    detectedActions,
    selectedActions,
    result,
    error,
    handleContractCodeChange,
    handlePackageIdChange,
    switchInputMethod,
    parseContract,
    generateGovernanceContract,
    downloadGovernanceContracts,
    toggleActionSelection,
  } = useContractProcessor();

  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState<File | null>(null);

  // Handle automatic tab progression based on hook state
  useEffect(() => {
    // After parsing successfully, move to selection tab (only for code method)
    if (
      detectedActions.length > 0 &&
      activeTab === "upload" &&
      inputMethod === "code"
    ) {
      setActiveTab("select");
    }

    // For package method, if we have a result, go directly to review
    if (result && activeTab === "upload" && inputMethod === "package") {
      setActiveTab("review");
    }

    // After generating successfully, move to review tab
    if (result && activeTab === "select") {
      setActiveTab("review");
    }
  }, [detectedActions, result, activeTab, inputMethod]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const uploadedFile = files[0];
      setFile(uploadedFile);

      // Read file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
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
                Connect your dApp to our unified governance platform in four
                simple steps
              </p>
            </div>

            <Card className="border border-gray-300 shadow-md mb-8">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  Getting Started
                </CardTitle>
                <CardDescription>
                  Our platform helps you implement governance for your Sui dApp
                  without changing your existing contracts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-h-full items-center gap-4 mb-4">
                  {/* Step 1 with subtle border */}
                  <div className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all bg-white">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <FileCode className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">1. Upload Contract</h3>
                      <p className="text-sm text-muted-foreground">
                        Provide your dApp's smart contract
                      </p>
                    </div>
                  </div>
                  {/* New Step 2 with subtle border */}
                  <div className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all bg-white">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <List className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">2. Select Functions</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose which functions to govern
                      </p>
                    </div>
                  </div>
                  {/* Step 3 with subtle border */}
                  <div className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all bg-white">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">3. Review Integration</h3>
                      <p className="text-sm text-muted-foreground">
                        Check the generated governance module
                      </p>
                    </div>
                  </div>
                  {/* Step 4 with subtle border */}
                  <div className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all bg-white">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <Check className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">4. Deploy</h3>
                      <p className="text-sm text-muted-foreground">
                        Launch your governance module
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full h-full grid-cols-2 sm:grid-cols-4 border border-gray-300 pt-2 px-1 pb-0 rounded-lg shadow-sm">
                <TabsTrigger
                  value="upload"
                  className="data-[state=active]:border-b-2 pb-3 data-[state=active]:border-primary data-[state=active]:bg-secondary/20 font-medium transition-all"
                >
                  1.Upload Contract
                </TabsTrigger>
                <TabsTrigger
                  value="select"
                  disabled={
                    detectedActions.length === 0 || inputMethod === "package"
                  }
                  className="data-[state=active]:border-b-2 pb-3 data-[state=active]:border-primary data-[state=active]:bg-secondary/20 font-medium transition-all"
                >
                  2.Select Functions
                </TabsTrigger>
                <TabsTrigger
                  value="review"
                  disabled={!result}
                  className="data-[state=active]:border-b-2 pb-3 data-[state=active]:border-primary data-[state=active]:bg-secondary/20 font-medium transition-all"
                >
                  3.Review Integration
                </TabsTrigger>
                <TabsTrigger
                  value="deploy"
                  disabled={!result}
                  className="data-[state=active]:border-b-2 pb-3 data-[state=active]:border-primary data-[state=active]:bg-secondary/20 font-medium transition-all"
                >
                  4.Deploy Governance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-6">
                <Card className="border border-gray-300 shadow-md">
                  <CardHeader>
                    <CardTitle>Upload Your Contract</CardTitle>
                    <CardDescription>
                      Provide your dApp's smart contract code or package ID to
                      identify governable functions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-6">
                      {/* Input Method Selection */}
                      <div className="flex flex-col gap-4">
                        <Label className="text-sm font-medium">
                          Choose input method:
                        </Label>
                        <div className="flex gap-4">
                          <Button
                            variant={
                              inputMethod === "code" ? "default" : "outline"
                            }
                            onClick={() => switchInputMethod("code")}
                            className="flex items-center gap-2"
                          >
                            <FileCode className="h-4 w-4" />
                            Contract Code
                          </Button>
                          <Button
                            variant={
                              inputMethod === "package" ? "default" : "outline"
                            }
                            onClick={() => switchInputMethod("package")}
                            className="flex items-center gap-2"
                          >
                            <Package className="h-4 w-4" />
                            Package ID
                          </Button>
                        </div>
                      </div>

                      {inputMethod === "code" ? (
                        <>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                            <input
                              type="file"
                              id="contract-upload"
                              className="hidden"
                              accept=".move"
                              onChange={handleFileUpload}
                            />
                            <label
                              htmlFor="contract-upload"
                              className="cursor-pointer flex flex-col items-center gap-2"
                            >
                              <Upload className="h-10 w-10 text-muted-foreground" />
                              <h3 className="font-medium text-lg">
                                Upload Contract File
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Drag and drop your .move file or click to browse
                              </p>
                              {file && (
                                <div className="mt-2 text-primary font-medium">
                                  {file.name} ({Math.round(file.size / 1024)}{" "}
                                  KB)
                                </div>
                              )}
                            </label>
                          </div>

                          <div>
                            <h3 className="mb-2 font-medium">
                              Or paste your contract code:
                            </h3>
                            <Textarea
                              placeholder="Paste your Move contract code here..."
                              className="min-h-[300px] font-mono text-sm"
                              value={contractCode}
                              onChange={(e) =>
                                handleContractCodeChange(e.target.value)
                              }
                            />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label
                              htmlFor="package-id"
                              className="text-sm font-medium"
                            >
                              Package ID
                            </Label>
                            <Input
                              id="package-id"
                              placeholder="Enter package ID (e.g., 0x123...)"
                              value={packageId}
                              onChange={(e) =>
                                handlePackageIdChange(e.target.value)
                              }
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      {isProcessing && (
                        <div className="space-y-2">
                          <Progress
                            value={isProcessing ? 50 : 0}
                            className="w-full"
                          />
                          <p className="text-sm text-muted-foreground">
                            {inputMethod === "code"
                              ? "Analyzing contract and identifying governable functions..."
                              : "Processing package and generating governance contracts..."}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                      onClick={parseContract}
                      disabled={
                        (inputMethod === "code" && !contractCode) ||
                        (inputMethod === "package" && !packageId) ||
                        isProcessing
                      }
                    >
                      {inputMethod === "code"
                        ? "Parse Contract"
                        : "Process Package"}{" "}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Selection Tab - Only shown for code method */}
              <TabsContent value="select" className="mt-6">
                <Card className="border border-gray-300 shadow-md">
                  <CardHeader>
                    <CardTitle>Select Governable Functions</CardTitle>
                    <CardDescription>
                      Choose which functions from your contract should be
                      governable
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {detectedActions.length > 0 ? (
                      <div className="space-y-6">
                        <Alert className="mb-6 border border-gray-300 shadow-sm bg-blue-50">
                          <AlertCircle className="h-4 w-4 text-blue-500" />
                          <AlertTitle>Function Selection</AlertTitle>
                          <AlertDescription>
                            We've identified {detectedActions.length} potential
                            governable functions in your contract. Select the
                            ones you want to include in your governance module.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                          {detectedActions.map((action, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-4 p-4 rounded-md border border-gray-300 shadow-sm hover:shadow-md transition-all bg-white"
                            >
                              <Checkbox
                                id={`action-${index}`}
                                checked={selectedActions.includes(action.name)}
                                onCheckedChange={() =>
                                  toggleActionSelection(action.name)
                                }
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`action-${index}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  <span className="font-mono text-primary">
                                    {action.name}
                                  </span>
                                </label>
                                {action.parameters.length > 0 && (
                                  <div className="mt-2 pl-4 border-l-2 border-gray-200">
                                    <p className="text-xs text-muted-foreground">
                                      Parameters:
                                    </p>
                                    {action.parameters.map((param, pIndex) => (
                                      <p
                                        key={pIndex}
                                        className="text-xs font-mono"
                                      >
                                        {param.name}:{" "}
                                        <span className="text-secondary-foreground">
                                          {param.type}
                                        </span>
                                      </p>
                                    ))}
                                  </div>
                                )}
                                <div className="mt-2">
                                  <p className="text-xs text-muted-foreground">
                                    {action.description ||
                                      "This function will be controlled by governance if selected."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p>
                        No governable actions detected in your contract. Please
                        go back and upload a valid contract.
                      </p>
                    )}

                    {isProcessing && (
                      <div className="space-y-2 mt-6">
                        <Progress
                          value={isProcessing ? 50 : 0}
                          className="w-full"
                        />
                        <p className="text-sm text-muted-foreground">
                          Generating governance contract...
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto shadow-sm hover:shadow transition-all"
                      onClick={() => setActiveTab("upload")}
                    >
                      Go Back
                    </Button>
                    <Button
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                      onClick={generateGovernanceContract}
                      disabled={selectedActions.length === 0 || isProcessing}
                    >
                      Generate Governance{" "}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="review" className="mt-6">
                <Card className="border border-gray-300 shadow-md">
                  <CardHeader>
                    <CardTitle>Review Your Governance Modules</CardTitle>
                    <CardDescription>
                      Check the automatically generated governance and token
                      modules for your dApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result ? (
                      <>
                        <Alert className="mb-6 border border-gray-300 shadow-sm">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Important</AlertTitle>
                          <AlertDescription>
                            Review the generated code carefully. These modules
                            will control your dApp's governance processes.
                          </AlertDescription>
                        </Alert>

                        <div className="mb-6">
                          <h3 className="text-lg font-medium mb-2">
                            Module Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-md border border-gray-300 shadow-sm">
                            <div>
                              <p className="text-sm font-medium">
                                Package Name:
                              </p>
                              <p className="font-mono">
                                {result.moduleInfo.packageName}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Module Name:
                              </p>
                              <p className="font-mono">
                                {result.moduleInfo.moduleName}
                              </p>
                            </div>
                            {result.packageId && (
                              <div className="md:col-span-2">
                                <p className="text-sm font-medium">
                                  Package ID:
                                </p>
                                <p className="font-mono text-xs break-all">
                                  {result.packageId}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mb-6">
                          <h3 className="text-lg font-medium mb-2">
                            Selected Governable Actions
                          </h3>
                          <div className="space-y-4">
                            {result.governableActions.length > 0 ? (
                              result.governableActions.map((action, index) => (
                                <div
                                  key={index}
                                  className="bg-muted/50 p-4 rounded-md border border-gray-300 shadow-sm hover:shadow-md transition-all"
                                >
                                  <p className="font-mono font-medium text-primary">
                                    {action.name}
                                  </p>
                                  {action.parameters.length > 0 && (
                                    <div className="mt-2 pl-4 border-l-2 border-gray-200">
                                      <p className="text-sm text-muted-foreground">
                                        Parameters:
                                      </p>
                                      {action.parameters.map(
                                        (param, pIndex) => (
                                          <p
                                            key={pIndex}
                                            className="text-sm font-mono"
                                          >
                                            {param.name}:{" "}
                                            <span className="text-secondary-foreground">
                                              {param.type}
                                            </span>
                                          </p>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p>
                                No governable actions selected for your
                                contract.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mb-6">
                          <h3 className="text-lg font-medium mb-2">
                            Generated Contracts
                          </h3>
                          <Tabs defaultValue="governance" className="w-full">
                            <TabsList className="mb-2">
                              <TabsTrigger value="governance">
                                Governance Contract
                              </TabsTrigger>
                              <TabsTrigger value="token">
                                Token Contract
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="governance">
                              <div className="bg-secondary/20 p-4 rounded-md overflow-auto max-h-[400px] border border-gray-300 shadow-sm">
                                <pre className="text-sm font-mono whitespace-pre">
                                  {result.governanceContract}
                                </pre>
                              </div>
                            </TabsContent>
                            <TabsContent value="token">
                              <div className="bg-secondary/20 p-4 rounded-md overflow-auto max-h-[400px] border border-gray-300 shadow-sm">
                                <pre className="text-sm font-mono whitespace-pre">
                                  {result.governanceTokenContract}
                                </pre>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </>
                    ) : (
                      <p>
                        No contract has been processed yet. Please go back and
                        {inputMethod === "code"
                          ? " select governance functions"
                          : " process a package"}
                        .
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto shadow-sm hover:shadow transition-all"
                      onClick={() =>
                        setActiveTab(
                          inputMethod === "code" ? "select" : "upload",
                        )
                      }
                    >
                      Go Back
                    </Button>
                    {result && (
                      <>
                        <Button
                          variant="secondary"
                          className="w-full sm:w-auto shadow-sm hover:shadow transition-all"
                          onClick={downloadGovernanceContracts}
                        >
                          Download Contracts
                        </Button>
                        <Button
                          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                          onClick={() => setActiveTab("deploy")}
                        >
                          Continue to Deploy{" "}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Deploy Tab Content */}
              <TabsContent value="deploy" className="mt-6">
                <Card className="border border-gray-300 shadow-md">
                  <CardHeader>
                    <CardTitle>Deploy Your Governance Module</CardTitle>
                    <CardDescription>
                      Follow these instructions to deploy your governance module
                      to the Sui network
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <Alert className="border border-gray-300 shadow-sm bg-green-50">
                        <Check className="h-4 w-4 text-green-500" />
                        <AlertTitle>Ready to Deploy</AlertTitle>
                        <AlertDescription>
                          Your governance module has been generated and is ready
                          to be deployed to the Sui network.
                        </AlertDescription>
                      </Alert>

                      <div className="bg-secondary/20 p-4 rounded-md border border-gray-300 shadow-sm">
                        <h3 className="font-medium mb-2">Deployment Details</h3>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex justify-between py-1 border-b border-gray-200">
                            <span className="text-muted-foreground">
                              Network
                            </span>
                            <span className="font-mono">Sui Mainnet</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-200">
                            <span className="text-muted-foreground">
                              Gas Budget
                            </span>
                            <span className="font-mono">30,000,000 MIST</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-200">
                            <span className="text-muted-foreground">
                              Governance Token
                            </span>
                            <span className="font-mono">
                              Included - Ready for deployment
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xl font-bold">
                          Deploying Otter Governance on Sui
                        </h3>
                        <p className="text-muted-foreground">
                          This guide walks you through deploying and simulating
                          a governance flow using Otter on the Sui blockchain.
                        </p>
                        <Alert className="border border-amber-200 bg-amber-50">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <AlertTitle>Prerequisite</AlertTitle>
                          <AlertDescription>
                            You must have{" "}
                            <code className="bg-secondary/20 p-1 rounded">
                              sui client
                            </code>{" "}
                            installed and configured (testnet/mainnet).
                          </AlertDescription>
                        </Alert>
                      </div>

                      {/* Folder structure section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold">
                          Folder structure for deployment
                        </h3>
                        <p className="text-muted-foreground">
                          There are two ways that allows your app to refer to
                          deployed packages - github or locally.
                        </p>
                        <p className="text-sm text-muted-foreground italic">
                          Notice how your app package is being referred to
                          through Move.toml.
                        </p>

                        <div className="space-y-6 mt-4">
                          <Accordion type="single" collapsible>
                            <AccordionItem value="item-1">
                              <AccordionTrigger className="bg-primary-foreground px-4">
                                <h4 className="font-bold text-primary">
                                  Scenario #1: Local reference
                                </h4>
                              </AccordionTrigger>
                              <AccordionContent className="px-4">
                                  <p className="my-2">
                              Your folder structure should look something like
                              this:
                            </p>
                            <div className="bg-secondary/20 p-4 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                              <ScrollArea aria-orientation="horizontal" className="h-full w-full"><pre>
                                {`governance/
├── app_folder/                 # App smart contract folder
├── sources/                    
│   ├── governance.move         # governance contract downloaded from Otter.
│   └── governance_token.move   # governnace token contract downloaded at the same time.
├── tests
└── Move.toml`}</pre>
<ScrollBar orientation="horizontal" />
</ScrollArea>
                            </div>

                            <p className="my-2">And the Move.toml like this:</p>
                            <div className="bg-secondary/20 p-4 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                              <ScrollArea aria-orientation="horizontal" className="h-full w-full"><pre>{`[package]
name = "generic_governor"
edition = "2024.beta" 

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }
simple_counter = { local = "./simple_counter" }


[addresses]
generic_governor = "0x0"
simple_counter = "0x48e6b4a86510e16891db5663cea0db2b3fa7e4bd3d909d867de39323e63330cd"`}</pre>
<ScrollBar orientation="horizontal" />
</ScrollArea>
                            </div>
                              </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                              <AccordionTrigger className="bg-primary-foreground px-4">
                                <h4 className="font-bold text-primary">
                                  Scenario #2: Github reference
                                </h4>
                              </AccordionTrigger>
                              <AccordionContent className="px-4">
                                <p className="my-2">
                              Your folder structure should look something like
                              this:
                            </p>
                            <div className="bg-secondary/20 p-4 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                             <ScrollArea aria-orientation="horizontal" className="h-full w-full"><pre>{`governance/
├── sources/                    
│   ├── governance.move         # governance contract downloaded from Otter.
│   └── governance_token.move   # governnace token contract downloaded at the same time.
├── tests
└── Move.toml`}</pre>
<ScrollBar orientation="horizontal" />
</ScrollArea>
                            </div>

                            <p className="my-2">And the Move.toml like this:</p>
                                <div className="bg-secondary/20 p-4 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                                <ScrollArea aria-orientation="horizontal" className="h-full w-full"><pre>{`[package]
    name = "generic_governor"
    edition = "2024.beta" 

    [dependencies]
    Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }
    simple_counter = { git = "https://github.com/<username>/<repo>.git", subdir = "<path-to-package>", rev = "<commit-or-branch>" }


    [addresses]
    generic_governor = "0x0"
    simple_counter = "0x48e6b4a86510e16891db5663cea0db2b3fa7e4bd3d909d867de39323e63330cd"`}
                            </pre>
                            <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                            </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      </div>

                      {/* Deployment section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold">
                          Moving on to deployment
                        </h3>

                        <div className="space-y-2">
                          <h4 className="font-medium">
                            1. To deploy the governance package:
                          </h4>
                          <div className="bg-secondary/20 p-2 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                            sui client publish
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">
                            2. Post deployment, export the created objects:
                          </h4>
                          <div className="bg-secondary/20 p-2 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                            export
                            ADMIN_CAP_ID=0x01968757b52e1b9c7f7ac44a167984c83757cc1de844500db964cbc5315cc775
                            <br />
                            export
                            GOVERNANCE_SYSTEM_ID=0xf959b09a23202f1e04fb8379107e3fbfc0f5597d4a0bd7a04eae2c6b92b6b771
                            <br />
                            export
                            GOVTOKEN_ADMIN_CAP=0xbd1ac83f0b22310a333a60d3fa88779e2881b6ab72d7c06059d6b88467341d7c
                            <br />
                            export
                            TREASURY_ID=0x2533bd61ecd09cd585329d3245b58f8d33d6551a797c82515ccb31db0c473aa8
                          </div>
                          <p className="text-sm text-amber-700">
                            ⚠️ The object IDs above are examples. Replace them
                            with your actual object IDs from deployment.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">
                            3. Initialize the governance contract:
                          </h4>
                          <div className="bg-secondary/20 p-2 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                            sui client call --package $GOVERNANCE_PACKAGE_ID
                            --module governance --function update_total_supply
                            --args $ADMIN_CAP_ID $GOVERNANCE_SYSTEM_ID
                            10000000000 --gas-budget 10000000
                          </div>
                        </div>

                        <Alert className="border border-green-200 bg-green-50 mt-4">
                          <Check className="h-4 w-4 text-green-500" />
                          <AlertTitle>Success!</AlertTitle>
                          <AlertDescription>
                            Your Governance Package is now deployed with both
                            the governance contract and the token contract.
                          </AlertDescription>
                        </Alert>
                      </div>

                      {/* Using the Governance section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold">
                          Using your Governance System
                        </h3>
                        <p className="text-muted-foreground">
                          Follow these steps to create a proposal, vote on it,
                          and execute it:
                        </p>

                        <div className="space-y-2">
                          <h4 className="font-medium">
                            1. Mint Governance Tokens:
                          </h4>
                          <div className="bg-secondary/20 p-2 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                            sui client call --package $GOVERNANCE_PACKAGE_ID
                            --module govtoken --function mint_coins \<br />
                            --args $GOVTOKEN_ADMIN_CAP $TREASURY_ID 1000000000
                            $MY_ADDRESS \<br />
                            --gas-budget 10000000
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">
                            2. Extract governance token ID:
                          </h4>
                          <div className="bg-secondary/20 p-2 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                            export
                            GOV_TOKEN_ID=0x9777bb0fdb3a4181966abc7a7b2d1a3d54b06109a21edc20f3122b172d3bfc74
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">3. Create a Proposal:</h4>
                          <div className="bg-secondary/20 p-2 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                            sui client call --package $GOVERNANCE_PACKAGE_ID
                            --module governance --function create_proposal \
                            <br />
                            --args $GOVERNANCE_SYSTEM_ID $GOV_TOKEN_ID "Set
                            counter to 33" "This proposal will set the counter
                            value to 42" 120 "0x6" 0 33 \<br />
                            --gas-budget 10000000
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">
                            4. Export proposal ID:
                          </h4>
                          <div className="bg-secondary/20 p-2 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                            export
                            PROPOSAL_ID=0x12a8fcbd50296ad40a1f6a0a541d68f185b93e558adc6122ad3fc2f8c9da64e8
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">
                            5. Vote on the Proposal:
                          </h4>
                          <div className="bg-secondary/20 p-2 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                            sui client call --package $GOVERNANCE_PACKAGE_ID
                            --module governance --function vote \<br />
                            --args $GOVERNANCE_SYSTEM_ID $PROPOSAL_ID
                            $GOV_TOKEN_ID 0 "0x6" \<br />
                            --gas-budget 10000000
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">
                            6. Finalize the Proposal:
                          </h4>
                          <div className="bg-secondary/20 p-2 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                            sui client call --package $GOVERNANCE_PACKAGE_ID
                            --module governance --function finalize_proposal \
                            <br />
                            --args $GOVERNANCE_SYSTEM_ID $PROPOSAL_ID "0x6" \
                            <br />
                            --gas-budget 10000000
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">
                            7. Execute the Proposal:
                          </h4>
                          <div className="bg-secondary/20 p-2 rounded-md border border-gray-300 shadow-sm font-mono text-sm">
                            sui client call --package $GOVERNANCE_PACKAGE_ID
                            --module governance --function execute_proposal \
                            <br />
                            --args $GOVERNANCE_SYSTEM_ID $PROPOSAL_ID
                            $COUNTER_OBJECT 42 \<br />
                            --gas-budget 10000000
                          </div>
                        </div>

                        <Alert className="border border-blue-200 bg-blue-50 mt-4">
                          <AlertCircle className="h-4 w-4 text-blue-500" />
                          <AlertTitle>Good News!</AlertTitle>
                          <AlertDescription>
                            <p>
                              All of these steps can be done on the Otter UI
                              itself!
                            </p>
                            <p className="mt-2">
                              Once deployed, add your governance address to the
                              Otter platform using the "Whitelist your
                              governance" button on the Governance page.
                            </p>
                          </AlertDescription>
                        </Alert>
                      </div>

                      <div className="space-y-4 p-4 border border-gray-300 rounded-md bg-blue-50/50 shadow-sm">
                        <h3 className="font-medium text-blue-700">
                          Next Steps
                        </h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          <li>
                            Download your generated governance and token
                            contracts
                          </li>
                          <li>
                            Setup your package structure as described above
                          </li>
                          <li>
                            Deploy your governance module using the Sui CLI
                          </li>
                          <li>
                            Whitelist your governance on the Otter platform
                          </li>
                          <li>
                            Distribute governance tokens to your community
                          </li>
                          <li>Start creating proposals and voting!</li>
                        </ol>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                    <Button
                      variant="outline"
                      className="w-full lg:w-auto shadow-sm hover:shadow transition-all"
                      onClick={() => setActiveTab("review")}
                    >
                      Go Back
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full lg:w-auto shadow-sm hover:shadow transition-all"
                      onClick={downloadGovernanceContracts}
                    >
                      Download Contracts
                    </Button>
                    <div className="flex w-full lg:w-auto flex-row-reverse items-center gap-4">
                      <Button
                        className="w-full lg:w-auto"
                        onClick={() =>
                          window.open(
                            "/governance/whitelist",
                            "_blank",
                          )
                        }
                        >
                        Whitelist governance
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        variant='secondary'
                        className="w-full lg:w-auto"
                        onClick={() =>
                          window.open(
                            "https://docs.otter.gov/deploy-guide",
                            "_blank",
                          )
                        }
                        >
                        View Full Documentation
                      </Button>
                    </div>
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
