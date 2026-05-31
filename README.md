# Claude-Cost

A small static website to help visualize how much work Claude can do with your money.

Pick a **budget** (default $500M), a **model**, and an **input/output split**, and the
site shows how many tokens that buys — then converts it into something relatable, like
"that's feeding the Linux kernel codebase ~10,000 times." A second section splits the
same budget across a team of developers and a working period.

## Run locally

It's a static site — no build step, no dependencies. Just serve the folder:

```sh
python3 -m http.server 8000 --directory public
# then open http://localhost:8000
```

Or open `public/index.html` directly in a browser.

## Files

- `public/index.html` — page structure and controls
- `public/styles.css` — responsive, mobile-first styling
- `public/app.js` — pricing data, comparison sizes, and all calculations
- `wrangler.toml` — Cloudflare deploy config (serves `public/`)

## Editing the numbers

- **Model prices** live in the `MODELS` array in `app.js` (US dollars per million
  tokens, list price).
- **Comparison sizes** (Linux kernel, Wikipedia, etc.) live in the `UNITS` array.
  These are deliberately rough, order-of-magnitude estimates.

## Deploy to Cloudflare

This deploys as a **Workers static-assets** site (an assets-only Worker that
just serves `public/`). No framework, no environment variables, no server
runtime required.

### Option A — Connect to Git (auto-deploys on push)

1. **dash.cloudflare.com** → **Workers & Pages** → **Create** → connect this repo.
2. Cloudflare detects `wrangler.toml`; the deploy command is `npx wrangler deploy`.
3. **Save and Deploy.** You'll get a `*.workers.dev` URL, and every push to the
   production branch redeploys automatically.

### Option B — Wrangler CLI

```sh
npm install -g wrangler   # if you don't have it
wrangler login            # one-time browser auth
wrangler deploy           # serves ./public per wrangler.toml
```
