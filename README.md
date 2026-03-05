# helio

A minimalist solar activity visualizer built on live NOAA data.

The sun is rendered as a pixel grid — each cell represents a small patch of the solar disk, filled in where active sunspot regions are currently located. A 28-day scrubber lets you watch the sun rotate as spots drift from east to west over the past month.

**Live:** [dominicseton.github.io/helio](https://dominicseton.github.io/helio)

---

## what it shows

- **Pixel sun** — sunspot regions plotted at their real heliographic coordinates, sized by area
- **28-day scrubber** — replay the past month; spots visibly migrate across the disk as the sun rotates (~13°/day)
- **Sidebar** — active region count, C/M/X flare probabilities, F10.7 radio flux, smoothed sunspot number
- **Solar Cycle 25 chart** — observed monthly sunspot count from 2019 with NOAA's forecast to 2030

---

## data

All data pulled live from [NOAA / Space Weather Prediction Center](https://www.swpc.noaa.gov/) — no API key required, CORS open.

| endpoint | updates |
|---|---|
| `services.swpc.noaa.gov/json/solar_regions.json` | daily at 00:30 UTC |
| `services.swpc.noaa.gov/json/f107_cm_flux.json` | 3× daily |
| `services.swpc.noaa.gov/json/solar-cycle/observed-solar-cycle-indices.json` | monthly |
| `services.swpc.noaa.gov/json/solar-cycle/predicted-solar-cycle.json` | monthly |

---

## stack

Vanilla TypeScript + Vite. No runtime dependencies. Canvas for the pixel sun, SVG for the cycle chart.

```
src/
  main.ts      app wiring, clock, slider
  sun.ts       pixel art canvas renderer
  chart.ts     solar cycle SVG chart
  api.ts       data fetching + helpers
  types.ts     TypeScript interfaces
  style.css    design system
```

---

## local dev

```sh
npm install
npm run dev
```

Open `http://localhost:5173/helio/`

---

## deploy

Hosted via GitHub Pages (Deploy from branch → `main` → `/docs`).

```sh
npm run build   # outputs to docs/
git add docs/
git commit -m "build"
git push
```
