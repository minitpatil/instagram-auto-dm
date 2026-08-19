require("dotenv").config();

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

async function callAPI(url, label) {
  console.log(`\n========== ${label} ==========`);

  const response = await fetch(url);
  const data = await response.json();

  console.log("HTTP STATUS:", response.status);
  console.log(JSON.stringify(data, null, 2));

  return data;
}

async function main() {
  console.log("==========================================");
  console.log("      INSTAGRAM IDENTITY DIAGNOSTIC");
  console.log("==========================================");

  console.log("Token Loaded:", !!ACCESS_TOKEN);

  if (!ACCESS_TOKEN) {
    console.log("❌ ACCESS TOKEN NOT FOUND");
    return;
  }

  // 1. Current token identity
  const me = await callAPI(
    `https://graph.instagram.com/v26.0/me?fields=id,username,name&access_token=${ACCESS_TOKEN}`,
    "TOKEN IDENTITY"
  );

  const tokenUserId = me?.id;

  if (!tokenUserId) {
    console.log("\n❌ Could not determine token identity.");
    return;
  }

  // 2. Subscription for the token identity
  const subscription = await callAPI(
    `https://graph.instagram.com/v26.0/${tokenUserId}/subscribed_apps?access_token=${ACCESS_TOKEN}`,
    "WEBHOOK SUBSCRIPTION"
  );

  // 3. Media owned by token identity
  const media = await callAPI(
    `https://graph.instagram.com/v26.0/${tokenUserId}/media?fields=id,media_type,media_product_type,permalink,comments_count&limit=5&access_token=${ACCESS_TOKEN}`,
    "RECENT MEDIA"
  );

  console.log("\n==========================================");
  console.log("              SUMMARY");
  console.log("==========================================");

  console.log("\nToken Identity ID:", tokenUserId);
  console.log("Username:", me?.username);
  console.log("Name:", me?.name);

  console.log(
    "\nSubscribed Fields:",
    subscription?.data?.[0]?.subscribed_fields || "NONE"
  );

  console.log(
    "\nMedia Returned:",
    media?.data?.length ?? 0
  );

  console.log("\n==========================================");
}

main().catch((error) => {
  console.error("\n❌ ERROR:", error);
});