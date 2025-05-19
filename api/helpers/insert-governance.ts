// This script directly inserts a governance address into the database using Prisma
// and automatically fetches the governance module name

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Define the governance address data
const governanceData = {
  address: "0x0c86f091850b314bd7982f927df418e6d023c40341924698d60f758dfcc7ff13",
  projectName: "Generic Governance",
  details: "Decentralized governance platform for Sui ecosystem projects",
  createdAt: new Date(),
};

// RPC class for fetching governance info (Node.js compatible version)
class SuiRPC {
  public rpcUrl: string;

  constructor(rpcUrl = "https://rpc-testnet.suiscan.xyz:443") {
    this.rpcUrl = rpcUrl;
  }

  async getNormalizedMoveModulesByPackage(packageId: string) {
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

      const data = await response.json();
      if (data.jsonrpc !== "2.0") {
        throw new Error("Invalid JSON-RPC response");
      }

      return data.result;
    } catch (error) {
      console.error("Error fetching modules:", error);
      throw error;
    }
  }

  async getGovernanceInfo(packageId: string) {
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

          // Look for ProposalKind enum
          let proposalKindEnum = null;
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
}

async function insertGovernanceAddress() {
  try {
    console.log("Fetching governance module information...");

    // Create RPC instance
    const rpc = new SuiRPC();

    // Fetch governance info from the package
    const governanceInfo = await rpc.getGovernanceInfo(governanceData.address);

    if (!governanceInfo) {
      throw new Error(
        `No governance module found in package ${governanceData.address}`
      );
    }

    console.log(
      `Found governance module: ${governanceInfo.governanceModuleName}`
    );

    // Prepare the complete data with module name
    const completeGovernanceData = {
      ...governanceData,
      moduleName: governanceInfo.governanceModuleName, // Store the discovered module name
      // Optionally store other governance info as JSON
      governanceInfo: JSON.stringify({
        createProposalFunction: governanceInfo.createProposalFunction,
        proposalKindEnum: governanceInfo.proposalKindEnum,
      }),
    };

    // Insert the data into the database
    const newGovernanceAddress = await prisma.governanceAddress.create({
      data: completeGovernanceData,
    });

    console.log("Governance address inserted successfully:");
    console.log({
      ...newGovernanceAddress,
      governanceInfo: "...(stored as JSON)", // Don't log the full JSON
    });

    console.log(`\nEvent tracker configuration:`);
    console.log(`Module: ${governanceInfo.governanceModuleName}`);
    console.log(`Package: ${governanceData.address}`);
  } catch (error) {
    console.error("Error inserting governance address:", error);

    // If there's an error fetching governance info, still try to insert with basic info
    console.log("Attempting to insert with basic information only...");
    try {
      const basicData = {
        ...governanceData,
        moduleName: null, // Mark as unknown
      };

      const newGovernanceAddress = await prisma.governanceAddress.create({
        data: basicData,
      });

      console.log("Basic governance address inserted (module name unknown):");
      console.log(newGovernanceAddress);
    } catch (insertError) {
      console.error("Failed to insert even basic data:", insertError);
    }
  } finally {
    // Disconnect from the database
    await prisma.$disconnect();
  }
}

// Run the function
insertGovernanceAddress();
