const express = require("express");
require("dotenv").config();

const webhookRoutes = require("./routes/webhook");

const app = express();

app.use(express.json());

app.use(express.static("."));

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("✅ Webhook Verified");
    return res.status(200).send(challenge);
  }

  console.log("❌ Webhook Verification Failed");
  return res.sendStatus(403);
});

app.use("/webhook", webhookRoutes);

app.get("/", (req, res) => {
  res.send("Instagram Auto DM API is Running 🚀");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});