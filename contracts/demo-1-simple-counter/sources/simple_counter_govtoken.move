// Copyright (c) Mysten Labs, Inc.
  // SPDX-License-Identifier: Apache-2.0
  
  module simple_counter_governance::govtoken {
      use sui::balance::{Self, Balance};
      use sui::coin::{Self, Coin, TreasuryCap};
      use sui::sui::SUI;
      use sui::tx_context::{sender};
      use sui::event;
  
      /// Error constants
      const EInsufficientBalance: u64 = 1;
  
      /// The governance token as a coin
      public struct GOVTOKEN has drop {}
  
      /// Stores governance token treasury
      public struct Treasury has key {
          id: UID,
          /// Treasury funds (from token purchases)
          funds: Balance<SUI>,
          /// The Treasury Cap for the governance coin
          treasury_cap: TreasuryCap<GOVTOKEN>,
      }
  
      /// Admin capability for governance operations
      public struct AdminCap has key, store {
          id: UID,
      }
  
      /// Events
      public struct CoinsMinted has copy, drop {
          recipient: address,
          amount: u64,
          minter: address,
      }
  
      public struct CoinsTransferred has copy, drop {
          from: address,
          to: address,
          amount: u64,
      }
  
      public struct CoinsBurned has copy, drop {
          amount: u64,
          burner: address,
      }
  
      // === Initialize the governance coin ===
      fun init(witness: GOVTOKEN, ctx: &mut TxContext) {
          let (treasury_cap, metadata) = coin::create_currency(
              witness,
              8, // 8 decimals for more precise governance
              b"GOV",
              b"Governance Token",
              b"Governance coin for decentralized protocol decision making",
              option::none(),
              ctx,
          );
  
          // Create and share the Treasury
          transfer::share_object(Treasury {
              id: object::new(ctx),
              treasury_cap,
              funds: balance::zero(),
          });
  
          // Create and transfer AdminCap to deployer
          transfer::transfer(
              AdminCap { id: object::new(ctx) },
              tx_context::sender(ctx)
          );
  
          // Make metadata public
          transfer::public_freeze_object(metadata);
      }
  
      // === Coin minting functionality ===
      
      /// Mint governance coins directly to an address
      public entry fun mint_coins(
          _admin_cap: &AdminCap,
          treasury: &mut Treasury,
          amount: u64,
          recipient: address,
          ctx: &mut TxContext,
      ) {
          // AdminCap validates authority to mint
          let minter = tx_context::sender(ctx);
          
          // Mint coins and transfer to recipient
          let coins = coin::mint(&mut treasury.treasury_cap, amount, ctx);
          transfer::public_transfer(coins, recipient);
          
          // Emit coin minting event
          event::emit(CoinsMinted {
              recipient,
              amount,
              minter,
          });
      }
  
      /// Transfer coins to another address
      public entry fun transfer_coins(
          coins: &mut Coin<GOVTOKEN>,
          amount: u64,
          recipient: address,
          ctx: &mut TxContext
      ) {
          let sender_addr = sender(ctx);
          assert!(coin::value(coins) >= amount, EInsufficientBalance);
          
          // Split coins and transfer to recipient
          let coins_to_send = coin::split(coins, amount, ctx);
          transfer::public_transfer(coins_to_send, recipient);
          
          // Emit transfer event
          event::emit(CoinsTransferred {
              from: sender_addr,
              to: recipient,
              amount
          });
      }
  
      /// Burn coins (reduce supply)
      public entry fun burn_coins(
          _admin_cap: &AdminCap,
          treasury: &mut Treasury,
          coins: Coin<GOVTOKEN>,
          ctx: &mut TxContext
      ) {
          let amount = coin::value(&coins);
          coin::burn(&mut treasury.treasury_cap, coins);
          
          // Emit burn event
          event::emit(CoinsBurned {
              amount,
              burner: sender(ctx)
          });
      }
  
      /// Get balance from coin
      public fun balance(coin: &Coin<GOVTOKEN>): u64 {
          coin::value(coin)
      }
      
      // === Treasury management ===
      
      /// Deposit SUI to treasury
      public entry fun deposit_sui(
          treasury: &mut Treasury,
          payment: Coin<SUI>,
      ) {
          let balance = coin::into_balance(payment);
          balance::join(&mut treasury.funds, balance);
      }
      
      /// Withdraw funds from treasury
      public entry fun withdraw_funds(
          _admin_cap: &AdminCap,
          treasury: &mut Treasury,
          amount: u64,
          recipient: address,
          ctx: &mut TxContext
      ) {
          // AdminCap validates authority to withdraw
          let coin = coin::take(&mut treasury.funds, amount, ctx);
          transfer::public_transfer(coin, recipient);
      }
      
      /// Expose treasury cap for governance module
      public fun borrow_treasury_cap(self: &Treasury): &TreasuryCap<GOVTOKEN> {
          &self.treasury_cap
      }
      
      // === Utility functions ===
      
      /// Join two coins
      public entry fun join_coins(
          coin_to_keep: &mut Coin<GOVTOKEN>, 
          coin_to_merge: Coin<GOVTOKEN>
      ) {
          coin::join(coin_to_keep, coin_to_merge);
      }
  
      /// Split a coin
      public entry fun split_coin(
          coin: &mut Coin<GOVTOKEN>,
          amount: u64,
          recipient: address,
          ctx: &mut TxContext
      ) {
          assert!(coin::value(coin) >= amount, EInsufficientBalance);
          transfer::public_transfer(coin::split(coin, amount, ctx), recipient);
      }
  
      #[test_only]
      /// Initialize the module for testing
      public fun init_for_testing(ctx: &mut TxContext) {
          let witness = GOVTOKEN {};
          init(witness, ctx);
      }
  
      #[test_only]
      public fun mint_for_testing(
          treasury: &mut Treasury, 
          amount: u64, 
          ctx: &mut TxContext
      ): Coin<GOVTOKEN> {
          coin::mint(&mut treasury.treasury_cap, amount, ctx)
      }
        
      #[test_only]
      public fun create_admin_cap_for_testing(ctx: &mut TxContext): AdminCap {
          AdminCap { id: object::new(ctx) }
      }
  
      #[test_only]
      public fun destroy_admin_cap_for_testing(cap: AdminCap) {
          let AdminCap { id } = cap;
          object::delete(id);
      }
  }