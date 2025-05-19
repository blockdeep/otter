// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { GovernableAction, ParameterInfo } from "./actionIdentifier";
import { findMainStruct } from "./contractExtractor";

interface AdditionalParamInfo {
  name: string;
  type: string;
  origParam: ParameterInfo;
}

/**
 * Generate a governance contract for a Move contract
 */
export function generateGovernanceContract(
  moduleInfo: any,
  governableActions: GovernableAction[],
  contractCode: string,
  mainStructName?: string // Add optional parameter for when we know the struct name
): string {
  if (governableActions.length === 0) {
    throw new Error("No governable actions selected for the contract");
  }

  // Extract the exact module name from the module declaration
  const moduleDeclaration = contractCode.match(/module\s+(\w+)::(\w+);/);
  const exactModuleName = moduleDeclaration
    ? moduleDeclaration[2]
    : moduleInfo.moduleName;

  // Use provided main struct name or try to find it in contract code
  const mainStruct =
    mainStructName || findMainStruct(contractCode) || "AppObject";

  // Generate the proposal kind enum based on governable actions
  const proposalKindEnum = generateProposalKindEnum(governableActions);

  // Generate the execute_proposal function with dynamically identified parameters
  const executeProposalFunction = generateExecuteProposalFunction(
    moduleInfo,
    governableActions,
    exactModuleName,
    mainStruct
  );

  // Generate proposal creation function
  const proposalCreationLogic =
    generateProposalCreationLogic(governableActions);

  // Generate the complete governance contract with the dynamically generated execute_proposal function
  return `// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

module ${moduleInfo.packageName}_governance::governance {
    use std::string::{Self, String};
    use sui::table::{Self, Table};
    use sui::tx_context::{sender};
    use sui::vec_map::{Self, VecMap};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::clock::{Self, Clock};
    
    // Import the govtoken module
    use ${moduleInfo.packageName}_governance::govtoken::{GOVTOKEN};
    
    // Import the app module being governed
    use ${moduleInfo.packageName}::${moduleInfo.moduleName};
    
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
    }
    
    /// Capability for administration
    public struct GovernanceAdminCap has key, store {
        id: UID,
    }
    
    /// Proposal Kinds -- SPECIFIC TO THE CONTRACT THAT HAS TO BE GOVERNED
    ${proposalKindEnum}
    
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
    fun init(ctx: &mut TxContext) {
        // Create admin capability
        let admin_cap = GovernanceAdminCap {
            id: object::new(ctx),
        };
        
        // Create and share the GovernanceSystem
        transfer::share_object(GovernanceSystem {
            id: object::new(ctx),
            proposals: table::new(ctx),
            next_proposal_id: 0,
            admin: sender(ctx),
            total_token_supply: 0, // Will be updated by admin
        });
        
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
    ${proposalCreationLogic}
    
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
    ${executeProposalFunction}
    
    /// Helper to create a unique key for dynamic fields
    fun combine_key(id: ID, key: String): vector<u8> {
        let mut result = object::id_to_bytes(&id);
        let key_bytes = *string::as_bytes(&key);
        
        let mut i = 0;
        let len = vector::length(&key_bytes);
        while (i < len) {
            vector::push_back(&mut result, *vector::borrow(&key_bytes, i));
            i = i + 1;
        };
        
        result
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
}`;
}

/**
 * Generate the proposal kind enum based on governable actions
 */
function generateProposalKindEnum(
  governableActions: GovernableAction[]
): string {
  // Generate the proposal kind enum based on governable actions
  const enumVariants = governableActions
    .map((action) => {
      // Get non-main object parameters
      const relevantParams = action.parameters.filter((param) => {
        const type = param.type.toLowerCase();
        // Filter out main object parameters and common system parameters
        return (
          !type.includes("txcontext") &&
          !type.includes("clock") &&
          !type.includes("governance") &&
          !type.includes("campaign") &&
          !type.includes("&mut") // Exclude mutable references
        );
      });

      // Create enum variant with parameters if needed
      if (relevantParams.length > 0) {
        const params = relevantParams
          .map((param) => `${param.name}: ${param.type}`)
          .join(", ");
        return `        ${capitalizeFirstLetter(action.name)} { ${params} }`;
      } else {
        return `        ${capitalizeFirstLetter(action.name)}`;
      }
    })
    .join(",\n");

  return `public enum ProposalKind has drop, store {
${enumVariants}
    }`;
}

/**
 * Generate the execute_proposal function with dynamically identified parameters
 */
