// ContractParser.ts - Backend service for parsing Move contracts and generating governance integration

/**
 * Module information extracted from a Move contract
 */
interface ModuleInfo {
  packageName: string;
  moduleName: string;
  functions: FunctionInfo[];
  structs: StructInfo[];
  customTypes: string[];
}

/**
 * Information about a function in a Move contract
 */
interface FunctionInfo {
  name: string;
  parameters: ParameterInfo[];
  isGovernable: boolean;
}

/**
 * Information about a parameter in a function
 */
interface ParameterInfo {
  name: string;
  type: string;
}

/**
 * Information about a struct in a Move contract
 */
interface StructInfo {
  name: string;
  abilities: string[];
  fields: FieldInfo[];
}

/**
 * Information about a field in a struct
 */
interface FieldInfo {
  name: string;
  type: string;
}

/**
 * Information about a governable action in a Move contract
 */
interface GovernableAction {
  name: string;
  parameters: ParameterInfo[];
  parameterValues: string[];
}

/**
 * Result of parsing a Move contract
 */
interface ParseResult {
  moduleInfo: ModuleInfo;
  governableActions: GovernableAction[];
  governanceContract: string;
}

/**
 * Main class for parsing Move contracts and generating governance code
 */
class ContractParser {
  private moduleInfo: ModuleInfo;

  constructor() {
    this.moduleInfo = {
      packageName: "",
      moduleName: "",
      functions: [],
      structs: [],
      customTypes: [],
    };
  }

