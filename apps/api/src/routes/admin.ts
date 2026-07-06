import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { FieldValue } from "firebase-admin/firestore";
import { authAdmin, db } from "../services/firebase";
import { verifyToken } from "../middleware/auth";
import { validateStrongPassword } from "../utils/passwordPolicy";

const brandManagerPermissions = ["dashboard", "mentions", "alerts", "leads", "reports", "brand_settings", "staff_management"];

function slugifyBrand(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDomainFromEmail(email: string) {
  return email.includes("@") ? email.split("@")[1].toLowerCase() : "";
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const randomPart = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `IF@${randomPart}24`;
}

async function ensureAdmin(request: FastifyRequest, reply: FastifyReply) {
  await verifyToken(request, reply);
  if (reply.sent) return false;

  const requester = (request as any).user;
  const requesterDoc = await db.collection("users").doc(requester.uid).get();
  const requesterRole = requesterDoc.exists ? requesterDoc.data()?.role : undefined;

  if (requesterRole !== "admin") {
    reply.status(403).send({ success: false, error: "Admin permission is required." });
    return false;
  }

  return true;
}

function serializeBrandManager(data: any) {
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    role: "brand_manager",
    brandId: data.brandId,
    brandName: data.brandName,
    companyDomain: data.companyDomain,
    permissions: Array.isArray(data.permissions) ? data.permissions : brandManagerPermissions,
    defaultRoute: data.defaultRoute || "/dashboard",
    disabled: data.disabled === true,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    hasTemporaryPassword: data.temporaryPasswordIssued === true && Boolean(data.temporaryPassword),
  };
}

