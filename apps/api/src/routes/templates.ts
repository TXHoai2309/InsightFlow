// apps/api/src/routes/templates.ts
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../services/firebase";
import { verifyToken } from "../middleware/auth";

// Types
interface TemplateBody {
  name: string;
  sentiment: "positive" | "negative" | "neutral" | "all";
  category: "crisis" | "lead" | "faq" | "general";
  templateText: string;
  placeholders?: string[];
  isActive?: boolean;
}

interface GenerateReplyBody {
  templateId?: string; // Optional: if provided, we use this template
  templateText?: string; // Optional: if provided, user can send custom template text directly
  mentionContent: string;
  customerName?: string;
  tone?: "polite_and_apologetic" | "friendly" | "professional" | "humorous";
  sentiment?: "positive" | "negative" | "neutral";
  topic?: string;
}

// Helpers
async function getBrandUser(request: FastifyRequest, reply: FastifyReply) {
  await verifyToken(request, reply);
  if (reply.sent) return null;

  const requester = (request as any).user;
  const userDoc = await db.collection("users").doc(requester.uid).get();
  const userProfile = userDoc.exists ? userDoc.data() : null;

  if (!userProfile) {
    reply.status(404).send({ success: false, error: "User profile not found." });
    return null;
  }

  if (!userProfile.brandId) {
    reply.status(400).send({ success: false, error: "User is not associated with any brand." });
    return null;
  }

  return {
    uid: requester.uid,
    role: userProfile.role || "crisis_employee",
    brandId: userProfile.brandId as string,
    brandName: userProfile.brandName as string,
  };
}

async function callGeminiAPI(
  apiKey: string,
  templateText: string | undefined,
  mentionContent: string,
  customerName: string,
  tone: string,
  sentiment?: string,
  topic?: string
): Promise<string> {
  const model = "gemini-flash-lite-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let toneText = "lịch sự, xin lỗi chân thành và tinh thần trách nhiệm cao";
  if (tone === "friendly") toneText = "thân thiện, cởi mở, vui vẻ, xưng hô gần gũi";
  if (tone === "professional") toneText = "chuyên nghiệp, trang trọng, chuẩn mực chăm sóc khách hàng";
  if (tone === "humorous") toneText = "hóm hỉnh, vui tươi, khéo léo và duyên dáng";
  if (tone === "polite_and_apologetic") toneText = "lịch sự, chân thành xin lỗi và cầu thị lắng nghe";

  let sentimentText = "";
  if (sentiment === "positive") sentimentText = "Tích cực (Cảm ơn và trân trọng sự ủng hộ của khách)";
  else if (sentiment === "negative") sentimentText = "Tiêu cực (Xin lỗi chân thành, nhận lỗi và đưa ra phương án khắc phục/đền bù)";
  else if (sentiment === "neutral") sentimentText = "Trung lập (Trả lời thông tin lịch sự, giải đáp thắc mắc)";

  let topicText = "";
  if (topic) {
    const topicMap: Record<string, string> = {
      quality: "Chất lượng sản phẩm/đồ ăn/đồ uống",
      price: "Giá cả/vấn đề đắt rẻ/giá trị đồng tiền",
      service: "Dịch vụ/thái độ nhân viên/phục vụ/giao hàng chậm trễ",
      location: "Không gian cửa hàng/vị trí/chi nhánh",
      promotion: "Chương trình khuyến mãi/voucher/sự kiện",
      recruitment: "Thông tin tuyển dụng/việc làm",
      other: "Khác / Hỗ trợ chung"
    };
    topicText = topicMap[topic] || topic;
  }

  let promptText = `
Bạn là Đại diện Chăm sóc Khách hàng AI chuyên nghiệp bằng tiếng Việt.
Dưới đây là thông tin ngữ cảnh:
- Bình luận gốc của khách hàng:
"${mentionContent}"
- Tên khách hàng (nếu có): "${customerName || 'Khách hàng'}"
- Giọng điệu yêu cầu: ${toneText}
`;

  if (templateText) {
    promptText += `
- Mẫu phản hồi gốc (Đóng vai trò là thông điệp/chính sách cốt lõi của thương hiệu):
"${templateText}"

Nhiệm vụ:
Hãy viết lại câu phản hồi hoàn chỉnh bằng tiếng Việt dựa trên Mẫu phản hồi gốc sao cho trả lời trực tiếp và phù hợp nhất với ngữ cảnh bình luận của khách hàng.
`;
  } else {
    promptText += `
- Hướng xử lý: phản hồi theo Sắc thái "${sentimentText || 'Trung lập'}" và tập trung giải quyết Chủ đề "${topicText || 'Hỗ trợ chung'}".

Nhiệm vụ:
Hãy tự soạn câu phản hồi hoàn chỉnh bằng tiếng Việt sao cho trả lời trực tiếp, phù hợp nhất với ngữ cảnh bình luận của khách hàng và định hướng Sắc thái/Chủ đề ở trên.
`;
  }

  promptText += `
Quy tắc bắt buộc:
1. Xưng hô tự nhiên, lịch thiệp. Điền tên khách hàng "${customerName || ''}" vào lời chào một cách tinh tế.
2. Tuyệt đối không để lại các ký tự placeholder dạng {{...}} hay [...] ở văn bản trả về; hãy tự thay thế thông tin phù hợp hoặc lược bỏ để câu trôi chảy.
3. Chỉ trả về duy nhất nội dung câu phản hồi chăm sóc khách hàng. Không thêm lời dẫn, không bọc dấu nháy kép ngoại cảnh, không thêm phần phân tích.
`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API returns HTTP ${response.status}: ${text}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Empty text returned from Gemini API.");
  return rawText.trim();
}

