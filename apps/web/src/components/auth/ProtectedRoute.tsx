"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import { canAccessPath, getDefaultRouteForRole } from "@/lib/rbac";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (profile?.temporaryPasswordIssued && pathname !== "/change-password") {
      router.replace("/change-password");
      return;
    }

    if (!profile?.temporaryPasswordIssued && pathname === "/change-password") {
      router.replace(profile?.defaultRoute || getDefaultRouteForRole(role as any));
      return;
    }

    if (!canAccessPath(role as any, pathname || "", profile?.permissions)) {
      router.replace(profile?.defaultRoute || getDefaultRouteForRole(role as any));
    }
  }, [loading, pathname, profile?.defaultRoute, profile?.permissions, profile?.temporaryPasswordIssued, role, router, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]">
        {t("auth.protected.loading")}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (profile?.temporaryPasswordIssued && pathname !== "/change-password") {
    return null;
  }

  if (!profile?.temporaryPasswordIssued && pathname === "/change-password") {
    return null;
  }

  if (!canAccessPath(role as any, pathname || "", profile?.permissions)) {
    return null;
  }

  return <>{children}</>;
}
