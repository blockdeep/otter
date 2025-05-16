// Enhanced SuiRPC.ts
interface SuiRpcResponse {
  jsonrpc: string;
  id: number;
  result: {
    [moduleName: string]: {
      fileFormatVersion: number;
      address: string;
      name: string;
      structs: {
        [structName: string]: {
          abilities: { abilities: string[] };
          typeParameters: any[];
          fields: Array<{
            name: string;
            type: any;
          }>;
        };
      };
      exposedFunctions: {
        [functionName: string]: {
          visibility: string;
          isEntry: boolean;
          typeParameters: any[];
          parameters: any[];
          return: any[];
        };
      };
      enums?: {
        [enumName: string]: any;
      };
    };
  };
}

interface GovernanceInfo {
  governanceModuleName: string;
  createProposalFunction: any;
  proposalKindEnum: any;
}

interface ParameterInfo {
  name: string;
  type: string;
}

interface GovernableAction {
  name: string;
  parameters: ParameterInfo[];
  description?: string;
}

interface ModuleInfo {
  packageName: string;
  moduleName: string;
  address: string;
}

interface MainStructInfo {
  name: string;
  hasKey: boolean;
}

export class SuiRPC {
  private static readonly DEFAULT_RPC_URL =
    "https://rpc-testnet.suiscan.xyz:443";

  constructor(private rpcUrl: string = SuiRPC.DEFAULT_RPC_URL) {}

  /**
   * Get normalized Move modules by package ID
   */
  async getNormalizedMoveModulesByPackage(
    packageId: string
  ): Promise<SuiRpcResponse["result"]> {
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      method: "sui_getNormalizedMoveModulesByPackage",
      params: [packageId],
    };

    try {
      const response = await fetch(this.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SuiRpcResponse = await response.json();

      if (data.jsonrpc !== "2.0") {
        throw new Error("Invalid JSON-RPC response");
      }

      return data.result;
    } catch (error) {
      console.error("Error fetching modules:", error);
      throw error;
    }
  }

  /**
   * Extract module information from RPC response
   */
  extractModuleInfoFromRPC(modules: SuiRpcResponse["result"]): ModuleInfo[] {
    const moduleInfos: ModuleInfo[] = [];

    for (const [moduleName, moduleData] of Object.entries(modules)) {
      // Extract package name from the address
      // For packages like "0x7deece8e4911d5bb17034d04724b3e644686de1b89cfaec149f0f912af30161a::Crowdfund"
      // We need to derive a package name
      const packageName = moduleName.toLowerCase();

      moduleInfos.push({
        packageName,
        moduleName,
        address: moduleData.address,
      });
    }

    return moduleInfos;
  }

  /**
   * Find the main struct with Key ability
   */
  findMainStructFromRPC(
    modules: SuiRpcResponse["result"]
  ): MainStructInfo | null {
    for (const [moduleName, moduleData] of Object.entries(modules)) {
      if (moduleData.structs) {
        for (const [structName, structData] of Object.entries(
          moduleData.structs
        )) {
          if (structData.abilities.abilities.includes("Key")) {
            return {
              name: structName,
              hasKey: true,
            };
          }
        }
      }
    }
    return null;
  }

  /**
   * Convert RPC parameter type to Move type string
   */
  private convertRpcTypeToMoveType(type: any): string {
    if (typeof type === "string") {
      return type.toLowerCase() === "address" ? "address" : type;
    }

    if (type.Struct) {
      const struct = type.Struct;
      if (struct.typeArguments && struct.typeArguments.length > 0) {
        const typeArgs = struct.typeArguments
          .map((arg: any) => this.convertRpcTypeToMoveType(arg))
          .join(", ");
        return `${struct.module}::${struct.name}<${typeArgs}>`;
      }
      return `${struct.module}::${struct.name}`;
    }

    if (type.MutableReference) {
      return `&mut ${this.convertRpcTypeToMoveType(type.MutableReference)}`;
    }

    if (type.Reference) {
      return `&${this.convertRpcTypeToMoveType(type.Reference)}`;
    }

    if (type.Vector) {
      return `vector<${this.convertRpcTypeToMoveType(type.Vector)}>`;
    }

    return "unknown";
  }

  /**
   * Convert RPC function parameters to ParameterInfo array
   */
  private convertRpcParametersToParameterInfo(
    parameters: any[]
  ): ParameterInfo[] {
    const parameterInfos: ParameterInfo[] = [];

    parameters.forEach((param, index) => {
      // Generate parameter names since RPC doesn't provide them
      // Skip common parameters like TxContext
      const type = this.convertRpcTypeToMoveType(param);

      // Skip TxContext as it's automatically handled
      if (type.includes("tx_context::TxContext")) {
        return;
      }

      // Generate meaningful parameter names based on type
      let name: string;
      if (type.includes("Campaign")) {
        name = "campaign";
      } else if (type.includes("Coin")) {
        name = "payment";
      } else if (type.includes("Clock")) {
        name = "clock";
      } else if (type === "address") {
        name = `recipient_${index}`;
      } else if (type === "U64" || type === "u64") {
        name = `amount_${index}`;
      } else if (type.includes("GovernanceCapability")) {
        name = "governance_cap";
      } else {
        name = `param_${index}`;
      }

      parameterInfos.push({
        name,
        type,
      });
    });

    return parameterInfos;
  }

