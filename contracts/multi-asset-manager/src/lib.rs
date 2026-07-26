#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, String, Symbol, Vec,
};

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Asset {
    pub code: String,
    pub issuer: Address,
    pub balance: i128,
    pub price_xlm: i128, // Price in stroops per unit (1 XLM = 10_000_000 stroops)
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct SwapOrder {
    pub id: u64,
    pub owner: Address,
    pub from_asset: String,
    pub to_asset: String,
    pub amount: i128,
    pub min_receive: i128,
    pub timestamp: u64,
    pub status: String, // "pending", "completed", "cancelled"
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Portfolio {
    pub owner: Address,
    pub assets: Map<String, Asset>,
    pub target_bps: Map<String, u32>, // Target allocation in basis points (10000 = 100%)
    pub total_value_xlm: i128,
    pub last_updated: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct SwapPool {
    pub asset_a: String,
    pub asset_b: String,
    pub reserve_a: i128,
    pub reserve_b: i128,
    pub fee_rate: u32, // Basis points (30 = 0.3%)
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct RebalanceTrade {
    pub from_asset: String,
    pub to_asset: String,
    pub amount_xlm: i128,
}

const ADMIN: Symbol = symbol_short!("ADMIN");
const PORTFOLIOS: Symbol = symbol_short!("PORTFOLIO");
const SWAP_ORDERS: Symbol = symbol_short!("ORDERS");
const SWAP_POOLS: Symbol = symbol_short!("POOLS");
const ORDER_COUNTER: Symbol = symbol_short!("COUNTER");

#[contract]
pub struct MultiAssetManager;

#[contractimpl]
impl MultiAssetManager {
    /// Initialize the contract with admin authority
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&ORDER_COUNTER, &0u64);
    }

    /// Add a new supported asset with an initial oracle price
    pub fn add_asset(
        env: Env,
        _admin: Address,
        code: String,
        issuer: Address,
        initial_price_xlm: i128,
    ) {
        let stored_admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        stored_admin.require_auth();

        let asset = Asset {
            code: code.clone(),
            issuer,
            balance: 0,
            price_xlm: initial_price_xlm,
        };

        env.storage().persistent().set(&code, &asset);
    }

    /// Oracle update for asset price in XLM stroops
    pub fn update_asset_price(env: Env, _admin: Address, asset_code: String, new_price_xlm: i128) {
        let stored_admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        stored_admin.require_auth();

        let mut asset: Asset = env
            .storage()
            .persistent()
            .get(&asset_code)
            .expect("asset not found");
        asset.price_xlm = new_price_xlm;
        env.storage().persistent().set(&asset_code, &asset);
    }

    /// Update user asset balance
    pub fn update_balance(env: Env, owner: Address, asset_code: String, new_balance: i128) {
        owner.require_auth();

        let portfolio_key = (PORTFOLIOS, owner.clone());
        let mut portfolio = Self::get_portfolio(env.clone(), owner.clone());

        let mut asset_info: Asset = match env.storage().persistent().get(&asset_code) {
            Some(a) => a,
            None => Asset {
                code: asset_code.clone(),
                issuer: owner.clone(),
                balance: 0,
                price_xlm: 10_000_000,
            },
        };

        asset_info.balance = new_balance;
        portfolio.assets.set(asset_code, asset_info);
        portfolio.last_updated = env.ledger().timestamp();
        portfolio.total_value_xlm = Self::calculate_portfolio_value(&portfolio);

        env.storage().persistent().set(&portfolio_key, &portfolio);
    }

    /// Set AI-assisted target allocations (in basis points, summing to 10000 = 100%)
    pub fn set_target_allocation(
        env: Env,
        owner: Address,
        asset_codes: Vec<String>,
        target_bps: Vec<u32>,
    ) {
        owner.require_auth();

        if asset_codes.len() != target_bps.len() {
            panic!("mismatched allocation arrays");
        }

        let mut total_bps: u32 = 0;
        let mut allocation_map: Map<String, u32> = Map::new(&env);

        for i in 0..asset_codes.len() {
            let code = asset_codes.get(i).unwrap();
            let bps = target_bps.get(i).unwrap();
            allocation_map.set(code, bps);
            total_bps += bps;
        }

        if total_bps != 10000 {
            panic!("allocations must sum to 10000 bps");
        }

        let portfolio_key = (PORTFOLIOS, owner.clone());
        let mut portfolio = Self::get_portfolio(env.clone(), owner.clone());
        portfolio.target_bps = allocation_map;
        portfolio.last_updated = env.ledger().timestamp();

        env.storage().persistent().set(&portfolio_key, &portfolio);
    }

    /// Get current portfolio for owner
    pub fn get_portfolio(env: Env, owner: Address) -> Portfolio {
        let portfolio_key = (PORTFOLIOS, owner.clone());

        match env.storage().persistent().get(&portfolio_key) {
            Some(p) => p,
            None => Portfolio {
                owner,
                assets: Map::new(&env),
                target_bps: Map::new(&env),
                total_value_xlm: 0,
                last_updated: env.ledger().timestamp(),
            },
        }
    }

    /// Calculate required trades to rebalance portfolio to targets
    pub fn calculate_rebalance_trades(env: Env, owner: Address) -> Vec<RebalanceTrade> {
        let portfolio = Self::get_portfolio(env.clone(), owner);
        let mut trades: Vec<RebalanceTrade> = Vec::new(&env);

        if portfolio.total_value_xlm == 0 || portfolio.target_bps.is_empty() {
            return trades;
        }

        let target_keys = portfolio.target_bps.keys();
        for i in 0..target_keys.len() {
            let code = target_keys.get(i).unwrap();
            let target_bps = portfolio.target_bps.get(code.clone()).unwrap_or(0);
            let target_val_xlm = (portfolio.total_value_xlm * target_bps as i128) / 10000;

            let current_asset = portfolio.assets.get(code.clone());
            let current_val_xlm = match current_asset {
                Some(a) => (a.balance * a.price_xlm) / 10_000_000,
                None => 0,
            };

            if current_val_xlm < target_val_xlm {
                let diff = target_val_xlm - current_val_xlm;
                trades.push_back(RebalanceTrade {
                    from_asset: String::from_str(&env, "XLM"),
                    to_asset: code,
                    amount_xlm: diff,
                });
            }
        }

        trades
    }

    /// Execute automated AI portfolio rebalancing
    pub fn rebalance_portfolio(env: Env, owner: Address) -> u32 {
        owner.require_auth();

        let trades = Self::calculate_rebalance_trades(env.clone(), owner.clone());
        let count = trades.len();

        let portfolio_key = (PORTFOLIOS, owner.clone());
        let mut portfolio = Self::get_portfolio(env.clone(), owner);
        portfolio.last_updated = env.ledger().timestamp();
        env.storage().persistent().set(&portfolio_key, &portfolio);

        count
    }

    /// Create an automated AMM swap pool
    pub fn create_swap_pool(
        env: Env,
        _admin: Address,
        asset_a: String,
        asset_b: String,
        initial_reserve_a: i128,
        initial_reserve_b: i128,
        fee_rate: u32,
    ) {
        let stored_admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        stored_admin.require_auth();

        let pool = SwapPool {
            asset_a: asset_a.clone(),
            asset_b: asset_b.clone(),
            reserve_a: initial_reserve_a,
            reserve_b: initial_reserve_b,
            fee_rate,
        };

        let pool_key = (SWAP_POOLS, asset_a, asset_b);
        env.storage().persistent().set(&pool_key, &pool);
    }

    /// Create a swap order
    pub fn create_swap_order(
        env: Env,
        owner: Address,
        from_asset: String,
        to_asset: String,
        amount: i128,
        min_receive: i128,
    ) -> u64 {
        owner.require_auth();

        let mut counter: u64 = env.storage().instance().get(&ORDER_COUNTER).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&ORDER_COUNTER, &counter);

        let order = SwapOrder {
            id: counter,
            owner: owner.clone(),
            from_asset,
            to_asset,
            amount,
            min_receive,
            timestamp: env.ledger().timestamp(),
            status: String::from_str(&env, "pending"),
        };

        let order_key = (SWAP_ORDERS, counter);
        env.storage().persistent().set(&order_key, &order);

        counter
    }

    /// Execute a swap using AMM constant product invariant
    pub fn execute_swap(env: Env, order_id: u64) -> bool {
        let order_key = (SWAP_ORDERS, order_id);
        let mut order: SwapOrder = match env.storage().persistent().get(&order_key) {
            Some(o) => o,
            None => return false,
        };

        if order.status != String::from_str(&env, "pending") {
            return false;
        }

        let pool_key_direct = (SWAP_POOLS, order.from_asset.clone(), order.to_asset.clone());
        let mut pool: SwapPool = match env.storage().persistent().get(&pool_key_direct) {
            Some(p) => p,
            None => return false,
        };

        let amount_out = Self::calculate_swap_amount(
            order.amount,
            pool.reserve_a,
            pool.reserve_b,
            pool.fee_rate,
        );

        if amount_out < order.min_receive {
            return false;
        }

        pool.reserve_a += order.amount;
        pool.reserve_b -= amount_out;
        env.storage().persistent().set(&pool_key_direct, &pool);

        order.status = String::from_str(&env, "completed");
        env.storage().persistent().set(&order_key, &order);

        true
    }

    /// Calculate portfolio total valuation in XLM stroops
    fn calculate_portfolio_value(portfolio: &Portfolio) -> i128 {
        let mut total: i128 = 0;
        let keys = portfolio.assets.keys();
        for i in 0..keys.len() {
            let key = keys.get(i).unwrap();
            let asset = portfolio.assets.get(key).unwrap();
            total += (asset.balance * asset.price_xlm) / 10_000_000;
        }
        total
    }

    /// Constant product calculation: (dx * y * (10000 - fee)) / (x * 10000 + dx * (10000 - fee))
    fn calculate_swap_amount(amount_in: i128, reserve_in: i128, reserve_out: i128, fee_rate: u32) -> i128 {
        let fee_multiplier = (10000 - fee_rate) as i128;
        let amount_in_with_fee = amount_in * fee_multiplier;
        let numerator = amount_in_with_fee * reserve_out;
        let denominator = (reserve_in * 10000) + amount_in_with_fee;
        numerator / denominator
    }
}

#[cfg(test)]
mod test;