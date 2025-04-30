# DAO - ON SUI

## CONTRACTS


```bash
export COUNTER_PACKAGE_ID=0x48e6b4a86510e16891db5663cea0db2b3fa7e4bd3d909d867de39323e63330cd
export GOVERNANCE_PACKAGE_ID=0x78f3c755b1d906864e4721dc887e59127553149a6f066acb45f6e37524925186

```

## STIMULATING GOVERNANCE.

1. Create and Deploy a Counter
First, let's create and deploy the counter:

```bash

sui client call --package $COUNTER_PACKAGE_ID --module simple_counter --function create --gas-budget 10000000

```

P.S: Note down the object created - this will be our counter object.

In my case
```bash
export COUNTER_OBJECT=0x0f0718e4e590bcf85e02f44f412fef11a31a7ae67fb37fb21266fea95b1ae49c
```

2. Initialize Governance System
Fetch other details from the package. Including ADMIN_CAP_ID and GOVERNANCE_SYSTEM_ID.

For this view all the SUI objects created using `sui client objects`.

```bash
export GOVERNANCE_PACKAGE_ID=0x78f3c755b1d906864e4721dc887e59127553149a6f066acb45f6e37524925186
export ADMIN_CAP_ID=0x85a4b9540e5e1f3945ecb1a3ca8f1b347c07fd9fa153538afaedcb3577eed0c5
export GOVERNANCE_SYSTEM_ID=0xe44ef3829ed58d6ba539e9b6c5d5bca5cd7c6eb874fd415fe9cb5c479cb48001
export GOVTOKEN_ADMIN_CAP=0xbb0e66baff85f284abf3852ffa14a9a51ac627bd30435c77b29b399a5b30507d
export TREASURY_ID=0xad222a43236d0d6e692b1b90e4ee3dbde6000023efc0e644da3b94f22633d9fa
export MY_ADDRESS=0xd400e9ad38603b5cb41c88b865bfdadd3e8855a3613cef083b20126c9b59a854
```

```bash
sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function update_total_supply   --args $ADMIN_CAP_ID $GOVERNANCE_SYSTEM_ID 10000000000   --gas-budget 10000000
```

3. Mint Governance Tokens

```bash
sui client call --package $GOVERNANCE_PACKAGE_ID --module govtoken --function mint_coins \
  --args $GOVTOKEN_ADMIN_CAP $TREASURY_ID 1000000000 $MY_ADDRESS \
  --gas-budget 10000000
```

Extract governance token id from the created objects.
```bash
export GOV_TOKEN_ID=0xee5446fb19397b8d8f7e08f72ff84da87f5bb3ac99e15c804f258a6452bc6254
```

4. Create a Proposal (Increment)

```bash
sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function create_increment_proposal \
  --args $GOVERNANCE_SYSTEM_ID $GOV_TOKEN_ID "Set counter to 42" "This proposal will set the counter value to 42" 1 "0x6"  \
  --gas-budget 10000000
```

```bash
export PROPOSAL_ID=0xd373891cff8a8aee2111941a341c2a8fded392bb8c504d9f31a9e143a7b95f3b
```

5. Vote on the Proposal

```bash
sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function vote \
  --args $GOVERNANCE_SYSTEM_ID $PROPOSAL_ID $GOV_TOKEN_ID 0 \
  --gas-budget 10000000
```

6.  Finalize the Proposal
```bash
sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function finalize_proposal \
  --args $GOVERNANCE_SYSTEM_ID $PROPOSAL_ID \
  --gas-budget 10000000
```

7. Execute the Proposal on the Counter

```bash
sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function execute_counter_proposal \
  --args $GOVERNANCE_SYSTEM_ID $PROPOSAL_ID $COUNTER_ID 42 \
  --gas-budget 10000000
```