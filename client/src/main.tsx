import React from "react";
import ReactDOM from "react-dom/client";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import App from "./App.jsx";
import { networkConfig } from "./networkConfig.js";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";
import GovernancePage from "./governance/page.jsx";
import ProposalsPage from "./governance/[app]/proposals/page.jsx";
import ProposalDetailsPage from "./governance/[app]/proposals/[proposalId]/page.jsx";
import LaunchGovernancePage from "./governance/launch/page.js";
import CreateProposalPage from "./governance/[app]/proposals/create/page.js";
import WhiteListGovernancePage from "./governance/whitelist/page.js";

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
    path: "/governance/launch",
    element: <LaunchGovernancePage />,
  },
  {
    path: "/governance/whitelist",
    element: <WhiteListGovernancePage />,
  },
  {
    path: "/governance/:app/proposals",
    element: <ProposalsPage />,
  },
  {
    path: "/governance/:app/proposals/create",
    element: <CreateProposalPage />,
  },
  {
    path: "/governance/:app/proposals/:proposalId",
    element: <ProposalDetailsPage />,
  },
]);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme appearance="light">
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
