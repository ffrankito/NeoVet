import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/admin/app-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await getRole();

return (
    <div className="flex min-h-screen">
      <AppSidebar user={user} role={role} />
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
