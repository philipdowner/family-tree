# My Family Tree

A digital family tree presentation for school projects. Features a beautiful tree visualization, animated slideshow, and world map showing your family's countries of origin.

## Quick Start

1. **Open the presentation**: Double-click `index.html` to open it in your web browser
2. **Edit your family data**: Open `data/family.json` in a text editor and fill in your family information
3. **Add photos**: Put your family photos in the `images/people/` folder
4. **Run the slideshow**: Refresh the page to see your changes!

## How to Edit Your Family Data

Open the file `data/family.json` in any text editor (like Notepad, TextEdit, or VS Code).

### Example Entry

```json
"mother": {
  "firstName": "Sarah",
  "lastName": "Smith",
  "photo": "images/people/mom.jpg",
  "birthDate": "1985-03-20",
  "deathDate": null,
  "countryOfOrigin": "United States",
  "countryFlag": "us"
}
```

### Field Explanations

| Field | What to Put | Example |
|-------|-------------|---------|
| `firstName` | Person's first name | `"Sarah"` |
| `lastName` | Person's last name | `"Smith"` |
| `photo` | Path to their photo | `"images/people/mom.jpg"` |
| `birthDate` | Birthday in YYYY-MM-DD format | `"1985-03-20"` |
| `deathDate` | Death date or `null` if alive | `null` or `"2020-05-15"` |
| `countryOfOrigin` | Country name | `"Ireland"` |
| `countryFlag` | Country code (see list below) | `"ie"` |

### Country Codes

| Code | Country | Code | Country |
|------|---------|------|---------|
| `us` | United States | `ie` | Ireland |
| `gb` | England/UK | `de` | Germany |
| `pl` | Poland | `it` | Italy |
| `fr` | France | `mx` | Mexico |
| `ca` | Canada | `jp` | Japan |

See `data/countries.json` for more country codes!

## Adding Photos

1. Put your photos in the `images/people/` folder
2. Name them something simple like `mom.jpg`, `grandpa-bob.jpg`
3. Update the `photo` field in `family.json` to match

**Photo Tips:**
- Square photos work best
- JPG or PNG format
- Keep file sizes under 500KB for fast loading

## Keyboard Controls

| Key | Action |
|-----|--------|
| Space | Play/Pause slideshow |
| Left Arrow | Previous slide |
| Right Arrow | Next slide |

## Troubleshooting

### "Error loading family.json"

- Make sure all your quotes are straight quotes `"` not curly quotes `"`
- Check that every line has a comma EXCEPT the last one in each section
- Make sure all brackets `{` `}` are properly matched

### Photos not showing

- Check that the file name in `family.json` exactly matches your photo file
- Make sure photos are in the `images/people/` folder
- Try using `.jpg` or `.png` files only

### Map pins in wrong place

- Make sure you're using the correct country code (like `us`, not `USA`)
- Check `data/countries.json` for the list of supported country codes

## Files Overview

```
family-tree/
├── index.html          # Main page (open this!)
├── data/
│   ├── family.json     # YOUR FAMILY DATA (edit this!)
│   ├── config.json     # Slideshow settings
│   └── countries.json  # Map coordinates
├── images/
│   ├── people/         # Put family photos here
│   ├── flags/          # Country flag images
│   └── map/            # World map
├── css/                # Styles (don't edit)
├── js/                 # Code (don't edit)
└── lib/                # Libraries (don't edit)
```

## Running From a USB Drive

This presentation works completely offline! Just copy the entire `family-tree` folder to a USB drive and open `index.html` on any computer.

## Credits

Created for a 5th grade school project. Built with:
- Anime.js for animations
- Custom SVG graphics
- Vanilla JavaScript

---

Have fun building your family tree!
