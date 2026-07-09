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

async function main() {
  console.log("Querying Mixue posts and comments...");

  // 1. Get all Mixue posts
  const postsQuery = "brand_slug=eq.mixue&limit=10000";
  const mixuePosts = await request("posts", postsQuery);
  console.log(`Mixue posts retrieved: ${mixuePosts.length}`);

  // 2. Get all Mixue comments (note: comments table might have brand/brand_slug or post_id)
  // Let's get distinct post_ids of Mixue posts
  const mixuePostIds = mixuePosts.map(p => p.post_id);
  console.log(`Unique Mixue post IDs: ${mixuePostIds.length}`);

  // Fetch comments matching these post IDs in batches of 100
  let mixueComments = [];
  const batchSize = 100;
  for (let i = 0; i < mixuePostIds.length; i += batchSize) {
    const chunk = mixuePostIds.slice(i, i + batchSize);
    const chunkQuery = `post_id=in.(${chunk.join(',')})&limit=1000`;
    const commentsChunk = await request("comments", chunkQuery);
    mixueComments = mixueComments.concat(commentsChunk);
  }
  console.log(`Mixue comments retrieved: ${mixueComments.length}`);

  // 3. Let's find annotations for these Mixue posts and comments
  // Annotations table can be queried by post_id
  let annotations = [];
  for (let i = 0; i < mixuePostIds.length; i += batchSize) {
    const chunk = mixuePostIds.slice(i, i + batchSize);
    const chunkQuery = `post_id=in.(${chunk.join(',')})&status=eq.completed`;
    const annChunk = await request("annotations", chunkQuery);
    annotations = annotations.concat(annChunk);
  }
  console.log(`Completed annotations linked to Mixue posts: ${annotations.length}`);

  // Analyze intent of these annotations
  const leads = [];
  annotations.forEach(a => {
    let label = {};
    if (a.label) {
      try {
        label = typeof a.label === 'string' ? JSON.parse(a.label) : a.label;
      } catch (e) {}
    }

    const intent = label.intent || 'none';
    if (['hot', 'warm', 'cold'].includes(intent)) {
      leads.push({
        id: a.comment_id || a.post_id,
        entity_key: a.entity_key,
        entity_type: a.entity_type,
        intent,
        sentiment: label.sentiment,
        topic: label.topic,
        label
      });
    }
  });

  console.log(`\nLeads derived from Mixue annotations: ${leads.length}`);
  if (leads.length > 0) {
    console.log("Derived Mixue leads details:");
    console.log(JSON.stringify(leads, null, 2));
  } else {
    console.log("No completed annotations for Mixue have intent: hot, warm, or cold.");
  }
  
  // Check if any leads exist in 'leads' table for Mixue
  // (leads table schema might use 'workspace_id' or 'brand')
  const leadsTable = await request("leads", "limit=10000");
  const mixueLeadsTable = leadsTable.filter(l => {
    const brand = String(l.brand || l.workspace_id || '').toLowerCase();
    return brand.includes('mixue');
  });
  console.log(`Mixue leads found in 'leads' table: ${mixueLeadsTable.length}`);
  if (mixueLeadsTable.length > 0) {
    console.log("Mixue leads in 'leads' table details:", JSON.stringify(mixueLeadsTable, null, 2));
  }
}

main().catch(console.error);
