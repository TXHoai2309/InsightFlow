// apps/api/testEmailJS.js
const fs = require("fs");
const path = require("path");

// Load .env.local
const p = path.join(__dirname, "..", "web", ".env.local");
if (fs.existsSync(p)) {
  const content = fs.readFileSync(p, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const parts = trimmed.split("=");
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
  console.log("Loaded environment variables from:", p);
} else {
  console.error("Could not find .env.local");
  process.exit(1);
}

const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

console.log("EmailJS Service ID:", serviceId);
console.log("EmailJS Template ID:", templateId);
console.log("EmailJS Public Key:", publicKey);

async function testEmailJS() {
  const dummyLink = "https://insightflow-6ce1f.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=test";
  const email = "toxuanhoai2309123@gmail.com";

  try {
    console.log("Sending request to EmailJS REST API...");
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: email,
          email: email,
          reset_link: dummyLink,
          link: dummyLink,
          message: `Test password reset link: ${dummyLink}`
        }
      })
    });

    const text = await res.text();
    console.log("EmailJS Status:", res.status);
    console.log("EmailJS Response:", text);

    if (res.ok) {
      console.log("SUCCESS! EmailJS sent the email successfully.");
    } else {
      console.error("FAILED! EmailJS returned an error.");
    }
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
  process.exit(0);
}

testEmailJS();
