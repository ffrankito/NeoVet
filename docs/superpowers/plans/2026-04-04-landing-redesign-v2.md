# Landing Redesign v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the NeoVet landing page inspired by commhealthcare.com — add USP cards, contact form, reorder sections, and polish the hero.

**Architecture:** Static Astro 6 site. Two new components (UspCards.astro, ContactForm.astro), modifications to 6 existing files. No new JS beyond a small urgency-escape handler in the contact form. All styling via Tailwind CSS 4 utility classes using existing design tokens.

**Tech Stack:** Astro 6, Tailwind CSS 4, DM Sans, Heroicons (inline SVG)

**Spec:** `docs/superpowers/specs/2026-04-04-landing-redesign-v2-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `landing/src/components/UspCards.astro` | 4 value-proposition cards section |
| `landing/src/components/ContactForm.astro` | Static contact form section with urgency escape |

### Modified Files
| File | Changes |
|------|---------|
| `landing/src/pages/index.astro` | Import new components, reorder sections (Reviews before Hours) |
| `landing/src/components/Navbar.astro` | Add "Contacto" nav link |
| `landing/src/components/Hero.astro` | Widen photo column, update CTAs, add accent line |
| `landing/src/components/Reviews.astro` | Add quote icon, Google Reviews link |
| `landing/src/components/Footer.astro` | Add "Contacto" nav link |
| `landing/src/styles/global.css` | Add reduced-motion safety net |

---

## Task 1: Add reduced-motion safety net to global.css

**Files:**
- Modify: `landing/src/styles/global.css:54-63`

- [ ] **Step 1: Add the reduced-motion media query at the end of global.css**

```css
/* Reduced motion safety net */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

Append this after the existing `body` rule block (after line 63).

- [ ] **Step 2: Verify the dev server starts without errors**

Run: `cd landing && npx astro dev --port 4321`
Expected: Server starts on http://localhost:4321 with no CSS errors.

- [ ] **Step 3: Commit**

```bash
git add landing/src/styles/global.css
git commit -m "style: add prefers-reduced-motion safety net to global.css"
```

---

## Task 2: Update Navbar — add "Contacto" link

**Files:**
- Modify: `landing/src/components/Navbar.astro:5-12`

- [ ] **Step 1: Add the Contacto link to the navLinks array**

Replace the current `navLinks` array (lines 5-12) with:

```typescript
const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Servicios", href: "#servicios" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Contacto", href: "#contacto" },
  { label: "Horarios", href: "#horarios" },
  { label: "Ubicación", href: "#ubicacion" },
  { label: "Reseñas", href: "#resenas" },
];
```

- [ ] **Step 2: Verify nav renders correctly in browser**

Check http://localhost:4321 — navbar should show 7 links on desktop. "Contacto" appears between "Nosotros" and "Horarios". The link won't scroll anywhere yet (section doesn't exist), but it should render.

- [ ] **Step 3: Commit**

```bash
git add landing/src/components/Navbar.astro
git commit -m "feat: add Contacto link to navbar"
```

---

## Task 3: Update Footer — add "Contacto" link

**Files:**
- Modify: `landing/src/components/Footer.astro:10-17`

- [ ] **Step 1: Add the Contacto link to the footer navLinks array**

Replace the footer's `navLinks` array (lines 10-17) with:

```typescript
const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Servicios", href: "#servicios" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Contacto", href: "#contacto" },
  { label: "Horarios", href: "#horarios" },
  { label: "Ubicación", href: "#ubicacion" },
  { label: "Reseñas", href: "#resenas" },
];
```

- [ ] **Step 2: Verify footer renders the 7 links**

Check http://localhost:4321 — scroll to footer, "Contacto" should appear in the Navegacion column.

- [ ] **Step 3: Commit**

```bash
git add landing/src/components/Footer.astro
git commit -m "feat: add Contacto link to footer navigation"
```

---

## Task 4: Update Hero — widen photo column, update CTAs, add accent line

**Files:**
- Modify: `landing/src/components/Hero.astro`

- [ ] **Step 1: Update the section layout — widen photo column**

In `Hero.astro`, find line 87:
```html
class="relative h-72 shrink-0 overflow-hidden bg-primary-900 sm:h-96 lg:h-auto lg:w-[35%]"
```

Replace `lg:w-[35%]` with `lg:w-[45%]`:
```html
class="relative h-72 shrink-0 overflow-hidden bg-primary-900 sm:h-96 lg:h-auto lg:w-[45%]"
```

- [ ] **Step 2: Update the headline text**

Find the `<h1>` content (line 44-47). Replace the placeholder headline:

```html
<h1 class="mt-4 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem] xl:text-6xl">
  <!-- PLACEHOLDER: confirm final headline with Paula -->
  Porque un bulldog no es cualquier perro, y nosotros no somos cualquier veterinaria
</h1>
```

