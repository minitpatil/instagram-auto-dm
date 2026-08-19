require("dotenv").config();

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = "27865698246421825";

async function main() {
  console.log("==========================================");
  console.log("   INSTAGRAM WEBHOOK SUBSCRIPTION CHECK");
  console.log("==========================================");

  console.log("\nInstagram User ID:", IG_USER_ID);
  console.log("Token Loaded:", !!ACCESS_TOKEN);

  if (!ACCESS_TOKEN || !IG_USER_ID) {
    console.error("\n❌ Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_USER_ID");
    return;
  }

  const url =
    `https://graph.instagram.com/v26.0/${IG_USER_ID}/subscribed_apps` +
    `?access_token=${ACCESS_TOKEN}`;

  console.log("\n📡 Checking Meta subscription...\n");

  const response = await fetch(url);
  const data = await response.json();

  console.log("HTTP STATUS:", response.status);

  console.log("\nRAW RESPONSE:");
  console.log(JSON.stringify(data, null, 2));

  console.log("\n==========================================");

  if (response.ok) {
    console.log("✅ SUBSCRIPTION API CHECK COMPLETE");
  } else {
    console.log("❌ SUBSCRIPTION CHECK FAILED");
  }

  console.log("==========================================");
}

main().catch((error) => {
  console.error("\n❌ ERROR:", error);
});