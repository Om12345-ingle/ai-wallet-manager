#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_initialization_and_limits() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, WalletGuard);
    let client = WalletGuardClient::new(&env, &contract_id);

    let owner = Address::generate(&env);

    client.initialize(&owner);

    let info = client.get_spending_info(&owner);
    assert_eq!(info.daily_limit, 1000_0000000);
    assert_eq!(info.monthly_limit, 10000_0000000);
    assert_eq!(info.max_tx_amount, 500_0000000);
    assert!(!info.is_frozen);

    // Update daily limit
    client.set_daily_limit(&owner, &2000_0000000);
    let updated_info = client.get_spending_info(&owner);
    assert_eq!(updated_info.daily_limit, 2000_0000000);
}

#[test]
fn test_transaction_validation_and_recording() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, WalletGuard);
    let client = WalletGuardClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    client.initialize(&owner);

    // Validate normal amount within limits (100 XLM)
    assert!(client.validate_transaction(&owner, &100_0000000));

    // Validate amount exceeding max_tx_amount (600 XLM > 500 XLM max tx)
    assert!(!client.validate_transaction(&owner, &600_0000000));

    // Record a 300 XLM transaction
    client.record_transaction(&owner, &300_0000000);

    let info = client.get_spending_info(&owner);
    assert_eq!(info.daily_spent, 300_0000000);
}

#[test]
fn test_emergency_freeze() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, WalletGuard);
    let client = WalletGuardClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    client.initialize(&owner);

    // Freeze wallet
    client.freeze_wallet(&owner);
    let info = client.get_spending_info(&owner);
    assert!(info.is_frozen);

    // Validation should now fail
    assert!(!client.validate_transaction(&owner, &10_0000000));

    // Unfreeze wallet
    client.unfreeze_wallet(&owner);
    assert!(client.validate_transaction(&owner, &10_0000000));
}

#[test]
fn test_contacts_and_risk_evaluation() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, WalletGuard);
    let client = WalletGuardClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let contact_addr = Address::generate(&env);
    client.initialize(&owner);

    let contact_name = String::from_str(&env, "Alice");
    client.add_contact(&owner, &contact_name, &contact_addr, &true);

    let risk = client.evaluate_tx_risk(&owner, &50_0000000, &contact_name);
    assert!(risk.is_allowed);
    assert!(risk.risk_score < 80);
}