# NeoVet Landing

Static marketing site for the NeoVet veterinary clinic. Services, team, location, and contact info.

---

## Stack

- Astro + TypeScript
- Tailwind CSS
- Deployed to Vercel (static output)

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

## v1 Scope

Static pages only — home, services, team, location. No backend, no forms, no database.

A `vercel.json` with security headers must be present before any production deployment. See `docs/architecture/` for the rationale.
