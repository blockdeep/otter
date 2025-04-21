# DAO - ON SUI

## CONTRACTS


```bash
export COUNTER_PACKAGE_ID=0x48e6b4a86510e16891db5663cea0db2b3fa7e4bd3d909d867de39323e63330cd
export GOVERNANCE_PACKAGE_ID=0x25fd4d4c5c000529399e79a97a4c5038a3b8a0fcef4870e4e8bf56d020e9d102

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
export COUNTER_OBJECT=0xdf3edde32fbb824967e806550539105f0a6e7ea8d47592dc89202f42374c00a0
```

2. Initialize Governance System
Fetch other details from the package. Including ADMIN_CAP_ID and GOVERNANCE_SYSTEM_ID.

For this view all the SUI objects created using `sui client objects`.

```bash
export GOVERNANCE_PACKAGE_ID=0x977d38221154b10b1166405477c3a699c350e72c62324bdb5eed55a5381ceb81
export ADMIN_CAP_ID=0xfb7051d233740f2b98dc77dd9b0e80c050bdb9b135ca6f9ecc8c2ad8df0362de
export GOVERNANCE_SYSTEM_ID=0x03240f21cf9b09e0f173e7fa9c623b654b3b0d93cb190708b475c5d43f11b54b
export GOVTOKEN_ADMIN_CAP=0x360742070d2556eb131decbeeecf0adea2f34240ce9719a189f37b7bc9da2c67
export TREASURY_ID=0xa479fa8aea6919ec292736e8c68831c38fae4fc86f7c20d59d2e44c6e9fa624a
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

4. Create a Proposal

```bash
sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function create_proposal \
  --args $GOVERNANCE_SYSTEM_ID $GOV_TOKEN_ID "Set counter to 42" "This proposal will set the counter value to 42" 1 \
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