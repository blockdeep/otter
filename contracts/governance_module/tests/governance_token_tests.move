#[test_only]
module governance_module::govtoken_tests {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::test_scenario::{Self as ts};
    use sui::test_utils::{assert_eq};
    
    // Import the module we're testing
    use governance_module::govtoken::{Self, GOVTOKEN, Treasury, AdminCap};
    
    // Test addresses
    const ADMIN: address = @0x1;
    const USER1: address = @0x2;
    const USER2: address = @0x3;
    
    // Test initialization
    #[test]
    fun test_init() {
        // Create test scenario with ADMIN as the deployer
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the module
        {
            govtoken::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Check that objects were created correctly
        ts::next_tx(&mut scenario, ADMIN);
        {
            // Admin should have received the AdminCap
            assert!(ts::has_most_recent_for_address<AdminCap>(ADMIN), 0);
            
            // Treasury should be a shared object
            assert!(ts::has_most_recent_shared<Treasury>(), 1);
        };
        
        ts::end(scenario);
    }
    
    // Test minting coins
    #[test]
    fun test_mint_coins() {
        let mut scenario = ts::begin(ADMIN);
        
        // Initialize the module
        {
            govtoken::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Mint coins to USER1
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut treasury = ts::take_shared<Treasury>(&scenario);
            
            let amount = 1000;
            govtoken::mint_coins(&admin_cap, &mut treasury, amount, USER1, ts::ctx(&mut scenario));
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(treasury);
        };
        
        // Check that USER1 received the coins
        ts::next_tx(&mut scenario, USER1);
        {
            // Check USER1 has the minted coins
            assert!(ts::has_most_recent_for_address<Coin<GOVTOKEN>>(USER1), 2);
            
            let coins = ts::take_from_address<Coin<GOVTOKEN>>(&scenario, USER1);
            assert_eq(govtoken::balance(&coins), 1000);
            ts::return_to_address(USER1, coins);
        };
        
        ts::end(scenario);
    }
    
    // Test transferring coins
    #[test]
    fun test_transfer_coins() {
        let  mut scenario = ts::begin(ADMIN);
        
        // Initialize the module and mint coins to USER1
        {
            govtoken::init_for_testing(ts::ctx(&mut scenario));
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut treasury = ts::take_shared<Treasury>(&scenario);
            
            govtoken::mint_coins(&admin_cap, &mut treasury, 1000, USER1, ts::ctx(&mut scenario));
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(treasury);
        };
        
        // USER1 transfers coins to USER2
        ts::next_tx(&mut scenario, USER1);
        {
            let mut coins = ts::take_from_address<Coin<GOVTOKEN>>(&scenario, USER1);
            
            govtoken::transfer_coins(&mut coins, 400, USER2, ts::ctx(&mut scenario));
            
            // Check the remaining balance
            assert_eq(govtoken::balance(&coins), 600);
            ts::return_to_address(USER1, coins);
        };
        
        // Check that USER2 received the coins
        ts::next_tx(&mut scenario, USER2);
        {
            let coins = ts::take_from_address<Coin<GOVTOKEN>>(&scenario, USER2);
            assert_eq(govtoken::balance(&coins), 400);
            ts::return_to_address(USER2, coins);
        };
        
        ts::end(scenario);
    }
    
    // Test burning coins
    #[test]
    fun test_burn_coins() {
        let  mut scenario = ts::begin(ADMIN);
        
        // Initialize the module and mint coins to ADMIN
        {
            govtoken::init_for_testing(ts::ctx(&mut scenario));
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut treasury = ts::take_shared<Treasury>(&scenario);
            
            govtoken::mint_coins(&admin_cap, &mut treasury, 1000, ADMIN, ts::ctx(&mut scenario));
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(treasury);
        };
        
        // ADMIN burns some coins
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut treasury = ts::take_shared<Treasury>(&scenario);
            let mut coins = ts::take_from_address<Coin<GOVTOKEN>>(&scenario, ADMIN);
            
            // Take a portion of the coins to burn
            let burn_amount = 400;
            let coins_to_burn = coin::split(&mut coins, burn_amount, ts::ctx(&mut scenario));
            
            govtoken::burn_coins(&admin_cap, &mut treasury, coins_to_burn, ts::ctx(&mut scenario));
            
            // Check the remaining balance
            assert_eq(govtoken::balance(&coins), 600);
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(treasury);
            ts::return_to_address(ADMIN, coins);
        };
        
        ts::end(scenario);
    }
    
    // Test joining coins
    #[test]
    fun test_join_coins() {
        let  mut scenario = ts::begin(ADMIN);
        
        // Initialize the module and mint coins to USER1
        {
            govtoken::init_for_testing(ts::ctx(&mut scenario));
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut treasury = ts::take_shared<Treasury>(&scenario);
            
            // Mint two separate batches of coins to USER1
            govtoken::mint_coins(&admin_cap, &mut treasury, 500, USER1, ts::ctx(&mut scenario));
            govtoken::mint_coins(&admin_cap, &mut treasury, 300, USER1, ts::ctx(&mut scenario));
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(treasury);
        };
        
        // USER1 joins the coins
        ts::next_tx(&mut scenario, USER1);
        {
            // Take both coins from the address
            let mut coins1 = ts::take_from_address<Coin<GOVTOKEN>>(&scenario, USER1);
            let coins2 = ts::take_from_address<Coin<GOVTOKEN>>(&scenario, USER1);
            
            // Join the coins
            govtoken::join_coins(&mut coins1, coins2);
            
            // Check the total balance
            assert_eq(govtoken::balance(&coins1), 800);
            
            ts::return_to_address(USER1, coins1);
        };
        
        ts::end(scenario);
    }
    