function buildFallbackReply(
  templateText: string | undefined,
  customerName: string,
  tone: string,
  sentiment?: string,
  topic?: string,
) {
  const greeting = customerName?.trim()
    ? `Chào ${customerName.trim()},`
    : "Chào bạn,";
  const closing =
    tone === "professional"
      ? "InsightFlow sẽ ghi nhận và phản hồi bạn trong thời gian sớm nhất."
      : "Mong bạn tiếp tục chia sẻ thêm để đội ngũ hỗ trợ tốt hơn.";

  if (templateText?.trim()) {
    return `${greeting} ${templateText.trim()} ${closing}`;
  }

  if (sentiment === "negative") {
    return `${greeting} cảm ơn bạn đã phản hồi. Chúng mình rất tiếc vì trải nghiệm chưa tốt${topic ? ` liên quan đến ${topic}` : ""}. Đội ngũ sẽ kiểm tra lại ngay và mong được hỗ trợ bạn cụ thể hơn qua inbox hoặc thông tin liên hệ.`;
  }

  if (sentiment === "positive") {
    return `${greeting} cảm ơn bạn rất nhiều vì phản hồi tích cực. Sự ủng hộ của bạn là động lực để đội ngũ tiếp tục cải thiện chất lượng dịch vụ.`;
  }

  return `${greeting} cảm ơn bạn đã quan tâm và để lại phản hồi. Đội ngũ đã ghi nhận thông tin${topic ? ` về ${topic}` : ""} và sẽ hỗ trợ bạn sớm nhất có thể.`;
}

