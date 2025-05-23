// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

module crowdfund_governance::governance {
    use std::string::{String};
    use sui::table::{Self, Table};
    use sui::tx_context::{sender};
    use sui::vec_map::{Self, VecMap};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::clock::{Self, Clock};
    
    // Import the govtoken module
    use crowdfund_governance::govtoken::{GOVTOKEN};
    
    // Import the app module being governed
    use crowdfund::Crowdfund;

    // Import the app module being governed AND its capability
    use crowdfund::Crowdfund::{GovernanceCapability};
    
    /// Error constants
    const EInsufficientVotingPower: u64 = 1;
    const EProposalNotActive: u64 = 2;
    const EAlreadyVoted: u64 = 3;
    const EProposalNotFinalized: u64 = 5;
    const ENotAuthorized: u64 = 6;
    const EProposalStillActive: u64 = 7;
    const EInvalidVoteType: u64 = 8;
    const EProposalNotFound: u64 = 9;
    const EInvalidProposalKind: u64 = 10;
    
    /// Minimum tokens required to create a proposal
    const MIN_PROPOSAL_THRESHOLD: u64 = 100_000_000; // 1 token with 8 decimals
    
    /// Minimum percentage of total voting power that must vote for a proposal to be valid
    const QUORUM_PERCENTAGE: u64 = 4; // 4% of total supply
    
    /// Proposal status enum
    const PROPOSAL_STATUS_ACTIVE: u8 = 0;
    const PROPOSAL_STATUS_PASSED: u8 = 1;
    const PROPOSAL_STATUS_REJECTED: u8 = 2;
    const PROPOSAL_STATUS_EXECUTED: u8 = 3;
    const PROPOSAL_STATUS_CANCELLED: u8 = 4;
    
    /// Vote types
    const VOTE_YES: u8 = 0;
    const VOTE_NO: u8 = 1;
    const VOTE_ABSTAIN: u8 = 2;
    
    /// Core governance system object
    public struct GovernanceSystem has key {
        id: UID,
        /// All governance proposals
        proposals: Table<ID, Proposal>,
        /// Counter for proposal IDs
        next_proposal_id: u64,
        /// Admin address
        admin: address,
        /// Total token supply for quorum calculation
        total_token_supply: u64,
        governance_capability: GovernanceCapability,
    }
    
    /// Capability for administration
    public struct GovernanceAdminCap has key, store {
        id: UID,
    }
    
    /// Proposal Kinds -- SPECIFIC TO THE CONTRACT THAT HAS TO BE GOVERNED
    public enum ProposalKind has drop, store {
        Transfer_funds { recipient: address, amount: u64 }
    }
    
    /// A governance proposal
    public struct Proposal has key, store {
        /// Unique proposal identifier
        id: UID,
        /// Creator of the proposal
        creator: address,
        /// Title of the proposal
        title: String,
        /// Description of the proposal
        description: String,
        /// Current status of the proposal
        status: u8,
        /// Kind of the proposal
        kind: ProposalKind,
        /// Vote counts
        yes_votes: u64,
        no_votes: u64,
        abstain_votes: u64,
        /// Total voting power at proposal creation (for quorum calculation)
        total_voting_power: u64,
        /// Addresses that have voted (to prevent double voting)
        voted: VecMap<address, bool>,
        /// Timestamp when proposal was created
        created_at: u64,
        /// Timestamp when voting ends
        voting_ends_at: u64,
    }
    
    /// Receipt for a vote
    public struct VoteReceipt has key, store {
        id: UID,
        /// The proposal ID this vote is for
        proposal_id: ID,
        /// The voter address
        voter: address,
        /// The vote type
        vote_type: u8,
        /// The voting power used
        voting_power: u64,
    }
    
    /// Events
    public struct ProposalCreated has copy, drop {
        proposal_id: ID,
        creator: address,
        title: String,
        description: String,
        voting_ends_at: u64,
        threshold: u64,
    }
    
