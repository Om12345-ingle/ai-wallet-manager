#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String, Vec};

#[test]
fn test_initialize_and_add_asset() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, MultiAssetManager);
    let client = MultiAssetManagerClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let usdc_code = String::from_str(&env, "USDC");
    let usdc_issuer = Address::generate(&env);

    // Add USDC asset with price 8_500_000 stroops (0.85 XLM)
    client.add_asset(&admin, &usdc_code, &usdc_issuer, &8_500_000);

    // Update asset price
    client.update_asset_price(&admin, &usdc_code, &9_000_000);
}

#[test]
fn test_portfolio_and_target_allocation() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, MultiAssetManager);
    let client = MultiAssetManagerClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    client.initialize(&admin);

    let xlm_code = String::from_str(&env, "XLM");
    let usdc_code = String::from_str(&env, "USDC");

    // Update balance
    client.update_balance(&owner, &xlm_code, &1000_0000000);
    client.update_balance(&owner, &usdc_code, &500_0000000);

    let portfolio = client.get_portfolio(&owner);
    assert_eq!(portfolio.owner, owner);

    // Set target allocation: 60% XLM (6000 bps), 40% USDC (4000 bps)
    let mut codes = Vec::new(&env);
    codes.push_back(xlm_code);
    codes.push_back(usdc_code);

    let mut bps = Vec::new(&env);
    bps.push_back(6000);
    bps.push_back(4000);

    client.set_target_allocation(&owner, &codes, &bps);

    // Rebalance portfolio
    let trade_count = client.rebalance_portfolio(&owner);
    assert!(trade_count >= 0);
}

#[test]
fn test_swap_pool_and_execution() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, MultiAssetManager);
    let client = MultiAssetManagerClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    client.initialize(&admin);

    let xlm_code = String::from_str(&env, "XLM");
    let usdc_code = String::from_str(&env, "USDC");

    // Create swap pool with 1,000,000 XLM and 100,000 USDC reserve
    client.create_swap_pool(
        &admin,
        &xlm_code,
        &usdc_code,
        &1000000_0000000,
        &100000_0000000,
        &30, // 0.3% fee
    );

    // Create a swap order to exchange 100 XLM for min 9 USDC
    let order_id = client.create_swap_order(
        &owner,
        &xlm_code,
        &usdc_code,
        &100_0000000,
        &9_0000000,
    );

    assert_eq!(order_id, 1);

    // Execute swap
    let success = client.execute_swap(&order_id);
    assert!(success);
}
