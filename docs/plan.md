# Family Tree Digital Presentation - Implementation Plan

## Project Overview

A visually stunning, offline-capable digital family tree for a 5th grade school presentation featuring nature-inspired tree visualization, animations, and educational components.

## Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Visualization** | Custom SVG + CSS | Simpler than D3.js, student-understandable, fully offline |
| **Animations** | CSS Animations + Anime.js | Anime.js is 17KB, simple API, works offline |
| **Map** | Static SVG World Map | No tile server needed, pins via simple coordinates |
| **Slideshow** | Vanilla JavaScript | Simple state machine, no library overhead |
| **Layout** | CSS Grid + Flexbox | Modern, universal support |

**Why these choices:**
- Zero build tools required (just open index.html)
- USB-drive portable
- Student can understand the code

## File Structure

```
family-tree/
├── index.html                 # Main entry point
├── data/
│   ├── family.json            # Family data (student edits this)
│   ├── config.json            # Presentation settings
│   └── countries.json         # Country coordinates (pre-filled)
├── images/
│   ├── people/                # Family photos
│   ├── flags/                 # SVG country flags
│   ├── tree/                  # Tree visual elements
│   └── map/world-map.svg      # Static world map
├── css/
│   ├── main.css
│   ├── tree.css
│   ├── animations.css
│   └── responsive.css
├── js/
│   ├── app.js                 # Main logic
│   ├── data-loader.js         # JSON loading/validation
│   ├── tree-renderer.js       # Tree visualization
│   ├── map-renderer.js        # Map with pins
│   └── slideshow.js           # Presentation flow
├── lib/
│   └── anime.min.js           # Animation library
└── fonts/                     # Offline fonts
```

## JSON Data Structure (Beginner-Friendly)

Designed for a student with no prior coding experience. Every field has clear naming and helpful comments.

```json
{
  "_README": "Welcome! Edit this file to build your family tree.",
  "_TIP": "Be careful with commas - every line except the last needs one!",

  "child": {
    "_comment": "This is YOU! Fill in your information below.",
    "firstName": "Mason",
    "lastName": "Downer",
    "photo": "images/people/mason.jpg",
    "birthDate": "2014-05-15",
    "deathDate": null,
    "countryOfOrigin": "United States",
    "countryFlag": "us"
  },

  "parents": {
    "mother": {
      "firstName": "...",
      "lastName": "...",
      "photo": "images/people/mother.jpg",
      "birthDate": "YYYY-MM-DD",
      "deathDate": null,
      "countryOfOrigin": "...",
      "countryFlag": "us"
    },
    "father": { /* same structure */ }
  },

  "grandparents": {
    "mothersMother": { /* ... */ },
    "mothersFather": { /* ... */ },
    "fathersMother": { /* ... */ },
    "fathersFather": { /* ... */ }
  },

  "greatGrandparents": {
    "_comment": "8 great-grandparents total",
    "mothersMothersMother": { /* ... */ },
    "mothersMothersFather": { /* ... */ },
    "mothersFathersMother": { /* ... */ },
    "mothersFathersFather": { /* ... */ },
    "fathersMothersMother": { /* ... */ },
    "fathersMothersFather": { /* ... */ },
    "fathersFathersMother": { /* ... */ },
    "fathersFathersFather": { /* ... */ }
  }
}
```

### Beginner Supports
- Descriptive field names (`mothersMother` instead of `mm`)
- `_comment` fields explain each section
- Example values show expected format
- Validation with friendly error messages ("Line 15: Missing comma")

## Visual Design (Stylized/Modern Aesthetic)

### Tree Concept
- **Stylized geometric tree** - clean lines, not realistic
- **Trunk**: Student at the base (hexagonal or rounded rectangle card)
- **Main branches**: Parents (left=maternal, right=paternal) as clean curved paths
- **Upper branches**: Grandparents (4 people)
- **Top tier**: All 8 great-grandparents
- **Person cards**: Rounded rectangles with circular photo cutouts, modern sans-serif typography