    public struct VoteCast has copy, drop {
        proposal_id: ID,
        voter: address,
        vote_type: u8, // 0 = yes, 1 = no, 2 = abstain
        voting_power: u64,
    }
    
    public struct ProposalStatusChanged has copy, drop {
        proposal_id: ID,
        new_status: u8,
    }
    
    public struct ProposalExecuted has copy, drop {
        proposal_id: ID,
        executor: address,
    }
    
    // === Initialize the governance system ===
    public entry fun initialize_governance(
        governance_cap: GovernanceCapability, // ← Receive capability
        ctx: &mut TxContext,
    ) {
        // Create admin capability
        let admin_cap = GovernanceAdminCap {
            id: object::new(ctx),
        };
        
        // Create and share the GovernanceSystem WITH capability
        let governance_system = GovernanceSystem {
            id: object::new(ctx),
            proposals: table::new(ctx),
            next_proposal_id: 0,
            admin: sender(ctx),
            total_token_supply: 0,
            governance_capability: governance_cap, // ← Store immediately
        };
        
        transfer::share_object(governance_system);
        
        // Transfer admin cap to sender
        transfer::transfer(admin_cap, sender(ctx));
    }

    // === Administration functions ===
    
    /// Update the total token supply (for quorum calculations)
    public entry fun update_total_supply(
        _admin_cap: &GovernanceAdminCap,
        self: &mut GovernanceSystem,
        new_supply: u64,
    ) {
        self.total_token_supply = new_supply;
    }
    
    /// Update the admin address
    public entry fun update_admin(
        _admin_cap: &GovernanceAdminCap,
        self: &mut GovernanceSystem,
        new_admin: address,
    ) {
        self.admin = new_admin;
    }
    
    // === Proposal management ===
   
    /// Create a proposal function
    public entry fun create_proposal(
        self: &mut GovernanceSystem,
        governance_coins: &Coin<GOVTOKEN>,
        title: String,
        description: String,
        voting_period_seconds: u64,
        clock: &Clock,
        proposal_kind: u8, // 0-0 for different proposal types
        recipient_0: address, // For transfer_funds,
        amount_0: u64, // For transfer_funds
        ctx: &mut TxContext,
    ) : ID {
        let pK: ProposalKind;
        // Create the appropriate proposal kind based on the proposal_kind parameter
        match (proposal_kind) {
            0 => {
                pK = ProposalKind::Transfer_funds { recipient: recipient_0, amount: amount_0 };
            },
            _ => {
                abort EInvalidProposalKind
            }
        };
        
        // Ensure the coin owner has enough tokens to create a proposal
        let voting_power = coin::value(governance_coins);
        assert!(voting_power >= MIN_PROPOSAL_THRESHOLD, EInsufficientVotingPower);
        
        let creator = sender(ctx);
        let now_ms = clock::timestamp_ms(clock);
        let voting_ends_at_ms = now_ms + (voting_period_seconds * 1000);
        let proposal_uid = object::new(ctx);
        let proposal_id = object::uid_to_inner(&proposal_uid);
        
        let proposal = Proposal {
            id: proposal_uid,
            creator,
            title,
            description,
            status: PROPOSAL_STATUS_ACTIVE,
            kind: pK,
            yes_votes: 0,
            no_votes: 0,
            abstain_votes: 0,
            total_voting_power: self.total_token_supply,
            voted: vec_map::empty(),
            created_at: now_ms,
            voting_ends_at: voting_ends_at_ms,
        };
        
        table::add(&mut self.proposals, proposal_id, proposal);
        self.next_proposal_id = self.next_proposal_id + 1;
        
        // Emit proposal created event
        event::emit(ProposalCreated {
            proposal_id,
            creator,
            title,
            description,
            voting_ends_at: voting_ends_at_ms,
            threshold: MIN_PROPOSAL_THRESHOLD,
        });
        
        proposal_id
    }
    
