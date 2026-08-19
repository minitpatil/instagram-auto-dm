require("dotenv").config();

const API_VERSION = process.env.GRAPH_API_VERSION || "v26.0";
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

const MEDIA_ID = "17943271003422784";

async function main() {
  console.log("==========================================");
  console.log("       RAW INSTAGRAM COMMENTS CHECK");
  console.log("==========================================");

  const url =
    `https://graph.instagram.com/${API_VERSION}/${MEDIA_ID}/comments` +
    `?fields=id,text,from,timestamp,username` +
    `&access_token=${ACCESS_TOKEN}`;

  console.log("\n📡 Calling comments endpoint...\n");
  console.log("Media ID:", MEDIA_ID);
  console.log("API Version:", API_VERSION);

  const response = await fetch(url);
  const data = await response.json();

  console.log("\n==========================================");
  console.log("HTTP STATUS:", response.status);
  console.log("==========================================");

  console.log("\nRAW RESPONSE:");
  console.log(JSON.stringify(data, null, 2));

  console.log("\n==========================================");
  console.log("RESULT ANALYSIS");
  console.log("==========================================");

  if (!response.ok) {
    console.log("❌ API request failed.");
    return;
  }

  if (data.data && data.data.length > 0) {
    console.log("✅ Comments returned:", data.data.length);

    for (const comment of data.data) {
      console.log("\n------------------------------------------");
      console.log("Comment ID:", comment.id);
      console.log("Text:", comment.text);
      console.log("Username:", comment.username);
      console.log("From:", comment.from);
      console.log("Timestamp:", comment.timestamp);
    }
  } else {
    console.log("⚠️ API returned HTTP 200 but data is EMPTY.");
  }

  if (data.paging) {
    console.log("\nPAGING:");
    console.log(JSON.stringify(data.paging, null, 2));
  }

  console.log("\n==========================================");
  console.log("DIAGNOSTIC COMPLETE");
  console.log("==========================================");
}

main().catch((error) => {
  console.error("\n❌ SCRIPT ERROR");
  console.error(error);
});