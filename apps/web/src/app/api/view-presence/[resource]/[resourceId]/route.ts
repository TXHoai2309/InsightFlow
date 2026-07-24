import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { verifyBearerToken } from "@/lib/server/auth";
import { db, dbData } from "@/lib/server/firebaseAdmin";
import {
  canAccessViewPresence,
  getScopedPresenceDocumentId,
  normalizePresenceBrandKey,
} from "@/lib/server/view-presence-scope";

type PresenceResource = "alerts" | "leads";

interface RouteContext {
  params: {
    resource: string;
    resourceId: string;
  };
}

const ACTIVE_WINDOW_MS = 120_000;
const ALLOWED_ROLES: Record<PresenceResource, ReadonlySet<string>> = {
  alerts: new Set(["brand_manager", "crisis_employee", "crisis_staff"]),
  leads: new Set(["brand_manager", "lead_employee", "lead_staff"]),
};

function isPresenceResource(value: string): value is PresenceResource {
  return value === "alerts" || value === "leads";
}

function readString(value: unknown, maxLength = 200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function readPermissions(value: unknown) {
  return Array.isArray(value)
    ? value.filter((permission): permission is string => typeof permission === "string")
    : [];
}

async function getUserProfile(uid: string) {
  const primaryProfile = await db.collection("users").doc(uid).get();
  if (primaryProfile.exists) return primaryProfile.data() || {};

  const dataProfile = await dbData.collection("users").doc(uid).get();
  return dataProfile.exists ? dataProfile.data() || {} : {};
}

async function authorizePresence(request: NextRequest, resource: string, resourceId: string) {
  if (!isPresenceResource(resource) || !readString(resourceId, 240)) return null;

  const user = await verifyBearerToken(request.headers.get("authorization"));
  if (!user) return null;

  const profile = await getUserProfile(user.uid);
  if (profile.disabled === true) return null;

  const role = readString(profile.role || user.role, 60);
  const permissions = readPermissions(profile.permissions || user.permissions);
  const brandKey = normalizePresenceBrandKey(
    profile.brandId ||
    profile.brandName ||
    user.brandId ||
    user.brandName,
  );
  const requiredPermission = resource === "alerts" ? "alerts" : "leads";

  if (!canAccessViewPresence({
    brandKey,
    role,
    permissions,
    requiredPermission,
    allowedRoles: ALLOWED_ROLES[resource],
  })) {
    return null;
  }

  const collectionName = resource === "alerts"
    ? "alert_view_presence"
    : "lead_view_presence";
  const presenceId = getScopedPresenceDocumentId(brandKey, readString(resourceId, 240));
  const viewers = db.collection(collectionName).doc(presenceId).collection("viewers");

  return {
    user,
    profile,
    viewers,
  };
}

async function listActiveViewers(
  viewers: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>,
) {
  const snapshot = await viewers.get();
  const activeSince = Date.now() - ACTIVE_WINDOW_MS;
  const expired: FirebaseFirestore.DocumentReference[] = [];
  const active = snapshot.docs.flatMap((viewerDoc) => {
    const data = viewerDoc.data();
    const lastSeenAtMs = data.lastSeenAt?.toMillis?.() || 0;
    if (lastSeenAtMs < activeSince) {
      expired.push(viewerDoc.ref);
      return [];
    }
    return [{
      uid: viewerDoc.id,
      displayName: readString(data.displayName) || readString(data.email) || "Người dùng",
      email: readString(data.email),
      photoURL: readString(data.photoURL, 2_000),
      lastSeenAt: new Date(lastSeenAtMs).toISOString(),
    }];
  });

  if (expired.length > 0) {
    const batch = db.batch();
    expired.forEach((reference) => batch.delete(reference));
    await batch.commit();
  }

  return active.sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt));
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const access = await authorizePresence(request, params.resource, params.resourceId);
    if (!access) {
      return NextResponse.json({ error: "Bạn không có quyền xem trạng thái này." }, { status: 403 });
    }
    return NextResponse.json({ viewers: await listActiveViewers(access.viewers) });
  } catch (error) {
    console.error("[View presence API] load failed:", error);
    return NextResponse.json({ error: "Không thể tải người đang xem." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const access = await authorizePresence(request, params.resource, params.resourceId);
    if (!access) {
      return NextResponse.json({ error: "Bạn không có quyền cập nhật trạng thái này." }, { status: 403 });
    }

    await access.viewers.doc(access.user.uid).set({
      uid: access.user.uid,
      displayName:
        readString(access.profile.displayName) ||
        readString(access.user.name) ||
        readString(access.user.email) ||
        "Người dùng",
      email: readString(access.profile.email) || readString(access.user.email),
      photoURL: readString(access.profile.photoURL, 2_000) || readString(access.user.picture, 2_000),
      lastSeenAt: Timestamp.now(),
    }, { merge: true });

    return NextResponse.json({ viewers: await listActiveViewers(access.viewers) });
  } catch (error) {
    console.error("[View presence API] heartbeat failed:", error);
    return NextResponse.json({ error: "Không thể cập nhật trạng thái đang xem." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const access = await authorizePresence(request, params.resource, params.resourceId);
    if (!access) {
      return NextResponse.json({ error: "Bạn không có quyền cập nhật trạng thái này." }, { status: 403 });
    }
    await access.viewers.doc(access.user.uid).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[View presence API] leave failed:", error);
    return NextResponse.json({ error: "Không thể đóng trạng thái đang xem." }, { status: 500 });
  }
}
