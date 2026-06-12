# Design Brief

## Direction

Career City — Gamified job-search RPG town with pixel-art neon aesthetic, Zelda/Pokemon explorable layout, and arcade-style HUD overlays. WCAG AAA compliant (7:1 contrast, 18px+ minimum text).

## Tone

Retro-futuristic arcade cabinet: pixel-perfect, CRT scanlines, neon glow, dry self-aware humor in NPC dialogue, no realistic shadows. Accessibility-first: large readable text, high contrast, keyboard navigable.

## Differentiation

Full-screen game canvas experience with scanline overlay, NPC dialogue bubbles, interactive town exploration, and career-milestone HUD bar — zero traditional UI chrome. Satisfies accessibility mandates without sacrificing visual fidelity.

## Color Palette

| Token      | OKLCH        | Role                                    | Contrast vs BG |
| ---------- | ------------ | --------------------------------------- | -------------- |
| background | 0 0 0        | Pure black canvas                       | —              |
| foreground | 1 0 0        | White text (7:1+ vs background)         | 21:1           |
| card       | 0.08 0.01 160| Slightly elevated black panels           | —              |
| primary    | 0.85 0.35 142| Neon magenta; XP bar, primary UI accent | 16:1           |
| secondary  | 0.65 0.32 322| Neon magenta (Resume Tailor buildings)  | 12:1           |
| accent     | 0.72 0.25 70 | Neon amber (Interview Coach, NPC boxes) | 14:1           |
| muted      | 0.15 0.02 260| Dark grey UI text (secondary controls)  | 4:1 (avoid)    |

## Typography

- Display: Space Grotesk — arcade headers, all dialogue, UI labels (clean geometric typeface, 18px+ base)
- Mono: JetBrains Mono — code input, player stats, technical text (18px+)
- Scale: Headings `var(--font-size-xl)` (2rem/32px), body `var(--font-size-base)` (1.125rem/18px), labels `var(--font-size-lg)` (1.5rem/24px)
- Leading: 1.5 for all text to meet WCAG readability

## Elevation & Depth

Flat design with 4px solid pixel borders, zero border-radius, neon glow effects on interactive states, scanline pattern overlay for CRT authenticity. No blur, no transparency shadows — all depth via borders and glows.

## Structural Zones

| Zone           | Background    | Border               | Typography              | Notes                                                   |
| -------------- | ------------- | -------------------- | ----------------------- | ------------------------------------------------------- |
| Canvas (game)  | pure black    | —                    | —                       | Full-screen interactive game area, 18px+ overlays      |
| HUD Bar (XP)   | card bg       | primary neon border  | Space Grotesk 18px+     | Bottom bar with gradient XP fill, level text           |
| NPC Dialogue   | popover       | accent neon border   | Space Grotesk 18px+     | Pixel borders, auto-dismiss or closable, wide max-width|
| Location Marker| primary neon  | 2px solid            | —                       | Clickable hotspots with pulse hover, 2rem × 2rem      |
| Button         | primary       | 4px solid            | Space Grotesk 18px+     | Letter-spacing 0.05em for legibility, glow on hover   |

## Spacing & Rhythm

4px grid rhythm: all borders 4px solid, padding in multiples of 0.5rem (4px), 1rem (8px), gaps between sections 1.5rem; scanline gap 2px to mimic CRT monitor. All interactive elements meet 44px touch target minimum.

## Component Patterns

- Buttons: 4px pixel border, neon glow on hover, scale 1.05 transform, 100ms transition, 18px+ text, letter-spacing 0.05em
- Cards: solid 4px border, flat background, zero radius, scanline overlay, 18px+ text
- Input: monospace font (JetBrains Mono), dark background, neon border on focus, no anti-aliasing, 18px+ text
- HUD: gradient XP bar with repeating diagonal stripe pattern, level/stats text in Space Grotesk 18px+
- NPC Avatar: 16x16 pixel sprite, neon halo glow effect, positioned absolutely, 300px max-width dialogue

## Motion

- Entrance: 200ms fade-in, scanline overlay applied on mount
- Hover: pulse-glow keyframe (0–1.5s infinite), scale 1.05 on interactive elements
- State: pixel-blink keyframe (0.5s step-start) for active/loading states

## Constraints

- All text must be Space Grotesk or JetBrains Mono (no system fonts)
- All text minimum 18px (1.125rem) for WCAG AAA compliance
- All borders exactly 4px solid, border-radius always 0
- Pure black background (#000000 / OKLCH 0 0 0), no gradients on background
- Neon palette only: magenta for primary/XP, amber for accent/Interview Coach
- No dropshadow or blur effects; glow via box-shadow only
- Scanline pattern mandatory on major surfaces
- Full-screen canvas; no traditional navigation or sidebars
- All text contrast must meet WCAG AAA (7:1 minimum)

## Signature Detail

CRT scanline overlay (`scanline::after` pseudo-element) with 1px transparent gap + 1px solid dark stripe repeating, creating authentic arcade monitor effect. Combined with 18px+ accessible typography and 7:1 contrast to ensure retro gaming aesthetic does not compromise readability for users with low vision.
