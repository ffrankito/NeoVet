import type { User } from "@supabase/supabase-js";
import type { StaffRole } from "@/db/schema";
import { UserMenu } from "./user-menu";

export function Topbar({
  user,
  role,
}: {
  user: User;
  role: StaffRole | null;
}) {
  return (
    <header className="sticky top-0 z-30 hidden h-14 items-center justify-end gap-4 border-b bg-background/80 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:flex">
      <UserMenu email={user.email ?? ""} role={role} />
    </header>
  );
}
