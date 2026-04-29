"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { LogOut, Map, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      volunteer: "bg-blue-100 text-blue-700",
      donor: "bg-green-100 text-green-700",
      ngo: "bg-amber-100 text-amber-700",
      admin: "bg-red-100 text-red-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4">
      {/* Left */}
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-md">
            <ShieldCheck className="text-primary-foreground h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight">
            DisasterLink
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/dashboard">
            <Button
              variant={pathname === "/dashboard" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5 text-[13px]"
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
            className={`text-xs ${roleBadge(user.role)}`}
          >
            {user.role.toUpperCase()}
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-muted-foreground text-xs">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
