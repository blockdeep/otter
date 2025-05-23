module crowdfund::Crowdfund;

use sui::balance::{Self, Balance};
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin, value};
use sui::sui::SUI;

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

/// Capability that proves authority to call governance functions
public struct GovernanceCapability has key, store {
    id: UID,
}

/// Error codes
const ENotCreator: u64 = 1;
const EDeadlineNotReached: u64 = 2;
const EMinDonation: u64 = 3;
const EInsufficientFunds: u64 = 4;

/// Initialize function - creates and transfers governance capability to deployer
fun init(ctx: &mut TxContext) {
    let governance_cap = GovernanceCapability {
        id: object::new(ctx),
    };
    // Transfer capability to deployer who can then transfer it to governance contract
    transfer::transfer(governance_cap, tx_context::sender(ctx));
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

    transfer::share_object(campaign);
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

    let fee_amount = (total_funds * c.withdrawal_fee) / 1000000000;
    let remaining_amount = total_funds - fee_amount;

    // Create coins and transfer them
    if (fee_amount > 0) {
        let fee_coin = coin::from_balance(balance::split(&mut c.funds, fee_amount), ctx);
        transfer::public_transfer(fee_coin, sender);
    };

    let remaining_coin = coin::from_balance(balance::split(&mut c.funds, remaining_amount), ctx);
    transfer::public_transfer(remaining_coin, c.creator);
}

/// Transfer funds from campaign - only callable with governance capability
public entry fun transfer_funds(
    _governance_cap: &GovernanceCapability, // ← Proof of authority
    c: &mut Campaign,
    recipient: address,
    amount: u64,
    ctx: &mut TxContext) {
    // No need to check sender - possession of capability is proof enough

    // Check if funds are available
    let total_funds = balance::value(&c.funds);
    assert!(total_funds >= amount, EInsufficientFunds);

    // Create a coin with the specified amount and transfer it to the recipient
    let transfer_coin = coin::from_balance(balance::split(&mut c.funds, amount), ctx);
    transfer::public_transfer(transfer_coin, recipient);
}
