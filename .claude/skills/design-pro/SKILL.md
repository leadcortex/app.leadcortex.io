---
name: design-pro
description: Use before creating, restyling or reviewing any UI component or page of LeadCortex (frontend/). Sets the spacing scale, typography, component rules, hover/motion discipline and the list of "AI-generated UI" patterns to remove. Also use when the user says the interface looks "vibe codé", "IA", messy, cramped or not pro.
---

# Design pro LeadCortex

Goal: an interface that reads like a product made by a small careful team, in the spirit of Apple's Human Interface Guidelines: clarity, deference (the content leads, the chrome stays quiet), depth used sparingly. **Never change the light-mode colour tokens** in `frontend/styles.css`; quality comes from spacing, type and restraint.

Before editing a page, read it whole, list what violates the rules below, then fix in this order: content (remove), hierarchy (type), spacing, components, motion.

## 1. Remove before you style

A section stays only if the user acts on it or reads it often. Ask for each block: *what does the user do with this?* If nothing:

- KPI rows of 3–4 identical cards with a big number, a tiny label and a "+12 %" pill: keep at most the one or two numbers the user acts on, inline in a sentence or a small header line. Never open a page with them.
- Decorative icons in coloured circles next to every title.
- Subtitles that restate the title ("Gérez vos prospects" under "Prospects").
- Empty states with a paragraph: one short line plus one action.
- Badges ("Nouveau", "IA", "Beta") on more than one element per screen.

## 2. Spacing (4 px grid)

Use only these steps: 4, 8, 12, 16, 24, 32, 48, 64 px (`1 2 3 4 6 8 12 16` in Tailwind). No `gap-2.5`, `p-3.5`, `mt-7` unless aligning to an existing control height.

| Relation | Space |
|---|---|
| label ↔ its control, icon ↔ its text | 4–8 |
| items inside a group (list rows, fields) | 8–12 |
| between groups inside a section | 24 |
| between sections of a page | 48 (32 on mobile) |
| page padding | 16 mobile, 32 desktop |

Proximity carries meaning: things that belong together sit closer than things that don't. If two unrelated texts are closer than 16 px vertically, that's a bug (e.g. a floating badge touching a paragraph).

Content width: text blocks max ~68 characters (`max-w-prose`); forms max 512 px; dashboards may go wider but keep a max width.

## 3. Typography

- Scale (px): 12 meta · 13 secondary · 14 body (app) · 15–16 body (reading) · 20 section title · 28 page title. One display (Instrument Serif italic) title per page at most.
- Weights: 400 body, 500 labels/buttons, 600 titles. `font-bold`/`font-extrabold` only for one key figure per screen.
- Never below 11 px. No uppercase+tracking "kicker" above every section: one per page at most.
- Numbers in tables and prices: `tabular-nums`.
- Muted text is for secondary info only, never for the main content of a row.

## 4. Components

- **Cards**: a card is a container the user opens or a group with a clear boundary. Prefer plain sections separated by whitespace or a hairline over cards inside cards. Radius: 12 (controls), 16 (cards), 24 (sheets/modals). One shadow level for floating things only (menus, popovers, modals); cards on the page get a border **or** a background, not both plus a shadow.
- **Buttons**: one primary per view. Secondary actions are `outline` or `ghost`. Labels are verbs ("Exporter", "Payer 29,99 €"), never "Cliquez ici".
- **Forms**: label always visible, error under the field in 12 px, disabled primary until valid instead of error walls. Inputs 44 px min height on touch.
- **Lists/tables**: rows 44–52 px, hairline separators, actions revealed on row hover only on desktop and always reachable on mobile.
- **Icons**: 16 px in text, 20 px in nav; same stroke everywhere; no icon that just repeats the label.

## 5. Hover and motion

- Hover feedback only on things that are clickable, and subtle: background tint or text colour. No `hover:-translate-y`, `hover:scale`, `hover:shadow-*` on cards. No glow.
- Transitions 120–200 ms, `ease-out`. Animate entrance of overlays only, not every card on page load (no staggered fade-ins).
- Respect `prefers-reduced-motion`.

## 6. Text (French UI)

Run the `humanizer:humanizer` rules on every string. Most frequent tells in this app:

- **Em/en dashes as separators** (`Aéronautique Lyon — Founder`, `Titre — sous-titre`). Use a middle dot `·`, a line break, a comma, or two styled spans (name in foreground, role in muted). Never `—` in UI.
- "Not X, but Y" marketing contrasts, triads ("Rapide, simple et puissant"), inflated words (puissant, intelligent, révolutionnaire, optimisé, fluide, seamless, boostez, propulsé par l'IA).
- Emojis in headings or buttons; title case; bold on every label.
- Fake precision and vanity stats ("98 % de satisfaction", "+247 %") that the user never uses.
- Sentences that explain the UI ("Cette section vous permet de…"): cut, the UI explains itself.

Write like a person talking to a colleague: short, concrete, verbs first, the real noun ("3 prospects sans e-mail", not "Données incomplètes détectées").

## 7. Checklist before saying "done"

- [ ] Nothing on screen the user never uses; page doesn't open with a KPI card row.
- [ ] All spacing on the 4 px scale; sections clearly separated; nothing cramped.
- [ ] One primary button, one display title, ≤ 1 kicker.
- [ ] No hover lift/scale/shadow on cards; no `—` in visible text.
- [ ] Checked at 390 px and 1280 px wide (screenshot when a browser is available).
- [ ] Light-mode colour tokens untouched.