    /// Cast a vote on a proposal
    public entry fun vote(
        self: &mut GovernanceSystem,
        proposal_id: ID,
        governance_coins: &Coin<GOVTOKEN>,
        vote_type: u8,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        // Validate vote type
        assert!(
            vote_type == VOTE_YES || vote_type == VOTE_NO || vote_type == VOTE_ABSTAIN,
            EInvalidVoteType
        );
        
        // Get the proposal
        assert!(table::contains(&self.proposals, proposal_id), EProposalNotFound);
        let proposal = table::borrow_mut(&mut self.proposals, proposal_id);
        
        // Check if proposal is active
        assert!(proposal.status == PROPOSAL_STATUS_ACTIVE, EProposalNotActive);
        
        // Check if current time is before voting ends
        assert!(clock::timestamp_ms(clock) <= proposal.voting_ends_at, EProposalNotActive);
        
        // No need to verify coin ownership since coins can only be used by their owner in a transaction
        let voter = sender(ctx);
        
        // Check if user has already voted
        assert!(!vec_map::contains(&proposal.voted, &voter), EAlreadyVoted);
        
        // Record the vote
        vec_map::insert(&mut proposal.voted, voter, true);
        
        // Add votes according to voting power based on coin balance
        let voting_power = coin::value(governance_coins);
        
        if (vote_type == VOTE_YES) {
            proposal.yes_votes = proposal.yes_votes + voting_power;
        } else if (vote_type == VOTE_NO) {
            proposal.no_votes = proposal.no_votes + voting_power;
        } else if (vote_type == VOTE_ABSTAIN) {
            proposal.abstain_votes = proposal.abstain_votes + voting_power;
        };
        
        // Create vote receipt
        let receipt = VoteReceipt {
            id: object::new(ctx),
            proposal_id,
            voter,
            vote_type,
            voting_power,
        };
        
        // Emit vote cast event
        event::emit(VoteCast {
            proposal_id,
            voter,
            vote_type,
            voting_power,
        });
        
        transfer::transfer(receipt, voter)
    }
    
    /// Finalize a proposal after voting period ends
    public entry fun finalize_proposal(
        self: &mut GovernanceSystem,
        proposal_id: ID,
        clock: &Clock,
        _ctx: &mut TxContext,
    ) {
        // Check that proposal exists
        assert!(table::contains(&self.proposals, proposal_id), EProposalNotFound);
        let proposal = table::borrow_mut(&mut self.proposals, proposal_id);
        
        // Check if voting period has ended
        assert!(clock::timestamp_ms(clock) > proposal.voting_ends_at, EProposalStillActive);
        assert!(proposal.status == PROPOSAL_STATUS_ACTIVE, EProposalNotActive);
        
        // Check if quorum was reached
        let total_votes = proposal.yes_votes + proposal.no_votes + proposal.abstain_votes;
        let quorum_threshold = (proposal.total_voting_power * QUORUM_PERCENTAGE) / 100;
        
        let new_status;
        
        if (total_votes >= quorum_threshold) {
            // Determine if proposal passed or failed
            if (proposal.yes_votes > proposal.no_votes) {
                new_status = PROPOSAL_STATUS_PASSED;
            } else {
                new_status = PROPOSAL_STATUS_REJECTED;
            };
        } else {
            // Not enough participation
            new_status = PROPOSAL_STATUS_REJECTED;
        };
        
        proposal.status = new_status;
        
        // Emit status change event
        event::emit(ProposalStatusChanged {
            proposal_id,
            new_status,
        });
    }
    
