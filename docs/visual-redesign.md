# Visual Redesign Plan: Downer Family Tree

## Context

This 5th-grade family tree presentation is technically correct but visually flat. Every slide shares the same cool gray background, the typography is generic system sans-serif, person cards float in a void, and the map slide shows a single tiny US pin on a gray map. The goal is to make it feel like a warm family storybook that engages classmates — while preserving the existing 9-slide structure, data architecture, and offline capability.

---

## 1. Typography

**Font pairing:** Freight Display Pro (headings) + Source Sans 3 (body)

- Download WOFF2 files and place in `fonts/`
- Add `@font-face` declarations to `main.css`
- New CSS variables: `--font-family-heading` (serif) and `--font-family` (sans)
- Apply heading font to: `.family-name`, `.slide-heading`, `.closing-title`, `.title-subtitle`, `.person-name`

**Files:** `css/main.css`, `fonts/*.woff2`

---

## 2. Color Palette — Warm Storybook Tones

Replace the cold teal/coral scheme with nature-inspired warmth:

| Role | Current | New |
|------|---------|-----|
| Primary | `#0D7377` (cold teal) | `#2D6A4F` (forest green) |
| Primary light | `#14919B` | `#52B788` (spring green) |
| Maternal side | `#0D7377` | `#6A994E` (warm olive) |
| Paternal side | `#FF6B6B` | `#BC6C25` (sienna) |
| Background | `#FAFAFA` → `#F0F4F5` | `#FDF8F0` → `#F5ECD7` (cream/linen) |
| Card bg | `#FFFFFF` | `#FFFEF9` (warm white) |
| Text | `#2D3436` | `#3D2C2E` (espresso) |
| Text light | `#636E72` | `#6B5E62` (dusk) |
| Accent | — | `#DDA15E` (honey gold) |

Update CSS variables in `main.css` `:root` block. Also update hardcoded hex values in `js/map-renderer.js` and `js/tree-renderer.js`.

**Files:** `css/main.css`, `css/tree.css`, `js/map-renderer.js`, `js/tree-renderer.js`

---

## 3. Backgrounds & Texture

The flat gray void is the #1 visual problem. Every slide needs warmth and depth.

- **Base:** Replace linear gradient with a warm radial gradient (cream center → linen edges → slight vignette)
- **Paper texture:** Add a subtle SVG noise/grain overlay as a CSS pseudo-element on `.slide` at ~3% opacity — gives parchment feel and makes glass-morphism cards actually have something to blur against
- **Per-slide color washes:**
  - Title/Closing: warm golden glow at center
  - Maternal focus slides: faint olive wash
  - Paternal focus slides: faint sienna wash
  - Map: slightly cooler parchment for vintage cartography feel
  - Tree: neutral warm to let colorful cards pop
- **Decorative corner elements:** Subtle botanical SVG line-art (vine/leaf corners) on title, closing, and focus slides at ~8% opacity. Created as inline SVG data URIs in CSS.

**Files:** `css/main.css`, new `css/decorations.css`, `index.html` (link new CSS)

---

## 4. Title Slide Redesign

**Current:** "Downer" in teal on blank gray. No warmth, no imagery.

**New design:**
- Background: warm cream with a centered golden radial glow
- A stylized SVG tree silhouette (decorative, not the data tree) behind the text at ~12% opacity, ~60% viewport height
- "The" in small caps above, "**Downer**" in large serif (~8rem), "Family Tree" in lighter sans, "A Journey Through Generations" in italic serif
- A horizontal strip of small circular family photo thumbnails (5-7 photos) at the bottom, slightly faded — immediately signals "this is about real people"
- Subtle floating particle animation (anime.js — tiny dots drifting upward)

**Animation sequence:**
1. Tree silhouette fades + scales in (800ms)
2. Family name reveals with slight blur-to-sharp (600ms, 400ms delay)
3. Subtitle + byline stagger up (400ms each)
4. Photo strip slides up from below (500ms, 1s delay)

**Files:** `index.html`, `css/main.css`, `css/animations.css`, `js/app.js` (photo strip population), new `images/decorations/title-tree.svg`

---

## 5. Full Tree Slide Improvements

- **Branches:** Increase thickness (6px trunk, 4px main, 3px upper). Add warm brown-to-green gradient. Adjust bezier curves for more organic feel.
- **Warm shadows:** Change card drop shadows from pure black to warm brown tint
- **Photo borders:** Thicker (6px), colored by side (olive/sienna)
- **Child card distinction:** Larger card with subtle golden glow ring around photo
- **Generation labels:** Small italic serif labels on the left ("Me", "Parents", "Grandparents", "Great-Grandparents") with faint horizontal guide lines
- **Background:** Warm parchment with slight vignette (lighter in center)

**Files:** `js/tree-renderer.js`, `css/tree.css`, `css/main.css`

---

## 6. Focus Slide Improvements (Parents, Grandparents, Great-Grandparents)

### Break the visual repetition:

**Parents slide (2 cards):**
- Horizontal card layout (photo left, info right) instead of current portrait cards
- Larger photos (160px)
- A decorative vine/branch element connecting the two cards
- Optional `funFact` field rendered in italic if present in data

**Grandparents slides (2 cards each):**
- Slightly different card shape from parents — photo overlaps the top edge
- Small relationship breadcrumb: "Mason → Kelli → Kim Henselbecker"
- Subtle side-color background wash (olive for maternal, sienna for paternal)

**Great-grandparent slides (4 cards each):**
- Clean 2×2 grid (not the current 3+1 wrap)
- Vintage photo treatment: sepia-tinted border, slight rotation (±2°), like photos pinned to a board
- Birth year timeline bar along the bottom

