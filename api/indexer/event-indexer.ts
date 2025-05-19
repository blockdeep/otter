// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import {
  EventId,
  SuiClient,
  SuiEvent,
  SuiEventFilter,
} from "@mysten/sui/client";

import { CONFIG } from "../config";
import { prisma } from "../db";
import { getClient } from "../sui-utils";
import { handleGovernanceObjects } from "./governance-handler";

type SuiEventsCursor = EventId | null | undefined;

type EventExecutionResult = {
  cursor: SuiEventsCursor;
  hasNextPage: boolean;
};

type EventTracker = {
  // The module that defines the type, with format `package::module`
  type: string;
  filter: SuiEventFilter;
  callback: (events: SuiEvent[], type: string) => any;
};

// Cache to keep track of active trackers
const activeTrackers: Map<string, { tracker: EventTracker; active: boolean }> =
  new Map();

// Build events to track from database
const buildEventsToTrack = async (): Promise<EventTracker[]> => {
  const governanceAddresses = await prisma.governanceAddress.findMany({
    where: {
      active: true,
      moduleName: { not: null }, // Only include contracts with known modules
    },
    select: { address: true, moduleName: true },
  });

  return [
    ...governanceAddresses.map((gov) => ({
      type: `${gov.address}::${gov.moduleName}`,
      filter: {
        MoveEventModule: {
          module: gov.moduleName as string,
          package: gov.address,
        },
      },
      callback: handleGovernanceObjects,
    })),
  ];
};

const executeEventJob = async (
  client: SuiClient,
  tracker: EventTracker,
  cursor: SuiEventsCursor
): Promise<EventExecutionResult> => {
  try {
    // Check if this tracker is still active
    const trackerInfo = activeTrackers.get(tracker.type);
    if (!trackerInfo || !trackerInfo.active) {
      console.log(`Tracker ${tracker.type} is no longer active, stopping`);
      return {
        cursor,
        hasNextPage: false,
      };
    }

    // get the events from the chain.
    // For this implementation, we are going from start to finish.
    // This will also allow filling in a database from scratch!
    const { data, hasNextPage, nextCursor } = await client.queryEvents({
      query: tracker.filter,
      cursor,
      order: "ascending",
    });

    // handle the data transformations defined for each event
    await tracker.callback(data, tracker.type);

    // We only update the cursor if we fetched extra data (which means there was a change).
    if (nextCursor && data.length > 0) {
      await saveLatestCursor(tracker, nextCursor);

      return {
        cursor: nextCursor,
        hasNextPage,
      };
    }
  } catch (e) {
    console.error(`Error in event job for ${tracker.type}:`, e);
  }
  // By default, we return the same cursor as passed in.
  return {
    cursor,
    hasNextPage: false,
  };
};

const runEventJob = async (
  client: SuiClient,
  tracker: EventTracker,
  cursor: SuiEventsCursor
) => {
  // Check if this tracker is still active
  const trackerInfo = activeTrackers.get(tracker.type);
  if (!trackerInfo || !trackerInfo.active) {
    console.log(`Skipping inactive tracker: ${tracker.type}`);
    return;
  }

  const result = await executeEventJob(client, tracker, cursor);

  // Trigger a timeout. Depending on the result, we either wait 0ms or the polling interval.
  setTimeout(
    () => {
      runEventJob(client, tracker, result.cursor);
    },
    result.hasNextPage ? 0 : CONFIG.POLLING_INTERVAL_MS
  );
};

/**
 * Gets the latest cursor for an event tracker, either from the DB (if it's undefined)
 *  or from the running cursors.
 */
const getLatestCursor = async (tracker: EventTracker) => {
  const cursor = await prisma.cursor.findUnique({
    where: {
      id: tracker.type,
    },
  });

  return cursor || undefined;
};

/**
 * Saves the latest cursor for an event tracker to the db, so we can resume
 * from there.
 * */
