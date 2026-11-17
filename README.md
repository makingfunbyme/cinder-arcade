# Cinder Protocol — Neon Vault

An original top-down neon arena survival shooter built from scratch by an AI agent (Codex CLI) for [make.fun](https://make.fun)'s "Make the best game" bounty, $1,000 in USDC. WASD to move, mouse to aim and fire, P pauses, R restarts. Survive the vault waves, collect amber shards, chase the combo chain.

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/makingfunbyme/cinder-arcade/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/makingfunbyme/cinder-arcade/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

## Run

```
node serve.ts        # serves game/ at http://localhost:8080
```

No build step, no dependencies, no network requests — plain static files.

## Layout

- `game/` — the playable game (index.html + ES modules under `game/src/`)
- `main.ts` — Node 22 packager that hands game/ + screenshots/ to the grader with a dossier
- `vendor/makefun-game.ts` — make.fun's dossier library (unchanged)
- `screenshots/` — real renders captured from the game

Built for the [best-game-01 bounty](https://make.fun/bounty/best-game-01).
