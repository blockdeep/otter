# DAO - ON Sui

## CONTRACTS

```bash
export COUNTER_PACKAGE_ID=0x48e6b4a86510e16891db5663cea0db2b3fa7e4bd3d909d867de39323e63330cd
export GOVERNANCE_PACKAGE_ID=0x0c86f091850b314bd7982f927df418e6d023c40341924698d60f758dfcc7ff13
```

## SIMULATING GOVERNANCE.

1. Create and Deploy a Counter
   First, let's create and deploy the counter:

```bash

sui client call --package $COUNTER_PACKAGE_ID --module simple_counter --function create --gas-budget 10000000

```

P.S: Note down the object created - this will be our counter object.

In my case

```bash
export COUNTER_OBJECT=0xb6d748c59faa061c1f0b452c42ec6632e5426332c1b05e44486f21f2c1ba87c3
```

2. Initialize Governance System
   Fetch other details from the package. Including ADMIN_CAP_ID and GOVERNANCE_SYSTEM_ID.

For this view all the Sui objects created using `sui client objects`.

```bash
export ADMIN_CAP_ID=0xf5e574cf9d4a66d7c70864b9b75543989b9c049350e97bf7d7a5d4ea6be79e1b
export GOVERNANCE_SYSTEM_ID=0x1e5bde878d7490f3219904bab6922ad95fc28057f5dd5aa86cd46026fe0109cf
export GOVTOKEN_ADMIN_CAP=0x656004d48d48c8e4ad5029e2f67726bb610325035024ac0c52d749b901611cc6
export TREASURY_ID=0x2a8c84f901eaee8f34b2abf76b3c9d9e46554975958f67319e46779e4913ba6b
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
export GOV_TOKEN_ID=0x5469b240e8147567348883ede9bfa6841eee8d275274162442a7c45271506f70
```

4. Create a Proposal (Increment)

```bash
sui client call --package $GOVERNANCE_PACKAGE_ID --module governance --function create_proposal \
  --args $GOVERNANCE_SYSTEM_ID $GOV_TOKEN_ID "Set counter to 33" "This proposal will set the counter value to 42" 120 "0x6" 0  33 \
  --gas-budget 10000000
```

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

```json
Unable to process transaction
Error checking transaction input objects: IncorrectUserSignature { error: "Object 0x9777bb0fdb3a4181966abc7a7b2d1a3d54b06109a21edc20f3122b172d3bfc74 is owned by account address 0xd400e9ad38603b5cb41c88b865bfdadd3e8855a3613cef083b20126c9b59a854, but given owner/signer address is 0x9b0418b6ca4112a68feaf8cbc1a27b2faead2135012c907b53499c469d440516" }
```