export default async function adminRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get("/brand-managers", async (request: FastifyRequest, reply: FastifyReply) => {
    const isAdmin = await ensureAdmin(request, reply);
    if (!isAdmin) return;

    try {
      const snapshot = await db.collection("users").where("role", "==", "brand_manager").get();
      const brandManagers = snapshot.docs
        .map((doc) => doc.data())
        .map(serializeBrandManager);

      return { success: true, data: brandManagers };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to load Brand Manager accounts.",
      });
    }
  });

  fastify.post("/brand-managers", async (request: FastifyRequest, reply: FastifyReply) => {
    const isAdmin = await ensureAdmin(request, reply);
    if (!isAdmin) return;

    const body = request.body as {
      fullName?: string;
      email?: string;
      brandName?: string;
      temporaryPassword?: string;
    };

    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const brandName = body.brandName?.trim();
    const temporaryPassword = body.temporaryPassword?.trim();

    if (!fullName || !email || !brandName || !temporaryPassword) {
      return reply.status(400).send({
        success: false,
        error: "Full name, email, brandName and temporaryPassword are required.",
      });
    }

    const passwordPolicy = validateStrongPassword(temporaryPassword);
    if (!passwordPolicy.valid) {
      return reply.status(400).send({
        success: false,
        error: passwordPolicy.errors.join(" "),
      });
    }

    const brandId = slugifyBrand(brandName);
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
        role: "brand_manager",
        brandId,
        brandName,
        permissions: brandManagerPermissions,
        defaultRoute: "/dashboard",
        temporaryPasswordIssued: true,
      });

      const accountPayload = {
        uid: userRecord.uid,
        email,
        displayName: fullName,
        photoURL: "",
        role: "brand_manager",
        brandId,
        brandName,
        companyDomain,
        permissions: brandManagerPermissions,
        defaultRoute: "/dashboard",
        disabled: false,
        temporaryPasswordIssued: true,
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: (request as any).user.uid,
      };

      await db.collection("users").doc(userRecord.uid).set(
        {
          ...accountPayload,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      await db.collection("brands").doc(brandId).set(
        {
          id: brandId,
          name: brandName,
          domain: companyDomain,
          brandManagerUid: userRecord.uid,
          brandManagerEmail: email,
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
        error: error.message || "Failed to create Brand Manager account.",
      });
    }
  });

  fastify.patch("/brand-managers/:uid", async (request: FastifyRequest, reply: FastifyReply) => {
    const isAdmin = await ensureAdmin(request, reply);
    if (!isAdmin) return;

    const { uid } = request.params as { uid: string };
    const body = request.body as {
      fullName?: string;
      brandName?: string;
    };

    const fullName = body.fullName?.trim();
    const brandName = body.brandName?.trim();

    if (!fullName || !brandName) {
      return reply.status(400).send({
        success: false,
        error: "Full name and brandName are required.",
      });
    }

    try {
      const managerDoc = await db.collection("users").doc(uid).get();
      const managerProfile = managerDoc.exists ? managerDoc.data() : null;

      if (!managerProfile || managerProfile.role !== "brand_manager") {
        return reply.status(404).send({ success: false, error: "Brand Manager account not found." });
      }

      const brandId = managerProfile.brandId || slugifyBrand(brandName);
      const companyDomain = managerProfile.companyDomain || getDomainFromEmail(managerProfile.email || "");

      await authAdmin.updateUser(uid, { displayName: fullName });
      const userRecord = await authAdmin.getUser(uid);
      await authAdmin.setCustomUserClaims(uid, {
        ...(userRecord.customClaims || {}),
        role: "brand_manager",
        brandId,
        brandName,
        permissions: brandManagerPermissions,
        defaultRoute: "/dashboard",
      });

      await db.collection("users").doc(uid).set(
        {
          displayName: fullName,
          brandId,
          brandName,
          companyDomain,
          permissions: brandManagerPermissions,
          defaultRoute: "/dashboard",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      await db.collection("brands").doc(brandId).set(
        {
          id: brandId,
          name: brandName,
          domain: companyDomain,
          brandManagerUid: uid,
          brandManagerEmail: managerProfile.email,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      const updatedDoc = await db.collection("users").doc(uid).get();
      return {
        success: true,
        data: serializeBrandManager(updatedDoc.data()),
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to update Brand Manager account.",
      });
    }
  });

  fastify.patch("/brand-managers/:uid/status", async (request: FastifyRequest, reply: FastifyReply) => {
    const isAdmin = await ensureAdmin(request, reply);
    if (!isAdmin) return;

    const { uid } = request.params as { uid: string };
    const body = request.body as { disabled?: boolean };

    if (typeof body.disabled !== "boolean") {
      return reply.status(400).send({ success: false, error: "disabled must be a boolean." });
    }

    if (uid === (request as any).user.uid) {
      return reply.status(400).send({ success: false, error: "Admin cannot change their own status here." });
    }

    try {
      const managerDoc = await db.collection("users").doc(uid).get();
      const managerProfile = managerDoc.exists ? managerDoc.data() : null;

      if (!managerProfile || managerProfile.role !== "brand_manager") {
        return reply.status(404).send({ success: false, error: "Brand Manager account not found." });
      }

      await authAdmin.updateUser(uid, { disabled: body.disabled });
      await db.collection("users").doc(uid).set(
        {
          disabled: body.disabled,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      const updatedDoc = await db.collection("users").doc(uid).get();
      return {
        success: true,
        data: serializeBrandManager(updatedDoc.data()),
      };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to update account status.",
      });
    }
  });

  fastify.post("/brand-managers/:uid/temporary-password", async (request: FastifyRequest, reply: FastifyReply) => {
    const isAdmin = await ensureAdmin(request, reply);
    if (!isAdmin) return;

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
      const managerDoc = await db.collection("users").doc(uid).get();
      const managerProfile = managerDoc.exists ? managerDoc.data() : null;

      if (!managerProfile || managerProfile.role !== "brand_manager") {
        return reply.status(404).send({ success: false, error: "Brand Manager account not found." });
      }

      if (managerProfile.temporaryPasswordIssued !== true || !managerProfile.temporaryPassword) {
        return reply.status(400).send({
          success: false,
          error: "Temporary password is no longer available for this account.",
        });
      }

      return {
        success: true,
        data: {
          uid,
          temporaryPassword: managerProfile.temporaryPassword,
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

  fastify.post("/brand-managers/:uid/reset-temporary-password", async (request: FastifyRequest, reply: FastifyReply) => {
    const isAdmin = await ensureAdmin(request, reply);
    if (!isAdmin) return;

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
      const managerDoc = await db.collection("users").doc(uid).get();
      const managerProfile = managerDoc.exists ? managerDoc.data() : null;

      if (!managerProfile || managerProfile.role !== "brand_manager") {
        return reply.status(404).send({ success: false, error: "Brand Manager account not found." });
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
