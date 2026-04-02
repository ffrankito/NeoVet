import Link from "next/link";
import { getCashSessions, getOpenSession } from "./actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value: string | number) {
  return `$${Number(value).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;
}

export default async function CashPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [result, openSession] = await Promise.all([
    getCashSessions({ page }),
    getOpenSession(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Caja</h1>
          <p className="text-muted-foreground">Registro de aperturas y cierres de caja</p>
        </div>
        {openSession ? (
          <Link
            href={`/dashboard/cash/${openSession.id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Ver caja abierta
          </Link>
        ) : (
          <Link href="/dashboard/cash/open" className={buttonVariants()}>
            Abrir caja
          </Link>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Caja</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Apertura</TableHead>
              <TableHead>Cierre</TableHead>
              <TableHead className="text-right">Monto inicial</TableHead>
              <TableHead className="text-right">Cierre contado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No hay sesiones de caja todavía.
                </TableCell>
              </TableRow>
            ) : (
              result.data.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {session.name || "Caja principal"}
                    {!session.closedAt && (
                      <Badge className="ml-2" variant="default">Abierta</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {session.staffName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(session.openedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {session.closedAt ? formatDate(session.closedAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(session.initialAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {session.closingAmount ? formatMoney(session.closingAmount) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/cash/${session.id}`}
                      className="inline-flex h-7 items-center rounded-lg px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      Ver
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
