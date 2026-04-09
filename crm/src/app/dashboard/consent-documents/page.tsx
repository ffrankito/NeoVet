import Link from "next/link";
import { Suspense } from "react";
import { getConsentDocuments } from "./actions";
import { getRole } from "@/lib/auth";
import { ConsentTable } from "@/components/admin/consent-documents/consent-table";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function ConsentDocumentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const role = await getRole();

  const result = await getConsentDocuments({ page });

  const canCreate = role === "admin" || role === "owner" || role === "vet";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Documentos de consentimiento
          </h1>
          <p className="text-muted-foreground">
            Autorizaciones y actas legales generadas
          </p>
        </div>

        {canCreate && (
          <Link
            href="/dashboard/consent-documents/new"
            className={buttonVariants()}
          >
            + Generar documento
          </Link>
        )}
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ConsentTable
          data={result.data}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
        />
      </Suspense>
    </div>
  );
}
