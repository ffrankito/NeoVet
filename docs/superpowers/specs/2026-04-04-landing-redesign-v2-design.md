# Landing Redesign v2 — Design Spec

**Date:** 2026-04-04
**Branch:** `landing/redesign-v2`
**Inspiration:** commhealthcare.com

## Section Order

```
Navbar
Hero              → WhatsApp CTA + "Conocenos" ghost
USP Cards [NEW]   → 4 value-prop cards, no heading
Especialidades    → 3 featured specialty cards (existing)
Servicios         → General services grid (existing)
Nosotros          → Paula's story, asymmetric (existing)
Reseñas           → Social proof (MOVED UP, before Hours)
Contacto [NEW]    → Static contact form
Horarios          → Schedule table (existing)
Ubicación         → Map + contact info (existing)
Footer            → Enhanced multi-column
```

## Brand Constraints

- Palette: teal primary, rose accent, warm gray neutrals. No blue.
- Font: DM Sans only.
- Language: Argentine Spanish (voseo).
- WhatsApp = primary CTA everywhere. Form = secondary. Chat widget = passive.
- No new JavaScript beyond existing carousel/menu/chat toggle.

## New Section: USP Cards

4 icon-based cards in a horizontal grid (1col mobile, 2col sm, 4col lg). White bg, no section heading.

| Icon | Title | Description |
|------|-------|-------------|
| Heart/stethoscope | Especialistas en tu raza | Diplomados en medicina de braquicéfalicos. Entendemos la anatomía única de tu bulldog, pug o bóxer. |
| Magnifying glass | Ecografía de alta complejidad | Máster en ecografía abdominal y cardiológica, en consultorio y a domicilio. |
| Shield/clock | Guardia obstétrica 24hs | Acompañamiento permanente para partos y emergencias reproductivas. |
| Calendar | Atención personalizada | Turnos coordinados para que tu mascota reciba la atención que merece. |

Card design: `rounded-2xl border border-neutral-100 hover:border-primary-200 hover:shadow-md`. Icon in `bg-primary-50 rounded-full h-14 w-14`. Mobile: icon-left/text-right. sm+: icon-top/text-center.

## New Section: Contact Form

- Section bg: `bg-neutral-100`, section id: `#contacto`
- Eyebrow: "Contacto", Heading: "Dejanos tu consulta"
- Subheading: "Completá el formulario y te respondemos por WhatsApp o email."
- White card: `rounded-2xl border border-neutral-200 bg-white shadow-sm p-6 sm:p-8 lg:p-10`
- Max width: `max-w-2xl mx-auto`

### Fields

| Row | Field | Type | Required |
|-----|-------|------|----------|
| 1 | Nombre completo | text | yes |
| 2 (2-col) | Teléfono / WhatsApp | tel | yes |
| 2 (2-col) | Email | email | no |
| 3 (2-col) | Nombre de tu mascota | text | yes |
| 3 (2-col) | Motivo de consulta | select | yes |
| 4 | Mensaje | textarea | no |

Dropdown options: Solicitar turno, Ecografía a domicilio, Reproducción / Neonatología, Cirugía, Peluquería canina, Urgencia, Otro.

**Urgencia escape:** If user selects "Urgencia", hide the form and show a WhatsApp CTA instead.

Submit button: "Enviar consulta" in `bg-primary-500` (teal, NOT green). Below: "Te respondemos en menos de 24hs".

Form does NOT submit anywhere — static HTML only for v1.

## Hero Changes

- Column split: `lg:w-[55%]` text / `lg:w-[45%]` photo (was ~65/35)
- Headline: placeholder — Paula picks from 3 options
- Dual CTAs: "Pedí tu turno" (WhatsApp green) + "Conocenos" (ghost outline)
- Add accent line (`h-0.5 w-10 bg-accent-400`) above subheadline

## Existing Section Tweaks

- **Navbar:** Add "Contacto" to navLinks
- **Reviews:** Add decorative quote icon to cards, add "Ver todas las reseñas en Google" link
- **Footer:** Add "Contacto" to navLinks, optionally add Especialidades quick-links column
- **global.css:** Add `prefers-reduced-motion` global safety net

## Files to Create

- `landing/src/components/UspCards.astro`
- `landing/src/components/ContactForm.astro`

## Files to Modify

- `landing/src/pages/index.astro`
- `landing/src/components/Navbar.astro`
- `landing/src/components/Hero.astro`
- `landing/src/components/Reviews.astro`
- `landing/src/components/Footer.astro`
- `landing/src/styles/global.css`