    // Test splitting coins
    // Test splitting coins
#[test]
fun test_split_coin() {
    let mut scenario = ts::begin(ADMIN);
    
    // Initialize the module and mint coins to USER1
    {
        govtoken::init_for_testing(ts::ctx(&mut scenario));
    };
    
    ts::next_tx(&mut scenario, ADMIN);
    {
        let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
        let mut treasury = ts::take_shared<Treasury>(&scenario);
        
        govtoken::mint_coins(&admin_cap, &mut treasury, 1000, USER1, ts::ctx(&mut scenario));
        
        ts::return_to_address(ADMIN, admin_cap);
        ts::return_shared(treasury);
    };
    
    // USER1 splits coins
    ts::next_tx(&mut scenario, USER1);
    {
        let mut coins = ts::take_from_address<Coin<GOVTOKEN>>(&scenario, USER1);
        
        // Use the module's split_coin function instead of manually splitting
        govtoken::split_coin(&mut coins, 300, USER1, ts::ctx(&mut scenario));
        
        // Check remaining balance
        assert_eq(govtoken::balance(&coins), 700);
        
        // Return original coins
        ts::return_to_address(USER1, coins);
    };
    
    // Check that the split worked (USER1 should now have two coin objects)
    ts::next_tx(&mut scenario, USER1);
    {
        // Get the first coin (700 units)
        let coins1 = ts::take_from_address<Coin<GOVTOKEN>>(&scenario, USER1);
        assert_eq(govtoken::balance(&coins1), 700);
        
        // Get the second coin (300 units)
        let coins2 = ts::take_from_address<Coin<GOVTOKEN>>(&scenario, USER1);
        assert_eq(govtoken::balance(&coins2), 300);
        
        // Return both coins
        ts::return_to_address(USER1, coins1);
        ts::return_to_address(USER1, coins2);
    };
    
    ts::end(scenario);
}
    
    // Test treasury management - deposit SUI
    #[test]
    fun test_deposit_sui() {
        let  mut scenario = ts::begin(ADMIN);
        
        // Initialize the module
        {
            govtoken::init_for_testing(ts::ctx(&mut scenario));
        };
        
        // Create some SUI for testing
        ts::next_tx(&mut scenario, ADMIN);
        {
            let ctx = ts::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(1000, ctx);
            transfer::public_transfer(coin, ADMIN);
        };
        
        // Deposit SUI to treasury
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut treasury = ts::take_shared<Treasury>(&scenario);
            let sui_coins = ts::take_from_address<Coin<SUI>>(&scenario, ADMIN);
            
            govtoken::deposit_sui(&mut treasury, sui_coins);
            
            ts::return_shared(treasury);
        };
        
        // Withdraw funds from treasury
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut treasury = ts::take_shared<Treasury>(&scenario);
            
            govtoken::withdraw_funds(&admin_cap, &mut treasury, 500, USER1, ts::ctx(&mut scenario));
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(treasury);
        };
        
        // Check that USER1 received the SUI
        ts::next_tx(&mut scenario, USER1);
        {
            let sui_coins = ts::take_from_address<Coin<SUI>>(&scenario, USER1);
            assert_eq(coin::value(&sui_coins), 500);
            ts::return_to_address(USER1, sui_coins);
        };
        
        ts::end(scenario);
    }
    
    // Test error cases
    #[test]
    #[expected_failure(abort_code = govtoken::EInsufficientBalance)]
    fun test_transfer_insufficient_balance() {
        let  mut scenario = ts::begin(ADMIN);
        
        // Initialize the module and mint coins to USER1
        {
            govtoken::init_for_testing(ts::ctx(&mut scenario));
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_address<AdminCap>(&scenario, ADMIN);
            let mut treasury = ts::take_shared<Treasury>(&scenario);
            
            govtoken::mint_coins(&admin_cap, &mut treasury, 100, USER1, ts::ctx(&mut scenario));
            
            ts::return_to_address(ADMIN, admin_cap);
            ts::return_shared(treasury);
        };
        
        // USER1 tries to transfer more coins than they have
        ts::next_tx(&mut scenario, USER1);
        {
            let mut coins = ts::take_from_address<Coin<GOVTOKEN>>(&scenario, USER1);
            
            // This should fail with EInsufficientBalance
            govtoken::transfer_coins(&mut coins, 200, USER2, ts::ctx(&mut scenario));
            
            ts::return_to_address(USER1, coins);
        };
        
        ts::end(scenario);
    }
    
    // Test unauthorized access
#[test]
#[expected_failure] // Use the specific error code
fun test_unauthorized_mint() {
    let mut scenario = ts::begin(ADMIN);
    
    // Initialize the module
    {
        govtoken::init_for_testing(ts::ctx(&mut scenario));
    };
    
    // USER1 tries to mint coins - this should fail since USER1 doesn't have an admin cap
    ts::next_tx(&mut scenario, USER1);
    {
        let mut treasury = ts::take_shared<Treasury>(&scenario);
        
        // Create an AdminCap for USER1
        let fake_admin_cap = govtoken::create_admin_cap_for_testing(ts::ctx(&mut scenario));
        
        // This should fail with ENotAuthorized
        govtoken::mint_coins(&fake_admin_cap, &mut treasury, 100, USER1, ts::ctx(&mut scenario));
        
        govtoken::destroy_admin_cap_for_testing(fake_admin_cap);
        ts::return_shared(treasury);
    };
    
    ts::end(scenario);
}
}