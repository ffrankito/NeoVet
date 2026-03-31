# Gallery Carousel — Design Spec

**Date:** 2026-03-30
**Status:** Approved

## What

A new `Gallery.astro` section placed between `About.astro` and `Hours.astro` in `index.astro`. Auto-playing photo carousel with text overlaid on a dark gradient at the bottom of the image.

## Visual Design

- Full viewport width, no horizontal padding. Height: `400px` desktop / `280px` mobile.
- Each slide is a full-cover photo. All slides stacked via CSS (`position: absolute`, `opacity: 0`). Active slide has `opacity: 1` with a `transition: opacity 0.6s ease`.
- Dark gradient overlay (`linear-gradient` from transparent top to `rgba(0,0,0,0.65)` bottom).
- Text anchored bottom-left: small teal label "Nuestra clínica" + heading "Cuidamos a tu mascota como parte de nuestra familia" in white. **Same text on all slides — does not change per slide.**
- Controls anchored bottom-right: two circular arrow buttons (prev/next) + one animated progress bar per slide.
- Progress bars: thin horizontal bars (`h-1`), one per slide, shown in a row. The active bar animates from 0% to 100% width over 4 seconds via a CSS `@keyframes` animation. On slide change, animation resets.
- Auto-plays every 4 seconds. Pauses on `mouseenter`, resumes on `mouseleave`.
- `prefers-reduced-motion`: if the user has reduced motion enabled, auto-play is disabled and opacity transitions are instant (`transition: none`).

## Script approach — CSP compatibility

Use a standard Astro `<script>` tag (no `is:inline`). Astro bundles this through Vite and serves it as a separate `.js` file at `/_astro/...`, covered by `script-src 'self'` in `vercel.json`. Do **not** use `<script is:inline>` — that would produce a literal inline script blocked by the CSP.

## Pre-implementation file renames (do this before writing any import)

Rename these files on disk first:

| From | To |
|---|---|
| `src/assets/images/pets/WhatsApp Image 2026-03-30 at 18.43.34.jpeg` | `src/assets/images/pets/pet-1.jpeg` |
| `src/assets/images/pets/WhatsApp Image 2026-03-30 at 18.43.35.jpeg` | `src/assets/images/pets/pet-2.jpeg` |
| `src/assets/images/pets/WhatsApp Image 2026-03-30 at 18.43.37.jpeg` | `src/assets/images/pets/pet-3.jpeg` |
| `src/assets/images/pets/WhatsApp Image 2026-03-30 at 18.43.38.jpeg` | `src/assets/images/pets/pet-4.jpeg` |
| `src/assets/images/pets/WhatsApp Image 2026-03-30 at 18.43.39.jpeg` | `src/assets/images/pets/pet-5.jpeg` |
| `src/assets/images/team/peluquería.jpeg` | `src/assets/images/team/peluqueria.jpeg` |

**Excluded files (do not include in carousel):**
- `src/assets/images/pets/WhatsApp Image 2026-03-30 at 18.43.36.jpeg` — excluded (duplicate angle)
- `src/assets/images/team/WhatsApp Image 2026-03-30 at 18.43.35.jpeg` — excluded
- `src/assets/images/team/WhatsApp Image 2026-03-30 at 18.43.36.jpeg` — excluded

## Photos (8 slides in order)

| File | Alt text (Argentine Spanish) |
|---|---|
| `src/assets/images/clinic/1.jpeg` | `"Interior de NeoVet — clínica veterinaria en Rosario"` |
| `src/assets/images/clinic/2.jpeg` | `"Instalaciones de NeoVet en Rosario"` |
| `src/assets/images/pets/pet-1.jpeg` | `""` (decorative) |
| `src/assets/images/pets/pet-2.jpeg` | `""` (decorative) |
| `src/assets/images/pets/pet-3.jpeg` | `""` (decorative) |
| `src/assets/images/pets/pet-4.jpeg` | `""` (decorative) |
| `src/assets/images/pets/pet-5.jpeg` | `""` (decorative) |
| `src/assets/images/team/peluqueria.jpeg` | `"Servicio de peluquería canina en NeoVet"` |

## Implementation

- All 8 images imported statically in the frontmatter → Astro optimizes to WebP automatically.
- Slide 0 loads `eager`; slides 1–7 load `lazy`.
- `<script>` (no `is:inline`) handles: auto-play timer, prev/next, pause-on-hover, reduced-motion check.

## Placement

`index.astro` order: `Navbar → Hero → Services → About → **Gallery** → Hours → Location → Reviews → Footer`
