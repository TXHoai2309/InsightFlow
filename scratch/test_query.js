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

async function run() {
  const url = `${SUPABASE_URL}/rest/v1/posts?limit=5`;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const data = await response.json();
  console.log("Sample posts:", JSON.stringify(data, null, 2));
}

run().catch(console.error);
