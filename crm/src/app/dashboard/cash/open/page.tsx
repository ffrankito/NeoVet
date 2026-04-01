import { OpenCashForm } from "@/components/admin/cash/open-cash-form";

export default function OpenCashPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abrir caja</h1>
        <p className="text-muted-foreground">Registrá el monto inicial de efectivo</p>
      </div>
      <OpenCashForm />
    </div>
  );
}
