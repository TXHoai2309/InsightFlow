const url = "https://sftfkwswszkugnjqfafm.supabase.co";
const key = "sb_publishable_YvABq5BgqJmfJXcf-SvYjA_B-UbiTV_";

async function run() {
  // Query count of all posts
  const resAll = await fetch(`${url}/rest/v1/posts?select=post_id&limit=5`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  console.log("Some posts sample:", await resAll.json());

  // Query distinct brand slugs
  const resBrands = await fetch(`${url}/rest/v1/posts?select=brand,brand_slug&limit=50`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const brands = await resBrands.json();
  console.log("Sample brand/brand_slug in posts:", brands);

  // Query specifically highland posts
  const resHighlands = await fetch(`${url}/rest/v1/posts?or=(brand_slug.eq.highlandcoffee,brand.eq.Highland%20Coffee)&select=post_id&limit=5`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  console.log("Highland posts:", await resHighlands.json());
}

run().catch(console.error);
