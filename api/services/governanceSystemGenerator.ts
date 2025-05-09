import { GovernableAction } from "./actionIdentifier";
import { generateGovernanceContract } from "./governanceGenerator";
import { generateGovernanceTokenContract } from "./governanceTokenGenerator";

/**
 * Generate both governance and token contracts for a Move contract
 */
export function generateGovernanceSystem(
    moduleInfo: any, 
    governableActions: GovernableAction[],
    contractCode: string
  ): { governanceContract: string, tokenContract: string } {
    // Generate the governance contract
    const governanceContract = generateGovernanceContract(
      moduleInfo, 
      governableActions,
      contractCode
    );
    
    // Generate the governance token contract
    const tokenContract = generateGovernanceTokenContract(moduleInfo);
    
    return {
      governanceContract,
      tokenContract
    };
  }