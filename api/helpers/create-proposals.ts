// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { Transaction } from '@mysten/sui/transactions';
import { CONFIG } from '../config';
import { ACTIVE_NETWORK, signAndExecute } from '../sui-utils';

/**
 * Script to create 5 demo governance proposals
 * This script:
 * 1. Creates 5 proposals (3 increment and 2 set value)
 * 2. Adds a variety of titles, descriptions, and voting periods
 * 3. Uses the GOVTOKEN for proposal creation
 */
const createDemoProposals = async () => {
    const txb = new Transaction();
    const proposalCount = 5;
    
    // References to important contract addresses
    const GOVERNANCE_PACKAGE_ID = CONFIG.SIMPLE_GOVERNANCE_CONTRACT.packageId;
    const GOVERNANCE_SYSTEM_ID = CONFIG.SIMPLE_GOVERNANCE_CONTRACT.governanceSystemId;
    
    const CLOCK_OBJECT_ID = '0x6';
    
    // Access the clock object for timestamps
    const clock = txb.object(CLOCK_OBJECT_ID);
    
    // Reference to the user's governance token
    const govTokenCoinId = CONFIG.SIMPLE_GOVERNANCE_CONTRACT.userGovTokenCoinId;
    const govToken = txb.object(govTokenCoinId);
    
    console.log(`Creating ${proposalCount} demo governance proposals...`);
    
    // Create 5 different proposals with varying properties
    // Proposal 1: Basic increment proposal with short voting period
    const proposal1 = txb.moveCall({
        target: `${GOVERNANCE_PACKAGE_ID}::governance::create_increment_proposal`,
        arguments: [
            txb.object(GOVERNANCE_SYSTEM_ID),
            govToken,
            txb.pure.string("Increment Counter: Critical System Update"),
            txb.pure.string("This proposal will increment the counter by 1. This is a critical system update that requires immediate attention. We need to ensure the counter continues to increase steadily for optimal protocol performance."),
            txb.pure.u64(86400), // 1 day voting period
            clock,
        ]
    });
    
    // Proposal 2: Set value proposal with medium value
    const proposal2 = txb.moveCall({
        target: `${GOVERNANCE_PACKAGE_ID}::governance::create_set_value_proposal`,
        arguments: [
            txb.object(GOVERNANCE_SYSTEM_ID),
            govToken,
            txb.pure.string("Set Counter to 42: The Answer"),
            txb.pure.string("This proposal will set the counter value to 42, which is widely recognized as the answer to life, the universe, and everything. This strategic value will optimize system parameters and lead to unprecedented efficiency gains."),
            txb.pure.u64(259200), // 3 days voting period
            txb.pure.u64(42), // Set to value 42
            clock,
        ]
    });
    
    // Proposal 3: Another increment proposal with medium voting period
    const proposal3 = txb.moveCall({
        target: `${GOVERNANCE_PACKAGE_ID}::governance::create_increment_proposal`,
        arguments: [
            txb.object(GOVERNANCE_SYSTEM_ID),
            govToken,
            txb.pure.string("Increment Counter: Regular Maintenance"),
            txb.pure.string("This is a regularly scheduled maintenance increment to ensure the counter continues to fulfill its crucial role in our ecosystem. Routine increments help maintain system stability and prepare for future growth."),
            txb.pure.u64(172800), // 2 days voting period
            clock,
        ]
    });
    
    // Proposal 4: Set value proposal with large value
    const proposal4 = txb.moveCall({
        target: `${GOVERNANCE_PACKAGE_ID}::governance::create_set_value_proposal`,
        arguments: [
            txb.object(GOVERNANCE_SYSTEM_ID),
            govToken,
            txb.pure.string("Set Counter to 1000: Milestone Update"),
            txb.pure.string("This significant proposal will set our counter to 1000, representing a major milestone in our protocol's development. This change signifies our entry into a new era of capabilities and sets the stage for advanced features to be developed in the future."),
            txb.pure.u64(432000), // 5 days voting period
            txb.pure.u64(1000), // Set to value 1000
            clock,
        ]
    });
    
    // Proposal 5: Another increment proposal with long voting period
    const proposal5 = txb.moveCall({
        target: `${GOVERNANCE_PACKAGE_ID}::governance::create_increment_proposal`,
        arguments: [
            txb.object(GOVERNANCE_SYSTEM_ID),
            govToken,
            txb.pure.string("Increment Counter: Strategic Enhancement"),
            txb.pure.string("This strategic increment proposal is part of our long-term roadmap to enhance system capabilities. By carefully timing this increment with other protocol developments, we maximize synergistic effects across the ecosystem."),
            txb.pure.u64(345600), // 4 days voting period
            clock,
        ]
    });
    
    // Execute the transaction
    const res = await signAndExecute(txb, ACTIVE_NETWORK);
    
    // Process the results
    if (!res || !res.digest) {
        throw new Error('Something went wrong while creating demo proposals.');
    }
    
    console.log('Successfully created demo governance proposals!');
    console.log('Transaction digest:', res.digest);
    
    // Provide details of each proposal
    console.log('Proposal details:');
    console.log('1. "Increment Counter: Critical System Update" - 1 day voting period');
    console.log('2. "Set Counter to 42: The Answer" - 3 days voting period');
    console.log('3. "Increment Counter: Regular Maintenance" - 2 days voting period');
    console.log('4. "Set Counter to 1000: Milestone Update" - 5 days voting period');
    console.log('5. "Increment Counter: Strategic Enhancement" - 4 days voting period');
    
    return res;
};

// Execute the function
createDemoProposals()
    .then(() => process.exit(0))
    .catch(error => {
        console.error("Error creating demo proposals:", error);
        process.exit(1);
    });