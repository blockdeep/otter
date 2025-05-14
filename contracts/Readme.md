# DAO - ON SUI

## CONTRACTS

```bash
export COUNTER_PACKAGE_ID=0x48e6b4a86510e16891db5663cea0db2b3fa7e4bd3d909d867de39323e63330cd
export GOVERNANCE_PACKAGE_ID=0xbafd0541bbeac9bb05ffd13c54ef77904667675fc7ac8596ef2b8616ccba94e1
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
export COUNTER_OBJECT=0xb6d748c59faa061c1f0b452c42ec6632e5426332c1b05e44486f21f2c1ba87c3
```

2. Initialize Governance System
   Fetch other details from the package. Including ADMIN_CAP_ID and GOVERNANCE_SYSTEM_ID.

For this view all the SUI objects created using `sui client objects`.

```bash
export ADMIN_CAP_ID=0x01968757b52e1b9c7f7ac44a167984c83757cc1de844500db964cbc5315cc775
export GOVERNANCE_SYSTEM_ID=0xf959b09a23202f1e04fb8379107e3fbfc0f5597d4a0bd7a04eae2c6b92b6b771
export GOVTOKEN_ADMIN_CAP=0xbd1ac83f0b22310a333a60d3fa88779e2881b6ab72d7c06059d6b88467341d7c
export TREASURY_ID=0x2533bd61ecd09cd585329d3245b58f8d33d6551a797c82515ccb31db0c473aa8
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
export GOV_TOKEN_ID=0x9777bb0fdb3a4181966abc7a7b2d1a3d54b06109a21edc20f3122b172d3bfc74
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