- [ ] **Step 3: Update the subheadline with accent line**

Find the `<p>` subheadline (lines 49-52). Replace with:

```html
<div class="mt-6 flex items-start gap-3">
  <span class="mt-2 h-0.5 w-10 shrink-0 rounded-full bg-accent-400" aria-hidden="true"></span>
  <p class="text-lg leading-relaxed text-primary-100 sm:text-xl">
    <!-- PLACEHOLDER: confirm final subheadline with Paula -->
    Formación de posgrado en razas braquicefálicas. Cirugía, cardiología, reproducción y guardia obstétrica 24 horas en Rosario.
  </p>
</div>
```

- [ ] **Step 4: Update the dual CTAs**

Find the CTA `<div>` (lines 54-72). Replace the entire block:

```html
<div class="mt-10 flex flex-col gap-4 sm:flex-row">
  <a
    href={whatsappUrl}
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-whatsapp-dark hover:shadow-xl"
  >
    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
    Pedí tu turno
  </a>
  <a
    href="#nosotros"
    class="inline-flex items-center justify-center rounded-xl border-2 border-primary-300/60 px-7 py-3.5 text-base font-semibold text-primary-100 transition-all hover:border-primary-200 hover:bg-white/10"
  >
    Conocenos
  </a>
</div>
```

- [ ] **Step 5: Verify hero looks correct in browser**

Check http://localhost:4321:
- Photo column should be wider (~45%)
- New headline text visible
- Accent line (rose bar) appears before subheadline
- Two CTAs: green "Pedí tu turno" + ghost "Conocenos"
- Mobile: stacks vertically, looks good at 375px

- [ ] **Step 6: Commit**

```bash
git add landing/src/components/Hero.astro
git commit -m "feat: redesign hero — wider photo, new headline, accent line, updated CTAs"
```

---

## Task 5: Create UspCards.astro

**Files:**
- Create: `landing/src/components/UspCards.astro`

- [ ] **Step 1: Create the UspCards component**

Create `landing/src/components/UspCards.astro` with this content:

```astro
---
const cards = [
  {
    title: "Especialistas en tu raza",
    description: "Diplomados en medicina de braquicefálicos. Entendemos la anatomía única de tu bulldog, pug o bóxer.",
    icon: "heart",
  },
  {
    title: "Ecografía de alta complejidad",
    description: "Máster en ecografía abdominal y cardiológica, en consultorio y a domicilio.",
    icon: "scan",
  },
  {
    title: "Guardia obstétrica 24hs",
    description: "Acompañamiento permanente para partos y emergencias reproductivas.",
    icon: "shield",
  },
  {
    title: "Atención personalizada",
    description: "Turnos coordinados para que tu mascota reciba la atención que merece.",
    icon: "clock",
  },
];
---

<section class="bg-white py-16">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div class="group flex items-start gap-4 rounded-2xl border border-neutral-100 px-5 py-6 transition-all hover:border-primary-200 hover:shadow-md sm:flex-col sm:items-center sm:px-4 sm:py-8 sm:text-center">
          <!-- Icon -->
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 transition-transform group-hover:scale-105 sm:h-14 sm:w-14">
            {card.icon === "heart" && (
              <svg class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            )}
            {card.icon === "scan" && (
              <svg class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            )}
            {card.icon === "shield" && (
              <svg class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            )}
            {card.icon === "clock" && (
              <svg class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            )}
          </div>

          <!-- Text -->
          <div>
            <h3 class="text-base font-semibold text-neutral-900 sm:mt-4">
              {card.title}
            </h3>
            <p class="mt-1 text-sm leading-relaxed text-neutral-500 sm:mt-2">
              {card.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Verify the file was created**

Run: `ls landing/src/components/UspCards.astro`
Expected: File exists.

- [ ] **Step 3: Commit**

```bash
git add landing/src/components/UspCards.astro
git commit -m "feat: create UspCards component — 4 value proposition cards"
```

---

## Task 6: Create ContactForm.astro

**Files:**
- Create: `landing/src/components/ContactForm.astro`

- [ ] **Step 1: Create the ContactForm component**

Create `landing/src/components/ContactForm.astro` with this content:

```astro
---
const whatsappUrl =
  "https://api.whatsapp.com/send/?phone=543413101194&text=URGENCIA%3A%20necesito%20atenci%C3%B3n%20inmediata&type=phone_number&app_absent=0";

const motivos = [
  { value: "turno", label: "Solicitar turno" },
  { value: "ecografia", label: "Ecografía a domicilio" },
  { value: "reproduccion", label: "Reproducción / Neonatolog��a" },
  { value: "cirugia", label: "Cirugía" },
  { value: "peluqueria", label: "Peluquería canina" },
  { value: "urgencia", label: "Urgencia" },
  { value: "otro", label: "Otro" },
];
---

