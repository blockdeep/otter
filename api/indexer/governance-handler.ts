// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { SuiEvent } from "@mysten/sui/client";
import { Prisma } from "@prisma/client";

import { prisma } from "../db";

type GovernanceEvent =
  | ProposalCreated
  | VoteCasted
  | ProposalStatusChanged
  | ProposalExecuted;

type ProposalCreated = {
  proposal_id: string;
  creator: string;
  title: String;
  voting_ends_at: string;
  threshold: string;
  governance_address: string;
};

type VoteCasted = {
  proposal_id: string;
  voter: string;
  vote_type: number; // 0 = yes, 1 = no, 2 = abstain
  voting_power: string;
};

type ProposalStatusChanged = {
  proposal_id: string;
  new_status: number;
};

type ProposalExecuted = {
  proposal_id: string;
  executor: string;
};

/**
 * Handles all events emitted by the `governanace` module.
 * Data is modelled in a way that allows writing to the db in any order (DESC or ASC) without
 * resulting in data incosistencies.
 * We're constructing the updates to support multiple events involving a single record
 * as part of the same batch of events (but using a single write/record to the DB).
 * */
export const handleGovernanceObjects = async (
  events: SuiEvent[],
  type: string
) => {
  const updates: Record<string, Prisma.ProposalCreateInput> = {};
  const governanceAddressCache: Record<string, number> = {};

  const governanceAddresses = await prisma.governanceAddress.findMany({
    select: { id: true, address: true },
  });

  for (const gov of governanceAddresses) {
    governanceAddressCache[gov.address] = gov.id;
  }

  for (const event of events) {
    if (!event.type.startsWith(type))
      throw new Error("Invalid event module origin");

    const governanceAddress = event.packageId;

    const data = event.parsedJson as GovernanceEvent;

    if (!Object.hasOwn(updates, data.proposal_id)) {
      updates[data.proposal_id] = {
        objectId: data.proposal_id,
        yes: 0,
        no: 0,
        abstain: 0,
        votes: {
          create: [],
        },
      };
    }

    // Proposal status change case
    if (event.type.endsWith("::ProposalStatusChanged")) {
      const data = event.parsedJson as ProposalStatusChanged;
      updates[data.proposal_id].status = data.new_status;
      continue;
    }

    // Proposal executed case
    if (event.type.endsWith("::ProposalExecuted")) {
      const data = event.parsedJson as ProposalExecuted;
      updates[data.proposal_id].executed = true;
      continue;
    }

    // Vote casted case
    if (event.type.endsWith("::VoteCast")) {
      const data = event.parsedJson as VoteCasted;
      (updates[data.proposal_id].votes as any).create.push({
        voter: data.voter,
        voteType: data.vote_type,
        votingPower: data.voting_power,
      });

      // Update the vote count based on vote_type
      if (data.vote_type === 0)
        updates[data.proposal_id].yes =
          (updates[data.proposal_id].yes || 0) + 1;
      else if (data.vote_type === 1)
        updates[data.proposal_id].no = (updates[data.proposal_id].no || 0) + 1;
      else if (data.vote_type === 2)
        updates[data.proposal_id].abstain =
          (updates[data.proposal_id].abstain || 0) + 1;

      continue;
    }

    const creationData = event.parsedJson as ProposalCreated;

    // Handle creation event
    updates[data.proposal_id].creator = creationData.creator;
    updates[data.proposal_id].title = creationData.title as string;
    updates[data.proposal_id].votingEndsAt = creationData.voting_ends_at;
    updates[data.proposal_id].threshold = creationData.threshold;
    updates[data.proposal_id].governance = {
      connect: {
        id: governanceAddressCache[governanceAddress],
      },
    };
  }

  //  As part of the demo and to avoid having external dependencies, we use SQLite as our database.
  // 	Prisma + SQLite does not support bulk insertion & conflict handling, so we have to insert these 1 by 1
  // 	(resulting in multiple round-trips to the database).
  //  Always use a single `bulkInsert` query with proper `onConflict` handling in production databases (e.g Postgres)
  const promises = Object.values(updates).map((update) =>
    prisma.proposal.upsert({
      where: {
        objectId: update.objectId,
      },
      create: update,
      update,
    })
  );
  await Promise.all(promises);
};
