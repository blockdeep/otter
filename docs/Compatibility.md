# 🔄 Otter Compatibility Guide

This document explains how to ensure your dApp is **compatible** with the Otter governance framework. Otter provides a governance layer that integrates tightly with both smart contracts and the frontend UI. To support real-time updates and seamless on-chain governance execution, certain **events and function definitions** are expected to follow a loosely enforced structure.

---

## 📡 How It Works

- An **indexer** monitors the Sui blockchain for **specific governance events** emitted by contracts using Otter.
- The **UI layer** (governance dashboard) responds to these events and expects specific function names and parameter formats to drive workflows like proposal creation, voting, finalization, and execution.

> ⚠️ You can modify or extend these interfaces slightly, but significant deviations may require frontend reconfiguration.

---

## 🧩 Required Events

Your governance contract must emit the following events to ensure compatibility with Otter's indexer:

### 1. `ProposalCreated`

```move
event::emit(ProposalCreated {
    proposal_id,
    creator,
    title,
    description,
    voting_ends_at,
    threshold,
});
```

**Used For:** Indexing newly created proposals.

---

### 2. `VoteCast`

```move
event::emit(VoteCast {
    proposal_id,
    voter,
    vote_type,
    voting_power,
});
```

**Used For:** Real-time voting metrics and preventing duplicate votes.

---

### 3. `ProposalStatusChanged`

```move
event::emit(ProposalStatusChanged {
    proposal_id,
    new_status,
});
```

**Used For:** Tracking transitions (e.g., Active → Passed → Executed).

---

### 4. `ProposalExecuted`

```move
event::emit(ProposalExecuted {
    proposal_id,
    executor,
});
```

**Used For:** Confirming successful execution and syncing UI.

---

## ⚙️ Function Compatibility Guidelines

To ensure the governance contract works with Otter, the following **entry functions** are expected, with reasonable structure:

---

### `create_proposal`

```move
public entry fun create_proposal(
    self: &mut GovernanceSystem,
    governance_coins: &Coin<GOVTOKEN>,
    title: String,
    description: String,
    voting_period_seconds: u64,
    clock: &Clock,
    proposal_kind: u8,
    value: u64,
    ctx: &mut TxContext
): ID
```

- `proposal_kind` can be a numeric enum selector (e.g. 0 for `Increment`, 1 for `SetValue`)
- `value` is a dynamic argument and may change depending on the proposal type
- Emits: `ProposalCreated`

---

### `vote`

```move
public entry fun vote(
    self: &mut GovernanceSystem,
    proposal_id: ID,
    governance_coins: &Coin<GOVTOKEN>,
    vote_type: u8,
    clock: &Clock,
    ctx: &mut TxContext
)
```

- `vote_type`: 0 = Yes, 1 = No, 2 = Abstain
- Emits: `VoteCast`

---

### `finalize_proposal`

```move
public entry fun finalize_proposal(
    self: &mut GovernanceSystem,
    proposal_id: ID,
    clock: &Clock,
    ctx: &mut TxContext
)
```

- Called after voting ends
- Emits: `ProposalStatusChanged`

---

### `execute_proposal`

```move
public entry fun execute_proposal(
    self: &mut GovernanceSystem,
    proposal_id: ID,
    governed_object: &mut GovernedType, // e.g., Counter
    ctx: &mut TxContext
)
```

- Performs the actual proposal logic (e.g., increment counter or set value)
- Emits:
  - `ProposalExecuted`
  - `ProposalStatusChanged`

> 🔧 The logic here must align with your `ProposalKind` enum (which can be customized per app).

---

## 🧱 ProposalKind Enum Pattern

You should define a `ProposalKind` enum in your contract to represent governance intents.

```move
public enum ProposalKind has drop, store {
    Increment,
    SetValue { value: u64 }
}
```

> 🧠 This enum **must** match the logic in both `create_proposal` and `execute_proposal`.

---

## 🧪 Customization Guidelines

- You may **extend** the `ProposalKind` enum to include app-specific actions.
- You can add more metadata or actions, **as long as**:
  - Events are still emitted
  - Required function entry points exist

---

## ✅ Summary

| Component             | Must Emit Event? | Must Match Signature? |
|----------------------|------------------|------------------------|
| `create_proposal`    | ✅ Yes           | ✅ Mostly              |
| `vote`               | ✅ Yes           | ✅ Yes                |
| `finalize_proposal`  | ✅ Yes           | ✅ Yes                |
| `execute_proposal`   | ✅ Yes           | ✅ Yes (customizable) |
| `ProposalKind` Enum  | —                | ✅ Yes                |

---

For any deviation or advanced customization, please coordinate with the Otter team to ensure compatibility with the frontend and indexer.

---

Made with 🐋 by the Otter team — bringing decentralized governance to the Sui ecosystem.
