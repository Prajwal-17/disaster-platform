"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import authClient from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Image from "next/image";

const ROLES = [
  {
    value: "volunteer",
    label: "Volunteer",
    desc: "Respond to resource requests on the ground",
  },
  { value: "donor", label: "Donor", desc: "Provide resources and funding" },
  { value: "ngo", label: "NGO", desc: "Coordinate incidents and requests" },
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
            Create your account
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Join the disaster coordination network
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="stagger-children space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="text-foreground/80 text-[13px] font-medium"
            >
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
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="input-field w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground/80 text-[13px] font-medium">
              Your Role
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="focus:border-primary focus:ring-primary/12 h-11 w-full rounded-[10px] border-[oklch(0.90_0.006_250)] bg-[oklch(0.995_0.001_250)] text-sm focus:ring-3">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex flex-col py-0.5">
                      <span className="font-medium">{r.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {r.desc}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="btn-primary mt-2 w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
