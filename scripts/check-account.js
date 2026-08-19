require("dotenv").config();

const API_VERSION = process.env.GRAPH_API_VERSION || "v26.0";
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

async function main() {
  console.log("==========================================");
  console.log("   INSTAGRAM ACCOUNT CHECK");
  console.log("==========================================");

  console.log("API Version:", API_VERSION);
  console.log("Token Loaded:", !!ACCESS_TOKEN);

  if (!ACCESS_TOKEN) {
    console.log("❌ INSTAGRAM_ACCESS_TOKEN not found in .env");
    return;
  }

  const url =
    `https://graph.instagram.com/${API_VERSION}/me` +
    `?fields=id,username,name` +
    `&access_token=${ACCESS_TOKEN}`;

  console.log("\n📡 Checking token identity...\n");

  const response = await fetch(url);
  const data = await response.json();

  console.log("API STATUS:", response.status);
  console.log(JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log("\n==========================================");
    console.log("✅ ACCOUNT IDENTIFIED");
    console.log("==========================================");

    console.log("Instagram ID:", data.id);
    console.log("Username:", data.username);
    console.log("Name:", data.name || "N/A");
  } else {
    console.log("\n❌ Could not identify account.");
  }
}

main().catch((error) => {
  console.error("\n❌ SCRIPT ERROR");
  console.error(error);
});