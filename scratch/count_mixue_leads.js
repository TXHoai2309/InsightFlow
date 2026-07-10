const envPath = require('path').join(__dirname, '../apps/web/.env.local');
const fs = require('fs');

let SUPABASE_URL = 'https://sftfkwswszkugnjqfafm.supabase.co';
let SUPABASE_ANON_KEY = 'sb_publishable_YvABq5BgqJmfJXcf-SvYjA_B-UbiTV_';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') SUPABASE_URL = value;
      if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = value;
    }
  }
}

async function request(table, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to query ${table}: ${response.status} - ${errText}`);
  }
  return response.json();
}

function inferLeadIntent(intentVal, labelIntent, currentLabelIntent) {
  const val = String(intentVal || labelIntent || currentLabelIntent || "").toLowerCase();
  if (val.includes("hot") || val.includes("nóng")) return "hot";
  if (val.includes("warm") || val.includes("ấm")) return "warm";
  if (val.includes("cold") || val.includes("lạnh")) return "cold";
  return "none";
}

async function main() {
  const mixuePosts = await request("posts", "brand_slug=eq.mixue&limit=10000");
  const mixuePostIds = mixuePosts.map(p => p.post_id);
  
  let annotations = [];
  const batchSize = 100;
  for (let i = 0; i < mixuePostIds.length; i += batchSize) {
    const chunk = mixuePostIds.slice(i, i + batchSize);
    const chunkQuery = `post_id=in.(${chunk.join(',')})&status=eq.completed`;
    const annChunk = await request("annotations", chunkQuery);
    annotations = annotations.concat(annChunk);
  }

  const leads = [];
  annotations.forEach(a => {
    let label = {};
    if (a.label) {
      try {
        label = typeof a.label === 'string' ? JSON.parse(a.label) : a.label;
      } catch (e) {}
    }
    const intent = inferLeadIntent(label.intent, label.intent, label.intent);
    if (intent !== "none") {
      leads.push({
        id: a.comment_id || a.post_id,
        intent,
        status: a.status || "new",
      });
    }
  });

  const intentCounts = { hot: 0, warm: 0, cold: 0 };
  leads.forEach(l => {
    intentCounts[l.intent]++;
  });

  console.log(`Derived Mixue Leads Total: ${leads.length}`);
  console.log("Intent breakdown:", intentCounts);
}

main().catch(console.error);
