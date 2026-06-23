import { NextResponse } from "next/server";

export async function GET() {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Mocked latest report document
  const mockReport = {
    generated_at: new Date().toISOString(),
    overview: {
      total_mentions: 1250,
      by_brand: {
        "Highlands Coffee": 520,
        "Phúc Long": 430,
        "KATINAT": 300
      },
      by_source: {
        facebook: 600,
        tiktok: 400,
        news: 150,
        youtube: 100
      },
      risk_mentions_count: 45
    },
    distribution: {
      sentiment_distribution: {
        positive: 650,
        neutral: 400,
        negative: 200
      },
      top_topics: [
        { topic: "quality", count: 450 },
        { topic: "service", count: 320 },
        { topic: "price", count: 210 },
        { topic: "experience", count: 150 },
        { topic: "delivery", count: 120 }
      ],
      by_brand_breakdown: {
        "Highlands Coffee": {
          sentiment_distribution: {
            positive: 250,
            neutral: 180,
            negative: 90
          },
          top_topics: [
            { topic: "quality", count: 200 },
            { topic: "service", count: 150 },
            { topic: "price", count: 100 }
          ]
        },
        "Phúc Long": {
          sentiment_distribution: {
            positive: 220,
            neutral: 150,
            negative: 60
          },
          top_topics: [
            { topic: "quality", count: 180 },
            { topic: "service", count: 120 },
            { topic: "price", count: 80 }
          ]
        },
        "KATINAT": {
          sentiment_distribution: {
            positive: 180,
            neutral: 70,
            negative: 50
          },
          top_topics: [
            { topic: "experience", count: 120 },
            { topic: "quality", count: 70 },
            { topic: "service", count: 50 }
          ]
        }
      }
    }
  };

  return NextResponse.json(mockReport);
}
