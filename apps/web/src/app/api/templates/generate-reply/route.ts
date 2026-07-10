import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl, readApiResponse } from "@/lib/apiProxy";

type GenerateReplyBody = {
  templateText?: string;
  mentionContent?: string;
  customerName?: string;
  tone?: "polite_and_apologetic" | "friendly" | "professional" | "humorous";
  sentiment?: "positive" | "negative" | "neutral";
  topic?: string;
};

function topicLabel(topic?: string) {
  const labels: Record<string, string> = {
    quality: "chất lượng sản phẩm",
    service: "dịch vụ",
    price: "giá cả",
    location: "cửa hàng hoặc chi nhánh",
    promotion: "khuyến mãi",
    recruitment: "tuyển dụng",
    other: "thông tin bạn chia sẻ",
  };
  return labels[topic || "other"] || topic || "thông tin bạn chia sẻ";
}

function buildFallbackReply(body: GenerateReplyBody) {
  const customerName = body.customerName?.trim();
  const greeting = customerName ? `Chào ${customerName},` : "Chào bạn,";
  const topic = topicLabel(body.topic);

  if (body.templateText?.trim()) {
    return `${greeting} ${body.templateText.trim()} Cảm ơn bạn đã chia sẻ, đội ngũ sẽ ghi nhận và hỗ trợ trong thời gian sớm nhất.`;
  }

  if (body.sentiment === "negative") {
    return `${greeting} cảm ơn bạn đã phản hồi. Chúng mình rất tiếc vì trải nghiệm về ${topic} chưa tốt. Đội ngũ sẽ kiểm tra lại ngay và mong được hỗ trợ bạn cụ thể hơn qua inbox hoặc thông tin liên hệ.`;
  }

  if (body.sentiment === "positive") {
    return `${greeting} cảm ơn bạn rất nhiều vì phản hồi tích cực. Sự ủng hộ của bạn là động lực để đội ngũ tiếp tục cải thiện chất lượng dịch vụ.`;
  }

  return `${greeting} cảm ơn bạn đã quan tâm và để lại phản hồi về ${topic}. Đội ngũ đã ghi nhận thông tin và sẽ hỗ trợ bạn sớm nhất có thể.`;
}

export async function POST(request: NextRequest) {
  let body: GenerateReplyBody = {};

  try {
    const authorization = request.headers.get("authorization");
    body = (await request.json()) as GenerateReplyBody;

    if (!authorization) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để thực hiện tác vụ này." },
        { status: 401 },
      );
    }

    if (!body.mentionContent?.trim()) {
      return NextResponse.json(
        { error: "Thiếu nội dung mention để tạo phản hồi." },
        { status: 400 },
      );
    }

    const apiBaseUrl = getApiBaseUrl(request);
    const response = await fetch(`${apiBaseUrl}/api/templates/generate-reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });

    const data = (await readApiResponse(response)) as {
      error?: string;
      replyText?: string;
      success?: boolean;
    };

    if (!response.ok) {
      if (response.status >= 500) {
        return NextResponse.json({
          success: true,
          replyText: buildFallbackReply(body),
          source: "web-fallback",
        });
      }

      return NextResponse.json(
        { error: data.error || "Không thể sinh câu phản hồi bằng AI." },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[API Proxy] generate reply error:", error);

    if (body.mentionContent?.trim()) {
      return NextResponse.json({
        success: true,
        replyText: buildFallbackReply(body),
        source: "web-fallback",
      });
    }

    return NextResponse.json(
      { error: "Không thể kết nối API backend. Vui lòng kiểm tra server API đang chạy." },
      { status: 502 },
    );
  }
}
