import { Router } from "express";
import { processInstagramWebhook } from "./webhook.service";

const router = Router();

/*
|--------------------------------------------------------------------------
| META WEBHOOK VERIFICATION
|--------------------------------------------------------------------------
*/

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Webhook verification request received");

  if (
    mode === "subscribe" &&
    token === process.env.VERIFY_TOKEN
  ) {
    console.log("Webhook verification successful");

    return res.status(200).send(challenge);
  }

  console.log("Webhook verification failed");

  return res.sendStatus(403);
});

/*
|--------------------------------------------------------------------------
| META WEBHOOK EVENTS
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  try {
    console.log("Instagram webhook event received");
    console.log(JSON.stringify(req.body, null, 2));

    await processInstagramWebhook(req.body);

    return res.sendStatus(200);
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.sendStatus(500);
  }
});

export default router;