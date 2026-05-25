---
name: Code Catch
description: AI-powered code review that catches what humans miss.
colors:
  background: "#09090b"
  surface-deep: "#111113"
  surface-raised: "#18181b"
  surface-overlay: "#1f1f23"
  border: "#27272a"
  muted: "#3f3f46"
  text-secondary: "#a1a1aa"
  text-primary: "#e4e4e7"
  text-bright: "#fafafa"
  accent-blue: "#3b82f6"
  accent-blue-muted: "#2563eb"
  signal-red: "#ef4444"
  signal-green: "#22c55e"
  signal-amber: "#f59e0b"
typography:
  display:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  none: "0px"
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.command-navy}"
    border: "1px solid {colors.accent-blue}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    cursor: "pointer"
  button-primary-hover:
    backgroundColor: "{colors.accent-blue-muted}"
    textColor: "{colors.text-bright}"
    border: "1px solid {colors.accent-blue-muted}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    cursor: "pointer"
  button-ghost-hover:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    border: "1px solid {colors.muted}"
  input-default:
    backgroundColor: "{colors.surface-deep}"
    textColor: "{colors.text-primary}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  card-surface:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
  nav-item-hover:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-bright}"
---

# Design System: Code Catch

## 1. Overview

**Creative North Star: "The Control Room"**

Code Catch is a mission-critical instrument panel. Every surface exists to surface signal, suppress noise, and give the developer immediate confidence in their codebase's health. The aesthetic is that of a well-engineered control room: deep, dark, precise, and utterly functional. Nothing decorates. Everything informs.

The system rejects warmth, playfulness, and visual softness. No cream backgrounds. No rounded-everything friendliness. No lifestyle SaaS energy. No neon theatrics. The interface communicates through density, typographic precision, and tonal restraint. It earns trust the way a well-built CLI does: by being fast, predictable, and never wasting your attention.

**Key Characteristics:**
- Dark-dominant with deep navy foundations, never pure black
- Flat surfaces differentiated by tonal shifts, not shadows
- Compact information density with tight, deliberate spacing
- Monospace accents for technical data (counts, hashes, timestamps)
- Color used sparingly and functionally: blue for action, red/green/amber for signal

## 2. Colors

A restrained cold palette. Tinted neutrals carry the interface; the single accent (blue) marks interactive elements and nothing else. Signal colors (red, green, amber) are reserved strictly for semantic meaning.

### Primary
- **Command Navy** (oklch(0.12 0.03 250)): The deepest background. The foundation of every screen. Used for page-level backgrounds and the sidebar base.
- **Accent Blue** (oklch(0.62 0.16 250)): The single interactive color. Buttons, links, active states, focus rings. Nothing else.

### Neutral
- **Surface Deep** (oklch(0.16 0.025 250)): Card backgrounds, input fields, secondary containers. One step above the page.
- **Surface Raised** (oklch(0.20 0.02 250)): Hover states, active nav items, elevated containers. Two steps above the page.
- **Surface Overlay** (oklch(0.24 0.02 250)): Dropdowns, popovers, command palettes. The highest tonal layer.
- **Slate Border** (oklch(0.30 0.02 250)): Dividers, input borders, table rules. Visible but quiet.
- **Slate Muted** (oklch(0.40 0.03 250)): Disabled states, placeholder text, tertiary information.
- **Text Secondary** (oklch(0.60 0.03 250)): Labels, descriptions, metadata. Readable but recessive.
- **Text Primary** (oklch(0.82 0.02 250)): Body copy, headings, primary content. The default reading color.
- **Text Bright** (oklch(0.92 0.01 250)): Emphasis, active states, high-contrast elements. Used sparingly.

### Signal (semantic only)
- **Signal Red** (oklch(0.55 0.2 25)): Errors, critical severity, destructive actions.
- **Signal Green** (oklch(0.55 0.15 155)): Success, passing checks, healthy status.
- **Signal Amber** (oklch(0.65 0.15 75)): Warnings, medium severity, attention needed.

### Named Rules
**The Cold Doctrine.** Every neutral is tinted toward hue 250 (cold blue). No pure grays. No warm undertones. If a surface looks gray, it's wrong; it should look slate-blue.

**The Signal Scarcity Rule.** Red, green, and amber appear only with semantic meaning (error, success, warning). They are never decorative. If a color draws the eye, it must be saying something.

## 3. Typography

**Display + Body Font:** Geist (with system fallback stack)
**Label + Code Font:** Geist Mono (with monospace fallback)