**All focus slides:**
- Ken Burns effect on photos (slow 1.0→1.05 zoom over slide duration)
- Add optional `funFact` and `hometown` fields to `family.json` schema (backward-compatible — skip if absent)

**Files:** `js/tree-renderer.js` (`createFocusCards()`), `css/main.css`, `css/animations.css`, `data/family.json` (add optional fields)

---

## 7. Map Slide Redesign

**Current:** Gray SVG map, one tiny circle pin, "United States (15)" legend. Almost empty.

**New design — vintage cartography aesthetic:**
- **Map styling:** CSS-restyle SVG paths — warm parchment fill for land, cream-blue for water, warm stroke borders. Faint latitude/longitude grid lines.
- **Decorative frame:** Vintage-style border around the map
- **Compass rose:** Small decorative SVG in a corner
- **Pin redesign:** Teardrop/marker shape instead of plain circle. Flag icon or country initial inside. Larger labels in serif font.
- **Journey lines:** When multiple countries exist, animated dotted lines trace from ancestral countries toward the US (or child's country). Lines draw themselves with stroke-dashoffset animation.
- **Single-country fallback:** When only US exists, show a larger decorative pin with all 15 names radiating outward, and a caption "All 15 family members — born in the United States"
- **Member sidebar:** Small grouped list of family members by country with thumbnail photos, below the legend

**Animation:** Map fades in → ancestral pins drop (farthest first) → journey lines draw → US pin drops last → legend reveals

**Files:** `js/map-renderer.js` (major changes), `css/main.css`, `css/animations.css`, new `images/decorations/compass-rose.svg`

---

## 8. Closing Slide Redesign

**Current:** "Thank You!" in teal on gray. Barren.

**New design — echo the title slide:**
- Same decorative tree silhouette from title, but now with small circular family photos placed at branch endpoints — the tree is "full"
- "The Downer Family" in large serif
- "Four Generations, One Story" in italic below
- "Mason Downer — 5th Grade — 2026" in small text
- Subtle golden glow animation behind the tree

**Animation:** Tree fades in → photos appear at branch tips (staggered, top-to-bottom: great-grandparents first → child last) → text fades up

**Files:** `index.html`, `css/main.css`, `css/animations.css`, `js/app.js` (closing tree renderer)

---

## 9. Slide Transitions

**Replace the uniform 500ms crossfade with directional transitions:**

| From → To | Transition |
|-----------|-----------|
| Title → Tree | Fade + scale up (current slide fades, new scales from 0.95→1.0) |
| Tree → Parents | Zoom-in feel (scale from 1.0→1.05 on exit) |
| Between focus slides | Slide left (current exits left, new enters right) |
| Last focus → Map | Fade + slide up (map rises) |
| Map → Closing | Warm crossfade with brief golden flash |

**Implementation:** Add transition type to each slide definition in `slideshow.js`. Refactor `goTo()` to apply exit/enter CSS classes based on transition type, using `animationend` cleanup.

Also: use anime.js more for orchestrated entrance sequences with elastic easing for a playful, bouncy feel appropriate for 5th graders.

**Files:** `js/slideshow.js` (`goTo()` method), `css/animations.css` (transition classes), new `js/transitions.js` (anime.js timeline sequences)

---

## Implementation Order

| Step | Scope | Why this order |
|------|-------|---------------|
| 1 | Typography + colors | Foundation — every subsequent step builds on these |
| 2 | Backgrounds + texture | Instantly transforms the feel; validates the palette |
| 3 | Title slide | Highest-impact single change; sets the tone |
| 4 | Focus slides | Most screen time; breaking repetition is high value |
| 5 | Tree slide | Richer branches and cards |
| 6 | Closing slide | Bookends with title; reuses the tree silhouette |
| 7 | Map slide | Complex but self-contained |
| 8 | Slide transitions | Builds on everything above |
| 9 | Polish | Animation timing, responsive testing, edge cases |

---

## Files Summary

**New files:**
- `fonts/*.woff2` — Downloaded font files (user provides from Adobe Fonts)
- `css/decorations.css` — Texture overlays, decorative elements, per-slide backgrounds
- `js/transitions.js` — Directional slide transition logic + anime.js timelines
- `images/decorations/title-tree.svg` — Stylized tree silhouette
- `images/decorations/compass-rose.svg` — Map decoration

**Modified files:**
- `css/main.css` — Colors, fonts, backgrounds, card styles
- `css/tree.css` — Branch styling, card redesign, generation labels
- `css/animations.css` — All new animations, transitions, Ken Burns, shimmer
- `css/responsive.css` — Adjust for new layouts
- `index.html` — New CSS/JS links, title photo strip, decoration containers
- `js/app.js` — Title photo population, closing tree renderer, new callbacks
- `js/slideshow.js` — Transition types in goTo(), updated slide config
- `js/tree-renderer.js` — Branch drawing, card creation, focus card layouts
- `js/map-renderer.js` — Pin redesign, journey lines, vintage styling, color updates
- `data/family.json` — Add optional `funFact`, `hometown` fields

---

## Verification

1. Open `index.html` in browser — confirm warm parchment backgrounds, serif headings, new colors
2. Click through all 9 slides — verify directional transitions work correctly
3. Check title slide — tree silhouette visible, photo strip populated, animations fire
4. Check focus slides — verify maternal vs paternal visual differentiation, varied layouts
5. Check map — vintage styling, pin design, single-country fallback looks good
6. Check closing — photo tree populates, animations stagger correctly
7. Test keyboard navigation (arrows, space) still works
8. Test with `file://` protocol (offline)
9. Resize browser — verify responsive breakpoints hold
10. Test with `prefers-reduced-motion` — animations gracefully degrade
