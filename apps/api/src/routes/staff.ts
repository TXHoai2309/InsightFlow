import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { FieldValue } from "firebase-admin/firestore";
import { authAdmin, db } from "../services/firebase";
import { verifyToken } from "../middleware/auth";
import { validateStrongPassword } from "../utils/passwordPolicy";

type StaffRole = "crisis_staff" | "lead_staff";

const operationPermissions = {
  dashboard: "dashboard",
  mentions: "mentions",
  alerts: "alerts",
  reports: "reports",
  leads: "leads",
} as const;

const roleAllowedPermissions: Record<StaffRole, string[]> = {
  crisis_staff: ["dashboard", "mentions", "alerts", "reports"],
  lead_staff: ["dashboard", "mentions", "leads", "reports"],
};

const defaultRoutePriority: Record<StaffRole, Array<{ permission: string; route: string }>> = {
  crisis_staff: [
    { permission: "alerts", route: "/alerts" },
    { permission: "mentions", route: "/mentions" },
    { permission: "reports", route: "/reports" },
    { permission: "dashboard", route: "/dashboard" },
  ],
  lead_staff: [
    { permission: "leads", route: "/leads" },
    { permission: "mentions", route: "/mentions" },
    { permission: "reports", route: "/reports" },
    { permission: "dashboard", route: "/dashboard" },
  ],
};

function getDomainFromEmail(email: string) {
  return email.includes("@") ? email.split("@")[1].toLowerCase() : "";
}

function isStaffRole(role: unknown): role is StaffRole {
  return role === "crisis_staff" || role === "lead_staff";
}

function resolvePermissions(staffRole: StaffRole, operations: unknown) {
  const requested = Array.isArray(operations) ? operations : [];
  const permissions = requested
    .map((item) => operationPermissions[item as keyof typeof operationPermissions])
    .filter(Boolean);
  const allowed = roleAllowedPermissions[staffRole];
  const scoped = permissions.filter((permission) => allowed.includes(permission));

  if (!scoped.includes("dashboard")) {
    scoped.unshift("dashboard");
  }

  return Array.from(new Set(scoped));
}

function resolveDefaultRoute(staffRole: StaffRole, permissions: string[]) {
  return defaultRoutePriority[staffRole].find((item) => permissions.includes(item.permission))?.route || "/dashboard";
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const randomPart = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `IF@${randomPart}24`;
}

async function ensureBrandManager(request: FastifyRequest, reply: FastifyReply) {
  await verifyToken(request, reply);
  if (reply.sent) return null;

  const requester = (request as any).user;
  const requesterDoc = await db.collection("users").doc(requester.uid).get();
  const requesterProfile = requesterDoc.exists ? requesterDoc.data() : null;

  if (requesterProfile?.role !== "brand_manager") {
    reply.status(403).send({ success: false, error: "Brand Manager permission is required." });
    return null;
  }

  if (!requesterProfile.brandId || !requesterProfile.brandName) {
    reply.status(400).send({ success: false, error: "Brand Manager is not assigned to a brand." });
    return null;
  }

  return {
    uid: requester.uid,
    brandId: requesterProfile.brandId as string,
    brandName: requesterProfile.brandName as string,
  };
}

