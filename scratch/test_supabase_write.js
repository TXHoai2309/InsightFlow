const supabaseUrl = "https://sftfkwswszkugnjqfafm.supabase.co";
const supabaseAnonKey = "sb_publishable_YvABq5BgqJmfJXcf-SvYjA_B-UbiTV_";

async function testWrite() {
  const url = `${supabaseUrl}/rest/v1/leads`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify([{
      id: "test_lead_id_123",
      owner_id: "test_owner_uid",
      owner_name: "Test Employee Name",
      status: "new"
    }])
  });
  console.log("Status:", response.status);
  console.log("Status Text:", response.statusText);
  const text = await response.text();
  console.log("Response:", text);
}

testWrite();
