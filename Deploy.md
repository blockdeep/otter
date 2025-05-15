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
    simple_counter = "0x48e6b4a86510e16891db5663cea0db2b3fa7e4bd3d909d867de39323e63330cd"
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
    simple_counter = "0x48e6b4a86510e16891db5663cea0db2b3fa7e4bd3d909d867de39323e63330cd"
    ```

### Moving on to deployment

1. To deploy the governance package
    ```bash 
    sui client publish
    ```

2. Post deployment you'll have various new objects created. Export them
    ```bash
    export ADMIN_CAP_ID=0x01968757b52e1b9c7f7ac44a167984c83757cc1de844500db964cbc5315cc775
    export GOVERNANCE_SYSTEM_ID=0xf959b09a23202f1e04fb8379107e3fbfc0f5597d4a0bd7a04eae2c6b92b6b771
    export GOVTOKEN_ADMIN_CAP=0xbd1ac83f0b22310a333a60d3fa88779e2881b6ab72d7c06059d6b88467341d7c
    export TREASURY_ID=0x2533bd61ecd09cd585329d3245b58f8d33d6551a797c82515ccb31db0c473aa8
    ```
3. Init the governance contract

    ```bash
    sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function update_total_supply   --args $ADMIN_CAP_ID $GOVERNANCE_SYSTEM_ID 10000000000   --gas-budget 10000000
    ```

### That's it! Your Governance Package is deployed which contains the governance contract with the token contract.  
### Read further to understand the steps to create a proposal, vote on it and so on.


1. Mint Governance Tokens

    ```bash
    sui client call --package $GOVERNANCE_PACKAGE_ID --module govtoken --function mint_coins \
    --args $GOVTOKEN_ADMIN_CAP $TREASURY_ID 1000000000 $MY_ADDRESS \
    --gas-budget 10000000
    ```

2. Extract governance token id from the created objects.

    ```bash
    export GOV_TOKEN_ID=0x9777bb0fdb3a4181966abc7a7b2d1a3d54b06109a21edc20f3122b172d3bfc74
    ```

3. Create a Proposal (Increment)

    ```bash
    sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function create_proposal \
    --args $GOVERNANCE_SYSTEM_ID $GOV_TOKEN_ID "Set counter to 33" "This proposal will set the counter value to 42" 120 "0x6" 0  33 \
    --gas-budget 10000000
    ```

4. Export proposal ID
    ```bash
    export PROPOSAL_ID=0x12a8fcbd50296ad40a1f6a0a541d68f185b93e558adc6122ad3fc2f8c9da64e8
    ```

5. Vote on the Proposal

    ```bash
    sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function vote \
    --args $GOVERNANCE_SYSTEM_ID $PROPOSAL_ID $GOV_TOKEN_ID 0 "0x6"\
    --gas-budget 10000000
    ```

6.  Finalize the Proposal

    ```bash
    sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function finalize_proposal \
    --args $GOVERNANCE_SYSTEM_ID $PROPOSAL_ID "0x6"\
    --gas-budget 10000000
    ```

7. Execute the Proposal on the Counter

    ```bash
    sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function execute_proposal \
    --args $GOVERNANCE_SYSTEM_ID $PROPOSAL_ID $COUNTER_OBJECT 42 \
    --gas-budget 10000000
    ```


### Too many steps right?

All of this can be done on the UI itself! Not sure how? Checkout this video!
