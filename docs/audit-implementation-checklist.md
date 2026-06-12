# Career City Audit Implementation Checklist

This file records the shipped implementation of the comprehensive audit.

## Progression and gameplay

- [x] Server-authoritative, idempotent mission completion and rewards
- [x] Typed game event bridge
- [x] Lifetime XP is never spent; shop uses derived Career Tokens
- [x] One canonical mission flow for every building
- [x] Persistent artifacts from every career tool
- [x] Opportunity board and preparation loadout
- [x] Skill challenges, application encounters, and non-punitive retries
- [x] District unlock, collectible career stories, meaningful side missions
- [x] Persistent journal and replayable role paths
- [x] State-aware NPC conversations and recruiter finale
- [x] Playable onboarding

## Interface and accessibility

- [x] One mutually exclusive overlay/modal system with focus management
- [x] Responsive full-screen world and reserved HUD safe zones
- [x] Intentional portrait experience and central resize lifecycle
- [x] Touch-correct prompts and controls
- [x] Journey hides during conversations and tools
- [x] Consistent controls, targets, copy, and reduced visual noise
- [x] Reduced-motion and visual-effects controls
- [x] Untimed interview practice and keyboard/menu navigation alternative
- [x] DOM workshop navigation alternative

## Content and reliability

- [x] Supportive, state-aware dialogue and useful environmental text
- [x] One location definition and backend-owned shop catalog
- [x] One music transition authority with clear start feedback
- [x] Honest coaching/scoring language and saved evidence scores
- [x] Clipboard failure, drafts, autosave, and unsaved-change protection
- [x] Share-token flow connected to read-only routes
- [x] Backend/frontend level rules aligned
- [x] Dead/duplicate systems, pages, hooks, events, and assets removed
- [x] Deployment compatibility, lint, typecheck, and production build verified

## Validation note

`pnpm check`, `pnpm typecheck`, and the production build pass. Browser visual
automation was attempted but blocked by the local Windows browser-runner
permission error, so Caffeine deployment remains the authoritative Motoko
compatibility and final device-render check.