function generateExecuteProposalFunction(
  moduleInfo: any,
  governableActions: GovernableAction[],
  exactModuleName: string,
  mainStruct: string
): string {
  // Create a set to track already added types to prevent duplicates
  const addedTypeSignatures = new Set<string>();
  const additionalObjectParams: AdditionalParamInfo[] = [];

  // First, identify all unique object parameters across all actions
  governableActions.forEach((action) => {
    action.parameters.forEach((param) => {
      // Skip common parameters like TxContext and Clock
      if (
        param.type.toLowerCase().includes("txcontext") ||
        param.type.toLowerCase().includes("clock")
      ) {
        return;
      }

      // Skip the main struct parameter which is already handled
      if (
        param.type.toLowerCase().includes(mainStruct.toLowerCase()) ||
        (param.type.toLowerCase().includes("campaign") &&
          mainStruct.includes("Campaign")) ||
        (param.type.toLowerCase().includes("counter") &&
          mainStruct.includes("Counter"))
      ) {
        return;
      }

      // Keep all other object parameters
      if (
        param.type.includes("&") ||
        param.type.includes("Capability") ||
        param.type.includes("Cap")
      ) {
        // Extract the proper reference type '&' or '&mut'
        const isReference = param.type.includes("&");
        const isMutableRef = param.type.includes("&mut");

        // Extract the type name from the original type
        const typeMatch = param.type.match(/([a-zA-Z0-9_]+)(?:\>|$)/);
        const typeName = typeMatch ? typeMatch[1] : "ObjParam";

        // Create a normalized type signature for deduplication
        let fullTypePath: string;

        // If it already has a full path, use it as is
        if (param.type.includes("::")) {
          fullTypePath = param.type;
        }
        // Otherwise, construct the full path
        else {
          if (isMutableRef) {
            fullTypePath = `&mut ${moduleInfo.packageName}::${exactModuleName}::${typeName}`;
          } else if (isReference) {
            fullTypePath = `&${moduleInfo.packageName}::${exactModuleName}::${typeName}`;
          } else {
            fullTypePath = `${moduleInfo.packageName}::${exactModuleName}::${typeName}`;
          }
        }

        // Create a unique parameter name
        const baseName = param.name || `${typeName.toLowerCase()}_param`;
        let paramName = baseName;

        // Ensure unique parameter names
        let counter = 1;
        while (additionalObjectParams.some((p) => p.name === paramName)) {
          paramName = `${baseName}_${counter}`;
          counter++;
        }

        // Use a normalized type signature for deduplication check
        const typeSignature = fullTypePath.toLowerCase();

        // Only add if we haven't already added this type
        if (!addedTypeSignatures.has(typeSignature)) {
          addedTypeSignatures.add(typeSignature);
          additionalObjectParams.push({
            name: paramName,
            type: fullTypePath,
            origParam: param,
          });
        }
      }
    });
  });

  // Generate the parameter list for execute_proposal
  let paramList = [
    "self: &mut GovernanceSystem",
    "proposal_id: ID",
    `app_object: &mut ${moduleInfo.packageName}::${exactModuleName}::${mainStruct}`,
  ];

  // Add additional parameters
  additionalObjectParams.forEach((paramInfo) => {
    paramList.push(`${paramInfo.name}: ${paramInfo.type}`);
  });

  // Always add context
  paramList.push("ctx: &mut TxContext");

  // Pass the additional parameters to the execution logic generator
  const executionLogic = generateExecutionLogic(
    moduleInfo,
    governableActions,
    exactModuleName,
    mainStruct,
    additionalObjectParams
  );

  return `public entry fun execute_proposal(
        ${paramList.join(",\n        ")}
    ) {
        // Ensure proposal exists
        assert!(table::contains(&self.proposals, proposal_id), EProposalNotFound);
        let proposal = table::borrow_mut(&mut self.proposals, proposal_id);
        
        // Ensure proposal passed
        assert!(proposal.status == PROPOSAL_STATUS_PASSED, EProposalNotFinalized);
        
        // Execute the proposal based on its kind - SPECIFIC TO THE APP CONTRACT
        ${executionLogic}
        
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
    }`;
}

/**
 * Generate execution logic for each governable action
 */
