import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRole } from "@/lib/auth";
import { formatART } from "@/lib/timezone";
import {
  getAssignableStaff,
  getRetornoQueue,
  getWalkInsInQueue,
} from "./actions";
import { QueueRowActions } from "./queue-row-actions";

const TASK_TYPE_LABELS: Record<string, string> = {
  sacar_sangre: "Sacar sangre",
  ecografia: "Ecografía",
  curacion: "Curación",
  aplicar_medicacion: "Aplicar medicación",
  radiografia: "Radiografía",
  control_signos_vitales: "Control de signos vitales",
  otro: "Otro",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  completed: "Completado",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

export default async function SalaDeEsperaPage() {
  const role = await getRole();
  if (role === "groomer") {
    redirect("/dashboard");
  }

  const [walkIns, entries, assignableStaff] = await Promise.all([
    getWalkInsInQueue(),
    getRetornoQueue(),
    getAssignableStaff(),
  ]);

  const bothEmpty = walkIns.length === 0 && entries.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sala de espera</h1>
        <p className="mt-1 text-muted-foreground">
          Pacientes esperando: walk-ins en recepción y retornos tras consulta.
        </p>
      </div>

      {bothEmpty ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          Sala vacía en este momento.
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Walk-ins</h2>
            {walkIns.length === 0 ? (
              <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                Sin walk-ins pendientes.
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Ingresó</TableHead>
                      <TableHead>Asignado a</TableHead>
                      <TableHead className="w-[120px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walkIns.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/patients/${w.patientId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {w.patientName}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {w.clientName}
                          </div>
                          {w.isUrgent && (
                            <span className="mt-1 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              Urgente
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[280px] whitespace-pre-wrap text-sm">
                          {w.reason ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatART(w.createdAt, { timeStyle: "short" })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {w.assignedStaffName ?? (
                            <span className="text-muted-foreground">
                              Sin asignar
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/appointments/${w.id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            Ver turno →
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Retornos de consulta</h2>
            {entries.length === 0 ? (
              <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                Sin retornos pendientes.
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Tarea</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ingresó</TableHead>
                      <TableHead className="w-[280px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/patients/${e.patientId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {e.patientName}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {e.clientName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {TASK_TYPE_LABELS[e.taskType] ?? e.taskType}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Pedido por {e.createdByStaffName}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[240px] whitespace-pre-wrap text-sm">
                          {e.notes ?? "—"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[e.status] ?? ""}`}
                          >
                            {STATUS_LABELS[e.status] ?? e.status}
                          </span>
                          {e.status === "in_progress" &&
                            e.performedByStaffName && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                Con {e.performedByStaffName}
                              </div>
                            )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatART(e.createdAt, { timeStyle: "short" })}
                        </TableCell>
                        <TableCell>
                          <QueueRowActions
                            retorno={{
                              id: e.id,
                              status: e.status,
                              assignedToStaffId: e.assignedToStaffId,
                            }}
                            assignableStaff={assignableStaff}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
