# Graco's Water Lab

A browser-based brewing water chemistry calculator for homebrewers. It helps you build a target water profile, dose salts and acids, and estimate mash/sparge pH for a given recipe — no server or build step required, just open `index.html`.

## Features

- **Salt dosing optimizer** — calculates gypsum, calcium chloride, Epsom salt, baking soda, pickling salt, magnesium chloride, and slaked lime additions to hit a target mineral profile, while penalizing salts that are harder to dose accurately or less commonly desirable.
- **Mash & sparge pH estimation** — heuristic models for predicting mash pH and sparge pH based on your water's alkalinity/HCO3 and grain bill, including a dynamic sparge acid calculator.
- **Style-based target presets** — built-in target pH ranges sourced from published brewing references, e.g. Janish (5.20–5.25 for IPAs), Noonan (5.25 for lagers), and Palmer (5.35–5.40 for dark/balanced beers).
- **Malt reference database** — grain bill selector backed by data from John Mallett's *Malt: A Practical Guide from Field to Brewhouse*.
- **BeerXML import/export** — import a recipe's mash and sparge volumes directly from BeerXML, and export your water profile back out.
- **Saved profiles** — save and reload custom source ("My Water") and target water profiles via browser `localStorage`.
- **Unit converter & ion balance warnings** — quick conversions and a warning banner when your resulting profile falls outside a healthy ion balance.

## Getting Started

This is a static site with no dependencies or build step.

1. Clone the repo: `git clone https://github.com/gracianymiranda-gif/gracos-water-lab.git`
2. Open `index.html` directly in a browser, or serve the folder with any static file server (e.g. `npx serve .`).
3. The app is also deployed via GitHub Pages.

## Project Structure

```
.
├── index.html      # App markup and UI structure
├── app.js          # Application logic: calculators, optimizer, BeerXML handling, DOM wiring
├── styles.css      # Styling
└── assets/         # Static assets
```

## Important Disclaimer

The mash and sparge pH models used in this tool are **heuristic estimates**, not lab-grade predictions. Always verify your actual mash pH with a calibrated pH meter — water chemistry, grain chemistry, and mash conditions vary enough that software estimates should be treated as a starting point, not a guarantee.

## Roadmap / Known Limitations

- No automated test suite yet — calculation logic (mash pH, sparge pH, salt optimizer) is validated manually.
- `app.js` is currently a single file; a future refactor may split it into focused modules (salts, pH models, BeerXML, UI).
- Cache-busting for `app.js`/`styles.css` is currently done via manual version query strings in `index.html`.

## Contributing

Issues and pull requests are welcome. For changes to the chemistry calculations, run `node tests/bw-calibration.test.mjs` and describe any additional validation (e.g. comparison against a known BeerXML recipe or reference profile).

## License

No license has been specified yet for this project. Contact the repository owner before reusing this code.
