"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import authClient from "@/lib/auth-client";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  ShieldCheck,
  Map,
  LogOut,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

const getColorFromName = (name: string) => {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const handleSignOut = async () => {
    await authClient.signOut();
    useAuthStore.getState().reset();
    toast.success("Signed out");
    router.push("/sign-in");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const roleBadgeStyle = (role: string) => {
    const styles: Record<string, string> = {
      volunteer: "bg-[oklch(0.92_0.05_250)] text-[oklch(0.38_0.14_250)] border-[oklch(0.88_0.05_250)]",
      donor: "bg-[oklch(0.92_0.06_155)] text-[oklch(0.35_0.12_155)] border-[oklch(0.88_0.06_155)]",
      ngo: "bg-[oklch(0.93_0.05_80)] text-[oklch(0.42_0.12_80)] border-[oklch(0.89_0.05_80)]",
      admin: "bg-[oklch(0.93_0.04_25)] text-[oklch(0.42_0.14_25)] border-[oklch(0.89_0.04_25)]",
    };
    return styles[role] || "bg-secondary text-secondary-foreground";
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between px-6 relative z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="logo-mark flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform group-hover:scale-105">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            DisasterLink
          </span>
        </Link>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {user && (
          <Badge
            variant="outline"
            className={`text-[10px] font-semibold uppercase tracking-wider ${roleBadgeStyle(user.role)}`}
          >
            {user.role}
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 gap-2 rounded-full pl-1 pr-2 hover:bg-muted/80"
            >
              <Avatar className="h-7 w-7 border border-border/50">
                {user?.image && <AvatarImage src={user.image} alt={user.name || ""} />}
                <AvatarFallback className={`text-[11px] font-semibold text-white ${getColorFromName(user?.name || "")}`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 z-[9999] p-1.5">
            <div className="px-2.5 py-2">
              <p className="text-sm font-semibold text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive gap-2 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
