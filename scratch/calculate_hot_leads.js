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

function normalizeText(val) {
  return String(val || "").trim();
}

function parseDate(field) {
  if (!field) return new Date(0).toISOString();
  return new Date(field).toISOString();
}

function inferLeadIntent(...values) {
  for (const value of values) {
    const directIntent = mapIntent(value);
    if (directIntent !== "none") return directIntent;

    const normalized = String(value || "")
      .toLowerCase()
      .trim();
    if (!normalized) continue;
    if (normalized.includes("lead_hot") || normalized.includes("hot_lead")) {
      return "hot";
    }
    if (normalized.includes("lead_warm") || normalized.includes("warm_lead")) {
      return "warm";
    }
    if (normalized.includes("lead_cold") || normalized.includes("cold_lead")) {
      return "cold";
    }
  }
  return "none";
}

function mapIntent(raw) {
  const intent = String(raw || "").toLowerCase().trim();
  return ["hot", "warm", "cold", "none"].includes(intent) ? intent : "none";
}

function buildEntityKeys(platform, postId, commentId) {
  const normalizedPlatform = platform === "befood" ? "be" : platform;
  const platforms = Array.from(new Set([platform, normalizedPlatform].filter(Boolean)));
  return platforms.flatMap((item) =>
    commentId
      ? [
        `${item}:${postId}:${commentId}`,
        `${item}:comment:${postId}:${commentId}`,
        `${item}:${postId}:comment:${commentId}`,
      ]
      : [`${item}:${postId}`, `${item}:post:${postId}`],
  );
}

function findAnnotation(annotationByKey, platform, postId, commentId) {
  return buildEntityKeys(platform, postId, commentId)
    .map((key) => annotationByKey.get(key))
    .find(Boolean);
}

async function main() {
  const mixuePosts = await request("posts", "brand_slug=eq.mixue&limit=10000");
  const mixuePostIds = mixuePosts.map(p => p.post_id);
  
  let annotationRows = [];
  const batchSize = 100;
  for (let i = 0; i < mixuePostIds.length; i += batchSize) {
    const chunk = mixuePostIds.slice(i, i + batchSize);
    const chunkQuery = `post_id=in.(${chunk.join(',')})&status=eq.completed`;
    const annChunk = await request("annotations", chunkQuery);
    annotationRows = annotationRows.concat(annChunk);
  }

  const postIds = Array.from(new Set(annotationRows.map(row => String(row.post_id || "").trim()))).filter(Boolean);
  const commentIds = Array.from(new Set(annotationRows.filter(row => row.entity_type === "comment").map(row => String(row.comment_id || "").trim()))).filter(Boolean);

  let postRows = [];
  for (let i = 0; i < postIds.length; i += batchSize) {
    const chunk = postIds.slice(i, i + batchSize);
    const chunkQuery = `post_id=in.(${chunk.join(',')})`;
    const chunkData = await request("posts", chunkQuery);
    postRows = postRows.concat(chunkData);
  }

  let commentRows = [];
  for (let i = 0; i < commentIds.length; i += batchSize) {
    const chunk = commentIds.slice(i, i + batchSize);
    const chunkQuery = `comment_id=in.(${chunk.join(',')})`;
    const chunkData = await request("comments", chunkQuery);
    commentRows = commentRows.concat(chunkData);
  }

  const postById = new Map();
  postRows.forEach(row => {
    postById.set(row.post_id, row);
  });

  const annotationByKey = new Map();
  annotationRows.forEach(row => {
    annotationByKey.set(row.entity_key, row);
    const platform = String(row.platform || "");
    const postId = String(row.post_id || "");
    const commentId = row.comment_id ? String(row.comment_id).trim() : null;
    buildEntityKeys(platform, postId, commentId).forEach(key => {
      if (key && !annotationByKey.has(key)) annotationByKey.set(key, row);
    });
  });

  function parseAnnotationLabel(row) {
    if (!row) return {};
    const raw = row.label;
    if (!raw) return {};
    try {
      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      }
      return raw && typeof raw === "object" ? raw : {};
    } catch {
      return {};
    }
  }

  function getSupabaseLabel(row, annotation, fallback) {
    const payload = typeof row.payload_json === 'string' ? JSON.parse(row.payload_json) : (row.payload_json || {});
    const payloadLabels = payload.labels || {};
    const rowLabels = {
      ...payloadLabels,
      ...(row.labels && typeof row.labels === 'object' ? row.labels : {})
    };
    const annotationLabel = parseAnnotationLabel(annotation);
    const inferredIntent = inferLeadIntent(
      annotationLabel.intent,
      rowLabels.intent,
      row.intent,
      row.lead_intent,
      row.intent_type,
      row.current_label,
      row.label,
      payload.intent,
      payload.lead_intent,
      payload.intent_type,
      payload.current_label,
      payload.label,
    );

    return {
      ...rowLabels,
      ...annotationLabel,
      intent: inferredIntent !== "none" ? inferredIntent : (annotationLabel.intent ?? rowLabels.intent)
    };
  }

  const mentions = [];
  postRows.forEach(row => {
    const platform = row.platform || row.source || "";
    const postId = row.post_id || row.id || "";
    const annotation = findAnnotation(annotationByKey, platform, postId);
    const label = getSupabaseLabel(row, annotation, {});
    mentions.push({
      id: postId,
      workspace_id: row.brand || row.brand_slug || "",
      intent: label.intent,
      labels: label,
      created_at: parseDate(row.created_at)
    });
  });

  commentRows.forEach(row => {
    const platform = row.platform || "";
    const postId = row.post_id || "";
    const commentId = row.comment_id || row.id || "";
    const annotation = findAnnotation(annotationByKey, platform, postId, commentId);
    const label = getSupabaseLabel(row, annotation, {});
    mentions.push({
      id: commentId,
      workspace_id: row.brand || row.brand_slug || "",
      intent: label.intent,
      labels: label,
      created_at: parseDate(row.created_at)
    });
  });

  const leadById = new Map();
  mentions.forEach(m => {
    const labels = m.labels;
    const intent = inferLeadIntent(labels?.intent, labels, m.labels);
    if (intent === "none" || leadById.has(m.id)) return;
    leadById.set(m.id, {
      id: m.id,
      intent,
      workspace_id: m.workspace_id
    });
  });

  const leads = Array.from(leadById.values());
  const hotLeads = leads.filter(l => l.intent === "hot");
  const warmLeads = leads.filter(l => l.intent === "warm");
  const coldLeads = leads.filter(l => l.intent === "cold");
  
  console.log("Total leads:", leads.length);
  console.log("Hot leads:", hotLeads.length);
  console.log("Warm leads:", warmLeads.length);
  console.log("Cold leads:", coldLeads.length);
}

main().catch(console.error);
