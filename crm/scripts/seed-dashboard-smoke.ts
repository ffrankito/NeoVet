/**
 * Smoke-test seed data for the dashboard and related flows.
 *
 * Every seeded row is tagged so re-running wipes previous smoke data before
 * inserting again (idempotent). Nothing here is intended for production.
 *
 * Tagging convention:
 *   - clients.phone starts with "SMOKE-"
 *   - products.name starts with "[SMOKE]"
 *   - cashSessions.name starts with "[SMOKE]"
 *   - charges cascade-delete with clients (no direct tag needed)
 *   - patients/appointments cascade-delete with clients
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { like } from "drizzle-orm";
import * as schema from "../src/db/schema";
import {
  clients,
  patients,
  appointments,
  charges,
  products,
  cashSessions,
  followUps,
} from "../src/db/schema";
import {
  clientId,
  patientId,
  appointmentId,
  chargeId,
  productId,
  cashSessionId,
  followUpId,
} from "../src/lib/ids";
import { parseDateTimeAsART, todayStartART } from "../src/lib/timezone";

// ---------------------------------------------------------------------------
// Known IDs (from DB inspection)
// ---------------------------------------------------------------------------
const STAFF = {
  TOMAS_ADMIN: "stf_a1b2c3d4e5f6a7b8",
  VET_TEST: "stf_3a6fb71c919147ed",
  GROOMER_TEST: "stf_936bd546733242f8",
  PAULA: "stf_1a63ea8f46074092",
} as const;

const SVC = {
  CONSULTA: "svc_534dcb4781cc4126",
  CIRUGIA: "svc_9acc576476be45f0",
  VACUNACION: "svc_1ebd28b62a6b42f2",
  BANO: "svc_estetica_bano",
  CORTE: "svc_estetica_corte",
  BANOCORTE: "svc_estetica_banocorte",
} as const;

// ---------------------------------------------------------------------------
// DB connection
// ---------------------------------------------------------------------------
const url = new URL(process.env.DATABASE_URL!);
const client = postgres({
  host: url.hostname,
  port: Number(url.port),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: "require",
  max: 1,
});
const db = drizzle(client, { schema });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const todayDateStr = todayStartART().toISOString().slice(0, 10); // UTC midnight of ART-today
// Build a local "YYYY-MM-DD" from today in Argentina tz for appointment scheduling
const argentinaDateStr = new Date()
  .toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

function todayArtAt(hour: number, min: number): Date {
  const hh = String(hour).padStart(2, "0");
  const mm = String(min).padStart(2, "0");
  return parseDateTimeAsART(`${argentinaDateStr}T${hh}:${mm}`);
}

async function cleanup() {
  // clients cascade-delete patients → appointments, and charges → (client FK)
  const deletedClients = await db
    .delete(clients)
    .where(like(clients.phone, "SMOKE-%"))
    .returning({ id: clients.id });
  const deletedProducts = await db
    .delete(products)
    .where(like(products.name, "[SMOKE]%"))
    .returning({ id: products.id });
  const deletedCash = await db
    .delete(cashSessions)
    .where(like(cashSessions.name, "[SMOKE]%"))
    .returning({ id: cashSessions.id });

  console.log(
    `Cleanup: ${deletedClients.length} clients, ${deletedProducts.length} products, ${deletedCash.length} cash sessions removed.`
  );
}

async function seed() {
  await cleanup();

  // --- Clients ---------------------------------------------------------------
  const clientsData = [
    { name: "María González",     phone: "SMOKE-001", email: "maria.g@test.com",  dni: "30123456", address: "Av. Siempreviva 742" },
    { name: "Juan Pérez",         phone: "SMOKE-002", email: "juan.p@test.com",   dni: "28987654", address: "Calle Falsa 123" },
    { name: "Lucía Rodríguez",    phone: "SMOKE-003", email: "lucia.r@test.com",  dni: "32456789", address: "Martínez 456" },
    { name: "Pedro Martínez",     phone: "SMOKE-004", email: null,                dni: null,        address: null },
    { name: "Ana Silva",          phone: "SMOKE-005", email: "ana.s@test.com",    dni: "29876543", address: "Belgrano 987" },
    { name: "Diego López",        phone: "SMOKE-006", email: "diego.l@test.com",  dni: null,        address: "Corrientes 111" },
    { name: "Carolina Fernández", phone: "SMOKE-007", email: null,                dni: "31234567", address: null },
    { name: "Roberto Giménez",    phone: "SMOKE-008", email: "roberto.g@test.com",dni: "27654321", address: "Rivadavia 333" },
    { name: "Sofía Castro",       phone: "SMOKE-009", email: "sofia.c@test.com",  dni: null,        address: null },
    { name: "Martín Álvarez",     phone: "SMOKE-010", email: null,                dni: "33987654", address: "San Martín 500" },
  ].map((c) => ({ ...c, id: clientId() }));
  await db.insert(clients).values(clientsData);

  // --- Patients --------------------------------------------------------------
  // Index matches clientsData; some clients have multiple pets. Mix of species,
  // 3 brachycephalic breeds (Bulldog Francés, Bulldog Inglés, Pug) since the
  // clinic specializes in them.
  const patientsData = [
    { clientIdx: 0, name: "Pancho",  species: "perro", breed: "Bulldog Francés",  sex: "macho"  },
    { clientIdx: 0, name: "Luna",    species: "gato",  breed: "Siamés",           sex: "hembra" },
    { clientIdx: 1, name: "Rocky",   species: "perro", breed: "Bulldog Inglés",   sex: "macho"  },
    { clientIdx: 2, name: "Nala",    species: "gato",  breed: "Europeo",          sex: "hembra" },
    { clientIdx: 3, name: "Toby",    species: "perro", breed: "Labrador",         sex: "macho"  },
    { clientIdx: 4, name: "Mía",     species: "gato",  breed: "Persa",            sex: "hembra" },
    { clientIdx: 4, name: "Copito",  species: "perro", breed: "Pug",              sex: "macho"  },
    { clientIdx: 5, name: "Simón",   species: "perro", breed: "Caniche Toy",      sex: "macho"  },
    { clientIdx: 6, name: "Kira",    species: "perro", breed: "Golden Retriever", sex: "hembra" },
    { clientIdx: 7, name: "Zeus",    species: "perro", breed: "Boxer",            sex: "macho"  },
    { clientIdx: 8, name: "Mimi",    species: "gato",  breed: "Europeo",          sex: "hembra" },
    { clientIdx: 9, name: "Bruno",   species: "perro", breed: "Bulldog Francés",  sex: "macho"  },
    { clientIdx: 9, name: "Nina",    species: "perro", breed: "Yorkshire",        sex: "hembra" },
  ].map((p) => ({
    id: patientId(),
    clientId: clientsData[p.clientIdx].id,
    name: p.name,
    species: p.species,
    breed: p.breed,
    sex: p.sex,
  }));
  await db.insert(patients).values(patientsData);

  // --- Appointments (today, mix of statuses/types/staff) --------------------
  type Row = {
    patientIdx: number;
    hour: number;
    min: number;
    status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
    svc: string;
    type: "veterinary" | "grooming";
    staff: string | null;
    reason: string;
    urgent?: boolean;
    walkIn?: boolean;
    cancelReason?: string;
  };
  const apptsRows: Row[] = [
    // Completed morning
    { patientIdx: 0,  hour: 9,  min: 0,  status: "completed", svc: SVC.CONSULTA,   type: "veterinary", staff: STAFF.VET_TEST,     reason: "Control general" },
    { patientIdx: 5,  hour: 9,  min: 30, status: "completed", svc: SVC.VACUNACION, type: "veterinary", staff: STAFF.VET_TEST,     reason: "Triple viral" },

    // In waiting room now (confirmed)
    { patientIdx: 2,  hour: 10, min: 0,  status: "confirmed", svc: SVC.CONSULTA,   type: "veterinary", staff: STAFF.VET_TEST,     reason: "Dificultad respiratoria", urgent: true },
    { patientIdx: 7,  hour: 10, min: 30, status: "confirmed", svc: SVC.BANOCORTE,  type: "grooming",   staff: STAFF.GROOMER_TEST, reason: "Baño y corte mensual" },
    { patientIdx: 3,  hour: 11, min: 0,  status: "confirmed", svc: SVC.CONSULTA,   type: "veterinary", staff: null,                reason: "Revisión de pata" },
    { patientIdx: 12, hour: 11, min: 30, status: "confirmed", svc: SVC.BANO,       type: "grooming",   staff: STAFF.GROOMER_TEST, reason: "Baño" },

    // Walk-in urgent (braquicefálico)
    { patientIdx: 11, hour: 10, min: 45, status: "confirmed", svc: SVC.CONSULTA,   type: "veterinary", staff: STAFF.VET_TEST,     reason: "Respira mal — BRAQUICEFÁLICO", urgent: true, walkIn: true },

    // Walk-in non-urgent
    { patientIdx: 6,  hour: 11, min: 15, status: "confirmed", svc: SVC.CONSULTA,   type: "veterinary", staff: null,                reason: "Consulta sin turno", walkIn: true },

    // Scheduled later (pending)
    { patientIdx: 4,  hour: 14, min: 0,  status: "pending",   svc: SVC.CONSULTA,   type: "veterinary", staff: STAFF.PAULA,        reason: "Check-up anual" },
    { patientIdx: 8,  hour: 15, min: 0,  status: "pending",   svc: SVC.CIRUGIA,    type: "veterinary", staff: STAFF.VET_TEST,     reason: "Castración programada" },
    { patientIdx: 9,  hour: 16, min: 0,  status: "pending",   svc: SVC.CORTE,      type: "grooming",   staff: STAFF.GROOMER_TEST, reason: "Corte" },

    // Cancelled + no-show
    { patientIdx: 10, hour: 13, min: 0,  status: "cancelled", svc: SVC.VACUNACION, type: "veterinary", staff: STAFF.VET_TEST,     reason: "Antirrábica", cancelReason: "Cliente reagendó" },
    { patientIdx: 1,  hour: 12, min: 0,  status: "no_show",   svc: SVC.CONSULTA,   type: "veterinary", staff: STAFF.VET_TEST,     reason: "Control" },
  ];
  await db.insert(appointments).values(
    apptsRows.map((a) => ({
      id: appointmentId(),
      patientId: patientsData[a.patientIdx].id,
      appointmentType: a.type,
      assignedStaffId: a.staff,
      serviceId: a.svc,
      scheduledAt: todayArtAt(a.hour, a.min),
      durationMinutes: 30,
      reason: a.reason,
      status: a.status,
      isWalkIn: a.walkIn ?? false,
      isUrgent: a.urgent ?? false,
      cancellationReason: a.cancelReason ?? null,
      sendReminders: false, // smoke data — do not trigger reminder emails
    }))
  );

  // --- Unpaid charges (3 distinct clients → "Deudores: 3") ------------------
  await db.insert(charges).values([
    { id: chargeId(), clientId: clientsData[0].id, sourceType: "consultation", amount: "5000",  paidAmount: "0",    status: "pending", description: "[SMOKE] Consulta pendiente" },
    { id: chargeId(), clientId: clientsData[0].id, sourceType: "grooming",     amount: "3000",  paidAmount: "1500", status: "partial", description: "[SMOKE] Baño parcial" },
    { id: chargeId(), clientId: clientsData[1].id, sourceType: "sale",         amount: "8500",  paidAmount: "0",    status: "pending", description: "[SMOKE] Alimento" },
    { id: chargeId(), clientId: clientsData[2].id, sourceType: "consultation", amount: "4500",  paidAmount: "0",    status: "pending", description: "[SMOKE] Control felino" },
    { id: chargeId(), clientId: clientsData[2].id, sourceType: "procedure",    amount: "12000", paidAmount: "2000", status: "partial", description: "[SMOKE] Procedimiento" },
  ]);

  // --- Products — 4 with low stock, 1 above threshold (controls) ------------
  await db.insert(products).values([
    { id: productId(), name: "[SMOKE] Meloxicam 2mg",        category: "medicamento",    currentStock: "2",  minStock: "10", sellPrice: "450",  isActive: true },
    { id: productId(), name: "[SMOKE] Guantes látex talle M", category: "insumo_clinico", currentStock: "5",  minStock: "50", sellPrice: "50",   isActive: true },
    { id: productId(), name: "[SMOKE] Vacuna antirrábica",    category: "vacuna",         currentStock: "0",  minStock: "5",  sellPrice: "2500", isActive: true },
    { id: productId(), name: "[SMOKE] Shampoo medicado",      category: "higiene",        currentStock: "1",  minStock: "3",  sellPrice: "1200", isActive: true },
    // Control: above min — should NOT trigger the Stock bajo alert
    { id: productId(), name: "[SMOKE] Alimento premium 15kg", category: "alimento",       currentStock: "20", minStock: "5",  sellPrice: "8000", isActive: true },
  ]);

  // --- Open cash session (09:00 today) --------------------------------------
  await db.insert(cashSessions).values({
    id: cashSessionId(),
    name: "[SMOKE] Sesión de prueba",
    openedById: STAFF.TOMAS_ADMIN,
    openedAt: todayArtAt(9, 0),
    initialAmount: "5000",
  });

  // --- Follow-ups (4 pending: 3 overdue + 1 future; 1 done; 1 dismissed) ----
  // Cascades with clients via patient FK, so cleanup is automatic.
  const dayOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  await db.insert(followUps).values([
    // Overdue (pending, scheduledDate in the past) → count toward alert chip
    { id: followUpId(), patientId: patientsData[0].id, scheduledDate: dayOffset(-7),  reason: "Control post-consulta respiratoria", status: "pending" },
    { id: followUpId(), patientId: patientsData[2].id, scheduledDate: dayOffset(-3),  reason: "Revisión de pata",                     status: "pending" },
    { id: followUpId(), patientId: patientsData[8].id, scheduledDate: dayOffset(-14), reason: "Post-operatorio castración",           status: "pending" },
    // Future (pending, not overdue) → should NOT count
    { id: followUpId(), patientId: patientsData[4].id, scheduledDate: dayOffset(7),   reason: "Control anual",                        status: "pending" },
    // Already handled
    { id: followUpId(), patientId: patientsData[1].id, scheduledDate: dayOffset(-10), reason: "Control vacunación",                   status: "done" },
    { id: followUpId(), patientId: patientsData[5].id, scheduledDate: dayOffset(-20), reason: "Control pelo",                         status: "dismissed" },
  ]);

  // --- Summary --------------------------------------------------------------
  console.log(`\nSeed complete (dated ${todayDateStr} ART):`);
  console.log(`  clients:       ${clientsData.length}`);
  console.log(`  patients:      ${patientsData.length}`);
  console.log(`  appointments:  ${apptsRows.length}`);
  console.log(`  charges:       5 (3 distinct clients)`);
  console.log(`  products:      5 (4 low-stock, 1 healthy control)`);
  console.log(`  cash session:  1 open`);
  console.log(`  follow-ups:    6 (3 overdue pending, 1 future pending, 1 done, 1 dismissed)`);
}

seed()
  .then(() => client.end())
  .catch(async (err) => {
    console.error(err);
    await client.end();
    process.exit(1);
  });
