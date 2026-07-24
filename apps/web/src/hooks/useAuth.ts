"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getIdTokenResult, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { buildUserRoleProfile, normalizeRole, type UserRoleProfile } from "@/lib/rbac";
import { useAuthStore } from "@/stores/auth.store";

let unsubscribeAuth: (() => void) | null = null;
let authSubscriberCount = 0;

const DEMO_USER = Object.freeze({
  uid: "demo-user",
  email: "demo@example.com",
  displayName: "Khách xem Demo",
  // Some shared panels request an auth token before loading optional history.
  // A deterministic placeholder keeps those components compatible in demo;
  // protected APIs still reject it and therefore can never expose real data.
  getIdToken: async () => "insightflow-demo-token",
}) as any;

const DEMO_PROFILE = Object.freeze({
  uid: "demo-user",
  email: "demo@example.com",
  displayName: "Khách xem Demo",
  role: "brand_manager",
  brandId: "demo_brand",
  brandName: "Demo Brand",
  defaultRoute: "/demo",
  permissions: [
    "dashboard",
    "mentions",
    "alerts",
    "leads",
    "reports",
    "staff_management",
    "brand_settings",
    "label_request_review",
    "response_settings",
  ],
}) as unknown as UserRoleProfile;

const DEMO_AUTH_STATE = Object.freeze({
  user: DEMO_USER,
  profile: DEMO_PROFILE,
  role: "brand_manager" as const,
  loading: false,
});

async function resolveProfileFromClaims(firebaseUser: NonNullable<typeof auth.currentUser>) {
  const tokenResult = await getIdTokenResult(firebaseUser, true);
  const claims = tokenResult.claims;

  if (!normalizeRole(claims.role)) {
    throw new Error("User is not provisioned with a valid InsightFlow role.");
  }

  return buildUserRoleProfile({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    storedRole: claims.role,
    storedBrandId: claims.brandId,
    storedBrandName: claims.brandName,
    storedBrandIds: claims.brandIds,
    storedWorkspaceIds: claims.workspaceIds,
    storedPermissions: claims.permissions,
    storedDefaultRoute: claims.defaultRoute,
    storedTemporaryPasswordIssued: claims.temporaryPasswordIssued,
    storedTrialAccount: claims.trialAccount,
    storedTrialDays: claims.trialDays,
    storedTrialStartAt: claims.trialStartAt,
    storedTrialEndsAt: claims.trialEndsAt,
    storedOnboarding: claims.onboarding,
  });
}

async function resolveUserProfile(firebaseUser: NonNullable<typeof auth.currentUser>) {
  const userRef = doc(db, "users", firebaseUser.uid);
  let storedData: Record<string, any> | null = null;

  try {
    const snapshot = await getDoc(userRef);
    storedData = snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.warn("Could not read Firestore user profile. Falling back to token claims.", error);
  }

  let resolvedProfile: UserRoleProfile;

  if (storedData && normalizeRole(storedData.role)) {
    if (storedData.disabled === true) {
      throw new Error("User account is disabled.");
    }

    resolvedProfile = buildUserRoleProfile({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      storedRole: storedData.role,
      storedBrandId: storedData.brandId,
      storedBrandName: storedData.brandName,
      storedBrandIds: storedData.brandIds,
      storedWorkspaceIds: storedData.workspaceIds,
      storedPermissions: storedData.permissions,
      storedDefaultRoute: storedData.defaultRoute,
      storedTemporaryPasswordIssued: storedData.temporaryPasswordIssued,
      storedTrialAccount: storedData.trialAccount,
      storedTrialDays: storedData.trialDays,
      storedTrialStartAt: storedData.trialStartAt,
      storedTrialEndsAt: storedData.trialEndsAt,
      storedOnboarding: storedData.onboarding,
    });
  } else {
    resolvedProfile = await resolveProfileFromClaims(firebaseUser);
  }

  // User profiles and login audit fields are managed by privileged backend
  // workflows. A regular employee may read this document but is intentionally
  // not allowed to write it, so login must not attempt an optional client write.

  return resolvedProfile;
}

function startAuthListener() {
  if (unsubscribeAuth) return;

  unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
    const {
      setUser,
      setProfile,
      setLoading,
      setProfileLoading,
    } = useAuthStore.getState();

    setUser(firebaseUser);
    setProfileLoading(true);

    if (!firebaseUser) {
      setProfile(null);
      setProfileLoading(false);
      setLoading(false);
      return;
    }

    try {
      const resolvedProfile = await resolveUserProfile(firebaseUser);
      setProfile(resolvedProfile);
    } catch (error) {
      console.error("Failed to resolve user role:", error);
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } finally {
      setProfileLoading(false);
      setLoading(false);
    }
  });
}

export function useAuth() {
  const pathname = usePathname();
  const isDemoMode = pathname.startsWith("/demo");
  const {
    user,
    profile,
    role,
    loading,
    profileLoading,
    setUser,
    setProfile,
    setLoading,
    setProfileLoading,
  } = useAuthStore();

  useEffect(() => {
    if (isDemoMode) return;

    authSubscriberCount += 1;
    startAuthListener();

    return () => {
      authSubscriberCount -= 1;
      if (authSubscriberCount <= 0 && unsubscribeAuth) {
        unsubscribeAuth();
        unsubscribeAuth = null;
        authSubscriberCount = 0;
      }
    };
  }, [isDemoMode, setLoading, setProfile, setProfileLoading, setUser]);

  // If in demo mode, override the auth return values
  if (isDemoMode) {
    return DEMO_AUTH_STATE;
  }

  return { user, profile, role: role as any, loading: loading || profileLoading };
}