<section id="contacto" class="bg-neutral-100 py-section">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-2xl">
      <!-- Header -->
      <div class="text-center">
        <p class="text-sm font-semibold uppercase tracking-widest text-primary-600">
          Contacto
        </p>
        <h2 class="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Dejanos tu consulta
        </h2>
        <p class="mt-4 text-lg text-neutral-500">
          Completá el formulario y te respondemos por WhatsApp o email.
        </p>
      </div>

      <!-- Form card -->
      <form id="contact-form" class="mt-12 space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">

        <!-- Row 1: Nombre -->
        <div>
          <label for="nombre" class="block text-sm font-medium text-neutral-700">
            Nombre completo <span class="text-accent-500">*</span>
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            required
            class="mt-1.5 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Tu nombre"
          />
        </div>

        <!-- Row 2: Telefono + Email -->
        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="telefono" class="block text-sm font-medium text-neutral-700">
              Teléfono / WhatsApp <span class="text-accent-500">*</span>
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              required
              class="mt-1.5 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="341 310-1194"
            />
          </div>
          <div>
            <label for="email" class="block text-sm font-medium text-neutral-700">
              Email <span class="text-xs text-neutral-400">(opcional)</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              class="mt-1.5 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="tu@email.com"
            />
          </div>
        </div>

        <!-- Row 3: Mascota + Motivo -->
        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="mascota" class="block text-sm font-medium text-neutral-700">
              Nombre de tu mascota <span class="text-accent-500">*</span>
            </label>
            <input
              type="text"
              id="mascota"
              name="mascota"
              required
              class="mt-1.5 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="Nombre de tu mascota"
            />
          </div>
          <div>
            <label for="motivo" class="block text-sm font-medium text-neutral-700">
              Motivo de consulta <span class="text-accent-500">*</span>
            </label>
            <select
              id="motivo"
              name="motivo"
              required
              class="mt-1.5 block w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-800 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="" disabled selected>Seleccioná un motivo</option>
              {motivos.map((m) => (
                <option value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <!-- Row 4: Mensaje -->
        <div id="mensaje-row">
          <label for="mensaje" class="block text-sm font-medium text-neutral-700">
            Mensaje
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            rows="4"
            class="mt-1.5 block w-full resize-y rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition-colors focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            placeholder="Contanos en qué podemos ayudarte..."
          ></textarea>
        </div>

        <!-- Submit -->
        <div id="submit-row" class="pt-2">
          <button
            type="submit"
            class="w-full rounded-xl bg-primary-500 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary-600 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 active:bg-primary-700"
          >
            Enviar consulta
          </button>
          <p class="mt-3 text-center text-xs text-neutral-400">
            Te respondemos en menos de 24hs
          </p>
        </div>

        <!-- Urgency escape (hidden by default) -->
        <div id="urgency-escape" class="hidden pt-2 text-center">
          <p class="text-base font-semibold text-neutral-900">
            Para urgencias, contactanos directamente:
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="mt-4 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-7 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-whatsapp-dark hover:shadow-xl"
          >
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp de urgencia
          </a>
          <p class="mt-3 text-sm text-neutral-500">
            O llamanos al <a href="tel:+543413101194" class="font-medium text-primary-600 hover:text-primary-800">(341) 310-1194</a>
          </p>
        </div>
      </form>
    </div>
  </div>
</section>

<script>
  const select = document.getElementById("motivo") as HTMLSelectElement | null;
  const mensajeRow = document.getElementById("mensaje-row");
  const submitRow = document.getElementById("submit-row");
  const urgencyEscape = document.getElementById("urgency-escape");

  select?.addEventListener("change", () => {
    const isUrgency = select.value === "urgencia";
    mensajeRow?.classList.toggle("hidden", isUrgency);
    submitRow?.classList.toggle("hidden", isUrgency);
    urgencyEscape?.classList.toggle("hidden", !isUrgency);
  });
</script>
```

- [ ] **Step 2: Verify the file was created**

Run: `ls landing/src/components/ContactForm.astro`
Expected: File exists.

- [ ] **Step 3: Commit**

```bash
git add landing/src/components/ContactForm.astro
git commit -m "feat: create ContactForm component with urgency escape to WhatsApp"
```

---

## Task 7: Update Reviews — add quote icon and Google Reviews link

**Files:**
- Modify: `landing/src/components/Reviews.astro`

- [ ] **Step 1: Add a decorative quote SVG inside each review card**

In `Reviews.astro`, find line 34 (the opening of the review card div):
```html
<div class="flex flex-col rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
```

Replace lines 34-56 (the entire card content) with:

```html
<div class="flex flex-col rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
  <!-- Quote mark -->
  <svg class="h-8 w-8 text-primary-200" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5 3.871 3.871 0 0 1-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5 3.871 3.871 0 0 1-2.748-1.179z" />
  </svg>

  <!-- Stars -->
  <div class="mt-3 flex gap-0.5 text-accent-400" aria-label={`${review.rating} de 5 estrellas`}>
    {Array.from({ length: review.rating }).map(() => (
      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>

  <!-- Review text -->
  <blockquote class="mt-4 flex-1 text-sm leading-relaxed text-neutral-600">
    "{review.text}"
  </blockquote>

  <!-- Author -->
  <div class="mt-6 flex items-center gap-3 border-t border-neutral-200 pt-4">
    <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
      {review.name.split(" ").map((n: string) => n[0]).join("")}
    </div>
    <p class="text-sm font-medium text-neutral-800">{review.name}</p>
  </div>
</div>
```

- [ ] **Step 2: Add Google Reviews link after the cards grid**

Find the closing `</div>` of the grid (after the cards `.map()`). After it, add:

```html
<div class="mt-12 text-center">
  <a
    href="https://maps.app.goo.gl/NeoVetRosario"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition-colors hover:text-primary-800"
  >
    Ver todas las reseñas en Google
    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  </a>
</div>
```

Note: The Google Maps link `https://maps.app.goo.gl/NeoVetRosario` is a placeholder. Replace with the actual NeoVet Google Business URL when available.

- [ ] **Step 3: Verify reviews render with quote icons and the link**

Check http://localhost:4321 — scroll to reviews. Each card should have a teal quote mark at the top. Below the cards, a "Ver todas las reseñas en Google" link with an external link icon.

- [ ] **Step 4: Commit**

```bash
git add landing/src/components/Reviews.astro
git commit -m "feat: add quote icons and Google Reviews link to reviews section"
```

---

## Task 8: Wire everything up in index.astro — reorder sections

**Files:**
- Modify: `landing/src/pages/index.astro`

- [ ] **Step 1: Replace the entire index.astro content**

Replace all of `landing/src/pages/index.astro` with:

```astro
---
import Base from "../layouts/Base.astro";
import Navbar from "../components/Navbar.astro";
import Hero from "../components/Hero.astro";
import UspCards from "../components/UspCards.astro";
import Services from "../components/Services.astro";
import About from "../components/About.astro";
import Reviews from "../components/Reviews.astro";
import ContactForm from "../components/ContactForm.astro";
import Hours from "../components/Hours.astro";
import Location from "../components/Location.astro";
import Footer from "../components/Footer.astro";
---

<Base>
  <Navbar />
  <main>
    <Hero />
    <UspCards />
    <Services />
    <About />
    <Reviews />
    <ContactForm />
    <Hours />
    <Location />
  </main>
  <Footer />
</Base>
```

Key changes from original:
- Added `UspCards` import and placed after Hero
- Added `ContactForm` import and placed after Reviews
- Moved `Reviews` before `ContactForm`, `Hours`, and `Location`
- Removed `Reviews` from its old position (was after Location)

- [ ] **Step 2: Verify the full page renders correctly**

Run: Check http://localhost:4321
Expected section order from top to bottom:
1. Navbar (fixed)
2. Hero (dark bg, new headline, wider photo)
3. USP Cards (4 cards, white bg)
4. Especialidades (3 featured cards, neutral-50 bg)
5. Servicios (8 service cards, white bg)
6. Nosotros (Paula's bio, neutral-50 bg)
7. Reseñas (reviews with quote icons, white bg)
8. Contacto (form on neutral-100 bg)
9. Horarios (schedule table, white bg)
10. Ubicación (map, neutral-50 bg)
11. Footer (dark bg)

Verify:
- "Contacto" nav link scrolls to the form section
- Urgency escape: select "Urgencia" in the dropdown → form fields hide, WhatsApp button appears
- All other nav links still work

- [ ] **Step 3: Commit**

```bash
git add landing/src/pages/index.astro
git commit -m "feat: wire up redesigned landing — USP cards, contact form, reordered sections"
```

---

## Task 9: Final visual check and cleanup commit

- [ ] **Step 1: Full-page visual review**

Open http://localhost:4321 and check:
- [ ] Hero renders correctly at desktop (1440px) and mobile (375px)
- [ ] USP cards show 4-column on desktop, 2 on tablet, 1 on mobile
- [ ] Contact form fields are properly aligned in 2-col layout on desktop
- [ ] Urgency escape hides form fields and shows WhatsApp CTA
- [ ] Reviews have quote icons and Google link
- [ ] Section backgrounds alternate correctly
- [ ] All nav links scroll to correct sections
- [ ] Chat widget (bottom-right) still works
- [ ] No console errors

- [ ] **Step 2: Fix any visual issues found**

Address any spacing, alignment, or rendering issues.

- [ ] **Step 3: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: visual polish for landing redesign v2"
```
