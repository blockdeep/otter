import type React from "react";
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DUGONG - Decentralized Governance for Sui",
  description:
    "Easiest way to launch and manage governance for your dApp on Sui blockchain.",
  generator: "v0.dev",
};

const queryClient = new QueryClient();
const networks = {
  devnet: { url: getFullnodeUrl("devnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networks} defaultNetwork="devnet">
              <WalletProvider>
                {children}
                </WalletProvider>
            </SuiClientProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
