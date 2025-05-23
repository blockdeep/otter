#  Otter — Decentralized Governance on Sui

Welcome to **Otter**, the governance framework built on Sui blockchain for the Sui ecosystem.  
Otter makes it easy for any Sui-based dApp to launch, manage, and scale decentralized governance — no complex setup required.

---

## 🌊 WHY Otter?

In the ocean of Web3 governance, dApps on Sui lack a native, unified solution. Otter fills that gap by offering:

- A plug-and-play governance layer for any Sui dApp.
- Frictionless on-chain voting with real-time feedback.
- Walrus-based storage refunds for proposal cost optimization.
- A single unified interface to govern across the entire Sui ecosystem.

---

## 🔧 CORE FEATURES

- **Unified Governance Hub**: Discover and participate in proposals across all onboarded dApps.
- **Create & Vote on Proposals**: Easily launch proposals, cast votes (Yes/No/Abstain), and track results.
- **On-Chain Execution**: Execute governance-approved smart contract actions directly.
- **Access Control Support**: Make sure Governance approved functions are targetted only.
- **Storage Refunds via Walrus**: Failed proposals allow proposers to reclaim their storage cost.
- **Custom Governance Models**: Projects can configure quorum, voting thresholds, and execution logic.

---

## 🚀 APP STRUCTURE


### GOVERNANCE DASHBOARD (/governance)
- A governance dashboard to:
  - View all whitelisted dApp governance instances.
  - Create and manage proposals for a governance instance.
  - Vote and track proposal outcomes.

### LAUNCH GOVERNANCE (/governance/launch)
 - As an MVP for the hackathon we've managed to build a contract generator for enabling governance in dApp contracts.
 - Generate your own governance contract with three easy steps:
    1. Upload your App contract (in move language).
    2. Choose the functions you want to include in the governance contract.
    3. That's it! Our backend will generate a governance contract which you can download and deploy!.
  - For steps on how to deploy the governance contract follow this [guide](./docs/Deploy)  

### WHITELIST GOVERNANCE (/governance/whitelist)

- Use the deployed packageId to whitelist your governance and our indexer will start tracking everything for you.

---

## 📅 PRODUCT ROADMAP

### ✅ MVP
- [x] Launch Governance frontend
- [x] Generic smart contract for quick setup
- [x] Walrus integration for proposal description storage and refunds
- [x] Frontend UI for proposal creation, voting, and execution
- [x] Whitelisting feature for indexer.


### 🔜 Next Iteration
- [ ] Automatic deployment.
- [ ] Walrus site to give sub-domain to each Governance
---

## 📘 Contract Compatibility

Check out the docs for [governance compatibitility](./docs/Compatibility).

---

## 🧑‍💻 Built With

- **Sui Move** – On-chain governance contracts
- **Walrus** – Programmable storage for refunds
- **Vitejs+ Tailwind** – Frontend UI
- **Typescript + Indexers** – Proposal & vote indexing

---

## 🤝 Contributing

If you're interested in contributing or getting involved, feel free to open an issue or contact us!

---

## 📬 Contact

- **Email**: info@blockdeep.io

---

Made with 🐋 for the Sui ecosystem.
