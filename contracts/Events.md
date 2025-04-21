## EVENTS THAT MUST BE EMITTED.

```move
event ProposalCreated(
    uint256 proposalId,
    address proposer,
    address[] targets,
    uint256[] values,
    string[] signatures,
    bytes[] calldatas,
    uint256 startBlock,
    uint256 endBlock,
    string description
);

public struct ProposalCreated has copy, drop {
    proposal_id: ID,
    proposer: address,
    title: String,
    voting_ends_at: u64,
    threshold: u64,
}
```



event ProposalQueued(uint256 proposalId, uint256 etaSeconds);
event ProposalCanceled(uint256 proposalId);
event ProposalExecuted(uint256 proposalId);

event VoteCast(
    address indexed voter, 
    uint256 proposalId, 
    uint8 support, 
    uint256 weight, 
    string reason
);