# NeoVet Landing

Single-page marketing site for the NeoVet veterinary clinic. Sections: Hero, Services, About, Hours, Location, Reviews, Footer — all navigable via anchor links.

---

## Stack

| Layer | Tool |
|-------|------|
| Framework | Astro 6 + TypeScript |
| Styling | Tailwind CSS 4 (`@theme` design tokens) |
| Font | DM Sans (Google Fonts) |
| Error tracking | Sentry (`@sentry/astro`) — project `ravena/neovet-landing` |
| Hosting | Vercel (static output) |
| Assets | web-asset-generator (favicons, OG images) |

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

Site runs at [http://localhost:4321](http://localhost:4321).

---

## Build

```bash
npm run build
npm run preview   # preview production build locally
```

---

## Project Structure

```
src/
├── layouts/
│   └── Base.astro          # HTML shell, meta tags, fonts, OG
├── components/
│   ├── Navbar.astro        # Fixed nav + mobile hamburger
│   ├── Hero.astro          # Headline + WhatsApp CTA
│   ├── Services.astro      # 7 service cards (2 featured)
│   ├── About.astro         # Paula's bio + specialties
│   ├── Hours.astro         # Schedule + emergency info
│   ├── Location.astro      # Address, phone, email, map placeholder
│   ├── Reviews.astro       # 3 testimonial cards
│   └── Footer.astro        # 4-column footer + WhatsApp CTA
├── pages/
│   └── index.astro         # Assembles all sections
├── styles/
│   └── global.css          # Tailwind @theme tokens + base styles
└── assets/
    ├── images/             # Hero, team, clinic, pet photos (Phase 4)
    ├── logo/               # NeoVet logo (Phase 4)
    └── README.md           # Asset organization guide
public/
├── favicon-*.png           # Generated favicons (7 sizes)
├── og-image.png            # Open Graph (1200×630)
├── twitter-image.png       # Twitter Card (1200×675)
├── manifest.json           # PWA manifest
└── ...
```

---

## v1 Scope

Single-page static landing — no backend, no forms, no database. WhatsApp is the primary CTA throughout.

Content is placeholder pending the Paula interview. See `docs/paula-interview-checklist.md`.

A `vercel.json` with security headers (CSP, HSTS, X-Frame-Options) must be present before any production deployment.

---

## Docs

| File | Contents |
|------|----------|
| `docs/paula-interview-checklist.md` | All content gaps to resolve with Paula before Phase 4 |
| `docs/optimization-overview.md` | Asset audit + design optimization status |
| `src/assets/README.md` | Where to drop photos/logo from the interview |
