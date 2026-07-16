import { auth } from "@/lib/firebase";
import type { RoleOnboardingState, UserRole } from "@/lib/rbac";

type OnboardingRole = Exclude<UserRole, "admin">;

async function saveRoleOnboarding(
  role: OnboardingRole,
  version: string,
  token: string,
): Promise<Response> {
  return fetch("/api/auth/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role, version }),
  });
}

export async function completeRoleOnboarding(
  role: OnboardingRole,
  version: string,
): Promise<RoleOnboardingState> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Bạn cần đăng nhập để lưu trạng thái hướng dẫn.");
  }

  let token = await user.getIdToken(true);
  let response = await saveRoleOnboarding(role, version, token);

  if (response.status === 401) {
    await user.reload();
    token = await user.getIdToken(true);
    response = await saveRoleOnboarding(role, version, token);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Chưa thể lưu trạng thái hướng dẫn.");
  }

  await user.getIdToken(true);
  return data.data.state as RoleOnboardingState;
}
