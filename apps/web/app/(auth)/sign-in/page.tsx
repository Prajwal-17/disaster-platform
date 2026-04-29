"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import authClient from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
    <div className="animate-fade-in-up w-full max-w-[400px]">
      <div className="auth-card px-8 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-5 flex items-center justify-center gap-2.5">
            <Image
              src="/disasterlink-logo-cream.jpg"
              alt="DisasterLink logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl bg-[#FFF8F2] object-contain"
              priority
            />
            <span className="text-foreground text-xl font-bold tracking-tight">
              DisasterLink
            </span>
          </div>
          <h1 className="text-foreground text-[22px] font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Sign in to access the coordination platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="stagger-children space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-foreground/80 text-[13px] font-medium"
            >
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
            <Label
              htmlFor="password"
              className="text-foreground/80 text-[13px] font-medium"
            >
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
            className="btn-primary mt-2 w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
