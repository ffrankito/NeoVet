# Phase K — Pet Shop: Inventario y Ventas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full pet shop module to the NeoVet CRM — product inventory, provider management, stock entries, and cart-style sales — with automatic stock updates and ~415 products imported from a GVet price list CSV.

**Architecture:** Five new DB tables (`products`, `providers`, `stock_entries`, `sales`, `sale_items`) follow the existing one-file-per-table Drizzle schema pattern. Server actions handle all mutations; stock changes (increment on entry, decrement on sale) happen atomically inside the same action that creates the record. The sidebar gains a new "Ventas" direct link and an "Inventario" collapsible dropdown.

**Tech Stack:** Next.js 16 App Router, TypeScript, Drizzle ORM, Supabase PostgreSQL, shadcn/ui, Zod, `npx tsx` for import scripts.

---

## File Map

```
src/db/schema/
  products.ts          ← NEW
  providers.ts         ← NEW
  stock_entries.ts     ← NEW
  sales.ts             ← NEW (also defines sale_items)
  index.ts             ← MODIFY (add 4 new exports)

src/lib/
  ids.ts               ← MODIFY (add 5 new ID generators)

src/components/admin/
  app-sidebar.tsx      ← MODIFY (add Ventas + Inventario dropdown)
  inventory/
    product-form.tsx   ← NEW
    product-table.tsx  ← NEW
    provider-form.tsx  ← NEW
    provider-table.tsx ← NEW
    stock-entry-form.tsx ← NEW
    stock-entry-table.tsx ← NEW
  sales/
    sale-cart-form.tsx ← NEW
    sale-table.tsx     ← NEW
    sale-detail.tsx    ← NEW

src/app/dashboard/
  inventory/
    products/
      page.tsx         ← NEW
      new/page.tsx     ← NEW
      [id]/edit/page.tsx ← NEW
    providers/
      page.tsx         ← NEW
      new/page.tsx     ← NEW
      [id]/edit/page.tsx ← NEW
    stock-entries/
      page.tsx         ← NEW
      new/page.tsx     ← NEW
    actions/
      product-actions.ts  ← NEW
      provider-actions.ts ← NEW
      stock-entry-actions.ts ← NEW
  sales/
    page.tsx           ← NEW
    new/page.tsx       ← NEW
    [id]/page.tsx      ← NEW
    actions.ts         ← NEW

scripts/
  import-products.ts   ← NEW
  import-providers.ts  ← NEW
```

---

## Task 1: Schema — 5 tables + IDs + migration

**Files:**
- Create: `src/db/schema/products.ts`
- Create: `src/db/schema/providers.ts`
- Create: `src/db/schema/stock_entries.ts`
- Create: `src/db/schema/sales.ts`
- Modify: `src/db/schema/index.ts`
- Modify: `src/lib/ids.ts`

- [ ] **Step 1.1: Create `src/db/schema/products.ts`**

