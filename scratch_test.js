const env = {
  NEXT_PUBLIC_SUPABASE_URL: "https://sftfkwswszkugnjqfafm.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_YvABq5BgqJmfJXcf-SvYjA_B-UbiTV_"
};

function normalizeUrl(url) {
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function getEndpoint(table, query = "") {
  const base = normalizeUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  return `${base}/rest/v1/${table}${query ? `?${query}` : ""}`;
}

async function supabaseRequest(table, query) {
  const res = await fetch(getEndpoint(table, query), {
    headers: {
      apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    }
  });
  return res.json();
}

async function loadSupabaseRows(table, params, maxRows = 10000) {
  const pageSize = 100;
  const rows = [];
  let offset = 0;
  while (rows.length < maxRows) {
    const requestParams = new URLSearchParams({
      ...params,
      limit: String(Math.min(pageSize, maxRows - rows.length)),
      offset: String(offset),
    });
    const page = await supabaseRequest(table, requestParams.toString());
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += page.length;
  }
  return rows;
}

async function run() {
  const platforms = ["google_maps", "facebook", "befood", "tiktok", "threads", "news_html"];
  const maxMentions = 30000;
  const perPlatformLimit = Math.max(50, Math.ceil(maxMentions / platforms.length));
  console.log('perPlatformLimit:', perPlatformLimit);

  const promises = platforms.map(async (p) => {
    const rows = await loadSupabaseRows(
      "annotations",
      {
        platform: p === "be" ? "in.(be,befood)" : (p === "thread" ? "in.(thread,threads)" : `eq.${p}`),
        status: "eq.completed",
        order: "updated_at.desc.nullslast",
      },
      perPlatformLimit
    );
    console.log(`Platform ${p} returned ${rows.length} annotations`);
    return rows;
  });

  const results = await Promise.all(promises);
  const annotationRows = results.flat();
  console.log('Total annotationRows:', annotationRows.length);
}

run();
