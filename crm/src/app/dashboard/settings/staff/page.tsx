import { getAllStaff } from "./actions";
import { buttonVariants } from "@/components/ui/button-variants";
import { StaffList } from "@/components/admin/staff/staff-list";

export default async function StaffPage() {
  const members = await getAllStaff();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="text-muted-foreground">Gestioná los usuarios del sistema y sus roles.</p>
        </div>
        <a href="/dashboard/settings/staff/new" className={buttonVariants()}>
          + Nuevo miembro
        </a>
      </div>
      <StaffList members={members} />
    </div>
  );
}
