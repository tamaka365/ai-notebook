import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">AI Notebook</h1>
          <p className="text-sm text-muted-foreground">重置您的账户密码</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
