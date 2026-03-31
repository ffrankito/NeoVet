# Gallery Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-width auto-playing photo carousel with overlaid text, placed between the "Nosotros" and "Horarios" sections.

**Architecture:** Single `Gallery.astro` component with all 8 images imported statically for Astro WebP optimization. CSS opacity toggling for slide visibility. Bundled `<script>` (no `is:inline`) for JS logic — safe with the existing `script-src 'self'` CSP in `vercel.json`.

**Tech Stack:** Astro 6, Tailwind CSS 4, astro:assets Image, TypeScript

---

## Files

| Action | Path |
|---|---|
| Rename (x6) | `src/assets/images/pets/` + `src/assets/images/team/` — see Task 1 |
| Create | `src/components/Gallery.astro` |
| Modify | `src/pages/index.astro` |
| Modify | `.gitignore` (add `.superpowers/`) |

---

### Task 1: Rename asset files + update .gitignore

**Files:**
- Rename: `src/assets/images/pets/` (5 files)
- Rename: `src/assets/images/team/peluquería.jpeg`
- Modify: `landing/.gitignore`

- [ ] **Step 1: Rename the pet photos**

```bash
cd landing/src/assets/images/pets
mv "WhatsApp Image 2026-03-30 at 18.43.34.jpeg" pet-1.jpeg
mv "WhatsApp Image 2026-03-30 at 18.43.35.jpeg" pet-2.jpeg
mv "WhatsApp Image 2026-03-30 at 18.43.37.jpeg" pet-3.jpeg
mv "WhatsApp Image 2026-03-30 at 18.43.38.jpeg" pet-4.jpeg
mv "WhatsApp Image 2026-03-30 at 18.43.39.jpeg" pet-5.jpeg
```

The file `WhatsApp Image 2026-03-30 at 18.43.36.jpeg` is intentionally excluded — do not rename or include it.

- [ ] **Step 2: Rename the grooming photo**

```bash
mv "landing/src/assets/images/team/peluquería.jpeg" "landing/src/assets/images/team/peluqueria.jpeg"
```

Also exclude (do not rename or include):
- `src/assets/images/team/WhatsApp Image 2026-03-30 at 18.43.35.jpeg`
- `src/assets/images/team/WhatsApp Image 2026-03-30 at 18.43.36.jpeg`

- [ ] **Step 3: Add `.superpowers/` to `.gitignore`**

Open `landing/.gitignore` and add at the end:

```
# Brainstorming sessions
.superpowers/
```

- [ ] **Step 4: Verify all renamed files exist**

```bash
ls landing/src/assets/images/pets/
ls landing/src/assets/images/team/
```

Expected in `pets/`: `pet-1.jpeg pet-2.jpeg pet-3.jpeg pet-4.jpeg pet-5.jpeg` (plus the excluded `WhatsApp Image...36.jpeg`)
Expected in `team/`: `paula.jpeg paula-detalle.jpeg paula-personal.jpeg peluqueria.jpeg` (plus the two excluded WhatsApp files)

- [ ] **Step 5: Commit**

```bash
git add landing/src/assets/images/ landing/.gitignore
git commit -m "chore(landing): rename asset files, exclude spaces from filenames"
```

---

### Task 2: Create `Gallery.astro`

**Files:**
- Create: `src/components/Gallery.astro`

- [ ] **Step 1: Create the file with this exact content**

