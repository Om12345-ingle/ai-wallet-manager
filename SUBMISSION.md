# AI Wallet Manager — Submission Data

## Required fields

| Field | Value |
|---|---|
| Project Name | AI Wallet Manager |
| GitHub Repo | https://github.com/Om12345-ingle/ai-wallet-manager |
| Live Demo | https://omyaingle.vercel.app |
| Demo Video | Pending final human recording and upload |
| Mainnet Transactions | 0 — mainnet deployment is awaiting a funded signer |
| Mainnet Contract Address | Not deployed yet |
| Testnet Traction | 9 confirmed project deployment/configuration transactions |
| Testnet Wallet Guard Contract | `CBLWIUQGJU24KFXGYT62FO7ELDYUE3QTDB2OOYPRNTHPJC4KVNSFG7DQ` |
| Testnet Multi Asset Manager Contract | `CAVYUCHMTSTCRMBKHLWPNBK73BWMTSBU3CDE3EMVDSRNKXCC632P4CXD` |

## Testnet explorer links

- [Wallet Guard contract](https://stellar.expert/explorer/testnet/contract/CBLWIUQGJU24KFXGYT62FO7ELDYUE3QTDB2OOYPRNTHPJC4KVNSFG7DQ)
- [Multi Asset Manager contract](https://stellar.expert/explorer/testnet/contract/CAVYUCHMTSTCRMBKHLWPNBK73BWMTSBU3CDE3EMVDSRNKXCC632P4CXD)
- [Wallet Guard deployment transaction](https://stellar.expert/explorer/testnet/tx/7ef4826b57a38c59e4635f2fc7d0276b9566704382670e69adaff083104de211)
- [Multi Asset Manager deployment transaction](https://stellar.expert/explorer/testnet/tx/35a4d1f8c2cc60ebf1a333ddc242452167095d581b80b5f95f47ae287e67e5bc)

The complete machine-readable deployment record, including all nine confirmed
transaction hashes, is in [`deployments/testnet.json`](deployments/testnet.json).
The form-ready CSV is
[`deployments/testnet-traction.csv`](deployments/testnet-traction.csv).

## Submission evidence

- [Desktop product UI](docs/screenshots/04-desktop-dashboard.png)
- [Mobile-responsive onboarding](docs/screenshots/02-mobile-onboarding.png)
- [Mobile connected dashboard](docs/screenshots/03-mobile-dashboard.png)
- [Analytics and monitoring setup](docs/screenshots/05-feedback-monitoring.png)
- [Feedback flow receipt](docs/screenshots/06-feedback-receipt.png)
- [User-wallet interaction CSV template](docs/user-wallet-interactions.csv)
- [Basic feedback summary](docs/USER_FEEDBACK_SUMMARY.md)
- [Demo recording script](docs/DEMO_SCRIPT.md)

The 10-real-user wallet rows and public demo-video URL are intentionally not
fabricated. They must be added after the participant study and recording. The
current local release is verified but has not been pushed or deployed at the
user's instruction.

## Mainnet readiness

The same audited WASM artifacts can be deployed with:

```bash
STELLAR_SOURCE=<funded-mainnet-identity> \
STELLAR_SOURCE_ADDRESS=<mainnet-public-key> \
npm run deploy:mainnet
```

This command requires an explicitly funded mainnet signer and an
`ALLOW_MAINNET_DEPLOY=true` safety gate supplied by the package script. Mainnet
addresses must only be added here after the transactions are confirmed on-chain.

For GitHub Actions, configure `STELLAR_TESTNET_SECRET_KEY` and
`STELLAR_MAINNET_SECRET_KEY` as repository secrets, plus
`STELLAR_TESTNET_DEPLOYER` and `STELLAR_MAINNET_DEPLOYER` as repository
variables. Then run the **CI/CD Pipeline** workflow manually and choose the
network.
