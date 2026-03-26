# Landing — Claude Instructions

> This app is part of the NeoVet monorepo. Read the root `CLAUDE.md` first — it contains business context, the v1/v2/v3 rule, the language policy, and cross-cutting constraints that apply here.

---

## What This App Is

Static marketing site for the NeoVet clinic. Conversion-focused: services, team, location, contact info. No backend.

---

## Stack

| Layer | Tool |
|-------|------|
| Framework | Astro + TypeScript |
| Styling | Tailwind CSS |
| Hosting | Vercel (static output) |

**CRITICAL: This is NOT a Next.js app.** Do not generate:
- `app/` directory structure or `pages/` router
- Server components, server actions, or `use client` / `use server` directives
- `next.config.ts` patterns or Next.js middleware
- `getServerSideProps` / `getStaticProps`

This app uses `.astro` files. Routing is file-based under `src/pages/`. Components go in `src/components/`.

---

## v1 Scope

- Static pages: home, services, team, location, contact info
- No forms that POST to a server
- No database, no auth, no JavaScript-heavy interactions
- Astro's zero-JS-by-default is intentional — do not add client-side JS unless strictly necessary

---

## Security

`vercel.json` with security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy) must be present before any production deployment.

When adding third-party scripts (analytics, maps, fonts), update the `Content-Security-Policy` in `vercel.json` to explicitly allow those domains. Do not use `unsafe-eval` or wildcard (`*`) in the CSP.

---

## Documentation Standards

This app is intentionally simple. Docs are minimal:

- Significant technical decisions → ADR in `landing/docs/architecture/ADR-NNN-title.md` using the template at `docs/standards/03-adr-template.md`
- No charter, technical spec, or handoff document required for v1
