# Crowdfund Smart Contract

A flexible crowdfunding platform built on Sui Move that allows campaign creation, donations in SUI tokens, and controlled fund withdrawals with governance capabilities.

## Overview

This smart contract enables:

- Creating crowdfunding campaigns with customizable parameters
- Accepting SUI token donations
- Withdrawal of funds by campaign creators after deadline
- Governance control for fund transfers
- Transferable governance rights

## Contract Structure

The contract contains two main structs:

- `Campaign`: Stores all campaign details and funds
- `GovernanceCapability`: Provides administrative control over campaigns

## Functionality

```bash
 export packageId=0x71e1235d26fe3b0ef855a404bfe0c5783a2329499f9efd1df2eadd4729a94f3d
```

### Creating a Campaign

Create a new crowdfunding campaign with the following parameters:

- `funding_goal`: Target amount in MIST (1 SUI = 10^9 MIST)
- `deadline`: Unix timestamp when the campaign ends
- `withdrawal_fee`: Fee percentage in MIST basis points (10^9 = 100%)
- `min_donation`: Minimum donation amount in MIST

```bash
sui client call \
  --package $packageId \
  --module Crowdfund \
  --function create_campaign \
  --args 100000000 1746696260 10000000 1000000 \
  --gas-budget 10000000
```

### Making a Donation

Donate SUI tokens to a campaign:

```bash
# Get a coin object to use for donation
export coinObjectId=$(sui client gas --json | jq -r '.[0].gasCoinId')

# Make the donation
sui client call \
  --package $packageId \
  --module Crowdfund \
  --function donate \
  --args $campaignId $coinObjectId \
  --gas-budget 10000000
```

### Withdrawing Funds

Campaign creators can withdraw funds after the deadline:

```bash
# Get the clock object ID
export clockId=0x6

# Withdraw funds
sui client call \
  --package $packageId \
  --module Crowdfund \
  --function withdraw_funds \
  --args $campaignId $clockId \
  --gas-budget 10000000
```

### Governance Functions

#### Transfer Funds (Governance Only)

Only the governance capability holder can transfer funds from a campaign:

```bash
sui client call \
  --package $packageId \
  --module Crowdfund \
  --function transfer_funds \
  --args $campaignId $recipientAddress 500000000 $governanceCapId \
  --gas-budget 10000000
```

#### Transfer Governance Capability

The governance capability can be transferred to a new address:

```bash

export governanceCapId=0x101443ed5cbd885944f2abd52a5f86b2eefdba859bd2159c65e03ace0114c8b6

sui client call \
  --package $packageId \
  --module Crowdfund \
  --function transfer_governance \
  --args $governanceCapId $newGovernorAddress \
  --gas-budget 10000000
```

## Deployment Guide

1. **Prepare the Contract**
   
   Ensure you have the contract code in a proper Sui Move package structure.

2. **Publish the Contract**

   ```bash
   sui client publish --gas-budget 100000000
   ```

   Save the package ID and governance capability ID:

   ```
   packageId=0x<your_package_id>
   governanceCapId=0x<your_governance_capability_id>
   ```

3. **Setup Complete Workflow**

   ```bash
   # Deploy the contract
   sui client publish --gas-budget 100000000
   packageId=0x<your_package_id>
   governanceCapId=0x<your_governance_capability_id>

   # Create a campaign (1000 SUI goal, 10% fee, min 0.1 SUI donation)
   sui client call --package $packageId --module Crowdfund --function create_campaign --args 1000000000000 1717251767 100000000000 100000000 --gas-budget 10000000
   campaignId=0x<your_campaign_object_id>

   # Make a donation
   coinObjectId=$(sui client gas --json | jq -r '.objectIds[0]')
   sui client call --package $packageId --module Crowdfund --function donate --args $campaignId $coinObjectId --gas-budget 10000000

   # Transfer governance to a dedicated governance contract
   governanceContractAddress=0x<governance_contract_address>
   sui client call --package $packageId --module Crowdfund --function transfer_governance --args $governanceCapId $governanceContractAddress --gas-budget 10000000

   # Governance action: Transfer some funds to another address
   recipientAddress=0x<recipient_address>
   sui client call --package $packageId --module Crowdfund --function transfer_funds --args $campaignId $recipientAddress 500000000 $governanceCapId --gas-budget 10000000

   # Wait until deadline passes, then creator withdraws remaining funds
   clockId=$(sui client objects --json | jq -r '.[] | select(.type | contains("Clock")) | .objectId')
   sui client call --package $packageId --module Crowdfund --function withdraw_funds --args $campaignId $clockId --gas-budget 10000000
   ```

## Security Features

- The `GovernanceCapability` has only the `key` ability (not `store`), ensuring it can only be transferred through the `transfer_governance` function.
- Campaign funds can only be withdrawn by the creator after the deadline.
- Governance actions for fund transfers require possession of the governance capability.
- All operations include appropriate checks and error handling.

## Error Codes

- `1`: Not the campaign creator
- `2`: Deadline not yet reached
- `3`: Donation below minimum amount
- `4`: Insufficient funds to withdraw/transfer

## Notes

- All monetary values are in MIST (1 SUI = 10^9 MIST)
- The contract enforces a fee on withdrawals based on the rate set during campaign creation
- Campaign creators cannot withdraw funds before the deadline
- The governance capability holder can transfer funds from any campaign at any time