import { ClientForm } from "@/components/admin/clients/client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo cliente</h1>
        <p className="text-muted-foreground">Registrá un nuevo dueño de mascota</p>
      </div>
      <ClientForm />
    </div>
  );
}
