import { Router } from "express";
import {
  addInstagramAccount,
  getInstagramAccounts,
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
      const accounts = await getInstagramAccounts(req.user.id);

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

      const account = await addInstagramAccount(req.user.id, {
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
        message: "Failed to add Instagram account",
      });
    }
  }
);

export default router;