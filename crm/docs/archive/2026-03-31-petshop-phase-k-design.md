# Design Spec — Phase K: Pet Shop (Inventory & Sales)

| Field | Value |
|---|---|
| **Date** | 2026-03-31 |
| **Status** | Approved |
| **Author** | Tomás Pinolini |
| **Target doc** | `crm/docs/v1/development-plan.md` — Fase K |

---

## Overview

Add a Pet Shop module to the NeoVet CRM covering full product inventory management, supplier tracking, stock entry registration, and point-of-sale style sales recording. ~415 products will be imported from an existing GVet price list CSV. Providers will be imported from GVet's supplier export.

This module is v1-only: no public API, no WhatsApp notifications, no automatic reorder. Schema is designed to support v2/v3 enhancements without restructuring.

---

## Database Schema

### `products` (`prd_`)

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | text | No | Prefixed ID (`prd_`) |
| `name` | text | No | Product name |
| `category` | enum | No | `medicamento \| vacuna \| insumo_clinico \| higiene \| accesorio \| juguete \| alimento \| transporte \| otro` |
| `current_stock` | numeric | No | Current stock quantity (auto-updated) |
| `min_stock` | numeric | No | Low stock threshold (default 0) |
| `cost_price` | numeric | Yes | Last known cost price (updated on stock entry) |
| `sell_price` | numeric | No | Sale price (pre-tax) |
| `tax_rate` | integer | No | IVA rate: 0 or 21 |
| `is_active` | boolean | No | Soft-disable without deleting |
| `created_at` | timestamptz | No | |
| `updated_at` | timestamptz | No | |

### `providers` (`prv_`)

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | text | No | Prefixed ID (`prv_`) |
| `name` | text | No | Supplier name |
| `address` | text | Yes | |
| `phone` | text | Yes | |
| `email` | text | Yes | |
| `cuit` | text | Yes | Argentine tax ID — required for Phase D fiscal linkage |
| `notes` | text | Yes | Free-text: payment terms, contact preferences, etc. |
| `is_active` | boolean | No | Soft-disable |
| `created_at` | timestamptz | No | |
| `updated_at` | timestamptz | No | |

### `stock_entries` (`ste_`)

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | text | No | Prefixed ID (`ste_`) |
| `product_id` | text | No | FK → products (cascade) |
| `provider_id` | text | Yes | FK → providers (set null) |
| `quantity` | numeric | No | Units received |
| `cost_price` | numeric | Yes | Cost price at time of entry |
| `notes` | text | Yes | |
| `created_by_id` | text | No | FK → staff |
| `created_at` | timestamptz | No | |

**Side effects on create:**
- `products.current_stock += quantity`
- `products.cost_price = cost_price` (if provided)

### `sales` (`sal_`)

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | text | No | Prefixed ID (`sal_`) |
| `patient_id` | text | Yes | FK → patients (set null) — optional traceability |
| `sold_by_id` | text | No | FK → staff — who made the sale (business logic) |
| `created_by_id` | text | No | FK → staff — who created the record (audit trail) |
| `payment_method` | text | No | `efectivo \| transferencia \| debito \| credito \| mercadopago` |
| `payment_id` | text | Yes | FK → payments (nullable — Phase D hook) |
| `notes` | text | Yes | |
| `created_at` | timestamptz | No | |
| `updated_at` | timestamptz | No | |

### `sale_items` (`sli_`)

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | text | No | Prefixed ID (`sli_`) |
| `sale_id` | text | No | FK → sales (cascade) |
| `product_id` | text | No | FK → products (RESTRICT — product cannot be deleted if sales reference it) |
| `quantity` | numeric | No | |
| `unit_price` | numeric | No | Snapshot of sell_price at time of sale |
| `tax_rate` | integer | No | Snapshot of tax_rate at time of sale |

**Side effects on sale create:**
- `products.current_stock -= quantity` for each item

---

## Navigation

**Sidebar additions:**

