import { StaffForm } from "@/components/admin/staff/staff-form";

export default function NewStaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo miembro del equipo</h1>
        <p className="text-muted-foreground">Creá una cuenta de acceso al CRM.</p>
      </div>
      <StaffForm />
    </div>
  );
}
