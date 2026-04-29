"use client";

import { useEffect, type ReactNode } from "react";
import authClient from "@/lib/auth-client";
import { useAuthStore, type AuthUser } from "@/lib/stores/auth-store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    if (isPending) {
      setLoading(true);
      return;
    }

    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role || "volunteer",
        image: session.user.image,
      } as AuthUser);
    } else {
      setUser(null);
    }
  }, [session, isPending, setUser, setLoading]);

  return <>{children}</>;
}
