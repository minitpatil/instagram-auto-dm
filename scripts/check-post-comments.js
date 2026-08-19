require("dotenv").config();

const API_VERSION = process.env.GRAPH_API_VERSION || "v26.0";
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

const MEDIA_ID = "17943271003422784";

async function main() {
  console.log("==========================================");
  console.log("       INSTAGRAM COMMENT DIAGNOSTIC");
  console.log("==========================================");

  const url =
    `https://graph.instagram.com/${API_VERSION}/${MEDIA_ID}` +
    `?fields=id,media_type,media_product_type,permalink,comments_count` +
    `&access_token=${ACCESS_TOKEN}`;

  console.log("\n📡 Checking Post information...\n");

  const response = await fetch(url);
  const data = await response.json();

  console.log("API STATUS:", response.status);
  console.log(JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log("\n==========================================");
    console.log("POST CHECK COMPLETE");
    console.log("==========================================");

    console.log("Media ID:", data.id);
    console.log("Media Type:", data.media_type);
    console.log("Product Type:", data.media_product_type);
    console.log("Comments Count:", data.comments_count);
  }
}

main().catch(console.error);