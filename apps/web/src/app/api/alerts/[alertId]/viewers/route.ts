<<<<<<< HEAD
import { NextResponse } from "next/server";

function retiredResponse() {
  return NextResponse.json(
    { error: "Presence đã chuyển sang đồng bộ Firestore realtime phía client." },
    { status: 410 },
  );
}

export const GET = retiredResponse;
export const POST = retiredResponse;
export const DELETE = retiredResponse;
=======
import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firebaseAdmin";
import {
  canAccessViewPresence,
  getScopedPresenceDocumentId,
  normalizePresenceBrandKey,
} from "@/lib/server/view-presence-scope";

const ACTIVE_WINDOW_MS = 120_000;

type ViewerRecord = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  brandKey: string;
  lastSeenAt: FirebaseFirestore.Timestamp;
};

const ALERT_ROLES = new Set(["brand_manager", "crisis_employee"]);

type ActiveViewer = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  lastSeenAt: string;
};

async function getViewerIdentity(request: NextRequest) {
  const token = await verifyBearerToken(request.headers.get("authorization"));
  if (!token) return null;

  const userSnapshot = await db.collection("users").doc(token.uid).get();
  const profile = userSnapshot.exists ? userSnapshot.data() || {} : {};
  const brandKey = normalizePresenceBrandKey(
    profile.brandId ||
      profile.brand_id ||
      profile.companyDomain ||
      profile.company_domain ||
      token.brandId ||
      token.companyDomain,
  );

  const role = String(profile.role || token.role || "");
  const permissions = Array.isArray(profile.permissions)
    ? profile.permissions.map((permission: unknown) => String(permission))
    : [];

  return {
    uid: token.uid,
    displayName: String(profile.displayName || profile.fullName || token.name || token.email || "Người dùng"),
    email: String(profile.email || token.email || ""),
    photoURL: String(profile.photoURL || token.picture || ""),
    brandKey,
    authorized: canAccessViewPresence({
      brandKey,
      role,
      permissions,
      requiredPermission: "alerts",
      allowedRoles: ALERT_ROLES,
    }),
  };
}

function getViewerCollection(alertId: string, brandKey: string) {
  // Presence is namespaced by the authenticated business scope. A user who
  // guesses an alert ID from another brand cannot read or join its viewer list.
  return db.collection("alert_view_presence").doc(getScopedPresenceDocumentId(brandKey, alertId)).collection("viewers");
}

async function listActiveViewers(alertId: string, brandKey: string) {
  const snapshot = await getViewerCollection(alertId, brandKey).get();
  const activeSince = Date.now() - ACTIVE_WINDOW_MS;
  const staleDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  const viewers: ActiveViewer[] = snapshot.docs.flatMap((viewerDoc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = viewerDoc.data() as Partial<ViewerRecord>;
    const lastSeenAt = data.lastSeenAt?.toMillis?.() || 0;
    if (lastSeenAt < activeSince) {
      staleDocs.push(viewerDoc);
      return [];
    }
    return [{
      uid: viewerDoc.id,
      displayName: data.displayName || data.email || "Người dùng",
      email: data.email || "",
      photoURL: data.photoURL || "",
      lastSeenAt: new Date(lastSeenAt).toISOString(),
    }];
  });

  if (staleDocs.length > 0) {
    const batch = db.batch();
    staleDocs.forEach((viewerDoc) => batch.delete(viewerDoc.ref));
    await batch.commit().catch(() => undefined);
  }

  return viewers.sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt));
}

function validateAlertId(alertId: string) {
  return alertId.length > 0 && alertId.length <= 200 && !alertId.includes("/");
}

export async function GET(request: NextRequest, { params }: { params: { alertId: string } }) {
  try {
    const viewer = await getViewerIdentity(request);
    if (!viewer) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    if (!viewer.authorized) return NextResponse.json({ error: "Bạn không có quyền xem cảnh báo này." }, { status: 403 });
    if (!validateAlertId(params.alertId)) return NextResponse.json({ error: "Cảnh báo không hợp lệ." }, { status: 400 });

    const viewers = await listActiveViewers(params.alertId, viewer.brandKey);
    return NextResponse.json({ success: true, viewers });
  } catch (error) {
    console.error("[Alert viewers API] load error:", error);
    return NextResponse.json({ error: "Không thể tải người đang xem." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { alertId: string } }) {
  try {
    const viewer = await getViewerIdentity(request);
    if (!viewer) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    if (!viewer.authorized) return NextResponse.json({ error: "Bạn không có quyền xem cảnh báo này." }, { status: 403 });
    if (!validateAlertId(params.alertId)) return NextResponse.json({ error: "Cảnh báo không hợp lệ." }, { status: 400 });

    await getViewerCollection(params.alertId, viewer.brandKey).doc(viewer.uid).set({
      ...viewer,
      lastSeenAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Alert viewers API] heartbeat error:", error);
    return NextResponse.json({ error: "Không thể cập nhật trạng thái đang xem." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { alertId: string } }) {
  try {
    const viewer = await getViewerIdentity(request);
    if (!viewer) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    if (!viewer.authorized) return NextResponse.json({ error: "Bạn không có quyền xem cảnh báo này." }, { status: 403 });
    if (!validateAlertId(params.alertId)) return NextResponse.json({ error: "Cảnh báo không hợp lệ." }, { status: 400 });

    await getViewerCollection(params.alertId, viewer.brandKey).doc(viewer.uid).delete().catch(() => undefined);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Alert viewers API] leave error:", error);
    return NextResponse.json({ error: "Không thể kết thúc trạng thái đang xem." }, { status: 500 });
  }
}
>>>>>>> 489ec048e8aeef754ec9ab4918917709296cca11