**Character:** Technical, tight, and confident. Geist's geometric precision matches the control-room metaphor. The mono variant appears wherever data is technical: commit hashes, file paths, timestamps, counts. This isn't decoration; it signals "this is machine-generated or machine-relevant data."

### Rendering
- **Anti-aliasing:** `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale` on the root. Subpixel rendering makes light-on-dark text look bloated.
- **Text rendering:** `text-rendering: optimizeLegibility` for headings (display, headline). Improves kerning pairs at larger sizes.
- **Font feature settings:** Enable `"ss01"` (stylistic set 1) for Geist where available. Tighter, more geometric alternates.

### Hierarchy
- **Display** (700, clamp(1.75rem, 4vw, 2.5rem), 1.1): Page titles only. One per screen maximum. Tight letter-spacing (-0.025em) for density.
- **Headline** (600, 1.25rem, 1.3): Section headers, card titles, modal headers. The workhorse heading.
- **Title** (600, 0.9375rem, 1.4): Subsection labels, table column headers, sidebar group labels.
- **Body** (400, 0.875rem, 1.6): All running text. Max line length 70ch. The 14px base keeps density high without sacrificing readability.
- **Label** (500, 0.75rem, 1.4, Geist Mono): Metadata, timestamps, badge text, status indicators. Uppercase forbidden; the mono face provides enough differentiation.

### Named Rules
**The 14px Floor Rule.** Body text is 14px (0.875rem). Nothing interactive goes below 12px. The density goal is achieved through spacing compression, not type shrinking.

**The Mono Signal Rule.** Geist Mono appears only for technical data: hashes, paths, counts, code, timestamps. Using mono for decorative purposes (nav labels, button text) is prohibited.

## 4. Elevation

Flat by default. Depth is communicated through tonal shifts in the navy scale, not through shadows. A surface one step above another is simply lighter (Surface Deep → Surface Raised → Surface Overlay). This creates clear hierarchy without the visual noise of drop shadows.

Shadows appear only as transient feedback:
- **Hover shadow** (`0 2px 8px oklch(0.05 0.02 250 / 40%)`): Applied on interactive card hover. Subtle, cold-tinted, disappears on mouse-out.
- **Focus shadow** (`0 0 0 2px oklch(0.62 0.16 250 / 40%)`): Ring-style focus indicator using the accent blue at reduced opacity.
- **Overlay shadow** (`0 8px 32px oklch(0.05 0.02 250 / 60%)`): Dropdowns and popovers only. Anchors floating elements to the page.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. If you're reaching for `box-shadow` on a static element, use a tonal shift instead. Shadows are responses to interaction, not permanent decoration.

## 5. Components

### Buttons
- **Shape:** Sharp corners (4px radius). Tight padding (8px 16px). `cursor: pointer` always, no exceptions.
- **Border:** Every button variant has a visible 1px border. Primary: `1px solid accent-blue`. Ghost: `1px solid slate-border`. Destructive: `1px solid signal-red`. Borders define the element's edge; buttons without borders look unfinished.
- **Primary:** Accent Blue background, Command Navy text. Border matches background color. The only saturated element on most screens.
- **Hover:** Slightly muted blue (accent-blue-muted), text shifts to bright. Border darkens to match. Transition: 150ms ease-out.
- **Ghost:** Transparent background, secondary text color, slate-border stroke. Hover fills with surface-raised and border lightens to muted. Used for secondary actions, toolbar buttons, nav items.
- **Destructive:** Signal Red background, same shape rules. Border: `1px solid signal-red`. Reserved for irreversible actions.
- **Disabled:** Surface-raised background, slate-muted text, slate-border stroke at 50% opacity. No pointer events, no hover. `cursor: not-allowed`.

### Inputs / Fields
- **Style:** Surface-deep background, 4px radius. Text-primary for value, slate-muted for placeholder.
- **Border:** Always visible. `1px solid slate-border` at rest. The border must be clearly distinguishable against the background; inputs without visible edges look broken. Never omit or reduce opacity on the resting border.
- **Focus:** Border shifts to accent-blue (full opacity, sharp). Focus ring (2px accent-blue at 40% opacity). No background change.
- **Error:** Border shifts to signal-red (full opacity). Inline error text below in signal-red, body weight.
- **Disabled:** Reduced opacity (0.5). Border remains visible at reduced contrast.

