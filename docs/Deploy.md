# 🛠 Deploying OTTER Governance on SUI using SUI CLI

This guide walks you through deploying and simulating a governance flow using OTTER on the Sui blockchain.

> ✅ Prerequisite: You must have `sui client` installed and configured (testnet).

---

## Folder structure for deployment

#### There are two ways that allows app to refer to deployed packages - github or locally.

#### P.S: Notice how simple_counter is being referred to through Move.toml.

### Scenario #1: locally

1. Your folder structure should look something like this.

   ```bash
   governance/
   ├── app_folder/                 # App smart contract folder
   ├── sources/
   │   ├── governance.move         # governance contract downloaded from OTTER.
   │   └── governance_token.move   # governnace token contract downloaded at the same time.
   ├── tests
   └── Move.toml
   ```

2. And the Move.toml like this

   ```toml
   [package]
   name = "generic_governor"
   edition = "2024.beta"

   [dependencies]
   Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }
   simple_counter = { local = "./simple_counter" }


   [addresses]
   generic_governor = "0x0"
   simple_counter = "0x48e6b4a86510e16891db5663cea0db2b3fa7e4bd3d909d867de39323e63330cd"  ## Make sure to add the deployed address of the app contract
   ```

### Scenario #2: Github

1. Your folder structure should look something like this.

   ```bash
   governance/
   ├── sources/
   │   ├── governance.move         # governance contract downloaded from OTTER.
   │   └── governance_token.move   # governnace token contract downloaded at the same time.
   ├── tests
   └── Move.toml
   ```

2. And the Move.toml like this

   ```toml
   [package]
   name = "generic_governor"
   edition = "2024.beta"

   [dependencies]
   Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }
   simple_counter = { git = "https://github.com/<username>/<repo>.git", subdir = "<path-to-package>", rev = "<commit-or-branch>" }


   [addresses]
   generic_governor = "0x0"
   simple_counter = "0x48e6b4a86510e16891db5663cea0db2b3fa7e4bd3d909d867de39323e63330cd" ## Make sure to add the deployed address of the app contract
   ```

### Moving on to deployment

1. To deploy the governance package

   ```bash
   sui client publish
   ```

2. Post deployment you'll have various new objects created. Export them

   ```bash
   export GOVERNANCE_PACKAGE_ID=0x600620ebca56d26f52eaededf83088547635de4ea378519cceeea60f0cd1c2bd
   export GOVTOKEN_ADMIN_CAP=0xaa78911fcc85665915fb887c537147f409ce31fcbf531dd89c7e9bb906553776
   export TREASURY_ID=0x59d0667ce59f768ea69b9188ee33407ed49faa68a87ece26764d42bf0cf759f3
   export MY_ADDRESS=0x9b0418b6ca4112a68feaf8cbc1a27b2faead2135012c907b53499c469d440516
   ```

3. Init the governance contract

   ```bash
   export APP_CONTRACT_GOV_CAP=0x25fc7c2033cb5f5bece125a825a8f660b0fb67232c31d54b8a118b3ce7ae2e41 # Get this from your APP contract.

   sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function initialize_governance   --args $APP_CONTRACT_GOV_CAP --gas-budget 10000000
   ```

4. Now we need to update the total supply - to help with quorum calculations

   ```bash
   export ADMIN_CAP_ID=0x97ecfa3a90efc8500042fdd7950d9dd6e46f6550895ba900b835d63673789086
   export GOVERNANCE_SYSTEM_ID=0xaf595a02fa1a66ccf15448555c6ef51e92de2b731ff40ee64b6f2c4284baa44c

   sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function update_total_supply   --args $ADMIN_CAP_ID $GOVERNANCE_SYSTEM_ID 10000000000   --gas-budget 10000000
   ```

5. Mint Governance Tokens

   ```bash
   sui client call --package $GOVERNANCE_PACKAGE_ID --module govtoken --function mint_coins \
   --args $GOVTOKEN_ADMIN_CAP $TREASURY_ID 1000000000 $MY_ADDRESS \
   --gas-budget 10000000
   ```

6. Extract governance token id from the created objects.

   ```bash
   export GOV_TOKEN_ID=0x9777bb0fdb3a4181966abc7a7b2d1a3d54b06109a21edc20f3122b172d3bfc74
   ```

### That's it! Your Governance Package is deployed which contains the governance contract with the token contract.

### Read further to understand the steps to create a proposal, vote on it and so on.

1. Create a Proposal (Increment)

   ```bash
   sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function create_proposal \
   --args $GOVERNANCE_SYSTEM_ID $GOV_TOKEN_ID "Set counter to 33" "This proposal will set the counter value to 42" 120 "0x6" 0  33 \
   --gas-budget 10000000
   ```

2. Export proposal ID

   ```bash
   export PROPOSAL_ID=0x12a8fcbd50296ad40a1f6a0a541d68f185b93e558adc6122ad3fc2f8c9da64e8
   ```

3. Vote on the Proposal

   ```bash
   sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function vote \
   --args $GOVERNANCE_SYSTEM_ID $PROPOSAL_ID $GOV_TOKEN_ID 0 "0x6"\
   --gas-budget 10000000
   ```

4. Finalize the Proposal

   ```bash
   sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function finalize_proposal \
   --args $GOVERNANCE_SYSTEM_ID $PROPOSAL_ID "0x6"\
   --gas-budget 10000000
   ```

5. Execute the Proposal on the Counter

   ```bash
   sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function execute_proposal \
   --args $GOVERNANCE_SYSTEM_ID $PROPOSAL_ID $COUNTER_OBJECT 42 \
   --gas-budget 10000000
   ```

### Too many steps right?

All of this can be done on the UI itself! Not sure how? Checkout this video!
