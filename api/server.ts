// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import cors from "cors";
import express from "express";

import { prisma } from "./db";
import {
  formatPaginatedResponse,
  parsePaginationForQuery,
  parseWhereStatement,
  WhereParam,
  WhereParamTypes,
} from "./utils/api-queries";
import contractProcessorRouter from "./routes/contractProcessor";
import { SuiRPC } from "./utils/RPC";
import { refreshTrackers } from "./indexer/event-indexer";

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

app.use(express.json());

app.use("/contract", contractProcessorRouter);

app.get("/", async (req, res) => {
  res.send({ message: "🚀 API is functional 🚀" });
});

app.get("/proposals", async (req, res) => {
  const acceptedQueries: WhereParam[] = [
    {
      key: "executed",
      type: WhereParamTypes.BOOLEAN,
    },
    {
      key: "objectId",
      type: WhereParamTypes.STRING,
    },
    {
      key: "creator",
      type: WhereParamTypes.STRING,
    },
  ];

  try {
    const escrows = await prisma.proposal.findMany({
      where: parseWhereStatement(req.query, acceptedQueries)!,
      ...parsePaginationForQuery(req.query),
    });

    res.send(formatPaginatedResponse(escrows));
  } catch (e) {
    console.error(e);
    res.status(400).send(e);
  }
});

app.get("/governances", async (req, res) => {
  const acceptedQueries = [
    {
      key: "active",
      type: WhereParamTypes.BOOLEAN,
    },
    {
      key: "projectName",
      type: WhereParamTypes.STRING,
    },
  ];

  try {
    const governanceAddresses = await prisma.governanceAddress.findMany({
      where: parseWhereStatement(req.query, acceptedQueries),
      ...parsePaginationForQuery(req.query),
      include: {
        proposals: true, // Include related proposals if needed
      },
    });

    res.send(formatPaginatedResponse(governanceAddresses));
  } catch (e) {
    console.error(e);
    res.status(400).send(e);
  }
});

app.post("/whitelist-governance", async (req, res) => {
  try {
    // Extract the governance data from the request body
    const { address, projectName, details } = req.body;

    // Validate required fields
    if (!address || !projectName || !details) {
      res.status(400).send({
        error:
          "Missing required fields: address, projectName, and details are required",
      });
      return;
    }

    // Create RPC instance to fetch governance module info
    const rpc = new SuiRPC();
    let governanceInfo = null;
    let moduleName = null;
    let governanceInfoJSON = null;

    try {
      // Fetch governance info from the package
      governanceInfo = await rpc.getGovernanceInfo(address);

      if (governanceInfo) {
        moduleName = governanceInfo.governanceModuleName;
        // Store other governance info as JSON
        governanceInfoJSON = JSON.stringify(governanceInfo);

        // Get additional governance data
      } else {
        console.log(`No governance module found in package ${address}`);
      }
    } catch (rpcError) {
      console.error("Error fetching governance info:", rpcError);
      // Continue with basic information if RPC fails
    }

    // Add the governance address to the database
    const newGovernanceAddress = await prisma.governanceAddress.create({
      data: {
        address,
        projectName,
        details,
        createdAt: new Date(),
        moduleName, // Will be null if not found
        governanceInfo: governanceInfoJSON, // Will be null if not found
        active: true, // Set to active by default
      },
    });

    // Refresh event trackers to pick up the new governance address
    await refreshTrackers();

    res.status(201).send({
      message: "Governance address whitelisted successfully",
      data: newGovernanceAddress,
    });
  } catch (e) {
    console.error("Error whitelisting governance:", e);
    res.status(400).send({
      error: e instanceof Error ? e.message : "Failed to whitelist governance",
    });
  }
});

console.log("starting server");


app.listen(PORT, () => console.log(`🚀 Server ready at: ${PORT}`));