async function callGeminiSuggestTemplate(
  apiKey: string,
  name: string,
  sentiment: string,
  category: string,
  brandName: string
): Promise<string> {
  const model = "gemini-flash-lite-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let sentimentText = "tiêu cực / khủng hoảng";
  if (sentiment === "positive") sentimentText = "tích cực / khen ngợi";
  if (sentiment === "neutral") sentimentText = "trung lập / hỏi thăm";
  if (sentiment === "all") sentimentText = "chung chung / mọi sắc thái";

  let categoryText = "xử lý khủng hoảng (crisis handling)";
  if (category === "lead") categoryText = "chăm sóc khách hàng tiềm năng (potential lead handling)";
  if (category === "faq") categoryText = "giải đáp câu hỏi thường gặp (FAQ)";
  if (category === "general") categoryText = "mẫu phản hồi chung";

  const promptText = `
Bạn là Chuyên gia Tư vấn Chăm sóc Khách hàng và Quản trị Thương hiệu.
Nhiệm vụ: Hãy tạo một Mẫu phản hồi chuẩn (Response Template) bằng tiếng Việt cho thương hiệu "${brandName}".

Thông tin yêu cầu của mẫu phản hồi:
- Tên chủ đề/mục tiêu của mẫu: "${name}"
- Sắc thái cảm xúc của bài viết/bình luận cần phản hồi: "${sentimentText}"
- Phân loại nghiệp vụ: "${categoryText}"

Quy tắc thiết kế mẫu phản hồi:
1. Mẫu cần sử dụng cấu trúc placeholders dạng {{...}} để nhân viên điền thông tin động sau này.
2. Các placeholders hợp lệ và bắt buộc phải dùng (hoặc chọn dùng phù hợp nhất):
   - {{customer_name}}: Tên của khách hàng.
   - {{brand_name}}: Tên thương hiệu (sử dụng "${brandName}").
   - {{location_name}}: Tên chi nhánh/cửa hàng xảy ra sự việc (sử dụng nếu category liên quan đến cửa hàng/chi nhánh).
   - {{issue_detail}}: Chi tiết sự việc hoặc vấn đề cụ thể (sử dụng nếu category liên quan đến khiếu nại/sự cố).
3. Mẫu phải lịch sự, chuyên nghiệp, phản ánh đúng sắc thái cảm xúc yêu cầu. Ví dụ:
   - Sắc thái tiêu cực/khủng hoảng: cần xin lỗi chân thành, nhận trách nhiệm, hứa khắc phục tại {{location_name}} liên quan đến {{issue_detail}}, đề xuất bồi thường, hướng liên hệ inbox/hotline.
   - Sắc thái tích cực: cảm ơn chân thành, mời quay lại chi nhánh {{location_name}}.
   - Sắc thái lead: chào hỏi nhiệt tình, xưng hô thân mật, gợi mở tư vấn.
4. Chỉ trả về duy nhất nội dung của mẫu phản hồi. Không thêm lời dẫn, không bọc dấu nháy kép ngoại cảnh, không thêm giải thích hay tiêu đề.

Ví dụ đầu ra mong muốn:
Chào {{customer_name}}, {{brand_name}} vô cùng xin lỗi vì trải nghiệm không tốt của bạn liên quan đến {{issue_detail}} tại chi nhánh {{location_name}}. Chúng tôi rất mong được lắng nghe và khắc phục, xin phép inbox bạn hoặc gọi hotline để hỗ trợ đền bù tốt nhất ạ.
`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini API returns HTTP ${response.status}: ${text}`);
  }

  const result2 = await response.json();
  const rawText2 = result2.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText2) throw new Error("Empty text returned from Gemini API.");
  return rawText2.trim();
}

export default async function templateRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // 1. GET /api/templates - Get all templates for caller's brand
  fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getBrandUser(request, reply);
    if (!user) return;

    try {
      const templatesRef = db.collection("brands").doc(user.brandId).collection("templates");
      const snapshot = await templatesRef.orderBy("createdAt", "desc").get();
      const templates = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, data: templates };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to retrieve response templates.",
      });
    }
  });

  // 2. POST /api/templates - Create a template (Brand Manager only)
  fastify.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getBrandUser(request, reply);
    if (!user) return;

    if (user.role !== "brand_manager" && user.role !== "admin") {
      return reply.status(403).send({
        success: false,
        error: "Only Brand Managers can create templates.",
      });
    }

    const body = request.body as TemplateBody;
    const { name, sentiment, category, templateText, placeholders = [], isActive = true } = body;

    if (!name || !sentiment || !category || !templateText) {
      return reply.status(400).send({
        success: false,
        error: "Name, sentiment, category and templateText are required.",
      });
    }

    try {
      const templatesRef = db.collection("brands").doc(user.brandId).collection("templates");
      const newDoc = templatesRef.doc();
      
      const templateData = {
        id: newDoc.id,
        name: name.trim(),
        sentiment,
        category,
        templateText: templateText.trim(),
        placeholders,
        isActive,
        createdBy: user.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      await newDoc.set(templateData);

      return reply.status(201).send({ success: true, data: templateData });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to create response template.",
      });
    }
  });

  // 3. PATCH /api/templates/:id - Update a template (Brand Manager only)
  fastify.patch("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getBrandUser(request, reply);
    if (!user) return;

    if (user.role !== "brand_manager" && user.role !== "admin") {
      return reply.status(403).send({
        success: false,
        error: "Only Brand Managers can modify templates.",
      });
    }

    const { id } = request.params as { id: string };
    const body = request.body as Partial<TemplateBody>;

    try {
      const docRef = db.collection("brands").doc(user.brandId).collection("templates").doc(id);
      const existing = await docRef.get();

      if (!existing.exists) {
        return reply.status(404).send({ success: false, error: "Template not found." });
      }

      const updateData: any = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.sentiment !== undefined) updateData.sentiment = body.sentiment;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.templateText !== undefined) updateData.templateText = body.templateText.trim();
      if (body.placeholders !== undefined) updateData.placeholders = body.placeholders;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;

      await docRef.update(updateData);

      const updated = await docRef.get();
      return { success: true, data: { id, ...updated.data() } };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to update response template.",
      });
    }
  });

  // 4. DELETE /api/templates/:id - Delete a template (Brand Manager only)
  fastify.delete("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getBrandUser(request, reply);
    if (!user) return;

    if (user.role !== "brand_manager" && user.role !== "admin") {
      return reply.status(403).send({
        success: false,
        error: "Only Brand Managers can delete templates.",
      });
    }

    const { id } = request.params as { id: string };

    try {
      const docRef = db.collection("brands").doc(user.brandId).collection("templates").doc(id);
      const existing = await docRef.get();

      if (!existing.exists) {
        return reply.status(404).send({ success: false, error: "Template not found." });
      }

      await docRef.delete();

      return { success: true, message: "Template deleted successfully." };
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to delete response template.",
      });
    }
  });

  // 5. POST /api/templates/generate-reply - Rephrase using Gemini AI (Any brand staff)
  fastify.post("/generate-reply", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getBrandUser(request, reply);
    if (!user) return;

    const body = request.body as GenerateReplyBody;
    const { templateId, templateText, mentionContent, customerName = "", tone = "polite_and_apologetic", sentiment, topic } = body;

    if (!mentionContent) {
      return reply.status(400).send({
        success: false,
        error: "mentionContent is required.",
      });
    }

    // Resolve template text
    let activeTemplateText = templateText || "";

    if (templateId) {
      try {
        const docRef = db.collection("brands").doc(user.brandId).collection("templates").doc(templateId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          activeTemplateText = docSnap.data()?.templateText || "";
        }
      } catch (err) {
        // Fallback or log
        request.log.warn(`Failed to fetch template ${templateId}, falling back to custom text.`);
      }
    }

    if (!activeTemplateText && !sentiment && !topic) {
      return reply.status(400).send({
        success: false,
        error: "Either a template (templateId/templateText) or direct labels (sentiment/topic) must be provided.",
      });
    }

    // Extract Gemini API key
    // We check process.env.GEMINI_API_KEY first, then first key of process.env.GEMINI_API_KEYS
    const rawKeys = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS || "";
    const apiKey = rawKeys
      ? rawKeys.split(/[,;\s]+/)[0].trim().replace(/^["']|["']$/g, "")
      : "";

    if (!apiKey) {
      request.log.warn("Gemini API key is not configured; using fallback quick reply.");
      return {
        success: true,
        replyText: buildFallbackReply(
          activeTemplateText || undefined,
          customerName,
          tone,
          sentiment,
          topic,
        ),
        source: "fallback",
      };
    }

    try {
      const generatedReply = await callGeminiAPI(
        apiKey,
        activeTemplateText || undefined,
        mentionContent,
        customerName,
        tone,
        sentiment,
        topic
      );

      return { success: true, replyText: generatedReply };
    } catch (error: any) {
      request.log.error(error);
      try {
        const fs = require("fs");
        const logMsg = `[${new Date().toISOString()}] Endpoint /generate-reply failed:\nError: ${error.message}\nStack: ${error.stack}\n\n`;
        fs.appendFileSync("d:\\Thuc_Tap\\InsightFlow\\gemini-error.log", logMsg);
      } catch (logErr) {}
      return reply.status(524).send({
        success: false,
        error: error.message || "Failed to generate reply using Gemini AI.",
      });
    }
  });

  // 6. POST /api/templates/suggest - Suggest response template using Gemini AI (Brand Manager only)
  fastify.post("/suggest", async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await getBrandUser(request, reply);
    if (!user) return;

    if (user.role !== "brand_manager" && user.role !== "admin") {
      return reply.status(403).send({
        success: false,
        error: "Only Brand Managers can request AI template suggestions.",
      });
    }

    const { name, sentiment, category } = request.body as {
      name: string;
      sentiment: string;
      category: string;
    };

    if (!name || !sentiment || !category) {
      return reply.status(400).send({
        success: false,
        error: "Name, sentiment, and category are required to generate template.",
      });
    }

    const rawKeys = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS || "";
    const apiKey = rawKeys
      ? rawKeys.split(/[,;\s]+/)[0].trim().replace(/^["']|["']$/g, "")
      : "";

    if (!apiKey) {
      return reply.status(500).send({
        success: false,
        error: "Gemini API key is not configured in the server environment.",
      });
    }

    try {
      const suggestedText = await callGeminiSuggestTemplate(
        apiKey,
        name,
        sentiment,
        category,
        user.brandName || "Thương hiệu"
      );

      return { success: true, templateText: suggestedText };
    } catch (error: any) {
      request.log.error(error);
      try {
        const fs = require("fs");
        const logMsg = `[${new Date().toISOString()}] Endpoint /suggest failed:\nError: ${error.message}\nStack: ${error.stack}\n\n`;
        fs.appendFileSync("d:\\Thuc_Tap\\InsightFlow\\gemini-error.log", logMsg);
      } catch (logErr) {}
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to generate suggested template using Gemini AI.",
      });
    }
  });
}

