---
name: Code Catch
description: AI code review for developers who live in the terminal. Dark, dense, engineered.
colors:
  signal-blue: "oklch(0.62 0.16 250)"
  signal-blue-fg: "oklch(0.98 0.01 250)"
  command-navy: "oklch(0.12 0.03 250)"
  console-panel: "oklch(0.16 0.025 250)"
  raised-panel: "oklch(0.20 0.02 250)"
  panel-line: "oklch(0.30 0.02 250)"
  console-white: "oklch(0.92 0.02 250)"
  muted-steel: "oklch(0.62 0.03 250)"
  daylight: "oklch(0.98 0.005 250)"
  ink: "oklch(0.15 0.03 250)"
  alert-red: "oklch(0.55 0.20 25)"
  signal-green: "oklch(0.55 0.15 155)"
  caution-amber: "oklch(0.65 0.15 75)"
typography:
  heading:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "'ss01', 'ss02', 'cv01'"
  label:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    lineHeight: 1.6
rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.signal-blue-fg}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "oklch(0.62 0.16 250 / 0.85)"
    textColor: "{colors.signal-blue-fg}"
  button-outline:
    backgroundColor: "{colors.console-panel}"
    textColor: "{colors.console-white}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted-steel}"
    rounded: "{rounded.sm}"
    height: "36px"
  input:
    backgroundColor: "{colors.console-panel}"
    textColor: "{colors.console-white}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
    height: "36px"
  card:
    backgroundColor: "{colors.console-panel}"
    textColor: "{colors.console-white}"
    rounded: "{rounded.lg}"
    padding: "24px"
  badge-default:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.signal-blue-fg}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  badge-success:
    backgroundColor: "oklch(0.55 0.15 155 / 0.20)"
    textColor: "oklch(0.72 0.12 155)"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
---

# Design System: Code Catch

## 1. Overview

**Creative North Star: "THE CONTROL ROOM"**

Code Catch is the wall of screens an engineer sits in front of when the stakes are real: deep cold navy, instruments lit in a single signal blue, every readout aligned to the same grid. The interface reads as engineered, not decorated. Surfaces are dark by default (the app ships `defaultTheme="dark"`), and depth comes from stacking panels of slightly different navy, the way a console gains dimension from its bezels rather than from drop shadows. Information density is a feature, not a flaw: a developer should see more of their review, diff, or analytics in one glance than a friendlier tool would dare to show.

The system runs on one cold hue (OKLCH hue 250) for every neutral and one saturated accent (Signal Blue) for everything that demands action or attention. Warmth, playfulness, and ornament are deliberately absent. Type is a single technical grotesque (Geist Sans) with a monospace companion (Geist Mono) reserved for anything a machine produced: code, diffs, commit hashes, metrics. Motion is brisk and functional: 150ms color shifts on controls, 400ms page transitions, nothing that makes a developer wait to watch an animation finish.

This system explicitly rejects the friendly-productivity-app look (Notion/Loom softness), wellness-startup and lifestyle-SaaS warmth, cream backgrounds and giant pillowy cards, and the cluttered enterprise-dashboard sprawl of Jira or Azure DevOps. It is equally not the neon-on-black hacker cliché: the accent is a precise instrument blue, never a glowing green terminal.

**Key Characteristics:**
- Dark-first. Command Navy (`oklch(0.12 0.03 250)`) is the home surface; light mode is a faithful cold-tinted inversion, not the primary experience.
- One hue, one signal. Every neutral is tinted toward hue 250; Signal Blue is the only saturated color in the chrome.
- Sharp geometry. Controls are nearly square (2px radius); panels are barely softened (6px). Only badges go fully round.
- Dense and aligned. Tight spacing, rigorous alignment, a fixed (non-fluid) type scale tuned for sustained reading at a desk.
- Machine truth in mono. Geist Mono marks anything generated or quoted from the codebase.

## 2. Colors

A single cold accent floating over a stack of hue-250 navies, with three semantic colors held in reserve to encode review state.

### Primary
- **Signal Blue** (`oklch(0.62 0.16 250)`): The only saturated hue in the interface chrome. Primary buttons, active navigation, current selection, focus rings, links, keyword syntax, and chart series one. Its scarcity is what makes it read as "act here."
- **Signal Blue Foreground** (`oklch(0.98 0.01 250)`): Near-white text/icon color that sits on Signal Blue fills for maximum legibility.

### Secondary
Semantic state colors. They appear only to mean something, never for decoration.
- **Signal Green** (`oklch(0.55 0.15 155)`): Success, passing checks, diff additions. Used as a 10–20% alpha tint behind text in dark mode.
- **Caution Amber** (`oklch(0.65 0.15 75)`): Warnings, degraded states, chart series three.
- **Alert Red** (`oklch(0.55 0.20 25)`): Destructive actions, errors, diff deletions.

