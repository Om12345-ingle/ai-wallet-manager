import { NextRequest, NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';

// Use environment variable to determine network, default to testnet
const isMainnet = process.env.STELLAR_NETWORK === 'mainnet';
const server = new StellarSdk.Horizon.Server(
  isMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org'
);

export async function POST(request: NextRequest) {
  try {
    const { publicKey, limit = 50 } = await request.json();
    
    if (!publicKey || !StellarSdk.StrKey.isValidEd25519PublicKey(publicKey)) {
      return NextResponse.json(
        { error: 'A valid Stellar public key is required', transactions: [], interactions: [] },
        { status: 400 },
      );
    }

    const safeLimit = Math.min(200, Math.max(1, Number.parseInt(String(limit), 10) || 50));

    const payments = await server.payments()
      .forAccount(publicKey)
      .limit(safeLimit)
      .order('desc')
      .call();
    
    const transactions = payments.records
      .filter((payment: any) => payment.type === 'payment')
      .map((payment: any) => ({
        id: payment.id,
        type: payment.from === publicKey ? 'send' : 'receive',
        amount: payment.amount,
        from: payment.from,
        to: payment.to,
        created_at: payment.created_at,
        successful: true,
        transaction_hash: payment.transaction_hash,
        asset: payment.asset_type === 'native' ? 'XLM' : payment.asset_code,
      }));

    const interactions = transactions.map((transaction) => ({
      id: transaction.id,
      transactionHash: transaction.transaction_hash,
      type: transaction.type,
      amount: transaction.amount,
      asset: transaction.asset,
      from: transaction.from,
      to: transaction.to,
      createdAt: transaction.created_at,
      successful: transaction.successful,
    }));

    return NextResponse.json({
      transactions,
      interactions,
      network: isMainnet ? 'mainnet' : 'testnet',
      fetchedAt: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: error.message, transactions: [], interactions: [] },
      { status: 500 }
    );
  }
}
