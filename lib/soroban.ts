import * as StellarSdk from '@stellar/stellar-sdk'

const IS_MAINNET = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet'
const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  (IS_MAINNET
    ? 'https://stellar-soroban-public.nodies.app'
    : 'https://soroban-testnet.stellar.org')
const NETWORK_PASSPHRASE = IS_MAINNET ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET
const HORIZON_URL = IS_MAINNET
  ? 'https://horizon.stellar.org'
  : 'https://horizon-testnet.stellar.org'

export interface SorobanSpendingInfo {
  dailyLimit: number
  monthlyLimit: number
  maxTxAmount: number
  dailySpent: number
  monthlySpent: number
  isFrozen: boolean
}

export interface SorobanPortfolioAsset {
  code: string
  issuer: string
  balance: number
  priceXLM: number
}

export interface SorobanPortfolio {
  owner: string
  assets: { [code: string]: SorobanPortfolioAsset }
  targetBps: { [code: string]: number }
  totalValueXLM: number
  lastUpdated: number
}

export interface SorobanRiskAssessment {
  riskScore: number
  isAllowed: boolean
  reason: string
}

export class SorobanContractClient {
  private static rpcServer = new StellarSdk.rpc.Server(RPC_URL)
  private static horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL)

  public static getWalletGuardContractId(): string {
    return process.env.NEXT_PUBLIC_CONTRACT_ID || process.env.SOROBAN_CONTRACT_ID || ''
  }

  public static getMultiAssetContractId(): string {
    return (
      process.env.NEXT_PUBLIC_MULTI_ASSET_CONTRACT_ID ||
      process.env.MULTI_ASSET_CONTRACT_ID ||
      ''
    )
  }

  /**
   * Helper to convert Address string or JS values to ScVal
   */
  public static toScVal(val: any): StellarSdk.xdr.ScVal {
    if (typeof val === 'string' && (val.startsWith('G') || val.startsWith('C'))) {
      return new StellarSdk.Address(val).toScVal()
    }
    return StellarSdk.nativeToScVal(val)
  }

  /**
   * Helper to parse ScVal to native JS object
   */
  public static fromScVal(scVal: StellarSdk.xdr.ScVal): any {
    return StellarSdk.scValToNative(scVal)
  }

  /**
   * Generic read method invoking Soroban RPC simulateTransaction
   */
  public static async simulateRead(
    contractId: string,
    functionName: string,
    args: StellarSdk.xdr.ScVal[] = []
  ): Promise<any> {
    if (!contractId) return null
    try {
      // Use standard dummy account for read simulations
      const dummyPublicKey = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      const dummyAccount = new StellarSdk.Account(dummyPublicKey, '0')
      const contract = new StellarSdk.Contract(contractId)

      const tx = new StellarSdk.TransactionBuilder(dummyAccount, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call(functionName, ...args))
        .setTimeout(30)
        .build()

      const simResult = await this.rpcServer.simulateTransaction(tx)
      if (StellarSdk.rpc.Api.isSimulationSuccess(simResult) && simResult.result?.retval) {
        return this.fromScVal(simResult.result.retval)
      }
      return null
    } catch (error) {
      console.warn(`Soroban RPC simulation warning (${functionName}):`, error)
      return null
    }
  }

  /**
   * Build a contract call transaction to be signed by Freighter or secret key
   */
  public static async buildContractTx(
    publicKey: string,
    contractId: string,
    functionName: string,
    args: StellarSdk.xdr.ScVal[] = []
  ): Promise<StellarSdk.Transaction> {
    if (!contractId) {
      throw new Error('Soroban contract ID is not configured')
    }
    const account = await this.horizonServer.loadAccount(publicKey)
    const contract = new StellarSdk.Contract(contractId)

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(functionName, ...args))
      .setTimeout(300)
      .build()

    return await this.rpcServer.prepareTransaction(tx)
  }

  // ==========================================
  // WALLET GUARD CONTRACT ENTRYPOINTS
  // ==========================================

  public static async getSpendingInfo(ownerPublicKey: string): Promise<SorobanSpendingInfo | null> {
    const contractId = this.getWalletGuardContractId()
    const args = [this.toScVal(ownerPublicKey)]
    const result = await this.simulateRead(contractId, 'get_spending_info', args)
    
    if (result) {
      return {
        dailyLimit: Number(result.daily_limit || result.dailyLimit || 1000_0000000) / 10_000_000,
        monthlyLimit: Number(result.monthly_limit || result.monthlyLimit || 10000_0000000) / 10_000_000,
        maxTxAmount: Number(result.max_tx_amount || result.maxTxAmount || 500_0000000) / 10_000_000,
        dailySpent: Number(result.daily_spent || result.dailySpent || 0) / 10_000_000,
        monthlySpent: Number(result.monthly_spent || result.monthlySpent || 0) / 10_000_000,
        isFrozen: Boolean(result.is_frozen || result.isFrozen),
      }
    }
    return null
  }

  public static async validateTransaction(ownerPublicKey: string, amountXLM: number): Promise<boolean> {
    const contractId = this.getWalletGuardContractId()
    const amountStroops = Math.round(amountXLM * 10_000_000)
    const args = [this.toScVal(ownerPublicKey), this.toScVal(BigInt(amountStroops))]
    const result = await this.simulateRead(contractId, 'validate_transaction', args)
    return result !== false
  }

  public static async evaluateTxRisk(
    ownerPublicKey: string,
    amountXLM: number,
    recipientName: string
  ): Promise<SorobanRiskAssessment | null> {
    const contractId = this.getWalletGuardContractId()
    const amountStroops = Math.round(amountXLM * 10_000_000)
    const args = [
      this.toScVal(ownerPublicKey),
      this.toScVal(BigInt(amountStroops)),
      this.toScVal(recipientName)
    ]
    const result = await this.simulateRead(contractId, 'evaluate_tx_risk', args)
    if (result) {
      return {
        riskScore: Number(result.risk_score || 20),
        isAllowed: Boolean(result.is_allowed),
        reason: String(result.reason || 'Low risk transaction'),
      }
    }
    return null
  }

  // ==========================================
  // MULTI-ASSET MANAGER CONTRACT ENTRYPOINTS
  // ==========================================

  public static async getPortfolio(ownerPublicKey: string): Promise<SorobanPortfolio | null> {
    const contractId = this.getMultiAssetContractId()
    const args = [this.toScVal(ownerPublicKey)]
    const result = await this.simulateRead(contractId, 'get_portfolio', args)
    if (result) {
      return {
        owner: ownerPublicKey,
        assets: result.assets || {},
        targetBps: result.target_bps || {},
        totalValueXLM: Number(result.total_value_xlm || 0) / 10_000_000,
        lastUpdated: Number(result.last_updated || Date.now() / 1000),
      }
    }
    return null
  }

  public static async calculateRebalanceTrades(ownerPublicKey: string): Promise<any[]> {
    const contractId = this.getMultiAssetContractId()
    const args = [this.toScVal(ownerPublicKey)]
    const result = await this.simulateRead(contractId, 'calculate_rebalance_trades', args)
    return Array.isArray(result) ? result : []
  }
}
