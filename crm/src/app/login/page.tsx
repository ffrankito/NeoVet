import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">NeoVet CRM</h1>
          <p className="text-sm text-muted-foreground">
            Ingresá con tu cuenta para continuar
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
