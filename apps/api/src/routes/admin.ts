import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { FieldValue } from "firebase-admin/firestore";
import { authAdmin, db } from "../services/firebase";
import { verifyToken } from "../middleware/auth";

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

export default async function adminRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
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

    if (temporaryPassword.length < 6) {
      return reply.status(400).send({
        success: false,
        error: "Temporary password must be at least 6 characters.",
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
}