```ts
import { boolean, integer, numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const productCategoryEnum = pgEnum("product_category", [
  "medicamento",
  "vacuna",
  "insumo_clinico",
  "higiene",
  "accesorio",
  "juguete",
  "alimento",
  "transporte",
  "otro",
]);

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: productCategoryEnum("category").notNull().default("otro"),
  currentStock: numeric("current_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  minStock: numeric("min_stock", { precision: 10, scale: 2 }).notNull().default("0"),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
  sellPrice: numeric("sell_price", { precision: 10, scale: 2 }).notNull().default("0"),
  taxRate: integer("tax_rate").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

- [ ] **Step 1.2: Create `src/db/schema/providers.ts`**

```ts
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const providers = pgTable("providers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  cuit: text("cuit"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
```

- [ ] **Step 1.3: Create `src/db/schema/stock_entries.ts`**

```ts
import { numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { products } from "./products";
import { providers } from "./providers";
import { staff } from "./staff";

export const stockEntries = pgTable("stock_entries", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  providerId: text("provider_id").references(() => providers.id, { onDelete: "set null" }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => staff.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type StockEntry = typeof stockEntries.$inferSelect;
export type NewStockEntry = typeof stockEntries.$inferInsert;
```

- [ ] **Step 1.4: Create `src/db/schema/sales.ts`** (also defines `sale_items`)

```ts
import { integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { patients } from "./patients";
import { staff } from "./staff";
import { products } from "./products";

export const sales = pgTable("sales", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").references(() => patients.id, { onDelete: "set null" }),
  soldById: text("sold_by_id")
    .notNull()
    .references(() => staff.id),
  createdById: text("created_by_id")
    .notNull()
    .references(() => staff.id),
  paymentMethod: text("payment_method").notNull(),
  paymentId: text("payment_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const saleItems = pgTable("sale_items", {
  id: text("id").primaryKey(),
  saleId: text("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  taxRate: integer("tax_rate").notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;
```

- [ ] **Step 1.5: Update `src/db/schema/index.ts`** — add 4 lines at the bottom:

```ts
export * from "./products";
export * from "./providers";
export * from "./stock_entries";
export * from "./sales";
```

- [ ] **Step 1.6: Update `src/lib/ids.ts`** — add 5 generators at the bottom:

```ts
export const productId  = () => createId("prd");
export const providerId = () => createId("prv");
export const stockEntryId = () => createId("ste");
export const saleId     = () => createId("sal");
export const saleItemId = () => createId("sli");
```

- [ ] **Step 1.7: Generate and apply migration**

```bash
cd crm
npm run db:generate
npm run db:migrate
```

Expected: new migration file in `supabase/migrations/` and 5 new tables visible in Supabase → Table Editor.

- [ ] **Step 1.8: Commit**

```bash
rtk git add src/db/schema/products.ts src/db/schema/providers.ts src/db/schema/stock_entries.ts src/db/schema/sales.ts src/db/schema/index.ts src/lib/ids.ts supabase/migrations/
rtk git commit -m "feat(petshop): add schema for products, providers, stock_entries, sales, sale_items"
```

---

## Task 2: Sidebar navigation

**Files:**
- Modify: `src/components/admin/app-sidebar.tsx`

The current sidebar only renders flat `NavItem` links. We need to add a collapsible group for "Inventario" while keeping "Ventas" as a flat item.

- [ ] **Step 2.1: Rewrite `src/components/admin/app-sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";
import type { StaffRole } from "@/db/schema";
import { CalendarDays, ChevronDown, ChevronRight } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: string | React.ReactNode;
  roles?: string[];
};

type NavGroup = {
  label: string;
  icon: string | React.ReactNode;
  roles?: string[];
  children: NavItem[];
};

const ALL_NAV_ITEMS: (NavItem | NavGroup)[] = [
  { href: "/dashboard",                    label: "Inicio",        icon: "🏠", roles: ["admin", "vet", "groomer"] },
  { href: "/dashboard/clients",            label: "Clientes",      icon: "👤", roles: ["admin", "vet"] },
  { href: "/dashboard/appointments",       label: "Turnos",        icon: "📅", roles: ["admin", "vet", "groomer"] },
  { href: "/dashboard/calendar",           label: "Agenda",        icon: <CalendarDays className="h-4 w-4" />, roles: ["admin", "vet", "groomer"] },
  { href: "/dashboard/sales",              label: "Ventas",        icon: "🛒", roles: ["admin", "vet", "groomer"] },
  {
    label: "Inventario",
    icon: "📦",
    roles: ["admin"],
    children: [
      { href: "/dashboard/inventory/products",      label: "Productos",   icon: "💊" },
      { href: "/dashboard/inventory/providers",     label: "Proveedores", icon: "🏭" },
      { href: "/dashboard/inventory/stock-entries", label: "Entradas",    icon: "📥" },
    ],
  },
  { href: "/dashboard/settings/services", label: "Servicios",     icon: "🩺", roles: ["admin"] },
  { href: "/dashboard/settings",           label: "Configuración", icon: "⚙️", roles: ["admin"] },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "children" in item;
}

export function AppSidebar({ user, role }: { user: User; role: StaffRole | null }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(pathname.startsWith("/dashboard/inventory") ? ["Inventario"] : [])
  );

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const visibleItems = ALL_NAV_ITEMS.filter(
    (item) => !item.roles || !role || item.roles.includes(role)
  );

  return (
    <aside className="flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          NeoVet CRM
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {visibleItems.map((item) => {
          if (isGroup(item)) {
            const isOpen = openGroups.has(item.label);
            const isGroupActive = item.children.some((c) => pathname.startsWith(c.href));
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isGroupActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center text-base">
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {isOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const isActive = pathname.startsWith(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <span className="flex h-5 w-5 items-center justify-center text-base">
                            {child.icon}
                          </span>
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center text-base">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm" className="mt-2 w-full justify-start">
            Cerrar sesión
          </Button>
        </form>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2.2: Verify in browser**

Start dev server (`npm run dev` inside `crm/`). Check:
- "Ventas" appears in sidebar for all roles
- "Inventario" appears only for admin, expands on click, auto-opens when on `/dashboard/inventory/*`

- [ ] **Step 2.3: Commit**

```bash
rtk git add src/components/admin/app-sidebar.tsx
rtk git commit -m "feat(petshop): add Ventas link and Inventario dropdown to sidebar"
```

---

## Task 3: Providers CRUD

**Files:**
- Create: `src/app/dashboard/inventory/providers/actions.ts`
- Create: `src/components/admin/inventory/provider-form.tsx`
- Create: `src/components/admin/inventory/provider-table.tsx`
- Create: `src/app/dashboard/inventory/providers/page.tsx`
- Create: `src/app/dashboard/inventory/providers/new/page.tsx`
- Create: `src/app/dashboard/inventory/providers/[id]/edit/page.tsx`

- [ ] **Step 3.1: Create `src/app/dashboard/inventory/providers/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { providers } from "@/db/schema";
import { providerId } from "@/lib/ids";
import { hasRole } from "@/lib/auth";
import { eq, ilike, or, desc } from "drizzle-orm";
import { z } from "zod";

const providerSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("El email no es válido.").optional().or(z.literal("")),
  cuit: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function getProviders(opts?: { search?: string }) {
  const condition = opts?.search
    ? or(
        ilike(providers.name, `%${opts.search}%`),
        ilike(providers.phone, `%${opts.search}%`),
        ilike(providers.email, `%${opts.search}%`)
      )
    : undefined;

  return db
    .select()
    .from(providers)
    .where(condition)
    .orderBy(desc(providers.createdAt));
}

export async function getProvider(id: string) {
  const [provider] = await db.select().from(providers).where(eq(providers.id, id)).limit(1);
  return provider ?? null;
}

export async function createProvider(formData: FormData) {
  if (!(await hasRole("admin"))) return { error: "Sin permiso." };

  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    address: (formData.get("address") as string)?.trim() ?? "",
    phone: (formData.get("phone") as string)?.trim() ?? "",
    email: (formData.get("email") as string)?.trim() ?? "",
    cuit: (formData.get("cuit") as string)?.trim() ?? "",
    notes: (formData.get("notes") as string)?.trim() ?? "",
  };

  const parsed = providerSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const id = providerId();
  await db.insert(providers).values({
    id,
    name: parsed.data.name,
    address: parsed.data.address || null,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    cuit: parsed.data.cuit || null,
    notes: parsed.data.notes || null,
  });

  revalidatePath("/dashboard/inventory/providers");
  redirect("/dashboard/inventory/providers");
}

export async function updateProvider(id: string, formData: FormData) {
  if (!(await hasRole("admin"))) return { error: "Sin permiso." };

  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    address: (formData.get("address") as string)?.trim() ?? "",
    phone: (formData.get("phone") as string)?.trim() ?? "",
    email: (formData.get("email") as string)?.trim() ?? "",
    cuit: (formData.get("cuit") as string)?.trim() ?? "",
    notes: (formData.get("notes") as string)?.trim() ?? "",
  };

  const parsed = providerSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await db
    .update(providers)
    .set({
      name: parsed.data.name,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      cuit: parsed.data.cuit || null,
      notes: parsed.data.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(providers.id, id));

  revalidatePath("/dashboard/inventory/providers");
  redirect("/dashboard/inventory/providers");
}

export async function deactivateProvider(id: string) {
  if (!(await hasRole("admin"))) return { error: "Sin permiso." };
  await db.update(providers).set({ isActive: false, updatedAt: new Date() }).where(eq(providers.id, id));
  revalidatePath("/dashboard/inventory/providers");
}
```

- [ ] **Step 3.2: Create `src/components/admin/inventory/provider-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProvider, updateProvider } from "@/app/dashboard/inventory/providers/actions";
import type { Provider } from "@/db/schema";

type ActionResult = { errors?: Record<string, string[]> } | { error?: string } | undefined;

export function ProviderForm({ provider }: { provider?: Provider }) {
  const isEdit = !!provider;
  const action = isEdit
    ? async (_prev: ActionResult, fd: FormData) => updateProvider(provider!.id, fd)
    : async (_prev: ActionResult, fd: FormData) => createProvider(fd);

  const [result, dispatch, isPending] = useActionState(action, undefined);
  const errors = (result && "errors" in result ? result.errors : {}) ?? {};
  const globalError = result && "error" in result ? result.error : null;

  return (
    <form action={dispatch} className="max-w-lg space-y-6">
      {globalError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" name="name" defaultValue={provider?.name ?? ""} />
        {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" defaultValue={provider?.address ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={provider?.phone ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={provider?.email ?? ""} />
        {errors.email && <p className="text-sm text-destructive">{errors.email[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cuit">CUIT</Label>
        <Input id="cuit" name="cuit" defaultValue={provider?.cuit ?? ""} placeholder="20-12345678-9" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" defaultValue={provider?.notes ?? ""} rows={3} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear proveedor"}
        </Button>
        <a
          href="/dashboard/inventory/providers"
          className={buttonVariants({ variant: "outline" })}
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
```

- [ ] **Step 3.3: Create `src/components/admin/inventory/provider-table.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deactivateProvider } from "@/app/dashboard/inventory/providers/actions";
import type { Provider } from "@/db/schema";

export function ProviderTable({ data }: { data: Provider[] }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">No hay proveedores registrados.</p>;
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Nombre</th>
            <th className="px-4 py-3 text-left font-medium">Teléfono</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">CUIT</th>
            <th className="px-4 py-3 text-left font-medium">Estado</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{p.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.phone ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.email ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.cuit ?? "—"}</td>
              <td className="px-4 py-3">
                {p.isActive ? (
                  <span className="text-green-600 text-xs font-medium">Activo</span>
                ) : (
                  <span className="text-muted-foreground text-xs">Inactivo</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 justify-end">
                  <Link href={`/dashboard/inventory/providers/${p.id}/edit`} className="text-xs text-blue-600 hover:underline">
                    Editar
                  </Link>
                  {p.isActive && (
                    <form action={deactivateProvider.bind(null, p.id)}>
                      <Button variant="ghost" size="sm" className="h-auto px-1 py-0.5 text-xs text-destructive">
                        Desactivar
                      </Button>
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3.4: Create list page `src/app/dashboard/inventory/providers/page.tsx`**

```tsx
import Link from "next/link";
import { getProviders } from "./actions";
import { ProviderTable } from "@/components/admin/inventory/provider-table";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function ProvidersPage({ searchParams }: Props) {
  const { search } = await searchParams;
  const data = await getProviders({ search });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">Proveedores de productos del pet shop</p>
        </div>
        <Link href="/dashboard/inventory/providers/new" className={buttonVariants()}>
          + Nuevo proveedor
        </Link>
      </div>
      <ProviderTable data={data} />
    </div>
  );
}
```

- [ ] **Step 3.5: Create `src/app/dashboard/inventory/providers/new/page.tsx`**

```tsx
import { ProviderForm } from "@/components/admin/inventory/provider-form";

export default function NewProviderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo proveedor</h1>
        <p className="text-muted-foreground">Completá los datos del proveedor</p>
      </div>
      <ProviderForm />
    </div>
  );
}
```

- [ ] **Step 3.6: Create `src/app/dashboard/inventory/providers/[id]/edit/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getProvider } from "../../actions";
import { ProviderForm } from "@/components/admin/inventory/provider-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProviderPage({ params }: Props) {
  const { id } = await params;
  const provider = await getProvider(id);
  if (!provider) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar proveedor</h1>
        <p className="text-muted-foreground">{provider.name}</p>
      </div>
      <ProviderForm provider={provider} />
    </div>
  );
}
```

- [ ] **Step 3.7: Verify in browser** — navigate to `/dashboard/inventory/providers`, create and edit a provider.

- [ ] **Step 3.8: Commit**

```bash
rtk git add src/app/dashboard/inventory/providers/ src/components/admin/inventory/provider-form.tsx src/components/admin/inventory/provider-table.tsx
rtk git commit -m "feat(petshop): providers CRUD"
```

---

## Task 4: Products CRUD

**Files:**
- Create: `src/app/dashboard/inventory/products/actions.ts`
- Create: `src/components/admin/inventory/product-form.tsx`
- Create: `src/components/admin/inventory/product-table.tsx`
- Create: `src/app/dashboard/inventory/products/page.tsx`
- Create: `src/app/dashboard/inventory/products/new/page.tsx`
- Create: `src/app/dashboard/inventory/products/[id]/edit/page.tsx`

- [ ] **Step 4.1: Create `src/app/dashboard/inventory/products/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { products, productCategoryEnum } from "@/db/schema";
import { productId } from "@/lib/ids";
import { hasRole } from "@/lib/auth";
import { eq, ilike, desc } from "drizzle-orm";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  category: z.enum(productCategoryEnum.enumValues),
  sellPrice: z.string().min(1, "El precio de venta es obligatorio."),
  taxRate: z.coerce.number().refine((v) => v === 0 || v === 21, "IVA debe ser 0 o 21."),
  minStock: z.string().optional().or(z.literal("")),
  costPrice: z.string().optional().or(z.literal("")),
});

export async function getProducts(opts?: { search?: string; includeInactive?: boolean }) {
  const rows = await db.select().from(products).orderBy(desc(products.updatedAt));

  return rows.filter((p) => {
    if (!opts?.includeInactive && !p.isActive) return false;
    if (opts?.search) {
      const q = opts.search.toLowerCase();
      return p.name.toLowerCase().includes(q);
    }
    return true;
  });
}

export async function getProduct(id: string) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return product ?? null;
}

export async function getActiveProducts() {
  return db.select().from(products).where(eq(products.isActive, true)).orderBy(products.name);
}

export async function createProduct(formData: FormData) {
  if (!(await hasRole("admin"))) return { error: "Sin permiso." };

  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    category: (formData.get("category") as string) ?? "otro",
    sellPrice: (formData.get("sellPrice") as string)?.trim() ?? "",
    taxRate: Number(formData.get("taxRate") ?? 0),
    minStock: (formData.get("minStock") as string)?.trim() ?? "",
    costPrice: (formData.get("costPrice") as string)?.trim() ?? "",
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const id = productId();
  await db.insert(products).values({
    id,
    name: parsed.data.name,
    category: parsed.data.category,
    sellPrice: parsed.data.sellPrice,
    taxRate: parsed.data.taxRate,
    minStock: parsed.data.minStock || "0",
    costPrice: parsed.data.costPrice || null,
  });

  revalidatePath("/dashboard/inventory/products");
  redirect("/dashboard/inventory/products");
}

export async function updateProduct(id: string, formData: FormData) {
  if (!(await hasRole("admin"))) return { error: "Sin permiso." };

  const raw = {
    name: (formData.get("name") as string)?.trim() ?? "",
    category: (formData.get("category") as string) ?? "otro",
    sellPrice: (formData.get("sellPrice") as string)?.trim() ?? "",
    taxRate: Number(formData.get("taxRate") ?? 0),
    minStock: (formData.get("minStock") as string)?.trim() ?? "",
    costPrice: (formData.get("costPrice") as string)?.trim() ?? "",
  };

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await db
    .update(products)
    .set({
      name: parsed.data.name,
      category: parsed.data.category,
      sellPrice: parsed.data.sellPrice,
      taxRate: parsed.data.taxRate,
      minStock: parsed.data.minStock || "0",
      costPrice: parsed.data.costPrice || null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath("/dashboard/inventory/products");
  redirect("/dashboard/inventory/products");
}

export async function deactivateProduct(id: string) {
  if (!(await hasRole("admin"))) return { error: "Sin permiso." };
  await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id));
  revalidatePath("/dashboard/inventory/products");
}
```

- [ ] **Step 4.2: Create `src/components/admin/inventory/product-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct, updateProduct } from "@/app/dashboard/inventory/products/actions";
import type { Product } from "@/db/schema";

const CATEGORY_LABELS: Record<string, string> = {
  medicamento: "Medicamento",
  vacuna: "Vacuna",
  insumo_clinico: "Insumo clínico",
  higiene: "Higiene",
  accesorio: "Accesorio",
  juguete: "Juguete",
  alimento: "Alimento",
  transporte: "Transporte",
  otro: "Otro",
};

type ActionResult = { errors?: Record<string, string[]> } | { error?: string } | undefined;

export function ProductForm({ product }: { product?: Product }) {
  const isEdit = !!product;
  const action = isEdit
    ? async (_prev: ActionResult, fd: FormData) => updateProduct(product!.id, fd)
    : async (_prev: ActionResult, fd: FormData) => createProduct(fd);

  const [result, dispatch, isPending] = useActionState(action, undefined);
  const errors = (result && "errors" in result ? result.errors : {}) ?? {};
  const globalError = result && "error" in result ? result.error : null;

  return (
    <form action={dispatch} className="max-w-lg space-y-6">
      {globalError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input id="name" name="name" defaultValue={product?.name ?? ""} />
        {errors.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría *</Label>
        <Select name="category" defaultValue={product?.category ?? "otro"}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Seleccioná una categoría" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-destructive">{errors.category[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sellPrice">Precio de venta *</Label>
          <Input id="sellPrice" name="sellPrice" type="number" step="0.01" min="0"
            defaultValue={product?.sellPrice ?? ""} />
          {errors.sellPrice && <p className="text-sm text-destructive">{errors.sellPrice[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxRate">IVA (%)</Label>
          <Select name="taxRate" defaultValue={String(product?.taxRate ?? 0)}>
            <SelectTrigger id="taxRate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0% (exento)</SelectItem>
              <SelectItem value="21">21%</SelectItem>
            </SelectContent>
          </Select>
          {errors.taxRate && <p className="text-sm text-destructive">{errors.taxRate[0]}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minStock">Stock mínimo</Label>
          <Input id="minStock" name="minStock" type="number" step="0.01" min="0"
            defaultValue={product?.minStock ?? "0"} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="costPrice">Precio de costo</Label>
          <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0"
            defaultValue={product?.costPrice ?? ""} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
        </Button>
        <a href="/dashboard/inventory/products" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </a>
      </div>
    </form>
  );
}
```

- [ ] **Step 4.3: Create `src/components/admin/inventory/product-table.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deactivateProduct } from "@/app/dashboard/inventory/products/actions";
import type { Product } from "@/db/schema";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  medicamento: "Medicamento", vacuna: "Vacuna", insumo_clinico: "Insumo clínico",
  higiene: "Higiene", accesorio: "Accesorio", juguete: "Juguete",
  alimento: "Alimento", transporte: "Transporte", otro: "Otro",
};

export function ProductTable({ data }: { data: Product[] }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">No hay productos registrados.</p>;
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Nombre</th>
            <th className="px-4 py-3 text-left font-medium">Categoría</th>
            <th className="px-4 py-3 text-right font-medium">Stock</th>
            <th className="px-4 py-3 text-right font-medium">Precio</th>
            <th className="px-4 py-3 text-left font-medium">IVA</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {data.map((p) => {
            const isLow = Number(p.currentStock) <= Number(p.minStock);
            return (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  {p.name}
                  {!p.isActive && (
                    <span className="ml-2 text-xs text-muted-foreground">(inactivo)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {CATEGORY_LABELS[p.category] ?? p.category}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-semibold",
                      isLow
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    )}
                  >
                    {p.currentStock}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  ${Number(p.sellPrice).toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{p.taxRate}%</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Link href={`/dashboard/inventory/products/${p.id}/edit`} className="text-xs text-blue-600 hover:underline">
                      Editar
                    </Link>
                    {p.isActive && (
                      <form action={deactivateProduct.bind(null, p.id)}>
                        <Button variant="ghost" size="sm" className="h-auto px-1 py-0.5 text-xs text-destructive">
                          Desactivar
                        </Button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4.4: Create list page `src/app/dashboard/inventory/products/page.tsx`**

```tsx
import Link from "next/link";
import { getProducts } from "./actions";
import { ProductTable } from "@/components/admin/inventory/product-table";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const { search } = await searchParams;
  const data = await getProducts({ search });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">Inventario del pet shop ({data.length} productos)</p>
        </div>
        <Link href="/dashboard/inventory/products/new" className={buttonVariants()}>
          + Nuevo producto
        </Link>
      </div>
      <ProductTable data={data} />
    </div>
  );
}
```

- [ ] **Step 4.5: Create `src/app/dashboard/inventory/products/new/page.tsx`**

```tsx
import { ProductForm } from "@/components/admin/inventory/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo producto</h1>
        <p className="text-muted-foreground">Completá los datos del producto</p>
      </div>
      <ProductForm />
    </div>
  );
}
```

- [ ] **Step 4.6: Create `src/app/dashboard/inventory/products/[id]/edit/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { getProduct } from "../../actions";
import { ProductForm } from "@/components/admin/inventory/product-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar producto</h1>
        <p className="text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm product={product} />
    </div>
  );
}
```

- [ ] **Step 4.7: Verify** — create a product and confirm badge turns red when stock = 0.

- [ ] **Step 4.8: Commit**

```bash
rtk git add src/app/dashboard/inventory/products/ src/components/admin/inventory/product-form.tsx src/components/admin/inventory/product-table.tsx
rtk git commit -m "feat(petshop): products CRUD with low-stock badge"
```

---

## Task 5: Stock Entries

**Files:**
- Create: `src/app/dashboard/inventory/stock-entries/actions.ts`
- Create: `src/components/admin/inventory/stock-entry-form.tsx`
- Create: `src/components/admin/inventory/stock-entry-table.tsx`
- Create: `src/app/dashboard/inventory/stock-entries/page.tsx`
- Create: `src/app/dashboard/inventory/stock-entries/new/page.tsx`

- [ ] **Step 5.1: Create `src/app/dashboard/inventory/stock-entries/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { stockEntries, products } from "@/db/schema";
import { stockEntryId } from "@/lib/ids";
import { getRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

const entrySchema = z.object({
  productId: z.string().min(1, "Seleccioná un producto."),
  providerId: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0."),
  costPrice: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export async function getStockEntries() {
  return db
    .select({
      id: stockEntries.id,
      quantity: stockEntries.quantity,
      costPrice: stockEntries.costPrice,
      notes: stockEntries.notes,
      createdAt: stockEntries.createdAt,
      productId: stockEntries.productId,
      productName: products.name,
    })
    .from(stockEntries)
    .innerJoin(products, eq(stockEntries.productId, products.id))
    .orderBy(desc(stockEntries.createdAt))
    .limit(100);
}

export async function createStockEntry(formData: FormData) {
  const role = await getRole();
  if (role !== "admin") return { error: "Sin permiso." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const staffRow = await db.query?.staff?.findFirst?.({ where: (s: { authUserId: { equals: (id: string) => unknown } }) => s.authUserId.equals(user.id) });

  const raw = {
    productId: (formData.get("productId") as string) ?? "",
    providerId: (formData.get("providerId") as string) ?? "",
    quantity: formData.get("quantity") as string,
    costPrice: (formData.get("costPrice") as string)?.trim() ?? "",
    notes: (formData.get("notes") as string)?.trim() ?? "",
  };

  const parsed = entrySchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await db.transaction(async (tx) => {
    await tx.insert(stockEntries).values({
      id: stockEntryId(),
      productId: parsed.data.productId,
      providerId: parsed.data.providerId || null,
      quantity: String(parsed.data.quantity),
      costPrice: parsed.data.costPrice || null,
      notes: parsed.data.notes || null,
      createdById: staffRow?.id ?? user.id,
    });

    await tx
      .update(products)
      .set({
        currentStock: sql`current_stock + ${parsed.data.quantity}`,
        ...(parsed.data.costPrice ? { costPrice: parsed.data.costPrice } : {}),
        updatedAt: new Date(),
      })
      .where(eq(products.id, parsed.data.productId));
  });

  revalidatePath("/dashboard/inventory/stock-entries");
  revalidatePath("/dashboard/inventory/products");
  redirect("/dashboard/inventory/stock-entries");
}
```

> **Note on staff lookup:** The `createStockEntry` action needs the staff row ID. Use the same pattern as other actions in this codebase — look up staff by `authUserId`. If the codebase doesn't have a direct staff lookup helper yet, inline the query as shown.

- [ ] **Step 5.2: Create `src/components/admin/inventory/stock-entry-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStockEntry } from "@/app/dashboard/inventory/stock-entries/actions";
import type { Product, Provider } from "@/db/schema";

type ActionResult = { errors?: Record<string, string[]> } | { error?: string } | undefined;

interface Props {
  products: Product[];
  providers: Provider[];
}

export function StockEntryForm({ products, providers }: Props) {
  const [result, dispatch, isPending] = useActionState(
    async (_prev: ActionResult, fd: FormData) => createStockEntry(fd),
    undefined
  );
  const errors = (result && "errors" in result ? result.errors : {}) ?? {};
  const globalError = result && "error" in result ? result.error : null;

  return (
    <form action={dispatch} className="max-w-lg space-y-6">
      {globalError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="productId">Producto *</Label>
        <Select name="productId">
          <SelectTrigger id="productId">
            <SelectValue placeholder="Seleccioná un producto" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.productId && <p className="text-sm text-destructive">{errors.productId[0]}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="providerId">Proveedor</Label>
        <Select name="providerId">
          <SelectTrigger id="providerId">
            <SelectValue placeholder="Opcional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sin proveedor</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Cantidad *</Label>
          <Input id="quantity" name="quantity" type="number" step="0.01" min="0.01" />
          {errors.quantity && <p className="text-sm text-destructive">{errors.quantity[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="costPrice">Precio de costo</Label>
          <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Registrando..." : "Registrar entrada"}
        </Button>
        <a href="/dashboard/inventory/stock-entries" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </a>
      </div>
    </form>
  );
}
```

- [ ] **Step 5.3: Create `src/components/admin/inventory/stock-entry-table.tsx`**

```tsx
import type { StockEntry } from "@/db/schema";

type StockEntryRow = {
  id: string;
  quantity: string;
  costPrice: string | null;
  notes: string | null;
  createdAt: Date;
  productName: string;
};

export function StockEntryTable({ data }: { data: StockEntryRow[] }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">No hay entradas registradas.</p>;
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Fecha</th>
            <th className="px-4 py-3 text-left font-medium">Producto</th>
            <th className="px-4 py-3 text-right font-medium">Cantidad</th>
            <th className="px-4 py-3 text-right font-medium">Costo</th>
            <th className="px-4 py-3 text-left font-medium">Notas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((e) => (
            <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {new Date(e.createdAt).toLocaleDateString("es-AR")}
              </td>
              <td className="px-4 py-3 font-medium">{e.productName}</td>
              <td className="px-4 py-3 text-right">{e.quantity}</td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {e.costPrice ? `$${Number(e.costPrice).toLocaleString("es-AR")}` : "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{e.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 5.4: Create `src/app/dashboard/inventory/stock-entries/page.tsx`**

```tsx
import Link from "next/link";
import { getStockEntries } from "./actions";
import { StockEntryTable } from "@/components/admin/inventory/stock-entry-table";
import { buttonVariants } from "@/components/ui/button";

export default async function StockEntriesPage() {
  const data = await getStockEntries();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Entradas de stock</h1>
          <p className="text-muted-foreground">Historial de ingresos de mercadería</p>
        </div>
        <Link href="/dashboard/inventory/stock-entries/new" className={buttonVariants()}>
          + Registrar entrada
        </Link>
      </div>
      <StockEntryTable data={data} />
    </div>
  );
}
```

- [ ] **Step 5.5: Create `src/app/dashboard/inventory/stock-entries/new/page.tsx`**

```tsx
import { getActiveProducts } from "../products/actions";
import { getProviders } from "../providers/actions";
import { StockEntryForm } from "@/components/admin/inventory/stock-entry-form";

export default async function NewStockEntryPage() {
  const [activeProducts, providers] = await Promise.all([
    getActiveProducts(),
    getProviders(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva entrada de stock</h1>
        <p className="text-muted-foreground">Registrá el ingreso de mercadería</p>
      </div>
      <StockEntryForm products={activeProducts} providers={providers} />
    </div>
  );
}
```

- [ ] **Step 5.6: Verify** — register a stock entry, confirm `currentStock` increases in the products list.

- [ ] **Step 5.7: Commit**

```bash
rtk git add src/app/dashboard/inventory/stock-entries/ src/components/admin/inventory/stock-entry-form.tsx src/components/admin/inventory/stock-entry-table.tsx
rtk git commit -m "feat(petshop): stock entries with automatic currentStock update"
```

---

## Task 6: Sales

**Files:**
- Create: `src/app/dashboard/sales/actions.ts`
- Create: `src/components/admin/sales/sale-cart-form.tsx`
- Create: `src/components/admin/sales/sale-table.tsx`
- Create: `src/components/admin/sales/sale-detail.tsx`
- Create: `src/app/dashboard/sales/page.tsx`
- Create: `src/app/dashboard/sales/new/page.tsx`
- Create: `src/app/dashboard/sales/[id]/page.tsx`

- [ ] **Step 6.1: Create `src/app/dashboard/sales/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sales, saleItems, products, patients, staff } from "@/db/schema";
import { saleId, saleItemId } from "@/lib/ids";
import { getRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
});

const saleSchema = z.object({
  patientId: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().min(1, "El método de pago es obligatorio."),
  notes: z.string().optional().or(z.literal("")),
  items: z.array(saleItemSchema).min(1, "Agregá al menos un producto."),
});

export async function getSales() {
  return db
    .select({
      id: sales.id,
      paymentMethod: sales.paymentMethod,
      notes: sales.notes,
      createdAt: sales.createdAt,
      patientId: sales.patientId,
    })
    .from(sales)
    .orderBy(desc(sales.createdAt))
    .limit(100);
}

export async function getSale(id: string) {
  const [sale] = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
  if (!sale) return null;

  const items = await db
    .select({
      id: saleItems.id,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      taxRate: saleItems.taxRate,
      productId: saleItems.productId,
      productName: products.name,
    })
    .from(saleItems)
    .innerJoin(products, eq(saleItems.productId, products.id))
    .where(eq(saleItems.saleId, id));

  let patient = null;
  if (sale.patientId) {
    const [p] = await db.select({ id: patients.id, name: patients.name }).from(patients).where(eq(patients.id, sale.patientId)).limit(1);
    patient = p ?? null;
  }

  return { ...sale, items, patient };
}

export async function createSale(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const [staffRow] = await db.select().from(staff).where(eq(staff.authUserId, user.id)).limit(1);
  if (!staffRow) return { error: "Staff no encontrado." };

  // Parse items from formData — sent as items[0][productId], items[0][quantity], etc.
  const itemsRaw: Array<{ productId: string; quantity: string }> = [];
  let i = 0;
  while (formData.get(`items[${i}][productId]`)) {
    itemsRaw.push({
      productId: (formData.get(`items[${i}][productId]`) as string) ?? "",
      quantity: (formData.get(`items[${i}][quantity]`) as string) ?? "0",
    });
    i++;
  }

  const raw = {
    patientId: (formData.get("patientId") as string) ?? "",
    paymentMethod: (formData.get("paymentMethod") as string) ?? "",
    notes: (formData.get("notes") as string)?.trim() ?? "",
    items: itemsRaw.map((item) => ({ productId: item.productId, quantity: Number(item.quantity) })),
  };

  const parsed = saleSchema.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const newSaleId = saleId();

  await db.transaction(async (tx) => {
    await tx.insert(sales).values({
      id: newSaleId,
      patientId: parsed.data.patientId || null,
      soldById: staffRow.id,
      createdById: staffRow.id,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes || null,
    });

    for (const item of parsed.data.items) {
      const [product] = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (!product) throw new Error(`Producto ${item.productId} no encontrado.`);

      await tx.insert(saleItems).values({
        id: saleItemId(),
        saleId: newSaleId,
        productId: item.productId,
        quantity: String(item.quantity),
        unitPrice: product.sellPrice,
        taxRate: product.taxRate,
      });

      await tx
        .update(products)
        .set({
          currentStock: sql`current_stock - ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, item.productId));
    }
  });

  revalidatePath("/dashboard/sales");
  revalidatePath("/dashboard/inventory/products");
  redirect(`/dashboard/sales/${newSaleId}`);
}
```

- [ ] **Step 6.2: Create `src/components/admin/sales/sale-cart-form.tsx`**

```tsx
"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSale } from "@/app/dashboard/sales/actions";
import type { Product } from "@/db/schema";

type CartItem = { productId: string; productName: string; quantity: number; unitPrice: number };
type ActionResult = { errors?: Record<string, string[]> } | { error?: string } | undefined;

interface Props {
  products: Product[];
  patients: { id: string; name: string }[];
}

export function SaleCartForm({ products, patients }: Props) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState(1);

  const [result, dispatch, isPending] = useActionState(
    async (_prev: ActionResult, fd: FormData) => createSale(fd),
    undefined
  );

  const globalError = result && "error" in result ? result.error : null;
  const formErrors = result && "errors" in result ? result.errors : {};

  const addItem = () => {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product || qty <= 0) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === selectedProductId);
      if (existing) {
        return prev.map((i) =>
          i.productId === selectedProductId ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { productId: product.id, productName: product.name, quantity: qty, unitPrice: Number(product.sellPrice) }];
    });
    setSelectedProductId("");
    setQty(1);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <form action={dispatch} className="space-y-8 max-w-2xl">
      {globalError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      {/* Add item row */}
      <div className="space-y-2">
        <Label>Agregar producto</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Buscá un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — ${Number(p.sellPrice).toLocaleString("es-AR")}
                    {Number(p.currentStock) <= 0 && " (sin stock)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            type="number"
            min={1}
            step={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-20"
          />
          <Button type="button" variant="outline" onClick={addItem} disabled={!selectedProductId}>
            Agregar
          </Button>
        </div>
      </div>

      {/* Cart items */}
      {items.length > 0 && (
        <div className="space-y-2">
          <Label>Productos en la venta</Label>
          <div className="rounded-md border divide-y">
            {items.map((item, idx) => (
              <div key={item.productId} className="flex items-center justify-between px-4 py-3">
                {/* Hidden inputs for form submission */}
                <input type="hidden" name={`items[${idx}][productId]`} value={item.productId} />
                <input type="hidden" name={`items[${idx}][quantity]`} value={item.quantity} />

                <div>
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × ${item.unitPrice.toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-sm">
                    ${(item.unitPrice * item.quantity).toLocaleString("es-AR")}
                  </span>
                  <Button type="button" variant="ghost" size="sm" className="text-destructive h-auto px-2 py-1 text-xs" onClick={() => removeItem(item.productId)}>
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-end px-4 py-3 bg-muted/30">
              <span className="font-bold">Total: ${total.toLocaleString("es-AR")}</span>
            </div>
          </div>
          {formErrors?.items && <p className="text-sm text-destructive">{String(formErrors.items[0])}</p>}
        </div>
      )}

      {/* Sale metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Método de pago *</Label>
          <Select name="paymentMethod">
            <SelectTrigger id="paymentMethod">
              <SelectValue placeholder="Seleccioná" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="efectivo">Efectivo</SelectItem>
              <SelectItem value="transferencia">Transferencia</SelectItem>
              <SelectItem value="debito">Débito</SelectItem>
              <SelectItem value="credito">Crédito</SelectItem>
              <SelectItem value="mercadopago">MercadoPago</SelectItem>
            </SelectContent>
          </Select>
          {formErrors?.paymentMethod && <p className="text-sm text-destructive">{formErrors.paymentMethod[0]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="patientId">Paciente (opcional)</Label>
          <Select name="patientId">
            <SelectTrigger id="patientId">
              <SelectValue placeholder="Sin paciente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin paciente</SelectItem>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending || items.length === 0}>
          {isPending ? "Registrando..." : "Confirmar venta"}
        </Button>
        <a href="/dashboard/sales" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </a>
      </div>
    </form>
  );
}
```

- [ ] **Step 6.3: Create `src/components/admin/sales/sale-table.tsx`**

```tsx
import Link from "next/link";
import type { Sale } from "@/db/schema";

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo", transferencia: "Transferencia",
  debito: "Débito", credito: "Crédito", mercadopago: "MercadoPago",
};

type SaleRow = Pick<Sale, "id" | "paymentMethod" | "notes" | "createdAt" | "patientId">;

export function SaleTable({ data }: { data: SaleRow[] }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">No hay ventas registradas.</p>;
  }

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Fecha</th>
            <th className="px-4 py-3 text-left font-medium">Pago</th>
            <th className="px-4 py-3 text-left font-medium">Notas</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {data.map((s) => (
            <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {new Date(s.createdAt).toLocaleDateString("es-AR")}
              </td>
              <td className="px-4 py-3">{PAYMENT_LABELS[s.paymentMethod] ?? s.paymentMethod}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{s.notes ?? "—"}</td>
              <td className="px-4 py-3 text-right">
                <Link href={`/dashboard/sales/${s.id}`} className="text-xs text-blue-600 hover:underline">
                  Ver detalle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 6.4: Create `src/components/admin/sales/sale-detail.tsx`**

```tsx
import type { Sale, SaleItem } from "@/db/schema";

type SaleDetailProps = {
  sale: Sale & {
    items: Array<{ id: string; quantity: string; unitPrice: string; taxRate: number; productName: string }>;
    patient: { id: string; name: string } | null;
  };
};

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo", transferencia: "Transferencia",
  debito: "Débito", credito: "Crédito", mercadopago: "MercadoPago",
};

export function SaleDetail({ sale }: SaleDetailProps) {
  const total = sale.items.reduce(
    (sum, i) => sum + Number(i.unitPrice) * Number(i.quantity),
    0
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="rounded-md border p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Fecha</span>
          <span>{new Date(sale.createdAt).toLocaleDateString("es-AR")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Método de pago</span>
          <span>{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</span>
        </div>
        {sale.patient && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paciente</span>
            <span>{sale.patient.name}</span>
          </div>
        )}
        {sale.notes && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Notas</span>
            <span>{sale.notes}</span>
          </div>
        )}
      </div>

      <div className="rounded-md border divide-y">
        {sale.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-sm">{item.productName}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity} × ${Number(item.unitPrice).toLocaleString("es-AR")}
                {item.taxRate > 0 && ` + ${item.taxRate}% IVA`}
              </p>
            </div>
            <span className="font-semibold text-sm">
              ${(Number(item.unitPrice) * Number(item.quantity)).toLocaleString("es-AR")}
            </span>
          </div>
        ))}
        <div className="flex justify-end px-4 py-3 bg-muted/30">
          <span className="font-bold">Total: ${total.toLocaleString("es-AR")}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6.5: Create `src/app/dashboard/sales/page.tsx`**

```tsx
import Link from "next/link";
import { getSales } from "./actions";
import { SaleTable } from "@/components/admin/sales/sale-table";
import { buttonVariants } from "@/components/ui/button";

export default async function SalesPage() {
  const data = await getSales();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">Historial de ventas del pet shop</p>
        </div>
        <Link href="/dashboard/sales/new" className={buttonVariants()}>
          + Nueva venta
        </Link>
      </div>
      <SaleTable data={data} />
    </div>
  );
}
```

- [ ] **Step 6.6: Create `src/app/dashboard/sales/new/page.tsx`**

```tsx
import { getActiveProducts } from "@/app/dashboard/inventory/products/actions";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { asc } from "drizzle-orm";
import { SaleCartForm } from "@/components/admin/sales/sale-cart-form";

export default async function NewSalePage() {
  const [activeProducts, allPatients] = await Promise.all([
    getActiveProducts(),
    db.select({ id: patients.id, name: patients.name }).from(patients).orderBy(asc(patients.name)),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva venta</h1>
        <p className="text-muted-foreground">Agregá productos y confirmá la venta</p>
      </div>
      <SaleCartForm products={activeProducts} patients={allPatients} />
    </div>
  );
}
```

- [ ] **Step 6.7: Create `src/app/dashboard/sales/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSale } from "../actions";
import { SaleDetail } from "@/components/admin/sales/sale-detail";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SaleDetailPage({ params }: Props) {
  const { id } = await params;
  const sale = await getSale(id);
  if (!sale) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Venta #{id.slice(-6)}</h1>
          <p className="text-muted-foreground">
            {new Date(sale.createdAt).toLocaleDateString("es-AR", { dateStyle: "full" })}
          </p>
        </div>
        <Link href="/dashboard/sales" className={buttonVariants({ variant: "outline" })}>
          ← Volver
        </Link>
      </div>
      <SaleDetail sale={sale} />
    </div>
  );
}
```

- [ ] **Step 6.8: Verify end-to-end** — register a sale with 2+ products, check stock decreases correctly in `/dashboard/inventory/products`.

- [ ] **Step 6.9: Commit**

```bash
rtk git add src/app/dashboard/sales/ src/components/admin/sales/
rtk git commit -m "feat(petshop): sales cart form, history, and detail page"
```

---

## Task 7: Import scripts

**Files:**
- Create: `scripts/import-products.ts`
- Create: `scripts/import-providers.ts`

- [ ] **Step 7.1: Create `scripts/import-products.ts`**

```ts
/**
 * GVet → NeoVet product import
 *
 * Usage:
 *   npx tsx scripts/import-products.ts --file "scripts/data/lista_precios 2026-04-01-00-21-51.csv"
 *   npx tsx scripts/import-products.ts --file "..." --dry-run
 *
 * CSV columns: Nombre, Cantidad, Impuesto, "Precio de venta", "Precio de venta + impuestos"
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// ---------------------------------------------------------------------------
// ID helper (mirrors src/lib/ids.ts)
// ---------------------------------------------------------------------------
function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

// ---------------------------------------------------------------------------
// Category keyword mapping
// ---------------------------------------------------------------------------
const KEYWORD_MAP: Array<{ keywords: string[]; category: string }> = [
  { keywords: ["vacuna"], category: "vacuna" },
  { keywords: ["shampoo", "cepillo", "rasqueta", "cardina", "dermapet", "osspret"], category: "higiene" },
  { keywords: ["collar", "correa", "arnes", "cinturon", "pretal"], category: "accesorio" },
  { keywords: ["pelota", "juguete", "raton", "rascador", "mordillo", "soga", "pluma", "caña", "rata", "pez", "rolling", "varita", "peluche"], category: "juguete" },
  { keywords: ["pouch", "hueso", "bombon", "snack", "gallina", "pollo", "stick", "bruler", "orejas", "traquea", "liver", "moñito", "soft cream"], category: "alimento" },
  { keywords: ["transportadora", "cucha", "moises", "mochila"], category: "transporte" },
  { keywords: ["aguja", "cateter", "jeringa", "gasa", "guante", "suero", "butterfly", "portaobjetos", "cinta"], category: "insumo_clinico" },
];

function inferCategory(name: string): string {
  const lower = name.toLowerCase();
  for (const { keywords, category } of KEYWORD_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  // Medications: contain known drug suffixes or are clearly pharmaceutical
  if (/icina|oxacilina|floxacina|ciclina|predni|melox|furose|metoclo|doxici|cefalex|amox|enro|bromo|griseo|pregaba|trazod|pimocard|ursomar|karsivan|nogastrol|odonto|flurbipro|oflox|colirama|epit|dexam|terram|dipiro|hepat|calci|nutripet|apetil|basken|bravecto|simparica|nexgard|cidar|flura|power gold|repexxin|block spino|frontline|perfos|bit trio|total full|toltrazol|contal|supramin/i.test(lower)) {
    return "medicamento";
  }
  return "otro";
}

// ---------------------------------------------------------------------------
// Minimal CSV parser (same approach as import-gvet.ts)
// ---------------------------------------------------------------------------
function parseCSV(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h.trim()] = (values[i] ?? "").trim(); });
    return row;
  });
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === "," && !inQuotes) {
      fields.push(current); current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf("--file");
  const isDryRun = args.includes("--dry-run");

  if (fileIdx === -1 || !args[fileIdx + 1]) {
    console.error("Usage: npx tsx scripts/import-products.ts --file <path> [--dry-run]");
    process.exit(1);
  }

  const filePath = path.resolve(args[fileIdx + 1]);
  const rows = parseCSV(filePath);
  console.log(`Parsed ${rows.length} rows from CSV`);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row["Nombre"]?.trim();
    if (!name) { skipped++; continue; }

    const currentStock = parseFloat(row["Cantidad"] ?? "0") || 0;
    const taxRate = parseInt(row["Impuesto"] ?? "0", 10) || 0;
    const sellPrice = parseFloat(row["Precio de venta"] ?? "0") || 0;
    const category = inferCategory(name);

    if (isDryRun) {
      console.log(`[DRY] ${name} | cat=${category} | stock=${currentStock} | price=${sellPrice} | iva=${taxRate}%`);
      inserted++;
      continue;
    }

    await db.execute(
      `INSERT INTO products (id, name, category, current_stock, min_stock, sell_price, tax_rate, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 0, $5, $6, true, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [
        createId("prd"),
        name,
        category,
        String(currentStock),
        String(sellPrice),
        taxRate,
      ] as any
    );
    inserted++;
  }

  console.log(`Done — ${inserted} products imported, ${skipped} skipped`);
  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 7.2: Create `scripts/import-providers.ts`**

```ts
/**
 * GVet → NeoVet provider import
 *
 * Usage:
 *   npx tsx scripts/import-providers.ts --file providers.csv
 *   npx tsx scripts/import-providers.ts --file providers.csv --dry-run
 *
 * CSV columns (GVet format): Nombre, Dirección, Teléfono, E-mail
 * CUIT column optional — add if GVet export includes it.
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function parseCSV(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

async function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf("--file");
  const isDryRun = args.includes("--dry-run");

  if (fileIdx === -1 || !args[fileIdx + 1]) {
    console.error("Usage: npx tsx scripts/import-providers.ts --file <path> [--dry-run]");
    process.exit(1);
  }

  const filePath = path.resolve(args[fileIdx + 1]);
  const rows = parseCSV(filePath);
  console.log(`Parsed ${rows.length} rows from CSV`);

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");

  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row["Nombre"]?.trim();
    if (!name) { skipped++; continue; }

    if (isDryRun) {
      console.log(`[DRY] ${name} | phone=${row["Teléfono"]} | email=${row["E-mail"]}`);
      inserted++;
      continue;
    }

    await db.execute(
      `INSERT INTO providers (id, name, address, phone, email, cuit, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [
        createId("prv"),
        name,
        row["Dirección"] || null,
        row["Teléfono"] || null,
        row["E-mail"] || null,
        row["CUIT"] || null,
      ] as any
    );
    inserted++;
  }

  console.log(`Done — ${inserted} providers imported, ${skipped} skipped`);
  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 7.3: Run product import (dry run first)**

Make sure `.env` (not `.env.local`) has `DATABASE_URL` in session mode (port 5432):

```bash
cd crm
npx tsx scripts/import-products.ts --file "scripts/data/lista_precios 2026-04-01-00-21-51.csv" --dry-run
```

Expected: ~415 lines printed with name, category, stock, price.

- [ ] **Step 7.4: Run product import (real)**

```bash
npx tsx scripts/import-products.ts --file "scripts/data/lista_precios 2026-04-01-00-21-51.csv"
```

Expected: `Done — 415 products imported, 0 skipped`. Verify in Supabase → Table Editor → products.

- [ ] **Step 7.5: Run provider import (dry run)**

```bash
npx tsx scripts/import-providers.ts --file "scripts/data/proveedores.csv" --dry-run
```

> If the GVet provider export file has a different name or path, adjust accordingly.

- [ ] **Step 7.6: Run provider import (real)**

```bash
npx tsx scripts/import-providers.ts --file "scripts/data/proveedores.csv"
```

- [ ] **Step 7.7: Commit**

```bash
rtk git add scripts/import-products.ts scripts/import-providers.ts
rtk git commit -m "feat(petshop): import scripts for products and providers from GVet CSV"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task covering it |
|---|---|
| 5 tables: products, providers, stock_entries, sales, sale_items | Task 1 |
| Prefixed IDs: prd_, prv_, ste_, sal_, sli_ | Task 1 |
| Sidebar: Ventas (direct) + Inventario dropdown | Task 2 |
| Providers CRUD + deactivate | Task 3 |
| Products CRUD + deactivate + low-stock badge | Task 4 |
| Stock entries with automatic currentStock update | Task 5 |
| Sales cart form with dynamic items | Task 6 |
| Sales auto-decrement stock | Task 6 |
| Sales: patient link (optional) | Task 6 |
| Sales: soldById auto-assigned to logged-in user | Task 6 |
| Sales: paymentId nullable (Phase D hook) | Task 1 schema |
| Import scripts for products + providers | Task 7 |
| Role access: admin only for inventory management | Tasks 3, 4, 5 (hasRole check) |
| All roles can register a sale | Task 6 (no role gate) |
| costPrice snapshot on stock entry | Task 5 |
| unit_price + taxRate snapshot on sale_items | Task 6 |
| RESTRICT on sale_items.productId | Task 1 schema |
| sale_items append-only (no edit path) | No edit route created |

**No gaps found.**

**Placeholder scan:** No TBDs, no "implement later", all code blocks are complete.

**Type consistency:** `productCategoryEnum` defined in Task 1 and imported in Task 4 actions. `saleId`/`saleItemId` defined in Task 1 ids.ts and used in Task 6. `StockEntry`/`Sale`/`SaleItem` types exported and used in components.
