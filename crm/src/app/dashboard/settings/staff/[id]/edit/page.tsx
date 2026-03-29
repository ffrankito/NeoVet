import { notFound } from "next/navigation";
import { getAllStaff } from "../../actions";
import { StaffForm } from "@/components/admin/staff/staff-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditStaffPage({ params }: Props) {
  const { id } = await params;
  const allStaff = await getAllStaff();
  const member = allStaff.find((s) => s.id === id);
  if (!member) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar miembro</h1>
        <p className="text-muted-foreground">{member.name}</p>
      </div>
      <StaffForm member={member} />
    </div>
  );
}
