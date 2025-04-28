import Link from "next/link";
import { ArrowRight, CheckCircle, Droplets, Gauge, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-blue-50 dark:from-background dark:to-blue-900/20">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,#f2f9ff,transparent)] dark:bg-[radial-gradient(circle_at_30%_20%,#1a4db3,transparent)]" />
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-200">
                  Decentralized Governance for Sui
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
                  Easiest way to launch and manage governance for your dApp.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button
                  asChild
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  <Link href="/governance">View Governance</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-blue-200 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-800/50"
                >
                  <Link href="#">Launch Governance</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-[url('/logo.svg')] bg-repeat-x bg-bottom opacity-20" />
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-24 bg-white dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Key Features
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
                  Powerful tools to make governance accessible and efficient
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-12">
              <Card className="bg-blue-50 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4 text-gray-700 dark:text-gray-200">
                  <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-800">
                    <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold">
                    Easy dApp Governance Launch
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    One-click setup for Sui dApps. Get started in minutes.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4 text-gray-700 dark:text-gray-200">
                  <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-800">
                    <Gauge className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold">
                    Fast, Gas-Efficient Voting
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Powered by Sui's architecture for optimal performance.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800">
                <CardContent className="p-6 flex flex-col items-center text-center space-y-4 text-gray-700 dark:text-gray-200">
                  <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-800">
                    <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold">Storage Refunds</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Reclaim storage costs with Walrus Programmable Storage.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Storage Refund Highlight */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Built-in Storage Refunds with Walrus
                </h2>
                <p className="text-gray-500 dark:text-gray-400 md:text-xl">
                  When proposals are created, storage is allocated. If a
                  proposal fails, the creators can reclaim their storage costs —
                  keeping governance efficient and fair.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 border-blue-200 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-800/50"
                >
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-md">
                  <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-400 to-blue-300 opacity-30 blur-lg dark:from-blue-600 dark:to-blue-500"></div>
                  <div className="relative rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                    <div className="flex flex-col items-center space-y-4 text-center">
                      <div className="rounded-full bg-blue-100 p-4 dark:bg-blue-800">
                        <Droplets className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold">
                        Storage Reclaim Process
                      </h3>
                      <div className="space-y-2 w-full">
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold dark:bg-blue-800 dark:text-blue-400">
                            1
                          </div>
                          <p className="text-left dark:text-gray-300">
                            Proposal created with storage allocation
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold dark:bg-blue-800 dark:text-blue-400">
                            2
                          </div>
                          <p className="text-left dark:text-gray-300">
                            If proposal fails or expires
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold dark:bg-blue-800 dark:text-blue-400">
                            3
                          </div>
                          <p className="text-left dark:text-gray-300">
                            Creator reclaims storage costs
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-12 md:py-24 bg-white dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  About DUGONG
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
                  DUGONG is built with a community-first approach to governance
                  on the Sui blockchain. We believe in creating tools that
                  empower dApps to make decisions collectively and
                  transparently.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Partner dApps */}
        <section className="py-12 md:py-24 bg-blue-50 dark:bg-blue-900/20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Partner dApps
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 dark:text-gray-400 md:text-xl">
                  Trusted by leading projects in the Sui ecosystem
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-8 mt-8">
                {/* Placeholder for partner logos */}
                <div className="h-16 w-32 rounded-md bg-white shadow-sm flex items-center justify-center text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                  Partner 1
                </div>
                <div className="h-16 w-32 rounded-md bg-white shadow-sm flex items-center justify-center text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                  Partner 2
                </div>
                <div className="h-16 w-32 rounded-md bg-white shadow-sm flex items-center justify-center text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                  Partner 3
                </div>
                <div className="h-16 w-32 rounded-md bg-white shadow-sm flex items-center justify-center text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                  Partner 4
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