```
Ventas          → /dashboard/sales          (direct link)
Inventario ▾                                (dropdown)
  Productos     → /dashboard/inventory/products
  Proveedores   → /dashboard/inventory/providers
  Entradas      → /dashboard/inventory/stock-entries
```

**Full route list:**

| Route | Purpose |
|---|---|
| `/dashboard/sales` | Sales list + "Nueva venta" button |
| `/dashboard/sales/new` | Cart-style sale form |
| `/dashboard/sales/[id]` | Sale detail |
| `/dashboard/inventory/products` | Product list with stock badges |
| `/dashboard/inventory/products/new` | Create product |
| `/dashboard/inventory/products/[id]/edit` | Edit product |
| `/dashboard/inventory/providers` | Provider list |
| `/dashboard/inventory/providers/new` | Create provider |
| `/dashboard/inventory/providers/[id]/edit` | Edit provider |
| `/dashboard/inventory/stock-entries` | Stock entry history |
| `/dashboard/inventory/stock-entries/new` | Register incoming stock (Entradas de stock) |

---

## Role Access

| Action | Admin | Vet | Groomer |
|---|---|---|---|
| View products & stock | ✅ | ✅ | ✅ |
| Register a sale | ✅ | ✅ | ✅ |
| Create/edit products | ✅ | ❌ | ❌ |
| Register stock entry | ✅ | ❌ | ❌ |
| Manage providers | ✅ | ❌ | ❌ |

---

## Business Rules

- `current_stock` is always derived from stock entries minus sales — never edited manually
- `min_stock` default is 0; when `current_stock <= min_stock`, product shows a red badge in the list
- `unit_price` and `tax_rate` on `sale_items` are snapshots — price changes don't affect historical sales
- `cost_price` on `products` reflects the most recent stock entry cost — enables future margin calculation
- `payment_id` is nullable in v1 — Phase D will link sales to ARCA comprobantes without schema changes
- A sale with `payment_method = mercadopago` will require a comprobante in Phase D (same rule as consultations)
- Products with associated `sale_items` cannot be deleted (RESTRICT) — use `is_active = false` to retire a product
- `sale_items` are append-only — no edit path exists once a sale is created
- `tax_rate` allowed values in v1: `0` and `21` only (Argentine IVA standard rates). Phase D may require expanding this to include 2.5%, 5%, 10.5%, 27%

---

## Import Scripts

### `scripts/import-products.ts`
- Source: `scripts/data/lista_precios 2026-04-01.csv`
- Fields: `name`, `current_stock` (Cantidad), `sell_price` (Precio de venta), `tax_rate` (Impuesto)
- Category auto-assigned by keyword matching on name:
  - vacuna → `vacuna`
  - shampoo, cepillo, rasqueta, cardina → `higiene`
  - collar, correa, arnes, cinturon → `accesorio`
  - pelota, juguete, raton, rascador, mordillo → `juguete`
  - pouch, alimento, snack, liver, hueso, bombon → `alimento`
  - transportadora, cucha, moises, mochila → `transporte`
  - aguja, cateter, jeringa, gasa, guante, suero → `insumo_clinico`
  - remaining → `medicamento` or `otro` by presence of known drug names

### `scripts/import-providers.ts`
- Source: GVet provider CSV export (same format as client/patient imports)
- Fields: `name`, `address`, `phone`, `email`, `cuit` (if present in GVet export — otherwise CUITs must be filled in manually before Phase D fiscal linkage)

---

## Sub-phase Summary

| Sub-phase | Deliverable |
|---|---|
| K.1 | Schema + migrations (5 tables) |
| K.2 | Providers — CRUD + import script |
| K.3 | Products — CRUD + import script |
| K.4 | Stock entries — form linked to provider, auto-updates stock |
| K.5 | Sales — cart form with dynamic items, patient link, staff auto-assign, history |

---

## Out of Scope (v1)

- Automatic reorder / purchase orders (v2)
- WhatsApp notifications for low stock (v2)
- Margin / profitability reports (v3)
- Barcode scanning (v3)
- Multi-location stock (v3)
