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

## Playable Systems

- Career Passport with credentials, discovered NPCs, visited locations,
  inventory, a small skill tree, and Chapter 1 completion state.
- Recruiter finale with three dialogue-choice rounds, coaching feedback,
  non-punitive retries, a Career Compass reward, and a one-time XP reward.
- Meaningful power-ups: Resume Boost improves Vera's coaching pass, Cover
  Letter Scroll improves Penny's structure, and Confidence Elixir reveals an
  interview hint.
- Persistent chapter journey, credentials, skills, discoveries, inventory,
  quests, and XP.
- Keyboard, touch joystick, reduced-motion support, responsive overlays, and
  gameplay-input suspension while forms are active.

## AI Safety

Career City currently uses dependable offline coaching from the Motoko
backend. Claude Haiku has intentionally not been connected because the project
does not currently expose a documented Caffeine-managed secret mechanism for
Anthropic credentials. Do not add an Anthropic key field to the frontend or
store a provider key with Internet Identity profile data.

The next safe AI step is a backend-only provider adapter after Caffeine
supports managed secrets and approved HTTPS outcalls for the provider.

## Remaining Expansion Work

The first chapter is playable, but expanded districts, a complete licensed
sprite and tileset replacement, deeper branching skill trees, and additional
encounter types are content-production expansions rather than bug fixes.

## Validation

```powershell
corepack pnpm install --prefer-offline
corepack pnpm typecheck
corepack pnpm build
```

The backend uses safe offline coaching responses until a Caffeine-managed AI
provider secret is available. Never commit provider API keys to this repo.
