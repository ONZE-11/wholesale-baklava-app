import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-muted/40 to-background">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
