import React from "react";
import ReactDOM from "react-dom/client";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import App from "./App.tsx";
import { networkConfig } from "./networkConfig.ts";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";
import GovernancePage from "./governance/page.tsx";
import ProposalsPage from "./governance/[app]/proposals/page.tsx";
import ProposalDetailsPage from "./governance/[app]/proposals/[proposalId]/page.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/governance",
    element: <GovernancePage />,
  },
  {
    path: "/governance/:app/proposals",
    element: <ProposalsPage />,
  },
  {
    path: "/governance/:app/proposals/:proposalId",
    element: <ProposalDetailsPage />,
  },
]);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme appearance="dark">
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider autoConnect>
            <RouterProvider router={router} />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </Theme>
  </React.StrictMode>,
);
