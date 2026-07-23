"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import { canAccessPath, getDefaultRouteForRole } from "@/lib/rbac";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, role, loading } = useAuth();
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    if (loading || !user || !profile?.trialAccount) {
      setTrialExpired(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const denyTrialAccess = async (message: string) => {
      if (cancelled) return;
      setTrialExpired(true);
      window.sessionStorage.setItem("insightflow-trial-access-error", message);
      await signOut(auth);
      if (!cancelled) router.replace("/login");
    };

    const validateTrial = async () => {
      const localEnd = profile.trialEndsAt ? new Date(profile.trialEndsAt) : null;
      if (!localEnd || Number.isNaN(localEnd.getTime()) || localEnd.getTime() <= Date.now()) {
        await denyTrialAccess("Thời gian dùng thử đã kết thúc. Vui lòng liên hệ InsightFlow để tiếp tục sử dụng.");
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/auth/trial-status", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = await response.json().catch(() => null);
        if (response.status === 403) {
          await denyTrialAccess(result?.error || "Tài khoản dùng thử đã hết hạn.");
        }
      } catch (error) {
        console.error("[Trial access] Could not verify trial status:", error);
      }
    };

    void validateTrial();
    timer = setInterval(() => void validateTrial(), 60_000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [loading, profile?.trialAccount, profile?.trialEndsAt, router, user]);

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

  if (trialExpired) {
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
