// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import express, { Request, Response } from 'express';

/**
 * Contract processor router
 */
const router = express.Router();

/**
 * Parse a Move contract to extract module info and identify potential governable actions
 */ // @ts-ignore
router.post('/parse-contract', async (req: Request, res: Response) => {
  try {
    const { contractCode } = req.body;
    
    if (!contractCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing contract code'
      });
    }
    
    // Extract module info from the contract
    const moduleInfo = extractModuleInfo(contractCode);
    
    // Identify all potential governable actions (public entry functions)
    const governableActions = identifyAllPotentialActions(contractCode);
    
    // Return the result
    return res.status(200).json({
      success: true,
      data: {
        moduleInfo,
        governableActions
      }
    });
  } catch (error) {
    console.error('Error parsing contract:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while parsing the contract'
    });
  }
});

/**
 * Generate a governance contract based on selected governable actions
 */ // @ts-ignore
router.post('/generate-governance', async (req: Request, res: Response) => {
  try {
    const { contractCode, governableActions } = req.body;
    
    if (!contractCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing contract code'
      });
    }
    
    if (!governableActions || !Array.isArray(governableActions) || governableActions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No governable actions selected'
      });
    }
    
    // Extract module info from the contract
    const moduleInfo = extractModuleInfo(contractCode);
    
    // Generate governance contract using only the selected actions
    const governanceContract = generateGovernanceContract(moduleInfo, governableActions, contractCode);
    
    // Return the result
    return res.status(200).json({
      success: true,
      data: {
        moduleInfo,
        governableActions,
        governanceContract
      }
    });
  } catch (error) {
    console.error('Error generating governance contract:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while generating governance contract'
    });
  }
});

// Keep the original endpoint for backward compatibility 
// @ts-ignore
router.post('/process-contract', async (req: Request, res: Response) => {
  try {
    const { contractCode } = req.body;
    
    if (!contractCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing contract code'
      });
    }
    
    // Extract module info from the contract
    const moduleInfo = extractModuleInfo(contractCode);
    
    // Identify governable actions (using the original method)
    const governableActions = identifyGovernableActions(contractCode);
    
    // Generate governance contract
    const governanceContract = generateGovernanceContract(moduleInfo, governableActions, contractCode);
    
    // Return the result
    return res.status(200).json({
      success: true,
      data: {
        moduleInfo,
        governableActions,
        governanceContract
      }
    });
  } catch (error) {
    console.error('Error processing contract:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while processing the contract'
    });
  }
});

// ==========================================================================
// Helper functions for contract processing
// ==========================================================================

/**
 * Extract module information from a Move contract
 */