```astro
---
import { Image } from 'astro:assets';
import clinic1 from '../assets/images/clinic/1.jpeg';
import clinic2 from '../assets/images/clinic/2.jpeg';
import pet1 from '../assets/images/pets/pet-1.jpeg';
import pet2 from '../assets/images/pets/pet-2.jpeg';
import pet3 from '../assets/images/pets/pet-3.jpeg';
import pet4 from '../assets/images/pets/pet-4.jpeg';
import pet5 from '../assets/images/pets/pet-5.jpeg';
import peluqueria from '../assets/images/team/peluqueria.jpeg';

const slides = [
  { src: clinic1,   alt: "Interior de NeoVet — clínica veterinaria en Rosario", loading: "eager" as const },
  { src: clinic2,   alt: "Instalaciones de NeoVet en Rosario",                  loading: "lazy"  as const },
  { src: pet1,      alt: "",                                                     loading: "lazy"  as const },
  { src: pet2,      alt: "",                                                     loading: "lazy"  as const },
  { src: pet3,      alt: "",                                                     loading: "lazy"  as const },
  { src: pet4,      alt: "",                                                     loading: "lazy"  as const },
  { src: pet5,      alt: "",                                                     loading: "lazy"  as const },
  { src: peluqueria, alt: "Servicio de peluquería canina en NeoVet",            loading: "lazy"  as const },
];
---

<section id="galeria" class="relative h-[280px] overflow-hidden lg:h-[400px]">
  <!-- Slides -->
  {slides.map((slide, i) => (
    <div
      class:list={[
        "gallery-slide absolute inset-0",
        i === 0 ? "opacity-100" : "opacity-0",
      ]}
      data-index={i}
    >
      <Image
        src={slide.src}
        alt={slide.alt}
        class="h-full w-full object-cover"
        width={1920}
        height={600}
        loading={slide.loading}
      />
    </div>
  ))}

  <!-- Gradient overlay -->
  <div
    class="pointer-events-none absolute inset-0"
    style="background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 60%, transparent 100%);"
  ></div>

  <!-- Text — bottom-left -->
  <div class="absolute bottom-6 left-6 z-10 lg:bottom-10 lg:left-16">
    <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-primary-300">
      Nuestra clínica
    </p>
    <h2 class="max-w-xs text-xl font-bold leading-snug text-white lg:max-w-md lg:text-3xl">
      Cuidamos a tu mascota como parte de nuestra familia
    </h2>
  </div>

  <!-- Controls — bottom-right -->
  <div class="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-3 lg:bottom-10 lg:right-8">
    <!-- Arrows -->
    <div class="flex gap-2">
      <button
        id="gallery-prev"
        type="button"
        aria-label="Foto anterior"
        class="flex h-9 w-9 items-center justify-center rounded-full border border-white/50 text-white transition-colors hover:bg-white/20"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>
      <button
        id="gallery-next"
        type="button"
        aria-label="Siguiente foto"
        class="flex h-9 w-9 items-center justify-center rounded-full border border-white/50 text-white transition-colors hover:bg-white/20"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
    <!-- Progress bars -->
    <div class="flex gap-1">
      {slides.map((_, i) => (
        <div class="h-1 w-7 overflow-hidden rounded-full bg-white/30">
          <div
            class:list={["gallery-bar h-full rounded-full bg-white", i === 0 ? "gallery-bar--active" : ""]}
            style="width: 0%"
            data-index={i}
          ></div>
        </div>
      ))}
    </div>
  </div>
</section>

<style>
  .gallery-slide {
    transition: opacity 0.6s ease;
  }

  .gallery-bar--active {
    animation: fill-bar 4s linear forwards;
  }

  @keyframes fill-bar {
    from { width: 0%; }
    to   { width: 100%; }
  }
</style>

<script>
  const INTERVAL = 4000;

  const section  = document.querySelector<HTMLElement>('#galeria')!;
  const slides   = Array.from(document.querySelectorAll<HTMLElement>('.gallery-slide'));
  const bars     = Array.from(document.querySelectorAll<HTMLElement>('.gallery-bar'));
  const prevBtn  = document.getElementById('gallery-prev')!;
  const nextBtn  = document.getElementById('gallery-next')!;
  const reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let current = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  function activateBar(index: number) {
    const bar = bars[index];
    if (reduced) {
      bar.style.width = '100%';
      return;
    }
    // Force reflow to restart animation when returning to a slide
    bar.classList.remove('gallery-bar--active');
    void bar.offsetWidth;
    bar.classList.add('gallery-bar--active');
  }

  function goTo(next: number) {
    // Deactivate current
    slides[current].classList.replace('opacity-100', 'opacity-0');
    bars[current].classList.remove('gallery-bar--active');
    bars[current].style.width = '0%';

    current = ((next % slides.length) + slides.length) % slides.length;

    // Activate next
    slides[current].classList.replace('opacity-0', 'opacity-100');
    activateBar(current);
  }

  function startAuto() {
    if (reduced) return;
    timer = setInterval(() => goTo(current + 1), INTERVAL);
  }

  function stopAuto() {
    if (timer !== null) { clearInterval(timer); timer = null; }
  }

  prevBtn.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
  nextBtn.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });
  section.addEventListener('mouseenter', stopAuto);
  section.addEventListener('mouseleave', startAuto);

  // Init first slide
  if (reduced) {
    slides.forEach(s => { s.style.transition = 'none'; });
  }
  activateBar(0);
  startAuto();
</script>
```

- [ ] **Step 2: Verify the build passes**

```bash
cd landing && npm run build
```

Expected: build completes, 8 images optimized to WebP, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add landing/src/components/Gallery.astro
git commit -m "feat(landing): add photo gallery carousel section"
```

---

### Task 3: Wire Gallery into `index.astro`

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Add the import after `About`**

Current line 6:
```astro
import About from "../components/About.astro";
```

Change to:
```astro
import About from "../components/About.astro";
import Gallery from "../components/Gallery.astro";
```

- [ ] **Step 2: Add `<Gallery />` between `<About />` and `<Hours />`**

Current:
```astro
    <About />
    <Hours />
```

Change to:
```astro
    <About />
    <Gallery />
    <Hours />
```

- [ ] **Step 3: Build and verify**

```bash
cd landing && npm run build
```

Expected: 1 page built, 8 gallery images in the optimized image output, no errors.

- [ ] **Step 4: Smoke-test in the browser**

```bash
cd landing && npm run preview
```

Open http://localhost:4321. Verify:
- Gallery section appears between "Nosotros" and "Horarios"
- Photos rotate every 4 seconds
- Progress bars animate
- Prev/next arrows work
- Text overlay visible bottom-left

- [ ] **Step 5: Commit**

```bash
git add landing/src/pages/index.astro
git commit -m "feat(landing): wire Gallery carousel into page"
```
