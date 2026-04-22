# 🤖 AI Wallet Manager — Stellar Blockchain

> **Rise In — Stellar Journey to Mastery | 🟢 Green Belt (Level 4) Submission**

An AI-powered wallet management application built on the **Stellar blockchain**, enabling users to manage multi-asset portfolios, execute token swaps, set smart contract spending limits, and interact with their wallet using natural language commands.

---

## 🌐 Live Demo

**[https://omyaingle-7vqkryq5i-neelpote96-9476s-projects.vercel.app](https://omyaingle-7vqkryq5i-neelpote96-9476s-projects.vercel.app)**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Level 4 Requirements Met](#level-4-requirements-met)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [CI/CD Pipeline](#cicd-pipeline)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)
- [Roadmap](#roadmap)

---

## Overview

AI Wallet Manager is a production-ready dApp on the **Stellar Testnet** that combines natural language AI with blockchain wallet operations. Users connect their Stellar wallet (manually or via Freighter), then interact through a chat interface to check balances, send assets, swap tokens, and manage security — all without needing to understand blockchain mechanics.

---

## ✅ Level 4 Requirements Met

| Requirement | Status | Details |
|---|---|---|
| Advanced smart contracts | ✅ | Soroban-ready spending limits, wallet freeze, contact management |
| Production-ready app | ✅ | Deployed on Vercel with CI/CD pipeline |
| Multi-asset support | ✅ | XLM, USDC, EURC, AQUA, YBX |
| Token swapping | ✅ | Path payment via Stellar DEX |
| Trustline management | ✅ | Auto-detect and create trustlines |
| Real on-chain transactions | ✅ | Live on Stellar Testnet |
| CI/CD pipeline | ✅ | GitHub Actions → Vercel auto-deploy |
| Clean architecture | ✅ | Next.js App Router, typed APIs, context state |
| README documentation | ✅ | This document |

---

## ✨ Features

### 🤖 AI-Powered Chat Interface
- Natural language command parsing — no blockchain knowledge needed
- Commands like `"swap 50 XLM to USDC"`, `"what's my balance?"`, `"freeze my wallet"`
- Confirmation flow for destructive actions (send, swap, freeze)

### 💼 Multi-Asset Portfolio
- Real-time balances for XLM, USDC, EURC, AQUA, YBX
- Portfolio value in XLM and USD equivalent
- Live price data per asset

### 🔄 Token Swapping
- Swap between any supported Stellar assets
- Path payment strict send via Stellar DEX
- Automatic trustline creation for new assets
- Swap history tracking

### 🔒 Smart Contract Security
- Daily and monthly spending limits
- Emergency wallet freeze / unfreeze
- Contact management (local + on-chain)
- Spending analytics

### 🔗 Wallet Connection
- Manual key entry (public + secret key)
- Freighter browser extension support
- Testnet Friendbot funding built-in

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| Blockchain | Stellar SDK, Soroban Smart Contracts |
| AI Parsing | Google Gemini AI + rule-based fallback |
| Wallet | Freighter API (`@stellar/freighter-api`) |
| Network | Stellar Testnet (Horizon + Soroban RPC) |
| Deployment | Vercel |
| CI/CD | GitHub Actions |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────┐
│                  Next.js App                │
│                                             │
│  ┌──────────────┐    ┌───────────────────┐  │
│  │  Chat UI     │    │  Portfolio / Swap │  │
│  │  (AI Parse)  │    │  Dashboard        │  │
│  └──────┬───────┘    └────────┬──────────┘  │
│         │                    │              │
│  ┌──────▼────────────────────▼──────────┐   │
│  │           App Context (State)        │   │
│  └──────────────────┬───────────────────┘   │
│                     │                       │
│  ┌──────────────────▼───────────────────┐   │
│  │           API Routes                 │   │
│  │  /api/ai-parse                       │   │
│  │  /api/stellar/balance                │   │
│  │  /api/stellar/send                   │   │
│  │  /api/stellar/multi-asset            │   │
│  │  /api/stellar/smart-limit            │   │
│  │  /api/stellar/fund-testnet           │   │
│  └──────────────────┬───────────────────┘   │
└─────────────────────┼───────────────────────┘
                      │
          ┌───────────▼────────────┐
          │   Stellar Testnet      │
          │   Horizon API          │
          │   Soroban RPC          │
          └────────────────────────┘
```

---

## 📜 Smart Contracts

The app integrates with Soroban smart contracts for:

- **Spending Limits** — enforce daily/monthly XLM caps on-chain
- **Wallet Freeze** — emergency lock that blocks all outgoing transactions
- **Contact Registry** — store trusted addresses on-chain
- **Spending Analytics** — track transaction patterns

Contract deployment scripts are in `/contracts` and `/deploy-contract.sh`.

> For testnet, the app runs in simulation mode when no contract ID is configured. Set `NEXT_PUBLIC_CONTRACT_ID` to connect to a deployed contract.

---

## 🔄 CI/CD Pipeline

Every push to `main` triggers the GitHub Actions pipeline:

```
Push to main
     │
     ▼
┌─────────────────────┐
│  1. Checkout code   │
│  2. Install deps    │
│  3. TypeScript check│
│  4. ESLint          │
│  5. Production build│
└──────────┬──────────┘
           │ (on success)
           ▼
┌─────────────────────┐
│  Deploy to Vercel   │
│  (Production)       │
└─────────────────────┘
```

Pipeline config: `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-lint:
    name: Build & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm run build
        env:
          STELLAR_PUBLIC_KEY: ${{ secrets.STELLAR_PUBLIC_KEY }}
          STELLAR_SECRET_KEY: ${{ secrets.STELLAR_SECRET_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    needs: build-and-lint
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g vercel@latest
      - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**Required GitHub Secrets:**
- `VERCEL_TOKEN` — Vercel deploy token
- `STELLAR_PUBLIC_KEY` — Testnet public key
- `STELLAR_SECRET_KEY` — Testnet secret key
- `GEMINI_API_KEY` — Google Gemini API key (optional)
- `NEXT_PUBLIC_CONTRACT_ID` — Soroban contract ID (optional)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- A Stellar testnet account ([generate one here](https://laboratory.stellar.org/#account-creator?network=test))

### Installation

```bash
# Clone the repo
git clone https://github.com/Om12345-ingle/walletmanagerhere.git
cd walletmanagerhere

# Install dependencies
npm install

# Copy env file
cp .env.example .env.local

# Add your keys to .env.local
# Then start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Fund Your Testnet Account

Click the **"Fund Testnet"** button in the app, or run:

```bash
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
```

---

## 🔑 Environment Variables

```env
# Required
STELLAR_PUBLIC_KEY=G...          # Your Stellar testnet public key
STELLAR_SECRET_KEY=S...          # Your Stellar testnet secret key

# Optional — app works without these
GEMINI_API_KEY=...               # Google Gemini AI (for enhanced NLP)
NEXT_PUBLIC_CONTRACT_ID=C...     # Deployed Soroban contract ID
SOROBAN_CONTRACT_ID=C...         # Same contract ID (server-side)
```

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/ai-parse` | POST | Parse natural language wallet commands |
| `/api/stellar/balance` | POST | Get XLM balance for a public key |
| `/api/stellar/send` | POST | Send XLM or assets to an address |
| `/api/stellar/history` | POST | Get recent transaction history |
| `/api/stellar/multi-asset` | POST | Portfolio, swap, prices, trustlines |
| `/api/stellar/smart-limit` | POST | Spending limits, freeze, contacts |
| `/api/stellar/fund-testnet` | POST | Fund account via Friendbot |
| `/api/stellar/generate-keys` | POST | Generate a new Stellar keypair |
| `/api/stellar/create-transaction` | POST | Build unsigned transaction XDR |

---

## 💬 Supported Chat Commands

```
Balance & Portfolio
  "What's my balance?"
  "Show my portfolio"
  "What are current prices?"

Sending
  "Send 10 XLM to G..."
  "Send 5 XLM to Alice"

Swapping
  "Swap 100 XLM to USDC"
  "Calculate swap 50 XLM to EURC"
  "Show swap history"

Security
  "Freeze my wallet"
  "Unfreeze my wallet"
  "Set daily limit to 500 XLM"
  "Check spending limits"

Contacts
  "Save G... as Alice"
  "List contacts"

General
  "Help"
  "Transaction history"
  "Check trustlines"
```

---

## 🗺 Roadmap

- [x] Level 1 — Wallet creation + on-chain transactions
- [x] Level 2 — Multi-wallet flows + smart contract integration
- [x] Level 3 — Complete mini dApp with swap and portfolio
- [x] Level 4 — Advanced smart contracts + production deployment + CI/CD
- [ ] Level 5 — Ship MVP + onboard first 5 real users
- [ ] Level 6 — Scale to 20 users + Demo Day

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

## 🙏 Built With

- [Stellar](https://stellar.org) — Blockchain network
- [Rise In](https://risein.com) — Stellar Journey to Mastery program
- [Next.js](https://nextjs.org) — React framework
- [Vercel](https://vercel.com) — Deployment platform
- [Google Gemini](https://ai.google.dev) — AI language model
