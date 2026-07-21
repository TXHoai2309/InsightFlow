import { NextRequest, NextResponse } from "next/server";
import { verifyBearerToken } from "@/lib/server/auth";
import { db } from "@/lib/server/firebaseAdmin";

const ACTIVE_WINDOW_MS = 120_000;

type ViewerRecord = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  brandKey: string;
  lastSeenAt: FirebaseFirestore.Timestamp;
};

type ActiveViewer = {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  lastSeenAt: string;
};

function normalizeBrandKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getViewerIdentity(request: NextRequest) {
  const token = await verifyBearerToken(request.headers.get("authorization"));
  if (!token) return null;

  const userSnapshot = await db.collection("users").doc(token.uid).get();
  const profile = userSnapshot.exists ? userSnapshot.data() || {} : {};
  const brandKey = normalizeBrandKey(
    profile.brandId ||
      profile.brand_id ||
      profile.companyDomain ||
      profile.company_domain ||
      token.brandId ||
      token.companyDomain,
  );

  return {
    uid: token.uid,
    displayName: String(profile.displayName || profile.fullName || token.name || token.email || "Người dùng"),
    email: String(profile.email || token.email || ""),
    photoURL: String(profile.photoURL || token.picture || ""),
    brandKey,
  };
}

function getViewerCollection(alertId: string) {
  return db.collection("alert_view_presence").doc(alertId).collection("viewers");
}

async function listActiveViewers(alertId: string) {
  const snapshot = await getViewerCollection(alertId).get();
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
    if (!validateAlertId(params.alertId)) return NextResponse.json({ error: "Cảnh báo không hợp lệ." }, { status: 400 });

    const viewers = await listActiveViewers(params.alertId);
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
    if (!validateAlertId(params.alertId)) return NextResponse.json({ error: "Cảnh báo không hợp lệ." }, { status: 400 });

    await getViewerCollection(params.alertId).doc(viewer.uid).set({
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
    if (!validateAlertId(params.alertId)) return NextResponse.json({ error: "Cảnh báo không hợp lệ." }, { status: 400 });

    await getViewerCollection(params.alertId).doc(viewer.uid).delete().catch(() => undefined);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Alert viewers API] leave error:", error);
    return NextResponse.json({ error: "Không thể kết thúc trạng thái đang xem." }, { status: 500 });
  }
}
