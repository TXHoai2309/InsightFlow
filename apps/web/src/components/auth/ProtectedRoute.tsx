"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccessPath, getDefaultRouteForRole } from "@/lib/rbac";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canAccessPath(role, pathname || "", profile?.permissions)) {
      router.replace(profile?.defaultRoute || getDefaultRouteForRole(role));
    }
  }, [loading, pathname, profile?.permissions, role, router, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]">
        Dang kiem tra quyen truy cap...
      </div>
    );
  }

  if (!user || !canAccessPath(role, pathname || "", profile?.permissions)) {
    return null;
  }

  return <>{children}</>;
}