### Modern Design Elements
- Clean, minimal UI with plenty of whitespace
- Subtle gradients and soft shadows
- Geometric connecting lines (smooth bezier curves)
- Glass-morphism effects (frosted glass card backgrounds)
- Accent lines and subtle grid patterns

### Animation Strategy
1. **Entrance**: Smooth fade-up with stagger, lines draw themselves
2. **Ambient**: Subtle floating motion, soft pulse on hover
3. **Transitions**: Smooth cross-fades with scale effects

### Color Palette (Modern/Tech)
- Primary: Deep teal `#0D7377`
- Secondary: Warm coral `#FF6B6B`
- Background: Off-white/cream `#FAFAFA` with subtle gradient
- Cards: White with soft shadow
- Maternal side accent: Teal tint
- Paternal side accent: Coral tint
- Text: Dark slate `#2D3436`

## Slideshow Flow

1. **Title** (5s) - Animated family name reveal
2. **Full Tree** (10s) - Animated tree growth
3. **Parents** (8s) - Focus on parent generation
4. **Maternal Grandparents** (8s)
5. **Paternal Grandparents** (8s)
6. **Great-Grandparents** (8s each side)
7. **World Map** (12s) - Pins drop on countries of origin
8. **Closing** (5s) - Return to tree, "Thank You"

**Controls**: Auto-advances; spacebar pauses; arrows for manual control

## Implementation Phases

### Phase 1: Foundation
1. Create folder structure
2. Download Anime.js and fonts
3. Create index.html shell
4. Build data loader with validation
5. Create sample family JSON

### Phase 2: Tree Visualization
6. Design tree SVG (trunk, branches)
7. Build tree renderer (parse data → position cards)
8. Create person card component
9. Make responsive (iPad, projector)

### Phase 3: Animations
10. Entrance animations (tree growth, card fade-in)
11. Ambient animations (leaf rustle, particles)

### Phase 4: Map Feature
12. Create/obtain SVG world map
13. Build map renderer with pin placement
14. Animate pin drops

### Phase 5: Slideshow
15. Build slideshow controller
16. Create slide transitions
17. Implement all slide types

### Phase 6: Polish
18. Cross-device testing (iPad Safari, projector)
19. USB drive testing
20. Documentation for student

## Critical Files

| File | Purpose |
|------|---------|
| `index.html` | Entry point, HTML structure |
| `data/family.json` | Core schema student edits |
| `js/tree-renderer.js` | JSON → visual tree |
| `css/animations.css` | "High-tech" animation definitions |
| `js/slideshow.js` | Presentation flow control |

## Educational Components

**Student learns:**
- JSON syntax (objects, key-value pairs, arrays)
- File paths and organization
- Basic web concepts (HTML/CSS/JS roles)
- Family history research and interviewing
- Geography (countries of origin)

**Teaching approach:**
- Heavily commented JSON with `_help` fields
- Friendly error messages for invalid data
- Step-by-step README with screenshots
- Example data to experiment with first

## Testing Checklist

- [ ] Opens correctly from USB drive (file:// protocol)
- [ ] Works on iPad Safari
- [ ] Works on laptop + projector
- [ ] Slideshow auto-advances smoothly
- [ ] All animations perform well
- [ ] Student can edit JSON and add photos
- [ ] Error messages are helpful when JSON is invalid

## Decisions Made

- **Generations**: All 8 great-grandparents (15 ancestors total + student)
- **Experience level**: No prior coding - emphasize beginner-friendly JSON with lots of guidance
- **Visual style**: Stylized/modern - clean lines, geometric shapes, teal/coral color scheme

## Summary

This plan creates a modern, visually striking family tree that:
1. Works completely offline from a USB drive
2. Auto-plays as a slideshow with minimal interaction
3. Teaches JSON editing through guided, well-commented data files
4. Includes a world map showing countries of origin
5. Features smooth animations for a "high-tech" presentation feel