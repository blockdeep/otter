// insert-governance.js
// This script directly inserts a governance address into the database using Prisma
// without needing to run the Express server

// Import the Prisma client
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Define the governance address data
const governanceData = {
  address: "0xbafd0541bbeac9bb05ffd13c54ef77904667675fc7ac8596ef2b8616ccba94e1",
  projectName: "Generic Governance",
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