  /**
   * Main function to analyze a contract and generate governance code
   * @param contractCode The Move contract code to analyze
   * @return Generated governance contract and metadata
   */
  public parseContract(contractCode: string): ParseResult {
    try {
      // 1. Extract basic module information
      this.extractModuleInfo(contractCode);

      // 2. Extract function definitions
      this.extractFunctions(contractCode);

      // 3. Extract struct definitions
      this.extractStructs(contractCode);

      // 4. Identify governable elements
      const governableActions = this.identifyGovernableActions();

      // 5. Generate governance integration code
      const governanceContract =
        this.generateGovernanceContract(governableActions);

      return {
        moduleInfo: this.moduleInfo,
        governableActions,
        governanceContract,
      };
    } catch (error) {
      console.error("Error parsing contract:", error);
      throw new Error(
        `Contract parsing failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Extract module name and package from the contract code
   * @param contractCode The Move contract code
   */
  private extractModuleInfo(contractCode: string): void {
    // Extract module name and package
    const moduleRegex = /module\s+([a-zA-Z0-9_]+)::([a-zA-Z0-9_]+)\s*{/;
    const moduleMatch = contractCode.match(moduleRegex);

    if (moduleMatch) {
      this.moduleInfo.packageName = moduleMatch[1];
      this.moduleInfo.moduleName = moduleMatch[2];
    } else {
      throw new Error("Unable to detect module name and package");
    }
  }

  /**
   * Extract function definitions from the contract code
   * @param contractCode The Move contract code
   */
  private extractFunctions(contractCode: string): void {
    // Look for public entry functions that might be governance targets
    const functionRegex = /public\s+entry\s+fun\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/g;

    let functionMatch;
    while ((functionMatch = functionRegex.exec(contractCode)) !== null) {
      const functionName = functionMatch[1];
      const parametersRaw = functionMatch[2];

      // Parse parameters and their types
      const parameters = this.parseParameters(parametersRaw);

      this.moduleInfo.functions.push({
        name: functionName,
        parameters,
        isGovernable: this.isFunctionGovernable(
          functionName,
          parameters,
          contractCode
        ),
      });
    }
  }

  /**
   * Parse parameters from a parameter string
   * @param parametersRaw Raw parameter string from a function definition
   * @return Array of parsed parameters
   */
  private parseParameters(parametersRaw: string): ParameterInfo[] {
    // Split parameters and extract name/type pairs
    if (!parametersRaw.trim()) return [];

    const paramList = parametersRaw.split(",").map((p) => p.trim());
    return paramList.map((param) => {
      const [name, type] = param.split(":").map((p) => p.trim());
      return { name, type };
    });
  }

  /**
   * Determine if a function is likely to be a governance target
   * @param functionName Name of the function
   * @param parameters Parameters of the function
   * @param contractCode Complete contract code for context
   * @return Whether the function is a good governance candidate
   */
  private isFunctionGovernable(
    functionName: string,
    parameters: ParameterInfo[],
    contractCode: string
  ): boolean {
    // Heuristic to determine if a function is likely to be a governance target
    // Functions that modify state and don't require special capabilities are good candidates

    // 1. Check if function name suggests a state change
    const stateChangeKeywords = [
      "set",
      "update",
      "change",
      "modify",
      "create",
      "add",
      "remove",
      "delete",
      "mint",
      "burn",
      "transfer",
    ];
    const hasStateChangeKeyword = stateChangeKeywords.some((keyword) =>
      functionName.toLowerCase().includes(keyword)
    );

    // 2. Check if function parameters seem governable (don't require special capabilities)
    const requiresSpecialCapability = parameters.some(
      (param) =>
        param.type.includes("Cap") ||
        param.type.includes("Admin") ||
        param.name.includes("admin")
    );

    // 3. Look for state modifications in function body (this is a simplified check)
    // For a real implementation, need more sophisticated parsing of the function body
    const functionBodyRegex = new RegExp(
      `fun\\s+${functionName}\\s*\\(.*?\\)\\s*{([\\s\\S]*?)}`,
      "s"
    );
    const functionBodyMatch = contractCode.match(functionBodyRegex);
    const functionBody = functionBodyMatch ? functionBodyMatch[1] : "";

    const hasStateModification =
      functionBody.includes(".") || // Field access
      functionBody.includes("=") || // Assignment
      functionBody.includes("::"); // Module function calls

    return (
      hasStateChangeKeyword &&
      !requiresSpecialCapability &&
      hasStateModification
    );
  }

  /**
   * Extract struct definitions from the contract code
   * @param contractCode The Move contract code
   */
  private extractStructs(contractCode: string): void {
    // Extract struct definitions that might be important for governance
    const structRegex =
      /struct\s+([a-zA-Z0-9_]+)\s+has\s+(.*?)\s*{([\s\S]*?)}/g;

    let structMatch;
    while ((structMatch = structRegex.exec(contractCode)) !== null) {
      const structName = structMatch[1];
      const abilities = structMatch[2].split(",").map((a) => a.trim());
      const fieldsRaw = structMatch[3];

      // Parse fields
      const fields = this.parseStructFields(fieldsRaw);

      this.moduleInfo.structs.push({
        name: structName,
        abilities,
        fields,
      });
    }
  }

  /**
   * Parse struct fields from a field definition string
   * @param fieldsRaw Raw field definition string from a struct
   * @return Array of parsed fields
   */
  private parseStructFields(fieldsRaw: string): FieldInfo[] {
    // Parse the fields from a struct definition
    const fieldLines = fieldsRaw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return fieldLines.map((field) => {
      const [name, type] = field.split(":").map((part) => part.trim());
      // Remove trailing comma if present
      const cleanType = type.endsWith(",") ? type.slice(0, -1).trim() : type;
      return { name, type: cleanType };
    });
  }

  /**
   * Identify functions that are good candidates for governance
   * @return Array of governable actions
   */
  private identifyGovernableActions(): GovernableAction[] {
    // Identify functions that are good candidates for governance
    const governableFunctions = this.moduleInfo.functions
      .filter((func) => func.isGovernable)
      .map((func) => {
        // Extract parameter types and values for proposal creation
        const parameterValues = func.parameters.map((param) => {
          if (param.type.includes("u64") || param.type.includes("u128"))
            return "0";
          if (param.type.includes("bool")) return "false";
          if (param.type.includes("address")) return "@0x0";
          if (param.type.includes("String")) return 'string::utf8(b"")';
          return "value"; // Default placeholder
        });

        return {
          name: func.name,
          parameters: func.parameters,
          parameterValues,
        };
      });

    return governableFunctions;
  }

  /**
   * Generate a new governance contract based on the template and governable actions
   * @param governableActions List of governable actions
   * @return Generated governance contract code
   */
  private generateGovernanceContract(
    governableActions: GovernableAction[]
  ): string {
    // Generate a new governance contract based on the template and governable actions
    if (governableActions.length === 0) {
      throw new Error("No governable actions found in the contract");
    }

    // 1. Generate the proposal kind enum based on governable actions
    const proposalKindEnum = this.generateProposalKindEnum(governableActions);

    // 2. Generate execution logic for each action
    const executionLogic = this.generateExecutionLogic(governableActions);

    // 3. Generate proposal creation function with the right parameters
    const proposalCreationLogic =
      this.generateProposalCreationLogic(governableActions);

    // Assemble the complete governance contract
    return `
  module ${this.moduleInfo.packageName}_governance::governance {
      use std::string::{Self, String};
      use sui::table::{Self, Table};
      use sui::tx_context::{sender};
      use sui::vec_map::{Self, VecMap};
      use sui::event;
      use sui::dynamic_field as df;
      use sui::coin::{Self, Coin};
      use sui::clock::{Self, Clock};
      
      // Import the govtoken module
      use ${this.moduleInfo.packageName}_governance::govtoken::{GOVTOKEN};
      
      // Import the app module being governed
      use ${this.moduleInfo.packageName}::${this.moduleInfo.moduleName};
      
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
      
      // [... remaining standard governance code from the template ...]
      
      // === Proposal management ===
     
      /// Create a proposal function
      ${proposalCreationLogic}
      
      // [... other standard governance functions from the template ...]
      
      /// Execute a proposal's action based on its kind
      public entry fun execute_proposal(
          self: &mut GovernanceSystem,
          proposal_id: ID,
          app_object: &mut ${this.moduleInfo.packageName}::${
      this.moduleInfo.moduleName
    }::${this.getMainStructName()}, // The main struct from the app contract
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
      
      // [... remaining standard governance code from the template ...]
  }`;
  }

  /**
   * Generate the proposal kind enum based on governable actions
   * @param governableActions List of governable actions
   * @return Generated enum code
   */
  private generateProposalKindEnum(
    governableActions: GovernableAction[]
  ): string {
    // Generate the proposal kind enum based on governable actions
    const enumVariants = governableActions
      .map((action) => {
        // Create enum variant with parameters if needed
        if (action.parameters.length > 0) {
          const params = action.parameters
            .map((param) => `${param.name}: ${param.type}`)
            .join(", ");
          return `        ${this.capitalizeFirstLetter(
            action.name
          )} { ${params} }`;
        } else {
          return `        ${this.capitalizeFirstLetter(action.name)}`;
        }
      })
      .join(",\n");

    return `public enum ProposalKind has drop, store {
  ${enumVariants}
      }`;
  }

  /**
   * Generate execution logic for each governable action
   * @param governableActions List of governable actions
   * @return Generated execution code
   */
  private generateExecutionLogic(
    governableActions: GovernableAction[]
  ): string {
    // Generate execution logic for each governable action
    return `match (&proposal.kind) {
              ${governableActions
                .map((action) => {
                  if (action.parameters.length > 0) {
                    const paramRefs = action.parameters
                      .map((param) => param.name)
                      .join(", ");
                    return `ProposalKind::${this.capitalizeFirstLetter(
                      action.name
                    )} { ${paramRefs} } => {
                  ${this.moduleInfo.packageName}::${
                      this.moduleInfo.moduleName
                    }::${action.name}(app_object${
                      action.parameters.length > 0 ? ", " : ""
                    }${paramRefs})
              }`;
                  } else {
                    return `ProposalKind::${this.capitalizeFirstLetter(
                      action.name
                    )} => {
                  ${this.moduleInfo.packageName}::${
                      this.moduleInfo.moduleName
                    }::${action.name}(app_object)
              }`;
                  }
                })
                .join(",\n            ")}
          };`;
  }

  /**
   * Generate proposal creation function with parameters for all governable actions
   * @param governableActions List of governable actions
   * @return Generated function code
   */
  private generateProposalCreationLogic(
    governableActions: GovernableAction[]
  ): string {
    // Generate proposal creation function with the right parameters
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
          ${governableActions
            .map((action, index) => {
              return action.parameters
                .map(
                  (param) =>
                    `${param.name}: ${param.type} // For proposal kind ${index}`
                )
                .join(",\n        ");
            })
            .filter(Boolean)
            .join(",\n        ")}
          ctx: &mut TxContext,
      ) : ID {
          let pK: ProposalKind;
          // Create the appropriate proposal kind based on the proposal_kind parameter
          match (proposal_kind) {
              ${governableActions
                .map((action, index) => {
                  if (action.parameters.length > 0) {
                    const paramNames = action.parameters
                      .map((param) => param.name)
                      .join(", ");
                    return `${index} => {
                  pK = ProposalKind::${this.capitalizeFirstLetter(
                    action.name
                  )} { ${paramNames} };
              }`;
                  } else {
                    return `${index} => {
                  pK = ProposalKind::${this.capitalizeFirstLetter(action.name)};
              }`;
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
              voting_ends_at: voting_ends_at_ms,
              threshold: MIN_PROPOSAL_THRESHOLD,
          });
          
          proposal_id
      }`;
  }

  /**
   * Get the main struct name from the app contract
   * @return Name of the main struct
   */
  private getMainStructName(): string {
    // Attempt to find the main struct with 'key' ability
    const keyStructs = this.moduleInfo.structs.filter((struct) =>
      struct.abilities.includes("key")
    );

    if (keyStructs.length > 0) {
      return keyStructs[0].name;
    }

    // Fallback - return the first struct or a placeholder
    return this.moduleInfo.structs.length > 0
      ? this.moduleInfo.structs[0].name
      : "MainStruct";
  }

  /**
   * Capitalize the first letter of a string
   * @param str Input string
   * @return String with first letter capitalized
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

export default ContractParser;
