## For the purpose of demo we'll go from using an APP contract, deploying governance for it and creating, voting, and executing a proposal on it.

1. Ensure your app contract is deployed. For the demo we are using [Crowdfund contract](../contracts/crowdfund/).

2. Copy the contract code and paste it in the Launch Governance page on the website.

3. Select the functions that we want to include for governance.

4. Download the created governance contract and governance token contract.

5. Paste them in a separate deployment folder. We created [one](../contracts/demo-2-crowdfund/) to reference the structure.

6. To publish the governance contract use

   ```bash
   sui client publish
   ```

7. Copy the newly created governance package id, along with newly created objects and export them.

   ```bash
   export GOVERNANCE_PACKAGE_ID=0x600620ebca56d26f52eaededf83088547635de4ea378519cceeea60f0cd1c2bd
   export GOVTOKEN_ADMIN_CAP=0xaa78911fcc85665915fb887c537147f409ce31fcbf531dd89c7e9bb906553776
   export TREASURY_ID=0x59d0667ce59f768ea69b9188ee33407ed49faa68a87ece26764d42bf0cf759f3
   export MY_ADDRESS=0x9b0418b6ca4112a68feaf8cbc1a27b2faead2135012c907b53499c469d440516
   ```

8. Once published we need to init the contract

   ```bash
   export APP_CONTRACT_GOV_CAP=0x25fc7c2033cb5f5bece125a825a8f660b0fb67232c31d54b8a118b3ce7ae2e41 # Get this from your APP contract.


   sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function initialize_governance   --args $APP_CONTRACT_GOV_CAP --gas-budget 10000000
   ```

9. Now we need to update the total supply - to help with quorum calculations

   ```bash
   export ADMIN_CAP_ID=0x97ecfa3a90efc8500042fdd7950d9dd6e46f6550895ba900b835d63673789086
   export GOVERNANCE_SYSTEM_ID=0xaf595a02fa1a66ccf15448555c6ef51e92de2b731ff40ee64b6f2c4284baa44c

   sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function update_total_supply   --args $ADMIN_CAP_ID $GOVERNANCE_SYSTEM_ID 10000000000   --gas-budget 10000000
   ```

10. Mint Governance Tokens

    ```bash
    sui client call --package $GOVERNANCE_PACKAGE_ID --module govtoken --function mint_coins \
    --args $GOVTOKEN_ADMIN_CAP $TREASURY_ID 1000000000 $MY_ADDRESS \
    --gas-budget 10000000
    ```

11. Extract governance token id from the created objects.


    ```bash
    export GOV_TOKEN_ID=0x00bbead282f954a96b0eb9a541e0ceb284fb0a3fb40da1aa1a33e564f146255d
    ```

### At this point your governance is setup and we can shift to the UI for proposal creation, voting and so on.

### Once on the UI, use the whitelist governance page to whitelist and describe your governance system.

