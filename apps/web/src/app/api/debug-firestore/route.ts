import { NextResponse } from "next/server";
import { dbSecond, db } from "@/lib/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";

export async function GET() {
  const results: Record<string, any> = {};

  // Check secondDb (datainsightflow project)
  const collectionsToCheck = [
    "mentions_nlp_demo",
    "mentions",
    "mentions_demo",
    "nlp_demo",
    "crawled_data",
    "data",
    "posts",
    "comments",
    "articles",
    "alerts",
    "alerts_demo",
    "leads",
    "brands",
    "workspaces",
  ];

  results.secondDb_available = !!dbSecond;
  results.primaryDb_available = !!db;

  if (dbSecond) {
    results.secondDb_project = "datainsightflow";
    results.secondDb_collections = {};

    for (const colName of collectionsToCheck) {
      try {
        const q = query(collection(dbSecond, colName), limit(2));
        const snap = await getDocs(q);
        results.secondDb_collections[colName] = {
          exists: !snap.empty,
          count: snap.size,
          sampleFields: snap.docs[0]
            ? Object.keys(snap.docs[0].data())
            : [],
          sampleData: snap.docs[0]
            ? (() => {
                const d = snap.docs[0].data();
                // Only show string/number fields to avoid serialization issues
                const safe: Record<string, any> = {};
                for (const [k, v] of Object.entries(d)) {
                  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
                    safe[k] = typeof v === "string" && v.length > 100 ? v.substring(0, 100) + "..." : v;
                  } else if (v && typeof v === "object" && "seconds" in v) {
                    safe[k] = `Timestamp(${v.seconds})`;
                  } else {
                    safe[k] = `[${typeof v}]`;
                  }
                }
                return safe;
              })()
            : null,
        };
      } catch (err: any) {
        results.secondDb_collections[colName] = {
          error: err.message || String(err),
        };
      }
    }
  }

  // Also check primary db
  if (db) {
    results.primaryDb_project = "insightflow-6ce1f";
    results.primaryDb_collections = {};

    for (const colName of collectionsToCheck) {
      try {
        const q = query(collection(db, colName), limit(2));
        const snap = await getDocs(q);
        if (!snap.empty) {
          results.primaryDb_collections[colName] = {
            exists: true,
            count: snap.size,
            sampleFields: snap.docs[0]
              ? Object.keys(snap.docs[0].data())
              : [],
          };
        }
      } catch {
        // skip
      }
    }
  }

  return NextResponse.json(results, { status: 200 });
}
