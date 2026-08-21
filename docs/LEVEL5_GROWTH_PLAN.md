# Level 5 Growth, Validation, and Iteration Plan

## Objective

Validate AI Wallet Manager with at least 50 genuine Stellar wallet interactions,
learn where users struggle, and convert the strongest evidence into a focused
product iteration and ecosystem-ready demo.

## Study Protocol

1. Recruit consenting participants who control their own Stellar testnet wallet.
2. Ask each participant to connect through Freighter or use watch-only mode for
   the review portion.
3. Complete a real testnet action and retain its transaction hash.
4. Wait 2–3 minutes before the next recorded interaction.
5. Verify each transaction on Stellar Expert and enter it into
   [`level-5-user-feedback.xlsx`](level-5-user-feedback.xlsx).
6. Collect a 1–5 rating, the strongest positive, the largest friction point, and
   one requested improvement.
7. Never collect or copy a participant's secret seed.

## Success Measures

| Measure | Target | Current status |
|---|---:|---|
| Confirmed wallet interactions | 50 | Pending test-user session |
| Interval compliance | 49 consecutive gaps between 120–180 seconds | Pending |
| Consented feedback records | 50 where practical | Pending |
| Public explorer evidence | 100% of claimed transactions | Activity Proof + workbook ready |
| Product iteration | At least one change tied to observed feedback | Activity Proof and watch-only onboarding shipped from prior reviewer feedback |

## Growth Strategy

- **Acquire:** Stellar developer groups, campus blockchain clubs, founder
  communities, and direct product demos.
- **Activate:** move users from wallet connection to a funded account and first
  verified action through the onboarding checklist.
- **Learn:** group feedback by onboarding, transaction clarity, AI commands,
  security, analytics, and mobile usability.
- **Retain:** follow up after the next release and measure whether participants
  return to contacts, spending policies, or transaction history.

## Feedback-to-Release Method

After the study, calculate the response count and average rating in the workbook,
then rank friction themes by frequency and severity. The highest-priority theme
must be linked to its implementing Git commit in both the workbook's **Iteration
Decision Log** and the README improvement section.

## Evidence Rules

- A transaction counts only after Stellar confirms it.
- A screenshot supplements but never replaces a transaction hash.
- Duplicate, automated, or fabricated users are excluded.
- Personally identifying data is stored only with consent and is not committed
  publicly unless the participant explicitly permits publication.
