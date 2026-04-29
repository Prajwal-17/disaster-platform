"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import authClient from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck, HeartHandshake, Building, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "volunteer", label: "Volunteer", desc: "Respond to resource requests on the ground", icon: HeartHandshake },
  { value: "ngo", label: "NGO", desc: "Coordinate incidents and manage requests", icon: Building },
  { value: "admin", label: "Admin", desc: "Full platform administration access", icon: ShieldAlert },
] as const;

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("volunteer");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
        role,
      } as any);

      if (result.error) {
        toast.error(result.error.message || "Sign up failed");
        return;
      }

      toast.success("Account created successfully");
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
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Join the disaster coordination network
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 stagger-children">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[13px] font-medium text-foreground/80">
              Full Name
            </Label>
            <input
              id="name"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="input-field w-full"
            />
          </div>

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
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="input-field w-full"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-[13px] font-medium text-foreground/80">Your Role</Label>
            <div className="grid grid-cols-1 gap-3">
              {ROLES.map((r) => {
                const isSelected = role === r.value;
                const Icon = r.icon;
                return (
                  <div
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/[0.03] shadow-sm ring-1 ring-primary/20"
                        : "border-border bg-transparent hover:border-border/80 hover:bg-muted/50"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                        isSelected
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-border/50 bg-background text-muted-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-1 pr-6">
                      <span className={cn("text-sm font-semibold", isSelected ? "text-foreground" : "text-foreground/80")}>
                        {r.label}
                      </span>
                      <span className="text-[13px] leading-tight text-muted-foreground">
                        {r.desc}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-in fade-in zoom-in duration-200">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
