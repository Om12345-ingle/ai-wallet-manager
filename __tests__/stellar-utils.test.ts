/**
 * Tests for Stellar utility functions
 * Covers keypair generation, address validation, amount formatting
 */

import * as StellarSdk from '@stellar/stellar-sdk'

describe('Stellar SDK — Keypair Generation', () => {
  test('generates a valid Stellar keypair', () => {
    const keypair = StellarSdk.Keypair.random()
    expect(keypair.publicKey()).toMatch(/^G[A-Z0-9]{55}$/)
    expect(keypair.secret()).toMatch(/^S[A-Z0-9]{55}$/)
  })

  test('public key starts with G', () => {
    const keypair = StellarSdk.Keypair.random()
    expect(keypair.publicKey()[0]).toBe('G')
  })

  test('secret key starts with S', () => {
    const keypair = StellarSdk.Keypair.random()
    expect(keypair.secret()[0]).toBe('S')
  })

  test('can reconstruct keypair from secret', () => {
    const original = StellarSdk.Keypair.random()
    const restored = StellarSdk.Keypair.fromSecret(original.secret())
    expect(restored.publicKey()).toBe(original.publicKey())
  })

  test('two random keypairs are different', () => {
    const kp1 = StellarSdk.Keypair.random()
    const kp2 = StellarSdk.Keypair.random()
    expect(kp1.publicKey()).not.toBe(kp2.publicKey())
  })
})

describe('Stellar SDK — Address Validation', () => {
  const VALID_ADDRESS = 'GCYLWUJI2USHF7DRQYCBOVDMRT3Z7F6WINN3RIMJ7T5X5G7ZPU53G5B2'

  test('validates a correct Stellar public key', () => {
    expect(() => StellarSdk.Keypair.fromPublicKey(VALID_ADDRESS)).not.toThrow()
  })

  test('throws on invalid public key', () => {
    expect(() => StellarSdk.Keypair.fromPublicKey('INVALID_KEY')).toThrow()
  })

  test('throws on empty string', () => {
    expect(() => StellarSdk.Keypair.fromPublicKey('')).toThrow()
  })

  test('valid address is 56 characters', () => {
    expect(VALID_ADDRESS.length).toBe(56)
  })
})

describe('Stellar SDK — Asset Creation', () => {
  test('creates native XLM asset', () => {
    const xlm = StellarSdk.Asset.native()
    expect(xlm.isNative()).toBe(true)
    expect(xlm.getAssetType()).toBe('native')
  })

  test('creates USDC asset with correct issuer', () => {
    const usdc = new StellarSdk.Asset(
      'USDC',
      'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
    )
    expect(usdc.getCode()).toBe('USDC')
    expect(usdc.isNative()).toBe(false)
  })

  test('creates EURC asset correctly', () => {
    const eurc = new StellarSdk.Asset(
      'EURC',
      'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2'
    )
    expect(eurc.getCode()).toBe('EURC')
  })

  test('native asset has no issuer (returns undefined)', () => {
    const xlm = StellarSdk.Asset.native()
    expect(xlm.getIssuer()).toBeUndefined()
  })
})

describe('Stellar SDK — Amount Formatting', () => {
  test('formats amount to 7 decimal places', () => {
    const amount = 10.5
    const formatted = amount.toFixed(7).replace(/\.?0+$/, '')
    expect(formatted).toBe('10.5')
  })

  test('formats whole number correctly', () => {
    const amount = 100
    const formatted = amount.toFixed(7).replace(/\.?0+$/, '')
    expect(formatted).toBe('100')
  })

  test('BASE_FEE is defined and numeric', () => {
    expect(typeof StellarSdk.BASE_FEE).toBe('string')
    expect(parseInt(StellarSdk.BASE_FEE)).toBeGreaterThan(0)
  })

  test('testnet network passphrase is correct', () => {
    expect(StellarSdk.Networks.TESTNET).toBe('Test SDF Network ; September 2015')
  })
})
