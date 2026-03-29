import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">AI Notebook</h1>
          <p className="text-sm text-muted-foreground">登录您的账户</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
