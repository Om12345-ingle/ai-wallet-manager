import { NextRequest, NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';

// Use environment variable to determine network, default to testnet
const isMainnet = process.env.STELLAR_NETWORK === 'mainnet';
const server = new StellarSdk.Horizon.Server(
  isMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org'
);
const networkPassphrase = isMainnet ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET;



export async function POST(request: NextRequest) {
  try {
    const { publicKey, recipient, amount } = await request.json();

    if (!publicKey || !recipient || !amount) {
      throw new Error('Public key, recipient, and amount are required');
    }

    // Validate Stellar address
    if (!recipient.startsWith('G') || recipient.length !== 56) {
      throw new Error('Invalid Stellar address format');
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Invalid amount');
    }

    // Check if destination account exists
    let destinationExists = true;
    try {
      await server.loadAccount(recipient);
    } catch (destError: any) {
      if (destError.response?.status === 404) {
        destinationExists = false;
      } else {
        throw destError;
      }
    }

    if (!destinationExists) {
      if (numAmount < 1) {
        throw new Error(`The recipient account does not exist. To create and fund a new account on Stellar, you must send at least 1 XLM (the network minimum balance reserve).`);
      }
    }

    // Load source account
    const sourceAccount = await server.loadAccount(publicKey);
    
    // Create unsigned transaction
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        !destinationExists
          ? StellarSdk.Operation.createAccount({
              destination: recipient,
              startingBalance: numAmount.toString(),
            })
          : StellarSdk.Operation.payment({
              destination: recipient,
              asset: StellarSdk.Asset.native(),
              amount: numAmount.toString(),
            })
      )
      .setTimeout(30)
      .build();
    
    return NextResponse.json({
      success: true,
      transactionXDR: transaction.toXDR(),
      amount: numAmount,
      recipient: recipient,
      message: 'Transaction created successfully, ready for signing'
    });
    
  } catch (error: any) {
    console.error('Create transaction error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 400 }
    );
  }
}