"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendResetCode, resetPassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type Step = "send" | "verify";

export function ResetPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("send");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.set("email", email);

    const result = await sendResetCode(formData);

    setIsLoading(false);

    if (result.success) {
      setSuccess("验证码已发送到您的邮箱，请查收");
      setStep("verify");
      setCountdown(60);
    } else {
      setError(result.error ?? "发送失败，请稍后重试");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("code", code);
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);

    const result = await resetPassword(formData);

    setIsLoading(false);

    if (result.success) {
      setSuccess("密码重置成功，即将跳转到登录页面...");
      setTimeout(() => router.push("/login"), 1500);
    } else {
      setError(result.error ?? "重置失败，请稍后重试");
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>重置密码</CardTitle>
        <CardDescription>
          {step === "send"
            ? "请输入您的注册邮箱，我们将发送验证码"
            : `验证码已发送至 ${email}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {step === "send" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "发送中..." : "发送验证码"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">验证码</Label>
              <Input
                id="code"
                type="text"
                placeholder="请输入 6 位验证码"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {countdown > 0 ? (
                  <span>{countdown} 秒后可重新获取验证码</span>
                ) : (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => {
                      setStep("send");
                      setCode("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    重新获取验证码
                  </button>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="至少 8 位"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "重置中..." : "重置密码"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
