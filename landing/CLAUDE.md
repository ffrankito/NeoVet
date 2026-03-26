# Landing — Claude Instructions

> This app is part of the NeoVet monorepo. Read the root `CLAUDE.md` first — it contains business context, the v1/v2/v3 rule, the language policy, and cross-cutting constraints that apply here.

---

## What This App Is

Single-page marketing site for the NeoVet clinic. Conversion-focused: Hero, Services, About, Hours, Location, Reviews, Footer — all on one page with anchor navigation. WhatsApp is the primary CTA. No backend.

---

## Stack

| Layer | Tool |
|-------|------|
| Framework | Astro 6 + TypeScript |
| Styling | Tailwind CSS 4 (`@theme` design tokens in `global.css`) |
| Font | DM Sans (Google Fonts, loaded via preconnect) |
| Icons/OG | web-asset-generator skill (`~/.claude/skills/web-asset-generator/`) |
| Hosting | Vercel (static output) |

**CRITICAL: This is NOT a Next.js app.** Do not generate:
- `app/` directory structure or `pages/` router
- Server components, server actions, or `use client` / `use server` directives
- `next.config.ts` patterns or Next.js middleware
- `getServerSideProps` / `getStaticProps`

This app uses `.astro` files. Routing is file-based under `src/pages/`. Components go in `src/components/`.

---

## Architecture

Single page assembled in `src/pages/index.astro`:

```
Base.astro (layout)
  └── index.astro
        ├── Navbar.astro      (fixed, anchor links, mobile hamburger)
        ├── Hero.astro        (#inicio)
        ├── Services.astro    (#servicios — 2 featured, 5 standard)
        ├── About.astro       (#nosotros)
        ├── Hours.astro       (#horarios)
        ├── Location.astro    (#ubicacion)
        ├── Reviews.astro     (#resenas)
        └── Footer.astro
```

### Design Tokens

Defined in `src/styles/global.css` using Tailwind 4 `@theme`:
- **Primary**: warm teal (`--color-primary-*`) — trust, health
- **Accent**: warm amber (`--color-accent-*`) — approachable, friendly
- **Neutral**: warm gray (`--color-neutral-*`)
- **WhatsApp**: `--color-whatsapp` / `--color-whatsapp-dark`

### Assets

- **Favicons** (7 sizes) + **OG images** (3) in `public/` — generated via web-asset-generator, currently placeholders (🐾 emoji + teal text)
- **PWA manifest** at `public/manifest.json`
- **Photos/logo** go in `src/assets/images/` and `src/assets/logo/` (see `src/assets/README.md`)

---

## v1 Scope

- Single-page static landing with anchor navigation
- No forms that POST to a server
- No database, no auth, no JavaScript-heavy interactions
- Astro's zero-JS-by-default is intentional — do not add client-side JS unless strictly necessary
- WhatsApp CTAs link to `https://api.whatsapp.com/send/?phone=543413101194`

---

## Current Status

**Phases 0–3 complete.** All sections built with placeholder content. Optimizations applied (DM Sans, PWA manifest, featured service cards, asset validation).

**Phase 4 (content swap) is BLOCKED** on the Paula interview. See `docs/paula-interview-checklist.md` for all gaps.

When Phase 4 starts:
1. Drop assets in `src/assets/` (see `src/assets/README.md`)
2. Replace placeholder text in components (search for `<!-- PLACEHOLDER:`)
3. Regenerate favicons/OG images with real logo via web-asset-generator
4. Validate and deploy

---

## Security

`vercel.json` with security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy) must be present before any production deployment.

CSP currently allows:
- Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`)
- Google Maps iframes (`google.com/maps`, `maps.googleapis.com`)

When adding third-party scripts (analytics, maps, fonts), update the `Content-Security-Policy` in `vercel.json` to explicitly allow those domains. Do not use `unsafe-eval` or wildcard (`*`) in the CSP.

---

## Documentation Standards

This app is intentionally simple. Docs are minimal:

- Significant technical decisions → ADR in `landing/docs/architecture/ADR-NNN-title.md` using the template at `docs/standards/03-adr-template.md`
- Content gaps → `docs/paula-interview-checklist.md`
- Asset/design audit → `docs/optimization-overview.md`
- No charter, technical spec, or handoff document required for v1
