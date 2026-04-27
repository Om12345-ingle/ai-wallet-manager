# 🤖 AI Wallet Manager — Stellar Blockchain

> **Rise In — Stellar Journey to Mastery | 🟢 Green Belt (Level 4) Submission**

![CI/CD Pipeline](https://github.com/Om12345-ingle/ai-wallet-manager/actions/workflows/ci.yml/badge.svg)

An AI-powered wallet management application built on the **Stellar blockchain**, enabling users to manage multi-asset portfolios, execute token swaps, set smart contract spending limits, and interact with their wallet using natural language commands.

---

## 🌐 Live Demo

**[https://omyaingle-patd1nve9-neelpote44-7832s-projects.vercel.app](https://omyaingle-patd1nve9-neelpote44-7832s-projects.vercel.app)**

---
google form link - https://forms.gle/fMs7FT5DjqDAZEbp6
google docs link - https://docs.google.com/spreadsheets/d/1Fy0MHt8JeNQrlyHyKJqUPEF3bupMbKvlBDsOAh3Yy44/edit?usp=sharing
## 📋 Reviewer Feedback & Fixes

> 📊 [Full Review Sheet](https://docs.google.com/spreadsheets/d/1Fy0MHt8JeNQrlyHyKJqUPEF3bupMbKvlBDsOAh3Yy44/edit?usp=sharing)

| # | Feedback | Fix Applied | Commit |
|---|---|---|---|
| 1 | AI chatbot doesn't understand natural language — even correct prompts fail | Upgraded to **Gemini 1.5 Flash** AI with regex fast-path + Gemini fallback for anything unrecognized | `feat: upgrade AI parser to Gemini 1.5 Flash` |
| 2 | Chat should have its own separate page | Added dedicated **AI Chat** tab in sidebar with full-page chat interface | `feat: chat as dedicated page` |
| 3 | Topbar/navbar stuck on all pages — should only be on one page | Header now only shows on Dashboard. Other pages have a clean minimal top bar. Navbar removed from non-dashboard views | `fix: navbar only on dashboard` |
| 4 | Mobile view broken — had to switch to desktop site | Added **mobile bottom navigation bar**, slide-out hamburger menu, proper viewport meta tag, responsive padding | `fix: full mobile responsive layout` |
| 5 | No contact list — can't save contacts or send to them easily | Added full **Contacts page** with add/remove/send functionality. Send XLM directly from contact card | `feat: contacts page with send` |
| 6 | Sending money to a friend not intuitive | Contacts page has one-click **Send XLM** button per contact. AI chat also supports "Send 10 XLM to Alice" | `feat: contacts page with send` |

---

## ✅ Tests — 52 Passing

```
 PASS  __tests__/command-parser.test.ts
 PASS  __tests__/stellar-utils.test.ts
 PASS  __tests__/wallet-api.test.ts

Test Suites: 3 passed, 3 total
Tests:       52 passed, 52 total
Snapshots:   0 total
Time:        4.737 s
```

Run tests locally:
```bash
npm test
```

---

## 🔗 On-Chain Activity (Stellar Testnet)

**Wallet Address:**
```
GCYLWUJI2USHF7DRQYCBOVDMRT3Z7F6WINN3RIMJ7T5X5G7ZPU53G5B2
```

**Funding Transaction (Friendbot):**
```
6ee7e9670e3d7c2b2d9e40aa7fd2813d49f17a6becddac7788f823e7f16bf7fe
```
🔍 [View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/6ee7e9670e3d7c2b2d9e40aa7fd2813d49f17a6becddac7788f823e7f16bf7fe)

**Network:** Stellar Testnet (Horizon: `https://horizon-testnet.stellar.org`)

**Supported Assets & Issuers:**

| Asset | Issuer |
|---|---|
| XLM | Native |
| USDC | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |
| EURC | `GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2` |
| AQUA | `GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA` |
| YBX | `GBUYUAI75XXWDZEKLY66CFYKQPET5JR4EENXZBUZ3YXZ7DS56Z4OKOFU` |

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

### 🤖 AI-Powered Chat (Gemini 1.5 Flash)
- Powered by Google Gemini AI — understands natural, conversational language
- Fast regex pre-parser for instant common commands
- Gemini fallback for anything complex or ambiguous
- Commands like `"I want to swap some XLM for dollars"`, `"how much do I have?"`, `"lock my wallet down"`

### 💼 Multi-Asset Portfolio
- Real-time balances for XLM, USDC, EURC, AQUA, YBX
- Portfolio value in XLM and USD equivalent

### 🔄 Token Swapping
- Swap between any supported Stellar assets
- Automatic trustline creation for new assets

### 👥 Contacts
- Save Stellar addresses with names
- Send XLM directly from contact card with one click
- AI chat supports "Send 10 XLM to Alice"

### 🔒 Smart Contract Security
- Daily and monthly spending limits
- Emergency wallet freeze / unfreeze
- Contact management (local + on-chain)

### 📱 Mobile-First Design
- Bottom navigation bar on mobile
- Slide-out hamburger menu
- Responsive layout at all screen sizes

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| Blockchain | Stellar SDK, Soroban Smart Contracts |
| AI | Google Gemini 1.5 Flash + regex fast-path |
| Wallet | Freighter API |
| Network | Stellar Testnet |
| Deployment | Vercel |
| CI/CD | GitHub Actions |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────┐
│                  Next.js App                │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Dashboard│ │ AI Chat  │ │  Contacts   │ │
│  └────┬─────┘ └────┬─────┘ └──────┬──────┘ │
│       └────────────┴──────────────┘         │
│                    │                        │
│  ┌─────────────────▼──────────────────────┐ │
│  │           App Context (State)          │ │
│  └─────────────────┬──────────────────────┘ │
│                    │                        │
│  ┌─────────────────▼──────────────────────┐ │
│  │  API Routes                            │ │
│  │  /api/ai-parse  (Gemini + regex)       │ │
│  │  /api/stellar/balance                  │ │
│  │  /api/stellar/send                     │ │
│  │  /api/stellar/multi-asset              │ │
│  │  /api/stellar/smart-limit              │ │
│  └─────────────────┬──────────────────────┘ │
└───────────────────┬─────────────────────────┘
                    │
        ┌───────────▼────────────┐
        │   Stellar Testnet      │
        │   Horizon + Soroban    │
        └────────────────────────┘
```

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
│  4. Run 52 tests    │
│  5. Production build│
└──────────┬──────────┘
           │ (on success)
           ▼
┌─────────────────────┐
│  Deploy to Vercel   │
│  (Production)       │
└─────────────────────┘
```

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci --legacy-peer-deps
      - run: npx tsc --noEmit
      - run: npm test
      - run: npm run build
  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: npm install -g vercel@latest
      - run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }} --yes
```

---

## 🚀 Getting Started

```bash
git clone https://github.com/Om12345-ingle/ai-wallet-manager.git
cd ai-wallet-manager
npm install
cp .env.example .env.local
# Add your keys to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

```env
STELLAR_PUBLIC_KEY=G...
STELLAR_SECRET_KEY=S...
GEMINI_API_KEY=...           # Google Gemini AI (strongly recommended)
NEXT_PUBLIC_CONTRACT_ID=C... # Soroban contract (optional)
```

---

## 📡 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/ai-parse` | POST | Parse natural language (Gemini + regex) |
| `/api/stellar/balance` | POST | Get XLM balance |
| `/api/stellar/send` | POST | Send XLM or assets |
| `/api/stellar/history` | POST | Transaction history |
| `/api/stellar/multi-asset` | POST | Portfolio, swap, prices, trustlines |
| `/api/stellar/smart-limit` | POST | Spending limits, freeze, contacts |
| `/api/stellar/fund-testnet` | POST | Fund via Friendbot |

---

## 💬 Supported Chat Commands

```
"What's my balance?"          → balance check
"Show my portfolio"           → all assets
"Swap 100 XLM to USDC"        → token swap
"Send 10 XLM to Alice"        → send to contact
"Send 5 XLM to G..."          → send to address
"Freeze my wallet"            → emergency lock
"Set daily limit to 500 XLM"  → spending limit
"List contacts"               → show contacts
"What are current prices?"    → asset prices
"Transaction history"         → recent txs
"Help"                        → command list
```

---

## 🗺 Roadmap

- [x] Level 1 — Wallet creation + on-chain transactions
- [x] Level 2 — Multi-wallet flows + smart contract integration
- [x] Level 3 — Complete mini dApp with swap and portfolio
- [x] Level 4 — Advanced smart contracts + production + CI/CD + reviewer fixes
- [ ] Level 5 — Ship MVP + onboard first 5 real users
- [ ] Level 6 — Scale to 20 users + Demo Day

---

## 📄 License

MIT

---

## 🙏 Built With

[Stellar](https://stellar.org) · [Rise In](https://risein.com) · [Next.js](https://nextjs.org) · [Vercel](https://vercel.com) · [Google Gemini](https://ai.google.dev)
