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

const PORT = process.env.PORT || 50000;
const app = express();
app.use(cors());

app.use(express.json());

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

app.get('/governances', async (req, res) => {
  const acceptedQueries = [
    {
      key: 'active',
      type: WhereParamTypes.BOOLEAN,
    },
    {
      key: 'projectName',
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
    // Check if the provided password matches the one in .env
    const { password, address, projectName, details } = req.body;

    // Validate required fields
    if (!password || !address || !projectName || !details) {
      res.status(400).send({
        error:
          "Missing required fields: password, address, projectName, and details are required",
      });
      return;
    }

    // Validate the password against the one stored in .env
    const serverPassword = process.env.GOVERNANCE_WHITELIST_PASSWORD;
    if (!serverPassword) {
      res.status(500).send({
        error:
          "Server configuration error: Password not set in environment variables",
      });
      return;
    }

    if (password !== serverPassword) {
      res.status(401).send({ error: "Invalid password" });
      return;
    }

    // If password validation passes, add the governance address to the database
    const newGovernanceAddress = await prisma.governanceAddress.create({
      data: {
        address,
        projectName,
        createdAt: new Date(),
        details,
      },
    });

    res.status(201).send({
      message: "Governance address whitelisted successfully",
      data: newGovernanceAddress,
    });
  } catch (e) {
    console.error(e);
    res.status(400).send(e);
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server ready at: ${PORT}`)
);
