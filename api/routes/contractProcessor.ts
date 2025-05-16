// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import express, { Request, Response } from "express";
import {
  extractModuleInfo,
  generateGovernanceContract,
  identifyAllPotentialActions,
  identifyGovernableActions,
} from "../services";
import { generateGovernanceTokenContract } from "../services/governanceTokenGenerator";
import { SuiRPC } from "../utils/RPC";

/**
 * Contract processor router
 */
const router = express.Router();

/**
 * Parse a Move contract to extract module info and identify potential governable actions
 */
// @ts-ignore
router.post("/parse-contract", async (req: Request, res: Response) => {
  try {
    const { contractCode } = req.body;
    if (!contractCode) {
      return res.status(400).json({
        success: false,
        message: "Missing contract code",
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
        governableActions,
      },
    });
  } catch (error) {
    console.error("Error parsing contract:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while parsing the contract",
    });
  }
});

/**
 * Generate a governance contract based on selected governable actions
 */
// @ts-ignore
router.post("/generate-governance", async (req: Request, res: Response) => {
  try {
    const { contractCode, governableActions } = req.body;

    if (!contractCode) {
      return res.status(400).json({
        success: false,
        message: "Missing contract code",
      });
    }

    if (
      !governableActions ||
      !Array.isArray(governableActions) ||
      governableActions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No governable actions selected",
      });
    }

    // Extract module info from the contract
    const moduleInfo = extractModuleInfo(contractCode);

    // Generate governance contract using only the selected actions
    const governanceContract = generateGovernanceContract(
      moduleInfo,
      governableActions,
      contractCode
    );

    // Generate matching governance token contract
    const governanceTokenContract = generateGovernanceTokenContract(moduleInfo);

    // Return the result
    return res.status(200).json({
      success: true,
      data: {
        moduleInfo,
        governableActions,
        governanceContract,
        governanceTokenContract,
      },
    });
  } catch (error) {
    console.error("Error generating governance contract:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while generating governance contract",
    });
  }
});

// Keep the original endpoint for backward compatibility
//@ts-ignore
router.post("/process-contract", async (req: Request, res: Response) => {
  try {
    const { contractCode } = req.body;
    if (!contractCode) {
      return res.status(400).json({
        success: false,
        message: "Missing contract code",
      });
    }
    // Extract module info from the contract
    const moduleInfo = extractModuleInfo(contractCode);
    // Identify governable actions (using the original method)
    const governableActions = identifyGovernableActions(contractCode);

    // Generate governance contract
    const governanceContract = generateGovernanceContract(
      moduleInfo,
      governableActions,
      contractCode
    );

    // Generate matching governance token contract
    const governanceTokenContract = generateGovernanceTokenContract(moduleInfo);

    // Return the result
    return res.status(200).json({
      success: true,
      data: {
        moduleInfo,
        governableActions,
        governanceContract,
        governanceTokenContract,
      },
    });
  } catch (error) {
    console.error("Error processing contract:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while processing the contract",
    });
  }
});

// New route to add to your router
// Add this to your existing router in paste.txt

/**
 * Generate governance contracts from a deployed package ID
 */
//@ts-ignore
router.post("/generate-governance-from-package", async (req: Request, res: Response) => {
    try {
      const { packageId, rpcUrl } = req.body;

      if (!packageId) {
        return res.status(400).json({
          success: false,
          message: "Missing packageId",
        });
      }

      // Initialize SuiRPC with custom URL if provided
      const rpc = new SuiRPC(rpcUrl);

      // Extract all necessary data from the package
      const { moduleInfo, mainStruct, governableActions } =
        await rpc.extractGovernanceData(packageId);

      if (governableActions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No governable actions found in the package",
        });
      }

      // Generate governance contract using the extracted data
      // We need to create a mock contract code string for the existing generator
      // since it expects a contract code parameter
      const mockContractCode = `module ${moduleInfo.packageName}::${moduleInfo.moduleName} { }`;

      const governanceContract = generateGovernanceContract(
        moduleInfo,
        governableActions,
        mockContractCode,
        mainStruct
      );

      // Generate matching governance token contract
      const governanceTokenContract =
        generateGovernanceTokenContract(moduleInfo);

      // Return the result
      res.status(200).json({
        success: true,
        data: {
          packageId,
          moduleInfo,
          mainStruct,
          governableActions,
          governanceContract,
          governanceTokenContract,
        },
      });
      return;
    } catch (error) {
      console.error("Error generating governance from package:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while generating governance from package",
      });
      return;
    }
  }
);

export default router;
