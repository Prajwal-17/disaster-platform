"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import authClient from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Sign in failed");
        return;
      }

      toast.success("Signed in successfully");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] animate-fade-in-up">
      <div className="auth-card px-8 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-5 flex items-center justify-center gap-2.5">
            <div className="logo-mark flex h-10 w-10 items-center justify-center rounded-xl">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              DisasterLink
            </span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to access the coordination platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 stagger-children">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[13px] font-medium text-foreground/80">
              Email
            </Label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="input-field w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[13px] font-medium text-foreground/80">
              Password
            </Label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="input-field w-full"
            />
          </div>

          <Button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