### Neutral
The Command Navy ramp. All hue 250, chroma fading as lightness rises.
- **Command Navy** (`oklch(0.12 0.03 250)`): The base canvas in dark mode. Deep and cold; never pure black.
- **Console Panel** (`oklch(0.16 0.025 250)`): Cards, inputs, secondary surfaces, the first layer lifted off the canvas.
- **Raised Panel** (`oklch(0.20 0.02 250)`): Popovers, dropdowns, accent/hover surfaces, the second layer up.
- **Panel Line** (`oklch(0.30 0.02 250)`): Borders, dividers, grid lines between instruments.
- **Console White** (`oklch(0.92 0.02 250)`): Primary text. Clears WCAG AA against every navy surface.
- **Muted Steel** (`oklch(0.62 0.03 250)`): Secondary text, captions, placeholders. Still AA on Command Navy; bright enough that it is never the washed-out gray that makes a UI hard to read.
- **Daylight** (`oklch(0.98 0.005 250)`) / **Ink** (`oklch(0.15 0.03 250)`): The light-mode surface and text anchors, both cold-tinted toward hue 250.

### Named Rules
**The One Signal Rule.** Signal Blue is the only saturated hue allowed in the UI chrome. If a screen has two competing accents, one is wrong. Status greens, ambers, and reds are not decoration; they appear only where they encode review state.

**The No-Warm Rule.** Every neutral carries hue 250. No warm grays, no pure grays, no pure black, no cream. If a surface looks beige or paper-toned, it has left the system.

## 3. Typography

**Display / Heading Font:** Geist Sans (with `system-ui, sans-serif` fallback)
**Body & UI Font:** Geist Sans
**Code / Data Font:** Geist Mono (with `ui-monospace, SFMono-Regular, monospace` fallback)

**Character:** One technical grotesque does all the human-readable work; weight and size carry the hierarchy, not a second typeface. The body runs with `font-feature-settings: "ss01", "ss02", "cv01"` for Geist's engineered alternates. Geist Mono is the voice of the machine: tabular, even, and unmistakably "this came from your codebase."

### Hierarchy
- **Heading** (600, 1.25–1.875rem, line-height 1.15, letter-spacing −0.02em): Page and section titles. Tight but never cramped; the −0.02em floor keeps letters from touching.
- **Title** (600, 1rem, leading-none, tracking-tight): Card titles and panel headers.
- **Body** (400, 0.875rem, line-height 1.6): Default UI and reading text. Prose caps at 65–75ch; data and tables may run denser.
- **Label** (500, 0.75rem): Buttons, form labels, metadata. Sentence case, not all-caps.
- **Mono** (400, 0.8125rem, line-height 1.6): Diffs, code blocks, hashes, metrics, syntax-highlighted output.

### Named Rules
**The One Family Rule.** Geist Sans carries headings, body, buttons, labels, and data. There is no display face and no third family. Hierarchy is built from weight (400/500/600) and size, never from swapping typefaces.

**The Machine-Truth Rule.** Geist Mono is reserved for content a machine generated or that must be read character-exact: code, diffs, commit SHAs, tokens, numeric metrics. Prose is never set in mono for flavor.

## 4. Elevation

Depth is built primarily from **tonal layering**, not shadows. In dark mode each surface steps up in lightness along the same hue 250 ramp (Command Navy `0.12` → Console Panel `0.16` → Raised Panel `0.20`), with Panel Line `0.30` borders drawing the edges. A panel reads as "above" the canvas because it is lighter, the way a lit instrument sits proudly on a dark console. Shadows are a quiet secondary cue, used sparingly and never as decoration.

### Shadow Vocabulary
- **Resting card** (`box-shadow: var(--shadow-sm)` ≈ `0 1px 2px rgb(0 0 0 / 0.05)`): Barely-there separation on default cards.
- **Review card** (`box-shadow: 0 2px 8px oklch(0.05 0.02 250 / 0.5)`): The signature content surface at rest.
- **Review card, hover** (`box-shadow: 0 4px 12px oklch(0.05 0.02 250 / 0.6)`): Lifts ~2px on hover, paired with a lighter border and background. The only place shadow grows in response to interaction.

### Named Rules
**The Tonal Depth Rule.** Reach for a lighter navy before reaching for a shadow. Stacked panels separate by lightness step (`0.12 / 0.16 / 0.20 / 0.30`); shadow blur never exceeds 12px and never exists for ornament. If a surface needs a 24px+ glow to feel elevated, the layering is wrong.

## 5. Components

Every interactive component ships the full state set: default, hover, focus-visible, active, disabled, and (where relevant) loading. Affordances are consistent surface-wide; the same button shape and the same form-control vocabulary appear on every screen.

