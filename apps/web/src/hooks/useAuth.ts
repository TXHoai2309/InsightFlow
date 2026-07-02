"use client";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { buildUserRoleProfile } from "@/lib/rbac";
import { useAuthStore } from "@/stores/auth.store";

let unsubscribeAuth: (() => void) | null = null;
let authSubscriberCount = 0;

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
      const userRef = doc(db, "users", firebaseUser.uid);
      const snapshot = await getDoc(userRef);
      const storedData = snapshot.exists() ? snapshot.data() : {};
      const resolvedProfile = buildUserRoleProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        storedRole: storedData.role,
        storedBrandId: storedData.brandId,
        storedBrandName: storedData.brandName,
        storedPermissions: storedData.permissions,
      });

      await setDoc(
        userRef,
        {
          ...resolvedProfile,
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdAt: storedData.createdAt || new Date().toISOString(),
        },
        { merge: true },
      );

      setProfile(resolvedProfile);
    } catch (error) {
      console.error("Failed to resolve user role:", error);
      setProfile(buildUserRoleProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      }));
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
