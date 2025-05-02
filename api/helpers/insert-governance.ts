// insert-governance.js
// This script directly inserts a governance address into the database using Prisma
// without needing to run the Express server

// Import the Prisma client
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Define the governance address data
const governanceData = {
  address: "0x78f3c755b1d906864e4721dc887e59127553149a6f066acb45f6e37524925186",
  projectName: "Simple Governance",
  details: "Decentralized governance platform for Sui ecosystem projects",
  createdAt: new Date()
};

async function insertGovernanceAddress() {
  try {
    // Insert the data into the database
    const newGovernanceAddress = await prisma.governanceAddress.create({
      data: governanceData
    });
    
    console.log("Governance address inserted successfully:");
    console.log(newGovernanceAddress);
  } catch (error) {
    console.error("Error inserting governance address:", error);
  } finally {
    // Disconnect from the database
    await prisma.$disconnect();
  }
}

// Run the function
insertGovernanceAddress();