export default async function staffRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const manager = await ensureBrandManager(request, reply);
    if (!manager) return;

    try {
      const snapshot = await db
        .collection("users")
        .where("brandId", "==", manager.brandId)
        .where("role", "in", ["crisis_staff", "lead_staff"])
        .get();

      const staff = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: data.uid,
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          brandId: data.brandId,
          brandName: data.brandName,
          permissions: data.permissions || [],
          defaultRoute: data.defaultRoute,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          hasTemporaryPassword: data.temporaryPasswordIssued === true && Boolean(data.temporaryPassword),
        };
      });

      return { success: true, data: staff };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: error.message || "Failed to load staff." });
    }
  });

  fastify.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const manager = await ensureBrandManager(request, reply);
    if (!manager) return;

    const body = request.body as {
      fullName?: string;
      email?: string;
      temporaryPassword?: string;
      staffRole?: StaffRole;
      operations?: string[];
    };

    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const temporaryPassword = body.temporaryPassword?.trim();
    const staffRole = body.staffRole;

    if (!fullName || !email || !temporaryPassword || !isStaffRole(staffRole)) {
      return reply.status(400).send({
        success: false,
        error: "Full name, email, staffRole and temporaryPassword are required.",
      });
    }

    const passwordPolicy = validateStrongPassword(temporaryPassword);
    if (!passwordPolicy.valid) {
      return reply.status(400).send({
        success: false,
        error: passwordPolicy.errors.join(" "),
      });
    }

    const permissions = resolvePermissions(staffRole, body.operations);
    const defaultRoute = resolveDefaultRoute(staffRole, permissions);
    const companyDomain = getDomainFromEmail(email);

    try {
      let userRecord;
      let created = false;

      try {
        userRecord = await authAdmin.getUserByEmail(email);
        await authAdmin.updateUser(userRecord.uid, {
          displayName: fullName,
          password: temporaryPassword,
          emailVerified: true,
          disabled: false,
        });
      } catch (error: any) {
        if (error.code !== "auth/user-not-found") {
          throw error;
        }

        userRecord = await authAdmin.createUser({
          email,
          password: temporaryPassword,
          displayName: fullName,
          emailVerified: true,
          disabled: false,
        });
        created = true;
      }

      await authAdmin.setCustomUserClaims(userRecord.uid, {
        role: staffRole,
        brandId: manager.brandId,
        brandName: manager.brandName,
        permissions,
        defaultRoute,
        temporaryPasswordIssued: true,
      });

      const accountPayload = {
        uid: userRecord.uid,
        email,
        displayName: fullName,
        photoURL: "",
        role: staffRole,
        brandId: manager.brandId,
        brandName: manager.brandName,
        companyDomain,
        permissions,
        defaultRoute,
        temporaryPasswordIssued: true,
        temporaryPassword,
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: manager.uid,
      };

      await db.collection("users").doc(userRecord.uid).set(
        {
          ...accountPayload,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      await db
        .collection("brands")
        .doc(manager.brandId)
        .collection("staff")
        .doc(userRecord.uid)
        .set(
          {
            uid: userRecord.uid,
            email,
            displayName: fullName,
            role: staffRole,
            permissions,
            temporaryPassword,
            temporaryPasswordIssued: true,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      return reply.status(created ? 201 : 200).send({
        success: true,
        created,
        data: {
          ...accountPayload,
          temporaryPassword,
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to create staff account.",
      });
    }
  });

  fastify.post("/:uid/temporary-password", async (request: FastifyRequest, reply: FastifyReply) => {
    const manager = await ensureBrandManager(request, reply);
    if (!manager) return;

    const authTime = (request as any).user?.auth_time;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (!authTime || nowInSeconds - authTime > 300) {
      return reply.status(403).send({
        success: false,
        error: "Please re-authenticate before viewing a temporary password.",
      });
    }

    const { uid } = request.params as { uid: string };

    try {
      const staffDoc = await db.collection("users").doc(uid).get();
      const staffProfile = staffDoc.exists ? staffDoc.data() : null;

      if (
        !staffProfile ||
        staffProfile.brandId !== manager.brandId ||
        !["crisis_staff", "lead_staff"].includes(staffProfile.role)
      ) {
        return reply.status(404).send({ success: false, error: "Staff account not found in your brand." });
      }

      if (staffProfile.temporaryPasswordIssued !== true || !staffProfile.temporaryPassword) {
        return reply.status(400).send({
          success: false,
          error: "Temporary password is no longer available for this account.",
        });
      }

      return {
        success: true,
        data: {
          uid,
          temporaryPassword: staffProfile.temporaryPassword,
        },
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to reveal temporary password.",
      });
    }
  });

  fastify.post("/:uid/reset-temporary-password", async (request: FastifyRequest, reply: FastifyReply) => {
    const manager = await ensureBrandManager(request, reply);
    if (!manager) return;

    const authTime = (request as any).user?.auth_time;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (!authTime || nowInSeconds - authTime > 300) {
      return reply.status(403).send({
        success: false,
        error: "Please re-authenticate before resetting a temporary password.",
      });
    }

    const { uid } = request.params as { uid: string };

    try {
      const staffDoc = await db.collection("users").doc(uid).get();
      const staffProfile = staffDoc.exists ? staffDoc.data() : null;

      if (
        !staffProfile ||
        staffProfile.brandId !== manager.brandId ||
        !["crisis_staff", "lead_staff"].includes(staffProfile.role)
      ) {
        return reply.status(404).send({ success: false, error: "Staff account not found in your brand." });
      }

      const temporaryPassword = generateTemporaryPassword();
      await authAdmin.updateUser(uid, {
        password: temporaryPassword,
        disabled: false,
      });

      const userRecord = await authAdmin.getUser(uid);
      await authAdmin.setCustomUserClaims(uid, {
        ...(userRecord.customClaims || {}),
        temporaryPasswordIssued: true,
      });

      await db.collection("users").doc(uid).set(
        {
          temporaryPassword,
          temporaryPasswordIssued: true,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      await db
        .collection("brands")
        .doc(manager.brandId)
        .collection("staff")
        .doc(uid)
        .set(
          {
            temporaryPassword,
            temporaryPasswordIssued: true,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      return {
        success: true,
        data: {
          uid,
          temporaryPassword,
        },
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to reset temporary password.",
      });
    }
  });
}