### Buttons
- **Shape:** Nearly square (2px radius, `rounded-sm`). Default height 36px (`h-9`), padding `8px 16px`, label at 0.875rem/500.
- **Primary:** Signal Blue fill with a matching border and near-white text. Hover drops fill to 85% opacity; active to 75%.
- **Outline:** Console Panel surface, Panel Line border, Console White text. Hover shifts to the accent/raised surface and brightens the border.
- **Ghost:** Transparent with Muted Steel text; hover fills with the raised surface, brightens text to Console White, and reveals a border.
- **Secondary / Link:** Secondary uses the panel surface with a border; link is text-only Signal Blue with an underline on hover.
- **Focus:** `ring-2 ring-primary/40` plus a Signal Blue border. **Loading:** `isLoading` sets `aria-busy` and a progress cursor; the label stays put (no layout shift).
- **Sizes:** `xs` (24px), `sm` (32px), `default` (36px), `lg` (40px), and matching square icon sizes.

### Inputs / Fields
- **Style:** Console Panel background, Panel Line border, 2px radius, 36px height, padding `4px 12px`. Placeholder uses Muted Steel (legible, not a faint gray).
- **Focus:** Border shifts to Signal Blue with a `ring-2 ring-primary/40` halo (color transition only, no size jump).
- **Error:** `aria-invalid` swaps border and ring to Alert Red. **Disabled:** 50% opacity, no pointer events.

### Cards / Containers
- **Corner Style:** Softened panel (6px radius, `rounded-lg`).
- **Background:** Console Panel on the Command Navy canvas.
- **Border:** Panel Line at ~50–60% opacity, one solid hairline. Never paired with a wide decorative shadow.
- **Shadow Strategy:** `shadow-sm` at rest; depth comes from the tonal step, not the shadow (see Elevation).
- **Internal Padding:** 24px (`p-6`), with a 6px header gap. **Transition:** `all 200ms ease-out`.

### Badges / Chips
- **Style:** Fully round pill (`rounded-full`), padding `2px 8px`, 0.75rem/500 text.
- **Solid:** Signal Blue or Alert Red fill with contrasting text.
- **Semantic:** Success / Warning / Info as low-alpha tints of green / amber / blue (10% light, 20% dark) with a saturated text color. State is paired with text, never carried by color alone.

### Navigation
- **Dashboard sidebar:** Command Navy surface, Panel Line edge, scrollable with a thin 4px Signal-Blue-tinted thumb (the one place a scrollbar is shown). Active item carries the raised surface and a Signal Blue marker; idle items sit in Muted Steel and brighten on hover.
- **Top navbar:** Sticky, hairline-bottom-bordered, with the logo, primary nav, and user menu. Mobile collapses the sidebar behind a trigger.

### Signature Component: The Diff & Review Surface
- **Diff lines:** Additions on a Signal-Green tint (`--diff-addition-bg`) with green text; deletions on an Alert-Red tint with red text; context on a slightly darker navy. Hunk headers sit on a translucent raised surface in Muted Steel.
- **Syntax highlighting:** Keywords in Signal Blue (600), strings in green, numbers in amber, comments in italic steel.
- **Review card:** The recurring unit of the product (see Elevation for its shadow behavior): Console Panel, Panel Line border, lifts on hover.

## 6. Do's and Don'ts

### Do:
- **Do** keep the interface dark by default. Command Navy (`oklch(0.12 0.03 250)`) is the home surface; build new screens for dark first, then verify the light inversion.
- **Do** reserve Signal Blue for action and state. Primary action, current selection, focus, and links, nothing decorative.
- **Do** build depth by stepping up the navy ramp (`0.12 → 0.16 → 0.20`) before adding any shadow.
- **Do** keep controls sharp: 2px on buttons and inputs, 6px on cards, full-round only on badges.
- **Do** set anything machine-generated (code, diffs, hashes, metrics) in Geist Mono.
- **Do** keep body text on Console White or Muted Steel; both clear WCAG AA (4.5:1) against the navy surfaces. Pair every status color with text or an icon.
- **Do** keep motion functional and fast: ~150ms on control color changes, ~200ms on cards, ~400ms on page transitions, all honoring `prefers-reduced-motion`.

### Don't:
- **Don't** use cream or warm backgrounds, giant rounded cards, or soft gradients everywhere. Every neutral stays on hue 250; no token should read as paper, sand, or beige.
- **Don't** drift toward "friendly productivity app" visuals (the Notion / Loom aesthetic), lifestyle-SaaS, HR-platform, or wellness-startup warmth.
- **Don't** ship the neon-on-black hacker look. The accent is a precise instrument blue, not a glowing terminal green.
- **Don't** recreate cluttered enterprise-dashboard sprawl (Jira, Azure DevOps); density must stay aligned and legible, never noisy.
- **Don't** add illustrated or playful ornament. This product is engineered, not decorated.
- **Don't** round cards to 12px+ , pair a 1px border with a wide (16px+) drop shadow, or use a colored `border-left` stripe as an accent. Use a full hairline border and a tonal step instead.
- **Don't** introduce a second accent hue or a second type family. One signal, one family.