  /**
   * Generate function description based on function name and type
   */
  private generateFunctionDescription(
    functionName: string,
    parameters: ParameterInfo[]
  ): string {
    const functionDescriptors: Record<string, string> = {
      create: "Creates a new resource or entity",
      donate: "Makes a donation to the campaign",
      transfer_funds: "Transfers funds from the campaign",
      transfer_governance: "Transfers governance capability to another address",
      withdraw_funds: "Withdraws funds from the campaign",
      set: "Sets or updates a value",
      update: "Updates a value or state",
      change: "Changes a value or state",
      modify: "Modifies a value or state",
      add: "Adds a new item or value",
      remove: "Removes an item or value",
      delete: "Deletes an item or resource",
      pause: "Pauses functionality or operations",
      unpause: "Resumes functionality or operations",
      enable: "Enables a feature or functionality",
      disable: "Disables a feature or functionality",
      mint: "Creates new tokens or assets",
      burn: "Destroys tokens or assets",
    };

    // Check for exact matches first
    if (functionDescriptors[functionName]) {
      return functionDescriptors[functionName];
    }

    // Check for partial matches
    for (const [keyword, description] of Object.entries(functionDescriptors)) {
      if (functionName.toLowerCase().includes(keyword)) {
        // Add governance context if it requires governance capability
        if (parameters.some((p) => p.type.includes("GovernanceCapability"))) {
          return `${description} (requires governance approval)`;
        }
        return description;
      }
    }

    // Default description
    if (parameters.some((p) => p.type.includes("GovernanceCapability"))) {
      return "Executes a governance-controlled operation (requires governance approval)";
    }

    return "Executes a state change in the contract";
  }

  /**
   * Identify governable actions from RPC response
   */
  identifyGovernableActionsFromRPC(
    modules: SuiRpcResponse["result"]
  ): GovernableAction[] {
    const governableActions: GovernableAction[] = [];

    for (const [moduleName, moduleData] of Object.entries(modules)) {
      if (moduleData.exposedFunctions) {
        for (const [functionName, functionData] of Object.entries(
          moduleData.exposedFunctions
        )) {
          // Skip getter functions
          if (
            functionName.startsWith("get_") ||
            functionName.startsWith("is_") ||
            functionName.startsWith("has_")
          ) {
            continue;
          }

          // Only consider public entry functions for governance
          if (functionData.visibility === "Public" && functionData.isEntry) {
            const parameters = this.convertRpcParametersToParameterInfo(
              functionData.parameters
            );
            const description = this.generateFunctionDescription(
              functionName,
              parameters
            );

            governableActions.push({
              name: functionName,
              parameters,
              description,
            });
          }
        }
      }
    }

    return governableActions;
  }

  /**
   * Extract all module information needed for governance generation
   */
  async extractGovernanceData(packageId: string): Promise<{
    moduleInfo: ModuleInfo;
    mainStruct: string;
    governableActions: GovernableAction[];
  }> {
    const modules = await this.getNormalizedMoveModulesByPackage(packageId);

    // Get the first module (assuming single module packages for now)
    const moduleInfos = this.extractModuleInfoFromRPC(modules);
    if (moduleInfos.length === 0) {
      throw new Error("No modules found in package");
    }

    const moduleInfo = moduleInfos[0]; // Take the first module

    // Find main struct
    const mainStructInfo = this.findMainStructFromRPC(modules);
    const mainStruct = mainStructInfo?.name || "AppObject";

    // Get governable actions
    const governableActions = this.identifyGovernableActionsFromRPC(modules);

    return {
      moduleInfo,
      mainStruct,
      governableActions,
    };
  }

  /**
   * Find the governance module and extract relevant information
   */
  async getGovernanceInfo(packageId: string): Promise<GovernanceInfo | null> {
    try {
      const modules = await this.getNormalizedMoveModulesByPackage(packageId);

      // Search through all modules for one that has "create_proposal" in exposedFunctions
      for (const [moduleName, moduleData] of Object.entries(modules)) {
        if (
          moduleData.exposedFunctions &&
          moduleData.exposedFunctions.create_proposal
        ) {
          // Found the governance module
          const createProposalFunction =
            moduleData.exposedFunctions.create_proposal;

          // Look for ProposalKind enum - could be in the same module or another module
          let proposalKindEnum = null;

          // First check the current governance module
          if (moduleData.enums && moduleData.enums.ProposalKind) {
            proposalKindEnum = moduleData.enums.ProposalKind;
          }

          return {
            governanceModuleName: moduleName,
            createProposalFunction: createProposalFunction,
            proposalKindEnum: proposalKindEnum,
          };
        }
      }

      return null; // No governance module found
    } catch (error) {
      console.error("Error getting governance info:", error);
      throw error;
    }
  }

  /**
   * Legacy method for backward compatibility - now returns just the module name
   */
  async findGovernanceModuleName(packageId: string): Promise<string | null> {
    const info = await this.getGovernanceInfo(packageId);
    return info ? info.governanceModuleName : null;
  }
}

// Export a default instance for convenience
export const suiRPC = new SuiRPC();