### Cards / Containers
- **Background:** Surface-raised (one step above page).
- **Border:** `1px solid slate-border`, always present and visible. Cards without borders dissolve into the page. The edge must be sharp and clearly defined against both the card background and the page behind it. No shadow at rest.
- **Radius:** 6px (md). Tight, not rounded.
- **Internal padding:** 12px 16px. Compact.
- **Hover (when interactive):** Hover shadow appears. Border lightens one step to muted. Transition: 150ms.
- **Nested containers:** Use surface-deep (darker than parent) to create inset appearance. Never nest cards inside cards.

### Navigation (Sidebar)
- **Background:** Command-navy (same as page, no visual separation except a 1px border-right in slate-border).
- **Items:** Ghost-button pattern. Transparent at rest, surface-raised on hover, surface-overlay when active.
- **Active indicator:** Background fill only. No colored side-stripe. Active text shifts to text-bright.
- **Typography:** Title weight (600) for group labels, body weight (400) for items.
- **Density:** 6px vertical padding per item. 10px horizontal. Tight.

### Tables
- **Header:** Title typography, text-secondary color. No background differentiation; separated by a 1px slate-border bottom.
- **Rows:** Body typography, text-primary. Alternating rows prohibited (use consistent background). Hover: row background shifts to surface-raised.
- **Borders:** Horizontal rules only (1px slate-border). No vertical dividers. No outer border.

### Badges / Status Indicators
- **Style:** Geist Mono label typography. Background tint of the signal color at 15% opacity. Text in the signal color at full strength. 4px radius.
- **No border.** The tinted background is sufficient.
- **Sizes:** One size only. No small/medium/large variants.

### Tooltips / Popovers
- **Background:** Surface-overlay.
- **Border:** 1px slate-border.
- **Shadow:** Overlay shadow (the only element with a persistent shadow besides dropdowns).
- **Typography:** Body size, text-primary.
- **Arrow:** None. Position is sufficient context.

## 6. Do's and Don'ts

### Do:
- **Do** tint every neutral toward hue 250. Even the darkest background carries a cold blue undertone (chroma 0.02-0.03).
- **Do** use tonal shifts for hierarchy. Page → Surface Deep → Surface Raised → Surface Overlay. Four levels maximum.
- **Do** reserve Accent Blue exclusively for interactive elements. If it's not clickable, it's not blue.
- **Do** use Geist Mono for technical data (hashes, paths, counts, code). It signals "machine-relevant."
- **Do** keep padding tight and asymmetric where appropriate. 12px vertical, 16px horizontal is the card default; vary for rhythm.
- **Do** use 1px borders in slate-border for separation. Thin, quiet, functional.
- **Do** make borders on inputs, cards, and buttons always visible and sharp. If the border disappears into the background, increase contrast. Borderless interactive elements look unfinished.
- **Do** set `cursor: pointer` on every clickable element (buttons, links, interactive cards). No exceptions.
- **Do** apply `-webkit-font-smoothing: antialiased` globally. Light text on dark backgrounds demands it.
- **Do** respect `prefers-reduced-motion`. Disable hover shadows and transitions; keep layout stable.

### Don't:
- **Don't** ship buttons without `cursor: pointer`. Default cursor on a clickable element signals broken interaction.
- **Don't** omit borders on inputs or cards. Borderless fields on dark backgrounds are invisible; the user can't find the input.
- **Don't** use cream backgrounds, warm tones, or any hue above 200 or below 300 in the neutral scale.
- **Don't** use border-left or border-right greater than 1px as a colored accent stripe on any element.
- **Don't** apply gradient text (`background-clip: text`). Emphasis is weight or size, never gradient.
- **Don't** use glassmorphism, backdrop-blur, or frosted-glass effects.
- **Don't** build identical card grids (same-sized cards with icon + heading + text repeated).
- **Don't** use shadows on static elements. Shadows are transient feedback only.
- **Don't** use bounce, elastic, or spring easing. Ease-out-quart or faster. 150ms maximum for micro-interactions.
- **Don't** use rounded corners above 8px. This is not a friendly productivity app.
- **Don't** use em dashes in UI copy. Commas, colons, semicolons, or periods.
- **Don't** make the interface feel like "lifestyle SaaS, HR platforms, no-code marketing tools, or wellness startup energy." (PRODUCT.md)
- **Don't** use decorative illustrations, mascots, or playful iconography.
- **Don't** use the hero-metric template (big number, small label, gradient accent). Show data in context, not in vanity cards.
