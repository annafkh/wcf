# PT Wish Care Fast

Indonesian company profile built with Astro, TypeScript, Tailwind CSS, and Lucide SVG icons. Prepared for one Node.js 22 LTS process. No React, database, CMS, polling, or runtime workers.

## Run locally

```powershell
npm ci
npm run dev
```

Open the address printed by Astro (normally http://127.0.0.1:4321).

## Build and run production

Use Node.js 22.12 or newer within the Node 22 LTS line. Set the real public domain before building; it supplies canonical URLs, social image URLs, robots.txt, and the sitemap. Without it, domain-dependent metadata is intentionally omitted rather than fabricated.

```powershell
$env:SITE_URL = 'https://your-actual-domain.id'
npm run build
$env:HOST = '127.0.0.1'
$env:PORT = '4321'
node ./dist/server/entry.mjs
```

Use your real domain in place of the example. Configure HTTPS and compression at the reverse proxy. Bind HOST to `0.0.0.0` only if direct network access is intended. Deploy `dist/`, `package.json`, `package-lock.json`, and production dependencies (`npm ci --omit=dev`). No PM2 is required. Build tooling is separate from the single-process production server.

`npm run build` runs Astro's TypeScript diagnostics before compiling. The homepage and crawler endpoints are prerendered, so requests do not rerender the company profile. Sessions are disabled. The small browser scripts handle navigation and optional reveal motion; content and links also work without JavaScript.

## Content and asset provenance

The working directory was empty. Company information and imagery come from the supplied `Company Profile PT WISH CARE FAST.pdf`. The reference demo was consulted only for layout and interactions.

PDF integration:

- Page 1: original shield logo, extracted without redrawing; also used for the favicon.
- Pages 2–4: company profile, contacts, exact vision, four missions, and all four legal entries, including PKP.
- Pages 5–6: six service names and complete descriptions of all five advantages. Service descriptions are concise role-based copy as requested.
- Page 7: seven readable client logos. The generic “kos kosan” entry is displayed as a category, not an invented organization. Image resources hidden behind other PDF objects are not treated as visible client endorsements.
- Page 8: five documentation images for the gallery; the staff coordination and floor-care photos also frame the redesigned hero. The originally extracted team photo remains available in `public/images/hero/`. Captions describe visible activity without guessing identities or locations.

No required company assets are missing. Higher-resolution originals are recommended when available: embedded PDF photos are approximately 312–569 pixels wide and several logos are small. Before public deployment, supply the real domain through `SITE_URL`. No public domain or external deployment has been assumed.

Repeatable content is maintained in `src/data/`. The company logo is in `public/logo/`, client logos in `public/images/clients/`, and documentation in `public/images/gallery/`. All PDF images are converted to WebP without upscaling, with intrinsic width, height, and descriptive alt text. Client and gallery images are lazy-loaded; only the hero photo is preloaded with high fetch priority. The supplied social card is original typographic artwork (`public/images/og.svg` plus a PNG for social platform compatibility).

## Architecture

```text
WCF/
├── public/
│   ├── favicon.png
│   ├── logo/wcf.webp
│   └── images/
│       ├── og.svg
│       ├── og.png
│       ├── hero/tim-wcf.webp
│       ├── about/
│       ├── clients/ (7 WebP logos)
│       └── gallery/ (5 WebP photos)
├── scripts/
│   ├── qa.mjs
│   └── lighthouse.mjs
├── src/
│   ├── components/
│   │   ├── Navbar.astro
│   │   ├── Brand.astro
│   │   ├── Icon.astro
│   │   ├── Hero.astro
│   │   ├── About.astro
│   │   ├── VisionMission.astro
│   │   ├── Services.astro
│   │   ├── Advantages.astro
│   │   ├── Legality.astro
│   │   ├── Clients.astro
│   │   ├── Gallery.astro
│   │   ├── CTA.astro
│   │   ├── Contact.astro
│   │   └── Footer.astro
│   ├── data/
│   │   ├── company.ts
│   │   ├── services.ts
│   │   ├── advantages.ts
│   │   └── legality.ts
│   ├── layouts/BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── robots.txt.ts
│   │   └── sitemap.xml.ts
│   └── styles/
│       ├── global.css
│       └── hero.css
├── .env.example
├── .gitignore
├── astro.config.mjs
├── package.json
├── package-lock.json
├── tsconfig.json
├── IMPLEMENTATION.md
└── README.md
```

Design tokens use the supplied navy, gold, white, text, muted, and soft-background colors. Tailwind provides responsive grid utilities; shared CSS defines the corporate layout, geometry, accessible states, and motion. System fonts avoid font downloads and layout shifts.

SEO includes Indonesian language, one H1, semantic landmarks, OpenGraph/Twitter metadata, favicon, configurable canonical metadata, and Organization/LocalBusiness structured data limited to supplied facts. Accessibility includes a skip link, visible keyboard focus, Escape-to-close menu behavior, reduced-motion support, and navigation that remains available without JavaScript.

Dependencies: `astro`, `@astrojs/node`, `tailwindcss`, `@tailwindcss/vite`, and `@lucide/astro` (the maintained Lucide Astro package). Development dependencies: `@astrojs/check` and `typescript`. `unifont` is overridden to 0.7.4 to retain compatibility with the workspace's Node 22.18; 0.7.5 pulls an HTTP client requiring Node 22.19. No font providers are configured.

## Optional browser QA

With the production server running, install test-only packages without changing the manifest or lockfile:

```powershell
npm install --no-save --package-lock=false playwright-core @axe-core/playwright lighthouse
node scripts/qa.mjs
node scripts/lighthouse.mjs
```

The QA script uses installed Chrome (set `BROWSER_PATH` for a different executable). It checks 375, 768, 1024, and 1440 pixel widths, overflow, mobile navigation, internal anchors, accessibility with axe, page errors, and content without JavaScript. Reports and screenshots are written to ignored `qa-results/`. Run `npm ci` afterward to return to the locked production/development dependency set. Browser QA packages are not application dependencies.
