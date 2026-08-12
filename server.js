const express = require("express");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const webhookRoutes = require("./routes/webhook");

const app = express();

app.use(express.json());

/*
|--------------------------------------------------------------------------
| WEBHOOK VERIFICATION
|--------------------------------------------------------------------------
*/

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === process.env.VERIFY_TOKEN
  ) {
    console.log("✅ Webhook Verified");
    return res.status(200).send(challenge);
  }

  console.log("❌ Webhook Verification Failed");
  return res.sendStatus(403);
});

/*
|--------------------------------------------------------------------------
| WEBHOOK POST
|--------------------------------------------------------------------------
*/

app.use("/webhook", webhookRoutes);

/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.send("Instagram Auto DM API is Running 🚀");
});

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

/*
|--------------------------------------------------------------------------
| PRIVACY POLICY
|--------------------------------------------------------------------------
| Only this specific HTML file is publicly accessible.
|--------------------------------------------------------------------------
*/

app.get("/privacy-policy.html", (req, res) => {
  const privacyPolicyPath = path.join(
    __dirname,
    "privacy-policy.html"
  );

  if (!fs.existsSync(privacyPolicyPath)) {
    return res.status(404).send("Privacy Policy Not Found");
  }

  res.sendFile(privacyPolicyPath);
});

/*
|--------------------------------------------------------------------------
| ALLOWED TXT FILES
|--------------------------------------------------------------------------
| IMPORTANT:
| Do NOT expose the entire "files" folder.
| Only files listed here can be accessed.
|--------------------------------------------------------------------------
*/

const TXT_FILES = {
  reel1: "reel1.txt",
  reel2: "reel2.txt",
  Independance_day_prompts: "Independance-day-prompts.txt",
  cgi_rally_prompt: "cgi-rally-prompt.txt",
};

/*
|--------------------------------------------------------------------------
| TXT FILE DOWNLOAD / VIEW ROUTE
|--------------------------------------------------------------------------
|
| Example:
| /file/reel1
|
| This will serve:
| /files/reel1.txt
|
|--------------------------------------------------------------------------
*/

app.get("/file/:fileKey", (req, res) => {
  const fileKey = req.params.fileKey;

  // Check allowlist
  if (!Object.prototype.hasOwnProperty.call(TXT_FILES, fileKey)) {
    console.log(`❌ Unauthorized file request: ${fileKey}`);
    return res.status(404).send("File Not Found");
  }

  const fileName = TXT_FILES[fileKey];

  const filePath = path.join(
    __dirname,
    "files",
    fileName
  );

  // Make sure file actually exists
  if (!fs.existsSync(filePath)) {
    console.log(`❌ TXT file not found: ${fileName}`);
    return res.status(404).send("File Not Found");
  }

  console.log(`📄 Serving TXT file: ${fileName}`);

  res.type("text/plain");
  res.sendFile(filePath);
});

/*
|--------------------------------------------------------------------------
| BLOCK COMMON FILE/DIRECTORY ACCESS
|--------------------------------------------------------------------------
|
| Since we removed express.static("."),
| these are already inaccessible.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| SERVER
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("======================================");
  console.log("🚀 Instagram Auto DM Server Started");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("🔐 Static file access: DISABLED");
  console.log("📄 Allowed TXT files:", Object.keys(TXT_FILES));
  console.log("======================================");
});