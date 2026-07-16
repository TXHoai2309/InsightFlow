import { auth } from "@/lib/firebase";
import type { RoleOnboardingState, UserRole } from "@/lib/rbac";

type OnboardingRole = Exclude<UserRole, "admin">;

export async function completeRoleOnboarding(
  role: OnboardingRole,
  version: string,
): Promise<RoleOnboardingState> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Bạn cần đăng nhập để lưu trạng thái hướng dẫn.");
  }

  const token = await user.getIdToken();
  const response = await fetch("/api/auth/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role, version }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Chưa thể lưu trạng thái hướng dẫn.");
  }

  await user.getIdToken(true);
  return data.data.state as RoleOnboardingState;
}
