# VANTA Meme Trading Lab

Paper-first Solana memecoin trading research dashboard. It combines a risk-first multi-agent style architecture with a modular suite of sniper, volume, momentum, arbitrage and copy-trading research tools.

## Engines

- AI-style opportunity scout
- Pump / Raydium fresh-pair sniper with a hard <=60s entry window
- Meme Opportunity Radar
- Volume & momentum scanner
- Cross-pool arbitrage monitor
- Copy Trading Lab (paper/watch configuration)
- Rug / honeypot market-structure screen
- Strategy Arena with independent $10 paper wallets
- Responsive iPhone + desktop UI with 4 themes

## Data & execution

GitHub Pages uses public DEX Screener market data and simulates fills while the page is open. A true 24/7 low-latency sniper requires a backend plus Solana RPC/event streaming. Live wallet execution is intentionally locked in this browser build.

Never put private keys, seed phrases, or private API keys in GitHub Pages frontend files.

## Inspiration

Conceptually informed by:

- `Jackhuang166/ai-memecoin-trading-bot` (MIT): risk-first scanning, dry-run, monitoring/dashboard and safety architecture.
- `HZCX404/memecoin-trading-bots`: modular Solana strategy categories such as Pump/Raydium sniping, volume, arbitrage and copy trading.

This project is implemented from scratch; code from the second repository is not copied.

## GitHub Pages

Deploy `main` from `/ (root)` and open:

`https://mmoya113.github.io/tabverdict/`
