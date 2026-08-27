import { Router } from "express";
import {
  addInstagramAccount,
  getInstagramAccounts,
  createAutomation,
  getAutomations,
} from "./instagram.service";
import {
  authenticateToken,
  AuthenticatedRequest,
} from "../../middleware/auth";

const router = Router();

/*
|--------------------------------------------------------------------------
| GET INSTAGRAM ACCOUNTS
|--------------------------------------------------------------------------
*/

router.get(
  "/accounts",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const accounts = await getInstagramAccounts(req.user!.id);

      return res.status(200).json({
        success: true,
        accounts,
      });
    } catch (error) {
      console.error("Get Instagram accounts error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to get Instagram accounts",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ADD INSTAGRAM ACCOUNT
|--------------------------------------------------------------------------
*/

router.post(
  "/accounts",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { instagramUserId, username, name, accessTokenEncrypted } =
        req.body;

      if (!instagramUserId || !username || !accessTokenEncrypted) {
        return res.status(400).json({
          success: false,
          message:
            "instagramUserId, username and accessTokenEncrypted are required",
        });
      }

      const account = await addInstagramAccount(req.user!.id, {
        instagramUserId,
        username,
        name,
        accessTokenEncrypted,
      });

      return res.status(201).json({
        success: true,
        message: "Instagram account added successfully",
        account,
      });
    } catch (error) {
      console.error("Add Instagram account error:", error);

        return res.status(500).json({
    success: false,
    message: error instanceof Error
      ? error.message
      : "Failed to add Instagram account",
  });
}
  }
);

/*
|--------------------------------------------------------------------------
| CREATE AUTOMATION
|--------------------------------------------------------------------------
*/

router.post(
  "/automations",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        instagramAccountId,
        targetUrl,
        mediaId,
        targetType,
        publicReply,
        dmMessage,
        fileId,
      } = req.body;

      console.log("======================================");
console.log("📦 CREATE AUTOMATION REQUEST BODY");
console.log(req.body);
console.log("📎 FILE ID FROM REQUEST:", fileId);
console.log("======================================");

      if (!instagramAccountId || !targetUrl || !targetType) {
        return res.status(400).json({
          success: false,
          message:
            "instagramAccountId, targetUrl and targetType are required",
        });
      }

      if (targetType !== "POST" && targetType !== "REEL") {
        return res.status(400).json({
          success: false,
          message: "targetType must be POST or REEL",
        });
      }

      const automation = await createAutomation(req.user!.id, {
        instagramAccountId,
        targetUrl,
        mediaId,
        targetType,
        publicReply,
        dmMessage,
        fileId,
      });

      return res.status(201).json({
        success: true,
        message: "Automation created successfully",
        automation,
      });
    } catch (error) {
      console.error("Create automation error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create automation",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET AUTOMATIONS
|--------------------------------------------------------------------------
*/

router.get(
  "/automations",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const automations = await getAutomations(req.user!.id);

      return res.status(200).json({
        success: true,
        automations,
      });
    } catch (error) {
      console.error("Get automations error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to get automations",
      });
    }
  }
);

export default router;