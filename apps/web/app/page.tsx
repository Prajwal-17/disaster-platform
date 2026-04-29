"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { ShieldCheck, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function Home() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

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

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="border-border/40 flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <ShieldCheck className="text-primary-foreground h-4 w-4" />
          </div>
          <span className="text-foreground text-[15px] font-bold tracking-tight">
            DisasterLink
          </span>
        </div>

        <div className="flex items-center">
          {!isLoading &&
            (user ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 gap-2 rounded-full pl-1 pr-2 hover:bg-muted/80"
                    >
                      <Avatar className="h-7 w-7 border border-border/50">
                        {user.image && <AvatarImage src={user.image} alt={user.name || ""} />}
                        <AvatarFallback className={`text-[11px] font-semibold text-white ${getColorFromName(user.name || "")}`}>
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
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/sign-in">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            ))}
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <h1 className="text-foreground mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
          Home Page
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          This is a placeholder for the actual landing page. The primary route
          currently displays this dummy content until the marketing and
          informational sections are built.
        </p>
      </main>
    </div>
  );
}
