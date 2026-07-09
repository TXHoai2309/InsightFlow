"use client";
import { useEffect } from "react";
import { getIdTokenResult, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { buildUserRoleProfile, normalizeRole, type UserRoleProfile } from "@/lib/rbac";
import { useAuthStore } from "@/stores/auth.store";

let unsubscribeAuth: (() => void) | null = null;
let authSubscriberCount = 0;

function stripUndefinedFields<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

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
    storedPermissions: claims.permissions,
    storedDefaultRoute: claims.defaultRoute,
    storedTemporaryPasswordIssued: claims.temporaryPasswordIssued,
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
      storedPermissions: storedData.permissions,
      storedDefaultRoute: storedData.defaultRoute,
      storedTemporaryPasswordIssued: storedData.temporaryPasswordIssued,
      storedOnboarding: storedData.onboarding,
    });
  } else {
    resolvedProfile = await resolveProfileFromClaims(firebaseUser);
  }

  void setDoc(
    userRef,
    stripUndefinedFields({
      ...resolvedProfile,
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdAt: storedData?.createdAt || new Date().toISOString(),
    }),
    { merge: true },
  ).catch((error) => {
    console.warn("Could not update Firestore user profile after login.", error);
  });

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
  }, [setLoading, setProfile, setProfileLoading, setUser]);

  return { user, profile, role, loading: loading || profileLoading };
}
