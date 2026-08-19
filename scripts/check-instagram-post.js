require("dotenv").config();

const API_VERSION = process.env.GRAPH_API_VERSION || "v26.0";
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

// Your Instagram Business Account ID
const INSTAGRAM_USER_ID = "27865698246421825";

// The Post URL you want to check
const TARGET_POST_URL =
  "https://www.instagram.com/p/CJeQDrFL6mR/";

async function apiGet(url) {
  const response = await fetch(url);
  const data = await response.json();

  console.log("\nAPI STATUS:", response.status);

  if (!response.ok) {
    console.log("❌ API ERROR:");
    console.log(JSON.stringify(data, null, 2));
    return null;
  }

  return data;
}

async function main() {
  console.log("==========================================");
  console.log("   INSTAGRAM POST DIAGNOSTIC");
  console.log("==========================================");

  console.log("API Version:", API_VERSION);
  console.log("Token Loaded:", !!ACCESS_TOKEN);
  console.log("Instagram User ID:", INSTAGRAM_USER_ID);
  console.log("Target Post:", TARGET_POST_URL);

  if (!ACCESS_TOKEN) {
    console.log("\n❌ INSTAGRAM_ACCESS_TOKEN not found in .env");
    return;
  }

  if (INSTAGRAM_USER_ID === "YOUR_INSTAGRAM_USER_ID") {
    console.log("\n❌ Please enter your Instagram User ID.");
    return;
  }

  // =====================================================
  // 1. GET ACCOUNT MEDIA
  // =====================================================

  const mediaUrl =
    `https://graph.instagram.com/${API_VERSION}/${INSTAGRAM_USER_ID}/media` +
    `?fields=id,caption,media_type,media_product_type,permalink,timestamp` +
    `&limit=50` +
    `&access_token=${ACCESS_TOKEN}`;

  console.log("\n📡 Fetching Instagram media...");

  const mediaData = await apiGet(mediaUrl);

  if (!mediaData) return;

  console.log("\n==========================================");
  console.log("MEDIA FOUND");
  console.log("==========================================");

  if (!mediaData.data || mediaData.data.length === 0) {
    console.log("❌ No media found.");
    return;
  }

  let targetMedia = null;

  for (const media of mediaData.data) {
    console.log("\n------------------------------------------");
    console.log("Media ID:", media.id);
    console.log("Media Type:", media.media_type);
    console.log("Product Type:", media.media_product_type);
    console.log("Permalink:", media.permalink);
    console.log("Timestamp:", media.timestamp);

    if (media.permalink === TARGET_POST_URL) {
      targetMedia = media;
    }
  }

  // =====================================================
  // 2. FIND TARGET POST
  // =====================================================

  if (!targetMedia) {
    console.log("\n==========================================");
    console.log("❌ TARGET POST NOT FOUND");
    console.log("==========================================");

    console.log(
      "\nThe Post URL was not found in the first 50 media items."
    );

    console.log(
      "Check whether the URL belongs to the same Instagram account."
    );

    return;
  }

  console.log("\n==========================================");
  console.log("🎯 TARGET POST FOUND");
  console.log("==========================================");

  console.log("Media ID:", targetMedia.id);
  console.log("Media Type:", targetMedia.media_type);
  console.log("Product Type:", targetMedia.media_product_type);
  console.log("Permalink:", targetMedia.permalink);

  // =====================================================
  // 3. GET COMMENTS
  // =====================================================

  const commentsUrl =
    `https://graph.instagram.com/${API_VERSION}/${targetMedia.id}/comments` +
    `?fields=id,text,username,timestamp` +
    `&access_token=${ACCESS_TOKEN}`;

  console.log("\n📡 Fetching comments...");

  const commentsData = await apiGet(commentsUrl);

  if (!commentsData) return;

  console.log("\n==========================================");
  console.log("COMMENTS");
  console.log("==========================================");

  if (!commentsData.data || commentsData.data.length === 0) {
    console.log("❌ No comments returned by API.");
    return;
  }

  for (const comment of commentsData.data) {
    console.log("\n------------------------------------------");
    console.log("Comment ID:", comment.id);
    console.log("Username:", comment.username);
    console.log("Text:", comment.text);
    console.log("Timestamp:", comment.timestamp);
  }

  console.log("\n==========================================");
  console.log("✅ DIAGNOSTIC COMPLETE");
  console.log("==========================================");
}

main().catch((error) => {
  console.error("\n❌ SCRIPT ERROR");
  console.error(error);
});