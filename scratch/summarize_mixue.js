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

function inferLeadIntent(...values) {
  for (const value of values) {
    if (!value) continue;
    const normalized = String(value).toLowerCase().trim();
    if (['hot', 'warm', 'cold'].includes(normalized)) return normalized;
    if (normalized.includes('lead_hot') || normalized.includes('hot_lead')) return 'hot';
    if (normalized.includes('lead_warm') || normalized.includes('warm_lead')) return 'warm';
    if (normalized.includes('lead_cold') || normalized.includes('cold_lead')) return 'cold';
  }
  return 'none';
}

async function main() {
  console.log("Fetching data for summary...");
  const posts = await request("posts", "brand_slug=eq.mixue&limit=10000");
  const mixuePostIds = posts.map(p => p.post_id);

  let annotations = [];
  const batchSize = 100;
  for (let i = 0; i < mixuePostIds.length; i += batchSize) {
    const chunk = mixuePostIds.slice(i, i + batchSize);
    const chunkQuery = `post_id=in.(${chunk.join(',')})&status=eq.completed`;
    const annChunk = await request("annotations", chunkQuery);
    annotations = annotations.concat(annChunk);
  }

  const intentStats = { hot: 0, warm: 0, cold: 0 };
  const platformStats = {};
  const contentTypeStats = { post: 0, comment: 0 };

  annotations.forEach(a => {
    let label = {};
    if (a.label) {
      try {
        label = typeof a.label === 'string' ? JSON.parse(a.label) : a.label;
      } catch (e) {}
    }

    const intent = label.intent || 'none';
    if (['hot', 'warm', 'cold'].includes(intent)) {
      intentStats[intent]++;
      
      const platform = a.platform || 'unknown';
      platformStats[platform] = (platformStats[platform] || 0) + 1;
      
      const type = a.entity_type || 'unknown';
      contentTypeStats[type] = (contentTypeStats[type] || 0) + 1;
    }
  });

  console.log("\n=== SUMMARY STATISTICS ===");
  console.log("Intent breakdown:", intentStats);
  console.log("Platform breakdown:", platformStats);
  console.log("Content type breakdown:", contentTypeStats);
}

main().catch(console.error);
