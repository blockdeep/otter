// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import express, { Request, Response } from "express";
import {
  extractModuleInfo,
  generateGovernanceContract,
  identifyAllPotentialActions,
  identifyGovernableActions,
} from "../services";

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

    // Return the result
    return res.status(200).json({
      success: true,
      data: {
        moduleInfo,
        governableActions,
        governanceContract,
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

    // Return the result
    return res.status(200).json({
      success: true,
      data: {
        moduleInfo,
        governableActions,
        governanceContract,
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

export default router;
