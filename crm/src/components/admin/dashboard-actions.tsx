"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function DashboardActions() {
  return (
    <>
      <Link href="/dashboard/clients/new" className={buttonVariants({ variant: "outline" })}>
        Nuevo cliente
      </Link>
      <Link href="/dashboard/appointments/new" className={buttonVariants({ variant: "outline" })}>
        Nuevo turno programado
      </Link>
    </>
  );
}
