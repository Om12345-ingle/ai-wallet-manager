#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SpendingInfo {
    pub daily_limit: i128,
    pub monthly_limit: i128,
    pub max_tx_amount: i128,
    pub daily_spent: i128,
    pub monthly_spent: i128,
    pub last_spent_timestamp: u64,
    pub is_frozen: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Contact {
    pub name: String,
    pub address: Address,
    pub is_trusted: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RiskAssessment {
    pub risk_score: u32, // 0 (safe) to 100 (high risk)
    pub is_allowed: bool,
    pub reason: String,
}

const SPENDING_INFO: Symbol = symbol_short!("SPENDING");
const CONTACTS: Symbol = symbol_short!("CONTACTS");

#[contract]
pub struct WalletGuard;

#[contractimpl]
impl WalletGuard {
    /// Initialize wallet guard defaults for owner
    pub fn initialize(env: Env, owner: Address) {
        owner.require_auth();

        let default_spending = SpendingInfo {
            daily_limit: 1000_0000000,    // Default 1000 XLM
            monthly_limit: 10000_0000000, // Default 10000 XLM
            max_tx_amount: 500_0000000,   // Default max single tx 500 XLM
            daily_spent: 0,
            monthly_spent: 0,
            last_spent_timestamp: env.ledger().timestamp(),
            is_frozen: false,
        };

        env.storage().instance().set(&(SPENDING_INFO, owner), &default_spending);
    }

    /// Set daily spending limit
    pub fn set_daily_limit(env: Env, owner: Address, limit: i128) {
        owner.require_auth();

        let mut spending_info = Self::get_spending_info(env.clone(), owner.clone());
        spending_info.daily_limit = limit;
        env.storage().instance().set(&(SPENDING_INFO, owner), &spending_info);
    }

    /// Set monthly spending limit
    pub fn set_monthly_limit(env: Env, owner: Address, limit: i128) {
        owner.require_auth();

        let mut spending_info = Self::get_spending_info(env.clone(), owner.clone());
        spending_info.monthly_limit = limit;
        env.storage().instance().set(&(SPENDING_INFO, owner), &spending_info);
    }

    /// Set max transaction limit
    pub fn set_max_tx_amount(env: Env, owner: Address, max_tx: i128) {
        owner.require_auth();

        let mut spending_info = Self::get_spending_info(env.clone(), owner.clone());
        spending_info.max_tx_amount = max_tx;
        env.storage().instance().set(&(SPENDING_INFO, owner), &spending_info);
    }

    /// Freeze wallet for emergency security
    pub fn freeze_wallet(env: Env, owner: Address) {
        owner.require_auth();

        let mut spending_info = Self::get_spending_info(env.clone(), owner.clone());
        spending_info.is_frozen = true;
        env.storage().instance().set(&(SPENDING_INFO, owner), &spending_info);
    }

    /// Unfreeze wallet
    pub fn unfreeze_wallet(env: Env, owner: Address) {
        owner.require_auth();

        let mut spending_info = Self::get_spending_info(env.clone(), owner.clone());
        spending_info.is_frozen = false;
        env.storage().instance().set(&(SPENDING_INFO, owner), &spending_info);
    }

    /// Add or update a security contact
    pub fn add_contact(env: Env, owner: Address, name: String, contact_address: Address, is_trusted: bool) {
        owner.require_auth();

        let contact = Contact {
            name: name.clone(),
            address: contact_address,
            is_trusted,
        };

        let key = (CONTACTS, owner, name);
        env.storage().persistent().set(&key, &contact);
    }

    /// Remove a contact
    pub fn remove_contact(env: Env, owner: Address, name: String) {
        owner.require_auth();

        let key = (CONTACTS, owner, name);
        env.storage().persistent().remove(&key);
    }

    /// Retrieve spending information for owner
    pub fn get_spending_info(env: Env, owner: Address) -> SpendingInfo {
        let mut info: SpendingInfo = env
            .storage()
            .instance()
            .get(&(SPENDING_INFO, owner))
            .unwrap_or(SpendingInfo {
                daily_limit: 1000_0000000,
                monthly_limit: 10000_0000000,
                max_tx_amount: 500_0000000,
                daily_spent: 0,
                monthly_spent: 0,
                last_spent_timestamp: env.ledger().timestamp(),
                is_frozen: false,
            });

        // Reset daily accumulator if > 24 hours (86400 seconds) have elapsed
        let now = env.ledger().timestamp();
        if now.saturating_sub(info.last_spent_timestamp) > 86400 {
            info.daily_spent = 0;
        }

        info
    }

    /// Validate transaction against spending limits and frozen state
    pub fn validate_transaction(env: Env, owner: Address, amount: i128) -> bool {
        let spending_info = Self::get_spending_info(env, owner);

        if spending_info.is_frozen {
            return false;
        }

        if amount > spending_info.max_tx_amount {
            return false;
        }

        if spending_info.daily_spent + amount > spending_info.daily_limit {
            return false;
        }

        if spending_info.monthly_spent + amount > spending_info.monthly_limit {
            return false;
        }

        true
    }

    /// Record transaction spent amount against accumulators
    pub fn record_transaction(env: Env, owner: Address, amount: i128) {
        owner.require_auth();

        let mut spending_info = Self::get_spending_info(env.clone(), owner.clone());
        spending_info.daily_spent += amount;
        spending_info.monthly_spent += amount;
        spending_info.last_spent_timestamp = env.ledger().timestamp();

        env.storage().instance().set(&(SPENDING_INFO, owner), &spending_info);
    }

    /// Evaluate transaction security risk with AI guardrails
    pub fn evaluate_tx_risk(
        env: Env,
        owner: Address,
        amount: i128,
        recipient_name: String,
    ) -> RiskAssessment {
        let spending_info = Self::get_spending_info(env.clone(), owner.clone());

        if spending_info.is_frozen {
            return RiskAssessment {
                risk_score: 100,
                is_allowed: false,
                reason: String::from_str(&env, "Wallet is frozen"),
            };
        }

        let contact_key = (CONTACTS, owner, recipient_name);
        let is_trusted = match env.storage().persistent().get::<_, Contact>(&contact_key) {
            Some(c) => c.is_trusted,
            None => false,
        };

        let mut score: u32 = 10; // Base risk

        if !is_trusted {
            score += 40;
        }

        if amount > (spending_info.daily_limit / 2) {
            score += 35;
        }

        let allowed = score < 80 && Self::validate_transaction(env.clone(), contact_key.1, amount);

        RiskAssessment {
            risk_score: score,
            is_allowed: allowed,
            reason: if allowed {
                String::from_str(&env, "Low risk transaction")
            } else {
                String::from_str(&env, "High risk or exceeds spending limits")
            },
        }
    }
}

#[cfg(test)]
mod test;