# Landing — Claude Instructions

> This app is part of the NeoVet monorepo. Read the root `CLAUDE.md` first — it contains business context, the v1/v2/v3 rule, the language policy, and cross-cutting constraints that apply here.

---

## What This App Is

Single-page marketing site for the NeoVet clinic. Conversion-focused landing with anchor navigation. WhatsApp is the primary CTA. Chat widget (iframe to chatbot) as secondary. Static contact form (not wired to backend yet) as tertiary. No backend.

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
Base.astro (layout — chat widget, scroll animations via IntersectionObserver)
  └── index.astro
        ├── Navbar.astro        (fixed transparent, logo + Servicios + Contactanos)
        ├── Hero.astro          (#inicio — full-bleed bg image, dark overlay, CTAs)
        ├── UspCards.astro      (4 value proposition cards, no anchor)
        ├── Services.astro      (#especialidades — 3 featured; #servicios — 8 standard)
        ├── About.astro         (#nosotros)
        ├── Reviews.astro       (#resenas — moved before contact for conversion)
        ├── ContactForm.astro   (#contacto — static form, urgency escape to WhatsApp)
        ├── Hours.astro         (#horarios)
        ├── Location.astro      (#ubicacion)
        └── Footer.astro
```

### Design Tokens

Defined in `src/styles/global.css` using Tailwind 4 `@theme`:
- **Primary**: warm teal (`--color-primary-*`) — trust, health
- **Accent**: rose (`--color-accent-*`) — warmth, care
- **Neutral**: warm gray (`--color-neutral-*`)
- **WhatsApp**: `--color-whatsapp` / `--color-whatsapp-dark`

### Assets

- **Logo**: `public/neovet-logo.png` — served raw (bypasses Astro image optimizer to preserve PNG transparency)
- **Favicons** (7 sizes) + **OG images** (3) in `public/` — generated via web-asset-generator, currently placeholders
- **PWA manifest** at `public/manifest.json`
- **Photos/logo sources** in `src/assets/images/` and `src/assets/logo/` (see `src/assets/README.md`)
- **Hero background**: `src/assets/images/hero/mobile/pau_vete_perro.jpeg` — Paula with bulldog patient

---

## v1 Scope

- Single-page static landing with anchor navigation
- Contact form is static HTML — does NOT submit anywhere yet (v2 will wire to Formspree or Resend)
- Chat widget is an iframe to `neo-vet-widget.vercel.app` (the chatbot app)
- No database, no auth
- Minimal JS: scroll animations (IntersectionObserver), chat widget toggle, contact form urgency escape
- WhatsApp CTAs link to `https://api.whatsapp.com/send/?phone=543413101194`

### CTA Hierarchy (do not violate)

1. **WhatsApp** (green) — primary, for immediate contact. Always most prominent.
2. **Contact form** (teal) — secondary, for async reach-out. Never styled to compete with WhatsApp.
3. **Chat widget** (teal, bottom-right) — tertiary, passive discovery. No call-to-action pointing to it.

---

## Current Status

**Redesign v2 complete (2026-04-04).** BakerStreet-inspired hero, USP cards, contact form, scroll animations, mobile-optimized layouts. Deployed to production.

**Phase 4 (content swap) is BLOCKED** on the Paula interview. See `docs/paula-interview-checklist.md` for all gaps.

When Phase 4 starts:
1. Drop assets in `src/assets/` (see `src/assets/README.md`)
2. Replace placeholder text in components (search for `<!-- PLACEHOLDER:`)
3. Regenerate favicons/OG images with real logo via web-asset-generator
4. Replace Google Reviews placeholder URL in `Reviews.astro`
5. Wire contact form to a backend (Formspree, Resend, or WhatsApp deep link)
6. Validate and deploy

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