function generateExecutionLogic(
  moduleInfo: any,
  governableActions: GovernableAction[],
  exactModuleName: string,
  mainStruct: string,
  additionalParams: AdditionalParamInfo[] = []
): string {
  // Generate execution logic for each governable action
  return `match (&proposal.kind) {
            ${governableActions
              .map((action) => {
                // Get value parameters to include in the match pattern
                const valueParams = action.parameters.filter((param) => {
                  const type = param.type.toLowerCase();
                  return (
                    !type.includes("txcontext") &&
                    !type.includes("clock") &&
                    !type.includes("&") &&
                    !type.includes("capability") &&
                    !type.includes("cap") &&
                    !type.includes(mainStruct.toLowerCase()) &&
                    !type.includes("campaign") &&
                    !type.includes("counter")
                  );
                });

                // Construct the parameter list for the function call
                const functionParams: string[] = [];

                // Analyze the parameter order from the function definition
                action.parameters.forEach((param) => {
                  const paramType = param.type.toLowerCase();

                  // Main struct parameter
                  if (
                    paramType.includes(mainStruct.toLowerCase()) ||
                    (paramType.includes("campaign") &&
                      mainStruct.includes("Campaign")) ||
                    (paramType.includes("counter") &&
                      mainStruct.includes("Counter"))
                  ) {
                    functionParams.push("app_object");
                  }
                  // Value parameters from ProposalKind enum
                  else if (
                    !paramType.includes("&") &&
                    !paramType.includes("txcontext") &&
                    !paramType.includes("clock") &&
                    !paramType.includes("capability") &&
                    !paramType.includes("cap")
                  ) {
                    // Find the corresponding value parameter
                    const valueParam = valueParams.find(
                      (vp) => vp.name === param.name || vp.type === param.type
                    );
                    if (valueParam) {
                      functionParams.push(`*${valueParam.name}`);
                    }
                  }
                  // Object parameters (non-main)
                  else if (
                    (paramType.includes("&") ||
                      paramType.includes("capability") ||
                      paramType.includes("cap")) &&
                    !paramType.includes("txcontext") &&
                    !paramType.includes("clock")
                  ) {
                    // Extract key type information for matching
                    const typeMatch = param.type.match(
                      /([a-zA-Z0-9_]+)(?:\>|$)/
                    );
                    const typeName = typeMatch
                      ? typeMatch[1].toLowerCase()
                      : "";

                    // Try to find a matching parameter
                    const matchingParam = additionalParams.find((ap) => {
                      const apType = ap.type.toLowerCase();
                      // Match by type name, reference style, or parameter name
                      return (
                        apType.includes(typeName) ||
                        (param.name &&
                          ap.name
                            .toLowerCase()
                            .includes(param.name.toLowerCase())) ||
                        (typeName && ap.type.toLowerCase().includes(typeName))
                      );
                    });

                    if (matchingParam) {
                      functionParams.push(matchingParam.name);
                    }
                  }
                  // TxContext parameter
                  else if (paramType.includes("txcontext")) {
                    functionParams.push("ctx");
                  }
                });

                const paramString = functionParams.join(", ");

                if (valueParams.length > 0) {
                  const paramNames = valueParams
                    .map((param) => `${param.name}`)
                    .join(", ");
                  return `ProposalKind::${capitalizeFirstLetter(
                    action.name
                  )} { ${paramNames} } => {
                ${exactModuleName}::${action.name}(${paramString})
            }`;
                } else {
                  return `ProposalKind::${capitalizeFirstLetter(
                    action.name
                  )} => {
                ${exactModuleName}::${action.name}(${paramString})
            }`;
                }
              })
              .join(",\n            ")}
        };`;
}

/**
 * Generate proposal creation function with parameters for all governable actions
 */
function generateProposalCreationLogic(
  governableActions: GovernableAction[]
): string {
  // Collect all unique parameters that aren't common system parameters
  const allParams = new Map<string, string>();

  governableActions.forEach((action, actionIndex) => {
    action.parameters.forEach((param) => {
      const type = param.type.toLowerCase();
      // Skip common parameters and main object parameters
      if (
        !type.includes("txcontext") &&
        !type.includes("clock") &&
        !type.includes("governance") &&
        !type.includes("campaign") &&
        !type.includes("counter") && // Exclude main struct parameters
        !type.includes("&mut")
      ) {
        // Create unique parameter name by combining action index and param name
        const uniqueName = `${param.name}_${actionIndex}`;
        allParams.set(uniqueName, `${param.type}, // For ${action.name}`);
      }
    });
  });

  // Add comma after the last parameter
  const parameterList = Array.from(allParams.entries())
    .map(([name, type]) => `${name}: ${type}`)
    .join(",\n        ");

  return `public entry fun create_proposal(
        self: &mut GovernanceSystem,
        governance_coins: &Coin<GOVTOKEN>,
        title: String,
        description: String,
        voting_period_seconds: u64,
        clock: &Clock,
        proposal_kind: u8, // 0-${
          governableActions.length - 1
        } for different proposal types
        ${parameterList}
        ctx: &mut TxContext,
    ) : ID {
        let pK: ProposalKind;
        // Create the appropriate proposal kind based on the proposal_kind parameter
        match (proposal_kind) {
            ${governableActions
              .map((action, index) => {
                const filteredParams = action.parameters.filter((param) => {
                  const type = param.type.toLowerCase();
                  return (
                    !type.includes("txcontext") &&
                    !type.includes("clock") &&
                    !type.includes("governance") &&
                    !type.includes("campaign") &&
                    !type.includes("counter") && // Exclude main struct parameters
                    !type.includes("&mut")
                  );
                });

                if (filteredParams.length > 0) {
                  const paramAssignments = filteredParams
                    .map((param) => `${param.name}: ${param.name}_${index}`)
                    .join(", ");
                  return `${index} => {
                pK = ProposalKind::${capitalizeFirstLetter(
                  action.name
                )} { ${paramAssignments} };
            },`; // Added comma here
                } else {
                  return `${index} => {
                pK = ProposalKind::${capitalizeFirstLetter(action.name)};
            },`; // Added comma here
                }
              })
              .join("\n            ")}
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
    }`;
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
