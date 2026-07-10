const url = "https://sftfkwswszkugnjqfafm.supabase.co";
const key = "sb_publishable_YvABq5BgqJmfJXcf-SvYjA_B-UbiTV_";

async function run() {
  const resHighlands = await fetch(`${url}/rest/v1/posts?or=(brand_slug.eq.highlands-coffee,brand.eq.Highlands%20Coffee)&select=post_id&limit=5`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  console.log("Corrected Highlands posts:", await resHighlands.json());
}

run().catch(console.error);
