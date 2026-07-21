import { NextResponse } from "next/server";
import { db, dbData } from "@/lib/server/firebaseAdmin";

export async function GET() {
  try {
    const snap1 = await db.collection("notifications").get();
    const data1 = snap1.docs.map(d => ({id: d.id, ...d.data()}));
    
    let data2 = [];
    try {
      const snap2 = await dbData.collection("notifications").get();
      data2 = snap2.docs.map(d => ({id: d.id, ...d.data()}));
    } catch(e) {
      data2 = [{ error: e.message }];
    }
    
    return NextResponse.json({ 
      db: data1.filter(d => d.recipient_role === "admin"), 
      dbData: data2.filter(d => d.recipient_role === "admin") 
    });
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
