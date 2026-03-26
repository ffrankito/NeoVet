# Assets de Paula — Guía de organización

Dejá los archivos de la entrevista con Paula en estas carpetas:

## Estructura

```
src/assets/
├── images/
│   ├── hero/           ← Foto principal para la sección Hero (1920×1080 ideal)
│   ├── team/           ← Foto de Paula, del equipo
│   ├── clinic/         ← Exterior, interior, consultorios
│   └── pets/           ← Fotos de mascotas (galería, decorativas)
├── logo/               ← Logo de NeoVet (SVG preferido, PNG como backup)
└── README.md           ← Este archivo
```

## Branding (va a `public/`)

Si Paula entrega logo, regeneramos favicons y OG images:
- **Logo SVG** → `src/assets/logo/neovet-logo.svg`
- **Logo PNG** → `src/assets/logo/neovet-logo.png`

Luego se ejecuta:
```bash
python ~/.claude/skills/web-asset-generator/scripts/generate_favicons.py src/assets/logo/neovet-logo.png public/ all --validate
python ~/.claude/skills/web-asset-generator/scripts/generate_og_images.py public/ --image src/assets/logo/neovet-logo.png --text "NeoVet — Centro Veterinario" --validate
```

## Texto confirmado

El texto confirmado de la entrevista va directamente editado en los componentes `.astro`.
Cada placeholder en el código tiene un comentario `<!-- PLACEHOLDER: ... -->` que indica qué dato reemplazar.

## Checklist de referencia

Ver `docs/paula-interview-checklist.md` para la lista completa de datos a recolectar.