    /// Cancel an active proposal (only creator or admin)
    public entry fun cancel_proposal(
        self: &mut GovernanceSystem,
        proposal_id: ID,
        ctx: &mut TxContext,
    ) {
        // Check that proposal exists
        assert!(table::contains(&self.proposals, proposal_id), EProposalNotFound);
        let proposal = table::borrow_mut(&mut self.proposals, proposal_id);
        
        // Only creator or admin can cancel
        let sender_addr = sender(ctx);
        assert!(
            sender_addr == proposal.creator || sender_addr == self.admin,
            ENotAuthorized
        );
        
        // Check if proposal is still active
        assert!(proposal.status == PROPOSAL_STATUS_ACTIVE, EProposalNotActive);
        
        // Set status to cancelled
        proposal.status = PROPOSAL_STATUS_CANCELLED;
        
        // Emit status change event
        event::emit(ProposalStatusChanged {
            proposal_id,
            new_status: PROPOSAL_STATUS_CANCELLED,
        });
    }
    
    /// Execute a proposal's action based on its kind
    public entry fun execute_proposal(
        self: &mut GovernanceSystem,
        proposal_id: ID,
        app_object: &mut crowdfund::Crowdfund::Campaign,
        ctx: &mut TxContext
    ) {
        // Ensure proposal exists
        assert!(table::contains(&self.proposals, proposal_id), EProposalNotFound);
        let proposal = table::borrow_mut(&mut self.proposals, proposal_id);
        
        // Ensure proposal passed
        assert!(proposal.status == PROPOSAL_STATUS_PASSED, EProposalNotFinalized);
        
        // Execute the proposal based on its kind - SPECIFIC TO THE APP CONTRACT
        match (&proposal.kind) {
            ProposalKind::Transfer_funds { recipient, amount } => {
                Crowdfund::transfer_funds(&self.governance_capability, app_object, *recipient, *amount, ctx)
            }
        };
        
        // Set proposal to executed
        proposal.status = PROPOSAL_STATUS_EXECUTED;
        
        event::emit(ProposalExecuted {
            proposal_id,
            executor: sender(ctx),
        });
        
        event::emit(ProposalStatusChanged {
            proposal_id,
            new_status: PROPOSAL_STATUS_EXECUTED,
        });
    }
        
    // === Getters ===
    
    /// Get the status of a proposal
    public fun get_proposal_status(
        self: &GovernanceSystem,
        proposal_id: ID,
    ): u8 {
        assert!(table::contains(&self.proposals, proposal_id), EProposalNotFound);
        let proposal = table::borrow(&self.proposals, proposal_id);
        proposal.status
    }
    
    /// Get voting results for a proposal
    public fun get_voting_results(
        self: &GovernanceSystem,
        proposal_id: ID,
    ): (u64, u64, u64) {
        assert!(table::contains(&self.proposals, proposal_id), EProposalNotFound);
        let proposal = table::borrow(&self.proposals, proposal_id);
        (proposal.yes_votes, proposal.no_votes, proposal.abstain_votes)
    }
    
    /// Get proposal details
    public fun get_proposal_details(
        self: &GovernanceSystem,
        proposal_id: ID,
    ): (address, String, String, u64, u64) {
        assert!(table::contains(&self.proposals, proposal_id), EProposalNotFound);
        let proposal = table::borrow(&self.proposals, proposal_id);
        (
            proposal.creator,
            proposal.title,
            proposal.description,
            proposal.created_at,
            proposal.voting_ends_at
        )
    }
    
    /// Check if an address has voted on a proposal
    public fun has_voted(
        self: &GovernanceSystem,
        proposal_id: ID,
        voter: address,
    ): bool {
        assert!(table::contains(&self.proposals, proposal_id), EProposalNotFound);
        let proposal = table::borrow(&self.proposals, proposal_id);
        vec_map::contains(&proposal.voted, &voter)
    }
    
    /// Get the total number of proposals
    public fun get_proposal_count(self: &GovernanceSystem): u64 {
        self.next_proposal_id
    }
    
    /// Get the quorum requirement as a percentage
    public fun get_quorum_percentage(): u64 {
        QUORUM_PERCENTAGE
    }
    
    /// Get the minimum proposal threshold
    public fun get_proposal_threshold(): u64 {
        MIN_PROPOSAL_THRESHOLD
    }
}