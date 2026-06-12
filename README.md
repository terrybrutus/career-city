# Career City

A career-coaching RPG built for Caffeine/ICP with React, Phaser, TypeScript,
and a Motoko backend.

## Current Game Loop

Chapter 1 guides the player through a real sequence:

1. Meet Sam in Town Square.
2. Enter Vera's Resume Tailor workshop.
3. Complete a resume coaching session.
4. Visit Felix and purchase a persistent power-up with XP.
5. Train with Chad.
6. Return to Ed to complete the chapter.

Progress is shown in the in-game Journey Guide. Career tool rewards persist to
the Motoko profile, shop purchases use backend inventory, and duplicate quest
or item rewards are rejected.

## Validation

```powershell
corepack pnpm install --prefer-offline
corepack pnpm typecheck
corepack pnpm build
```

The backend uses safe offline coaching responses until a Caffeine-managed AI
provider secret is available. Never commit provider API keys to this repo.