function extractModuleInfo(contractCode: string): any {
  // Extract module name and package
  const moduleRegex = /module\s+([a-zA-Z0-9_]+)::([a-zA-Z0-9_]+)\s*{/;
  const moduleMatch = contractCode.match(moduleRegex);
  
  if (!moduleMatch) {
    throw new Error('Unable to detect module name and package');
  }
  
  const packageName = moduleMatch[1];
  const moduleName = moduleMatch[2];
  
  return {
    packageName,
    moduleName
  };
}

/**
 * Parameter information for governable functions
 */
interface ParameterInfo {
  name: string;
  type: string;
}

/**
 * Information about a governable action
 */
interface GovernableAction {
  name: string;
  parameters: ParameterInfo[];
  description?: string;
}

/**
 * Identify all public entry functions in a Move contract 
 * without applying filtering heuristics
 */
function identifyAllPotentialActions(contractCode: string): GovernableAction[] {
  const potentialActions: GovernableAction[] = [];
  
  // Look for all public | entry functions
  const functionRegex = /public\s+(entry\s+)?fun\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/g;
  
  let match;
  while ((match = functionRegex.exec(contractCode)) !== null) {
    const functionName = match[2];
    const parametersRaw = match[3];
    
    // Parse parameters
    const parameters = parseParameters(parametersRaw);
    
    // Extract function description from comments above the function
    const description = extractFunctionDescription(contractCode, functionName);
    
    // Add to potential governable actions with description
    potentialActions.push({
      name: functionName,
      parameters,
      description
    });
  }
  
  return potentialActions;
}

/**
 * Extract function description from comments
 */
function extractFunctionDescription(contractCode: string, functionName: string): string | undefined {
  // Look for comments above the function declaration
  const commentRegex = new RegExp(`((?:\\/\\/.*\\n)+)\\s*public\\s+(entry\\s+)?fun\\s+${functionName}\\s*\\(`, 'm');
  const match = contractCode.match(commentRegex);
  
  if (match && match[1]) {
    // Clean up the comment
    return match[1]
      .split('\n')
      .map(line => line.replace(/^\s*\/\/\s*/, '').trim())
      .filter(line => line)
      .join(' ');
  }
  
  // Try to determine a description based on the function name
  const stateChangeKeywords = {
    'set': 'Sets or updates a value',
    'update': 'Updates a value or state',
    'change': 'Changes a value or state',
    'modify': 'Modifies a value or state',
    'create': 'Creates a new resource or entry',
    'add': 'Adds a new item or value',
    'remove': 'Removes an item or value',
    'delete': 'Deletes an item or resource',
    'increment': 'Increments a counter or value',
    'decrement': 'Decrements a counter or value'
  };
  
  for (const [keyword, description] of Object.entries(stateChangeKeywords)) {
    if (functionName.toLowerCase().includes(keyword)) {
      return `${description} (auto-detected)`;
    }
  }
  
  return 'Executes a state change in the contract';
}

/**
 * Identify governable actions in a Move contract with original heuristics
 * for backward compatibility
 */
function identifyGovernableActions(contractCode: string): GovernableAction[] {
  const governableActions: GovernableAction[] = [];
  
  // Look for public | entry functions
  const functionRegex =  /public\s+(entry\s+)?fun\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/g;
  
  let match;
  while ((match = functionRegex.exec(contractCode)) !== null) {
    const functionName = match[2];
    const parametersRaw = match[3];
    
    // Parse parameters
    const parameters = parseParameters(parametersRaw);
    
    // Check if the function is a good governance candidate
    if (isFunctionGovernable(functionName, parameters, contractCode)) {
      governableActions.push({
        name: functionName,
        parameters
      });
    }
  }
  
  return governableActions;
}

/**
 * Parse parameters from a parameter string
 */
function parseParameters(parametersRaw: string): ParameterInfo[] {
  if (!parametersRaw.trim()) return [];
  
  const paramList = parametersRaw.split(',').map(p => p.trim());
  return paramList.map(param => {
    const [name, type] = param.split(':').map(p => p.trim());
    return { name, type };
  });
}

/**
 * Determine if a function is a good governance candidate
 */
function isFunctionGovernable(
  functionName: string, 
  parameters: ParameterInfo[], 
  contractCode: string
): boolean {
  // Functions that modify state and don't require special capabilities are good candidates
  
  // 1. Check if function name suggests a state change
  const stateChangeKeywords = ['set', 'update', 'change', 'modify', 'create', 'add', 'remove', 'delete', 'increment'];
  const hasStateChangeKeyword = stateChangeKeywords.some(keyword => 
    functionName.toLowerCase().includes(keyword)
  );
  
  // 2. Check if function parameters seem governable (don't require special capabilities)
  const requiresSpecialCapability = parameters.some(param => 
    param.type.includes('Cap') || 
    param.type.includes('Admin') || 
    param.name.includes('admin')
  );
  
  // 3. Look for state modifications in function body
  const functionBodyRegex = new RegExp(`fun\\s+${functionName}\\s*\\(.*?\\)\\s*{([\\s\\S]*?)}`, 's');
  const functionBodyMatch = contractCode.match(functionBodyRegex);
  const functionBody = functionBodyMatch ? functionBodyMatch[1] : '';
  
  const hasStateModification = 
    functionBody.includes('.') || // Field access
    functionBody.includes('=') || // Assignment
    functionBody.includes('::');  // Module function calls
  
  return hasStateChangeKeyword && !requiresSpecialCapability && hasStateModification;
}

/**
 * Find the main struct in a contract
 */
function findMainStruct(contractCode: string): string {
  // Look for structs with 'key' ability
  const structRegex = /struct\s+([a-zA-Z0-9_]+)\s+has\s+(.*?)(?:,\s*store)?\s*{/g;
  
  let match;
  while ((match = structRegex.exec(contractCode)) !== null) {
    const structName = match[1];
    const abilities = match[2].split(',').map(a => a.trim());
    
    // If it has the 'key' ability, it's likely the main struct
    if (abilities.includes('key')) {
      return structName;
    }
  }
  
  // Fallback to a default name if no struct with 'key' ability is found
  return 'AppObject';
}

/**
 * Generate a governance contract for a Move contract
 */
function generateGovernanceContract(
  moduleInfo: any, 
  governableActions: GovernableAction[],
  contractCode: string
): string {
  if (governableActions.length === 0) {
    throw new Error('No governable actions selected for the contract');
  }
  
  // Try to find the main struct
  const mainStructName = findMainStruct(contractCode) || 'AppObject';
  
  // Generate the proposal kind enum based on governable actions
  const proposalKindEnum = generateProposalKindEnum(governableActions);
  
  // Generate execution logic for each action
  const executionLogic = generateExecutionLogic(moduleInfo, governableActions);
  
  // Generate proposal creation function
  const proposalCreationLogic = generateProposalCreationLogic(governableActions);
  
  // Generate the complete governance contract
  return `
module ${moduleInfo.packageName}_governance::governance {
    use std::string::{Self, String};
    use sui::table::{Self, Table};
    use sui::tx_context::{Self, sender, TxContext};
    use sui::vec_map::{Self, VecMap};
    use sui::event;
    use sui::dynamic_field as df;
    use sui::coin::{Self, Coin};
    use sui::clock::{Self, Clock};
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    
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
    public entry fun execute_proposal(
        self: &mut GovernanceSystem,
        proposal_id: ID,
        app_object: &mut ${moduleInfo.packageName}::${moduleInfo.moduleName}::${mainStructName},
        ctx: &mut TxContext,
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
    }
    
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
function generateProposalKindEnum(governableActions: GovernableAction[]): string {
  // Generate the proposal kind enum based on governable actions
  const enumVariants = governableActions.map((action) => {
    // Create enum variant with parameters if needed
    if (action.parameters.length > 0) {
      const params = action.parameters
        .map(param => `${param.name}: ${param.type}`)
        .join(', ');
      return `        ${capitalizeFirstLetter(action.name)} { ${params} }`;
    } else {
      return `        ${capitalizeFirstLetter(action.name)}`;
    }
  }).join(',\n');
  
  return `public enum ProposalKind has drop, store {
${enumVariants}
    }`;
}

/**
 * Generate execution logic for each governable action
 */
function generateExecutionLogic(moduleInfo: any, governableActions: GovernableAction[]): string {
  // Generate execution logic for each governable action
  return `match (&proposal.kind) {
            ${governableActions.map((action) => {
              if (action.parameters.length > 0) {
                const paramRefs = action.parameters
                  .map(param => param.name)
                  .join(', ');
                return `ProposalKind::${capitalizeFirstLetter(action.name)} { ${paramRefs} } => {
                ${moduleInfo.packageName}::${moduleInfo.moduleName}::${action.name}(app_object${action.parameters.length > 0 ? ', ' : ''}${paramRefs})
            }`;
              } else {
                return `ProposalKind::${capitalizeFirstLetter(action.name)} => {
                ${moduleInfo.packageName}::${moduleInfo.moduleName}::${action.name}(app_object)
            }`;
              }
            }).join(',\n            ')}
        };`;
}

/**
 * Generate proposal creation function with parameters for all governable actions
 */
function generateProposalCreationLogic(governableActions: GovernableAction[]): string {
  // Generate proposal creation function with the right parameters
  return `public entry fun create_proposal(
        self: &mut GovernanceSystem,
        governance_coins: &Coin<GOVTOKEN>,
        title: String,
        description: String,
        voting_period_seconds: u64,
        clock: &Clock,
        proposal_kind: u8, // 0-${governableActions.length - 1} for different proposal types
        ${governableActions.map((action, index) => {
          return action.parameters.map(param => 
            `${param.name}: ${param.type} // For proposal kind ${index}`
          ).join(',\n        ');
        }).filter(Boolean).join(',\n        ')}
        ctx: &mut TxContext,
    ) : ID {
        let pK: ProposalKind;
        // Create the appropriate proposal kind based on the proposal_kind parameter
        match (proposal_kind) {
            ${governableActions.map((action, index) => {
              if (action.parameters.length > 0) {
                const paramNames = action.parameters.map(param => param.name).join(', ');
                return `${index} => {
                pK = ProposalKind::${capitalizeFirstLetter(action.name)} { ${paramNames} };
            }`;
              } else {
                return `${index} => {
                pK = ProposalKind::${capitalizeFirstLetter(action.name)};
            }`;
              }
            }).join('\n            ')}
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

export default router;