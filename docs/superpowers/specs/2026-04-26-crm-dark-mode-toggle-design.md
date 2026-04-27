# CRM dark/light mode toggle — design

**Date:** 2026-04-26
**Scope:** `crm/` only
**Owner:** Tomás

## Context

The CRM is a Next.js 16 + Tailwind 4 + shadcn/ui app used daily by ~9 clinic staff (admin, owner, vet, groomer). Tailwind is configured for the `dark` class strategy and `crm/src/app/globals.css` already defines a `.dark` block with full color-token overrides (background, foreground, primary, accent, etc.). No theme switcher is currently wired — the dark tokens have never been exposed to users.

Goal: ship a per-browser dark/light toggle visible inside the user account menu on desktop and inside the sidebar drawer on mobile.

## Decisions

| Question | Decision | Rationale |
|---|---|---|
| Persistence | `localStorage`, per browser | Simpler. No DB migration. Owner accepted that shared workstations share a theme. |
| Default theme | `system` (follow OS) | Zero-cost via `next-themes`. Most clinic Windows desktops are light, so behavior converges to light in practice. |
| Toggle UX | Binary cycle (light ↔ dark) | A 3-state cycle (light / dark / system) is more granular than needed. Once the user clicks once, the choice locks to explicit light or dark and persists. |
| Placement | Inside `UserMenu` dropdown (desktop) + above logout in sidebar drawer (mobile) | Owner picked. The Topbar is hidden on mobile (`lg:flex`), so we mirror the toggle in the sidebar drawer to keep parity across breakpoints. |
| Provider scope | Root layout (`crm/src/app/layout.tsx`) | So the login page also respects the saved theme — otherwise users get a flash of light at every login. |

## Architecture

Use [`next-themes`](https://github.com/pacocoursey/next-themes) (~3kb gzipped).

```
crm/src/app/layout.tsx
└── <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    └── (existing app tree)
```

`<html>` gets `suppressHydrationWarning` so React doesn't warn when the `next-themes` inline script applies the `dark` class before hydration completes.

## Components

| File | Type | Purpose |
|---|---|---|
| `crm/src/lib/use-theme-toggle.ts` | new | Internal hook returning `{ isDark, toggle, label, Icon }` |
| `crm/src/components/admin/theme-toggle-menu-item.tsx` | new | `<DropdownMenuItem>` shell for use inside `UserMenu` |
| `crm/src/components/admin/theme-toggle-button.tsx` | new | `<Button variant="ghost" size="sm">` shell for use in the sidebar drawer |

Both shells consume the same hook so behavior stays in lockstep.

`ThemeToggleMenuItem` uses Base UI's `closeOnClick={false}` prop so the dropdown stays open after click — lets the user see the visual swap before navigating away. **Note:** the shadcn registry in this repo wraps `@base-ui/react/menu`, not Radix UI, so `onClick` is the click handler (not Radix's `onSelect`); see [crm/src/components/ui/dropdown-menu.tsx](../../../crm/src/components/ui/dropdown-menu.tsx).

## Files modified

| File | Change |
|---|---|
| `crm/package.json` | add `next-themes` dependency |
| `crm/src/app/layout.tsx` | wrap children in `<ThemeProvider>`; add `suppressHydrationWarning` to `<html>` |
| `crm/src/components/admin/user-menu.tsx` | insert `<ThemeToggleMenuItem />` between `<DropdownMenuSeparator />` and the logout `<form>` |
| `crm/src/components/admin/app-sidebar.tsx` | insert `<ThemeToggleButton />` directly above the logout `<form>` in the mobile drawer footer (around line 135) |

## Copy (Spanish AR)

| Current state | Label and `aria-label` |
|---|---|
| Light, click → dark | `Cambiar a modo oscuro` |
| Dark, click → light | `Cambiar a modo claro` |

## Acceptance criteria

1. Toggling from the `UserMenu` (desktop) flips the entire dashboard between light and dark; choice persists across reloads.
2. Toggling from the sidebar drawer (mobile) does the same.
3. First-visit theme follows the user's OS preference.
4. No hydration-mismatch warnings in the browser console.
5. The login page (`/login`) respects the saved theme on subsequent visits.
6. The dropdown menu does NOT auto-close when clicking the toggle item.
7. Icon swaps between sun and moon based on current theme.

## Risks and follow-ups

**Untested `.dark` block.** `globals.css` defines dark tokens but no one has verified every screen renders correctly in dark mode. After wiring, do a smoke pass on dashboard / clients / appointments / calendar / petshop / cash / consultations and report any:
- hard-coded `bg-white` / `text-black` / `border-gray-*` classes that bypass the tokens
- low-contrast combos in the `.dark` palette
- chart / calendar / badge primitives that don't have dark variants

Fixing those is **explicitly out of scope** for this task — they'll be tracked as a follow-up.

**Hydration mismatch.** Handled by `next-themes`'s inline `<script>` + `suppressHydrationWarning` on `<html>`. No additional work required.

## Out of scope

- Dark mode for `chatbot/` or `landing/`.
- Per-user account persistence (chose per-browser).
- Explicit 3-state light/dark/system toggle.
- Refactoring or fixing dark-mode styling bugs found during the smoke pass.
- The `frontend-design` skill is reserved for **icon-button polish only** (sun/moon swap animation, hover state) — invoked at the very end of implementation, not for the wiring.