const saveLatestCursor = async (tracker: EventTracker, cursor: EventId) => {
  const data = {
    eventSeq: cursor.eventSeq,
    txDigest: cursor.txDigest,
  };

  return prisma.cursor.upsert({
    where: {
      id: tracker.type,
    },
    update: data,
    create: { id: tracker.type, ...data },
  });
};

/**
 * Start tracking a new governance address
 */
const startTracking = async (address: string, moduleName: string) => {
  const trackerType = `${address}::${moduleName}`;

  // Check if we're already tracking this address
  if (activeTrackers.has(trackerType)) {
    const existingTracker = activeTrackers.get(trackerType);
    if (existingTracker && !existingTracker.active) {
      console.log(`Reactivating tracker for ${trackerType}`);
      existingTracker.active = true;
    } else {
      console.log(`Already tracking ${trackerType}`);
      return;
    }
  } else {
    // Create a new tracker
    const newTracker: EventTracker = {
      type: trackerType,
      filter: {
        MoveEventModule: {
          module: moduleName,
          package: address,
        },
      },
      callback: handleGovernanceObjects,
    };

    activeTrackers.set(trackerType, { tracker: newTracker, active: true });

    console.log(`Starting new tracker for ${trackerType}`);

    // Start the event job
    runEventJob(
      getClient(CONFIG.NETWORK),
      newTracker,
      await getLatestCursor(newTracker)
    );
  }
};

/**
 * Stop tracking a governance address
 */
const stopTracking = (address: string, moduleName: string) => {
  const trackerType = `${address}::${moduleName}`;

  if (activeTrackers.has(trackerType)) {
    console.log(`Deactivating tracker for ${trackerType}`);
    const trackerInfo = activeTrackers.get(trackerType);
    if (trackerInfo) {
      trackerInfo.active = false;
    }
  }
};

/**
 * Refresh the list of active trackers from the database
 */
export const refreshTrackers = async () => {
  console.log("Refreshing governance trackers...");

  const governanceAddresses = await prisma.governanceAddress.findMany({
    where: {
      moduleName: { not: null },
    },
    select: { address: true, moduleName: true, active: true },
  });

  // Start tracking for new or reactivated addresses
  for (const gov of governanceAddresses) {
    if (gov.active && gov.moduleName) {
      await startTracking(gov.address, gov.moduleName);
    } else if (!gov.active && gov.moduleName) {
      stopTracking(gov.address, gov.moduleName);
    }
  }

  // Find and stop tracking for addresses that are no longer in the database
  for (const [trackerType, trackerInfo] of activeTrackers.entries()) {
    // Check if this tracker's address is still in the database
    const [address, moduleName] = trackerType.split("::");
    const stillExists = governanceAddresses.some(
      (gov) =>
        gov.address === address && gov.moduleName === moduleName && gov.active
    );

    if (!stillExists && trackerInfo.active) {
      console.log(`Stopping tracker for removed governance: ${trackerType}`);
      trackerInfo.active = false;
    }
  }

  console.log(
    `Active trackers: ${Array.from(activeTrackers.entries())
      .filter(([_, info]) => info.active)
      .map(([type]) => type)
      .join(", ")}`
  );
};

/// Sets up all the listeners for the events we want to track.
/// They are polling the RPC endpoint every second.
export const setupListeners = async () => {
  // Initial load of trackers
  const eventsToTrack = await buildEventsToTrack();

  // Initialize active trackers map
  for (const event of eventsToTrack) {
    activeTrackers.set(event.type, { tracker: event, active: true });
  }

  // Start all trackers
  for (const event of eventsToTrack) {
    runEventJob(getClient(CONFIG.NETWORK), event, await getLatestCursor(event));
  }

  // Set up a periodic refresh of trackers
  setInterval(refreshTrackers, CONFIG.TRACKER_REFRESH_INTERVAL_MS || 30000); // Default to 30 seconds if not configured
};
