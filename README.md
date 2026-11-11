# Venga · Sell

Landing page for selling crypto for euros, built from the Figma section "Sell" (node 42423:29561) in the "👨🏻‍💻 Website" file, with a working sell calculator in the hero.

Plain HTML, CSS and a little JavaScript: no build step or dependencies.

## Files
- `index.html`: markup and copy (English, from the `sell::v1.3` Lokalise keys)
- `styles.css`: all styles, the breakpoints and the motion states at the bottom
- `sell.js`: the sell calculator (coin list, prices, fees, maths, − / + buttons)
- `main.js`: nav, scroll reveals, the steps carousel, the FAQ and the asset chips
- `assets/`: SVGs and images exported from Figma (photos compressed to JPEG)
- `assets/coins/`: coin icons, one SVG per ticker (used by the chips and the calculator)
- `fonts/`: Labil Grotesk (excluded from git by `.gitignore`, see below)

## Sell calculator
- Pick a crypto from the list (click the field or use the arrow keys), then type the amount or use − / + (also ↑ / ↓ in the field). Switching crypto keeps roughly the same euro value.
- **You receive = amount × price − fees**, with fees of **0.8 % + €1** per sale (`FEE_RATE` and `FEE_FIXED` at the top of `sell.js`). If the amount doesn't cover the fees, it shows €0.00 and says so.
- **Prices are static reference prices** in `COINS` at the top of `sell.js`, with `LAST_UPDATED` for the note. BTC matches the Figma mock; the rest are placeholders. Connect a real price feed and confirm the fee schedule before going live (check both with Legal).
- Clicking an asset chip sets that crypto in the calculator and scrolls up to it.

## Before going live
- `DOWNLOAD_URL` at the top of `main.js` sets every Download button (currently `#`). Nav, footer, feature tiles and "See all our available coins" links are `#` placeholders.
- The four "Cash out on your terms" lines and the FAQ answers are drafts (Figma has "Marketing copy needed here" and only the FAQ questions).
- Copy fixes against Figma: "Inutative" → "Intuitive", "wan to sell" → "want to sell", sentence case on the Intuitive card, and the cut-off Trust sentence completed as on the Swap page.

## Breakpoints
| Range | Figma frame |
|---|---|
| 1280px and up | Desktop 1440 |
| 1025–1279px | Desktop 1025 (calculator under the copy) |
| 768–1024px | Tablet (steps become a swipeable carousel) |
| below 768px | Mobile (calculator fields stack, dark text) |

## Run locally

    python3 -m http.server 3610

then open http://localhost:3610.

## Fonts
Labil Grotesk is a licensed typeface, so `fonts/` is ignored by git. Without it the page falls back to the system font. Copy the four `.otf` files into `fonts/` locally (they are in the other Venga projects).
