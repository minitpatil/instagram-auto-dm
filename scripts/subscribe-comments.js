require("dotenv").config();

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = "27865698246421825";

async function main() {
  console.log("==========================================");
  console.log("   SUBSCRIBE INSTAGRAM COMMENTS WEBHOOK");
  console.log("==========================================");

  const url =
    `https://graph.instagram.com/v26.0/${IG_USER_ID}/subscribed_apps` +
    `?subscribed_fields=comments,messages` +
    `&access_token=${ACCESS_TOKEN}`;

  console.log("\n📡 Subscribing comments + messages...\n");

  const response = await fetch(url, {
    method: "POST",
  });

  const data = await response.json();

  console.log("HTTP STATUS:", response.status);

  console.log("\nRAW RESPONSE:");
  console.log(JSON.stringify(data, null, 2));

  console.log("\n==========================================");

  if (response.ok && data.success === true) {
    console.log("✅ COMMENTS WEBHOOK SUBSCRIBED");
  } else {
    console.log("❌ SUBSCRIPTION FAILED");
  }

  console.log("==========================================");
}

main().catch(console.error);