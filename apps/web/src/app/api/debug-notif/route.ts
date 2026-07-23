import { NextResponse } from "next/server";
import { db, dbData } from "@/lib/server/firebaseAdmin";

export async function GET() {
  try {
    const snap1 = await db.collection("notifications").get();
    const data1 = snap1.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    
    let data2: any[] = [];
    try {
      const snap2 = await dbData.collection("notifications").get();
      data2 = snap2.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (e: any) {
      data2 = [{ error: e?.message || String(e) }];
    }
    
    return NextResponse.json({ 
      db: data1.filter((d: any) => d.recipient_role === "admin"), 
      dbData: data2.filter((d: any) => d.recipient_role === "admin") 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
