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

const LEAD_ROLES = new Set(["brand_manager", "lead_employee"]);

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
      requiredPermission: "leads",
      allowedRoles: LEAD_ROLES,
    }),
  };
}

function getViewerCollection(leadId: string, brandKey: string) {
  // Keep viewer identities inside the authenticated brand namespace even if
  // an ID is guessed or reused by another tenant.
  return db.collection("lead_view_presence").doc(getScopedPresenceDocumentId(brandKey, leadId)).collection("viewers");
}

async function listActiveViewers(leadId: string, brandKey: string) {
  const snapshot = await getViewerCollection(leadId, brandKey).get();
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

function validateLeadId(leadId: string) {
  return leadId.length > 0 && leadId.length <= 200 && !leadId.includes("/");
}

export async function GET(request: NextRequest, { params }: { params: { leadId: string } }) {
  try {
    const viewer = await getViewerIdentity(request);
    if (!viewer) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    if (!viewer.authorized) return NextResponse.json({ error: "Bạn không có quyền xem khách hàng này." }, { status: 403 });
    if (!validateLeadId(params.leadId)) return NextResponse.json({ error: "Khách hàng không hợp lệ." }, { status: 400 });

    const viewers = await listActiveViewers(params.leadId, viewer.brandKey);
    return NextResponse.json({ success: true, viewers });
  } catch (error) {
    console.error("[Lead viewers API] load error:", error);
    return NextResponse.json({ error: "Không thể tải người đang xem." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { leadId: string } }) {
  try {
    const viewer = await getViewerIdentity(request);
    if (!viewer) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    if (!viewer.authorized) return NextResponse.json({ error: "Bạn không có quyền xem khách hàng này." }, { status: 403 });
    if (!validateLeadId(params.leadId)) return NextResponse.json({ error: "Khách hàng không hợp lệ." }, { status: 400 });

    await getViewerCollection(params.leadId, viewer.brandKey).doc(viewer.uid).set({
      ...viewer,
      lastSeenAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Lead viewers API] heartbeat error:", error);
    return NextResponse.json({ error: "Không thể cập nhật trạng thái đang xem." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { leadId: string } }) {
  try {
    const viewer = await getViewerIdentity(request);
    if (!viewer) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
    if (!viewer.authorized) return NextResponse.json({ error: "Bạn không có quyền xem khách hàng này." }, { status: 403 });
    if (!validateLeadId(params.leadId)) return NextResponse.json({ error: "Khách hàng không hợp lệ." }, { status: 400 });

    await getViewerCollection(params.leadId, viewer.brandKey).doc(viewer.uid).delete().catch(() => undefined);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Lead viewers API] leave error:", error);
    return NextResponse.json({ error: "Không thể kết thúc trạng thái đang xem." }, { status: 500 });
  }
}
