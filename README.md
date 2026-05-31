# Claude-Cost

A small static website to help visualize how much work Claude can do with your money.

Pick a **budget** (default $500M), a **model**, and an **input/output split**, and the
site shows how many tokens that buys — then converts it into something relatable, like
"that's feeding the Linux kernel codebase ~10,000 times." A second section splits the
same budget across a team of developers and a working period.

## Run locally

It's a static site — no build step, no dependencies. Just serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Or open `index.html` directly in a browser.

## Files

- `index.html` — page structure and controls
- `styles.css` — responsive, mobile-first styling
- `app.js` — pricing data, comparison sizes, and all calculations

## Editing the numbers

- **Model prices** live in the `MODELS` array in `app.js` (US dollars per million
  tokens, list price).
- **Comparison sizes** (Linux kernel, Wikipedia, etc.) live in the `UNITS` array.
  These are deliberately rough, order-of-magnitude estimates.

## Deploy to Cloudflare Pages

This is a plain static site, so deployment is just uploading the files:

1. Create a new **Pages** project and connect this repo (or upload the folder).
2. **Build command:** leave empty. **Build output directory:** `/` (the repo root).
3. Deploy.

No framework, no environment variables, no server runtime required.
