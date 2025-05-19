module crowdfund::Crowdfund;

use sui::coin::{Self, Coin, value};
use sui::sui::SUI;
use sui::balance::{Self, Balance};
use sui::clock::{Self, Clock};

/// Campaign object
public struct Campaign has key, store {
    id: UID,
    creator: address,
    funding_goal: u64,
    deadline: u64,
    withdrawal_fee: u64,
    min_donation: u64,
    donated: u64,
    funds: Balance<SUI>,
    donors: vector<address>,
}

/// Capability that identifies the governance contract
public struct GovernanceCapability has key {
    id: UID
}

/// Error codes
const ENotCreator: u64 = 1;
const EDeadlineNotReached: u64 = 2;
const EMinDonation: u64 = 3;
const EInsufficientFunds: u64 = 4;

/// Initialize function - called once when the contract is published
/// Creates and sends the governance capability to the deployer
fun init(ctx: &mut TxContext) {
    let governance_cap = GovernanceCapability {
        id: object::new(ctx)
    };
    transfer::transfer(governance_cap, tx_context::sender(ctx));
}

/// Transfer the governance capability to a new address
/// Can only be called by the current holder of the capability
public entry fun transfer_governance(
    governance_cap: GovernanceCapability, 
    new_governor: address
) {
    // The capability is moved by value, ensuring only the current owner can transfer it
    transfer::transfer(governance_cap, new_governor);
}


public entry fun create_campaign(
    funding_goal: u64,
    deadline: u64,
    withdrawal_fee: u64,
    min_donation: u64,
    ctx: &mut TxContext,
) {
    let creator = tx_context::sender(ctx);
    let campaign = Campaign {
        id: object::new(ctx),
        creator,
        funding_goal,
        deadline,
        withdrawal_fee,
        min_donation,
        donated: 0,
        funds: balance::zero(),
        donors: vector::empty<address>(),
    };
    transfer::transfer(campaign, creator);
}

public entry fun donate(c: &mut Campaign, coin: Coin<SUI>, ctx: &mut TxContext) {
    let sender = tx_context::sender(ctx);
    let amount = value(&coin);
    
    // Check minimum donation amount
    assert!(amount >= c.min_donation, EMinDonation);
    
    // Update donation stats
    c.donated = c.donated + amount;
    vector::push_back(&mut c.donors, sender);
    
    // Add funds to the campaign balance
    let coin_balance = coin::into_balance(coin);
    balance::join(&mut c.funds, coin_balance);
}

public entry fun withdraw_funds(c: &mut Campaign, clock: &Clock, ctx: &mut TxContext) {
    // Only the creator can withdraw funds
    let sender = tx_context::sender(ctx);
    assert!(sender == c.creator, ENotCreator);
    
    // Check if deadline has passed
    let current_time = clock::timestamp_ms(clock);
    assert!(current_time >= c.deadline, EDeadlineNotReached);
    
    // Calculate fee amount and remaining funds
    let total_funds = balance::value(&c.funds);
    assert!(total_funds > 0, EInsufficientFunds);
    
    let fee_amount = (total_funds * c.withdrawal_fee) / 1000000000; // Assuming fee is in basis points of 10^9
    let remaining_amount = total_funds - fee_amount;
    
    // Create coins and transfer them
    if (fee_amount > 0) {
        // Send fee to the contract deployer (could be changed to a specific fee recipient)
        let fee_coin = coin::from_balance(balance::split(&mut c.funds, fee_amount), ctx);
        transfer::public_transfer(fee_coin, sender);
    };
    
    // Send remaining funds to the campaign creator
    let remaining_coin = coin::from_balance(balance::split(&mut c.funds, remaining_amount), ctx);
    transfer::public_transfer(remaining_coin, c.creator);
}

/// Transfer funds from a campaign to any address - only callable by governance
public entry fun transfer_funds(
    c: &mut Campaign, 
    recipient: address, 
    amount: u64,
    _governance_cap: &GovernanceCapability, 
    ctx: &mut TxContext
) {
    // Check if funds are available
    let total_funds = balance::value(&c.funds);
    assert!(total_funds >= amount, EInsufficientFunds);
    
    // Create a coin with the specified amount and transfer it to the recipient
    let transfer_coin = coin::from_balance(balance::split(&mut c.funds, amount), ctx);
    transfer::public_transfer(transfer_coin, recipient);
}