"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import authClient from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Map,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

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
    <header className="navbar-surface flex h-14 shrink-0 items-center justify-between px-5 relative z-50">
      {/* Left */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="logo-mark flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-105">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            DisasterLink
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/dashboard">
            <Button
              variant={pathname === "/dashboard" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5 text-[13px] font-medium h-8 px-3"
            >
              <Map className="h-3.5 w-3.5" />
              Map
            </Button>
          </Link>
        </nav>
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
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/8 text-[11px] font-semibold text-primary">
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
