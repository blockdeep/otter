interface SuiRpcResponse {
  jsonrpc: string;
  id: number;
  result: {
    [moduleName: string]: {
      exposedFunctions: {
        [functionName: string]: any;
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

export class SuiRPC {
  private static readonly DEFAULT_RPC_URL =
    "https://rpc-testnet.suiscan.xyz:443";

  constructor(private rpcUrl: string = SuiRPC.DEFAULT_RPC_URL) {}

  /**
   * Get normalized Move modules by package ID
   */
  async getNormalizedMoveModulesByPackage(
    packageId: string,
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

// Example usage:
export async function getGovernanceInfo(
  packageId: string,
  rpcUrl?: string,
): Promise<GovernanceInfo | null> {
  const rpc = new SuiRPC(rpcUrl);
  return await rpc.getGovernanceInfo(packageId);
}

// Export a default instance for convenience
export const suiRPC = new SuiRPC();
