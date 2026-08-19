require("dotenv").config();

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

async function main() {
  console.log("==========================================");
  console.log("       INSTAGRAM TOKEN PERMISSIONS");
  console.log("==========================================");

  const url =
    `https://graph.instagram.com/v26.0/me/permissions` +
    `?access_token=${ACCESS_TOKEN}`;

  const response = await fetch(url);
  const data = await response.json();

  console.log("\nHTTP STATUS:", response.status);

  console.log("\nRAW RESPONSE:");
  console.log(JSON.stringify(data, null, 2));

  console.log("\n==========================================");
}

main().catch(console.error);