import { Router } from "express";
import jwt from "jsonwebtoken";
import { encryptToken } from "../../utils/encryption";

import {
  addInstagramAccount,
  getInstagramAccounts,
  createAutomation,
  getAutomations,
  removeInstagramAccount,
} from "./instagram.service";

import {
  authenticateToken,
  AuthenticatedRequest,
} from "../../middleware/auth";

const router = Router();

/*
|--------------------------------------------------------------------------
| INSTAGRAM OAUTH CONFIG
|--------------------------------------------------------------------------
*/

const INSTAGRAM_APP_ID =
  process.env.INSTAGRAM_APP_ID || "";

const INSTAGRAM_APP_SECRET =
  process.env.INSTAGRAM_APP_SECRET || "";

const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL ||
  "http://localhost:3001";

const INSTAGRAM_REDIRECT_URI =
  `${PUBLIC_BASE_URL}/api/instagram/oauth/callback`;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

const GRAPH_API_VERSION =
  process.env.GRAPH_API_VERSION ||
  "v26.0";

/*
|--------------------------------------------------------------------------
| START INSTAGRAM BUSINESS LOGIN
|--------------------------------------------------------------------------
*/

router.get(
  "/oauth",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      if (!INSTAGRAM_APP_ID) {
        return res.status(500).json({
          success: false,
          message:
            "INSTAGRAM_APP_ID is not configured in .env",
        });
      }

      const jwtSecret =
        process.env.JWT_SECRET;

      if (!jwtSecret) {
        console.error(
          "JWT_SECRET is not configured"
        );

        return res.status(500).json({
          success: false,
          message:
            "Server authentication configuration error",
        });
      }

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user is required",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | CREATE OAUTH STATE
      |--------------------------------------------------------------------------
      */

      const state = jwt.sign(
        {
          sub: req.user.id,
          purpose:
            "instagram_oauth",
        },
        jwtSecret,
        {
          expiresIn: "10m",
        }
      );

      /*
      |--------------------------------------------------------------------------
      | INSTAGRAM BUSINESS LOGIN SCOPES
      |--------------------------------------------------------------------------
      */

      const scopes = [
        "instagram_business_basic",
        "instagram_business_manage_messages",
        "instagram_business_manage_comments",
      ].join(",");

      /*
      |--------------------------------------------------------------------------
      | CREATE INSTAGRAM AUTH URL
      |--------------------------------------------------------------------------
      */

      const authUrl =
        "https://www.instagram.com/oauth/authorize" +
        `?client_id=${encodeURIComponent(
          INSTAGRAM_APP_ID
        )}` +
        `&redirect_uri=${encodeURIComponent(
          INSTAGRAM_REDIRECT_URI
        )}` +
        "&response_type=code" +
        `&scope=${encodeURIComponent(
          scopes
        )}` +
        `&state=${encodeURIComponent(
          state
        )}`;

      console.log(
        "======================================"
      );

      console.log(
        "📸 INSTAGRAM OAUTH START"
      );

      console.log(
        "User ID:",
        req.user.id
      );

      console.log(
        "App ID:",
        INSTAGRAM_APP_ID
      );

      console.log(
        "Redirect URI:",
        INSTAGRAM_REDIRECT_URI
      );

      console.log(
        "======================================"
      );

      return res.status(200).json({
        success: true,
        authUrl,
      });
    } catch (error) {
      console.error(
        "Instagram OAuth start error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to start Instagram OAuth",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| INSTAGRAM OAUTH CALLBACK
|--------------------------------------------------------------------------
*/

router.get(
  "/oauth/callback",
  async (
    req,
    res
  ) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | READ OAUTH PARAMETERS
      |--------------------------------------------------------------------------
      */

      const code =
        typeof req.query.code ===
        "string"
          ? req.query.code
          : "";

      const state =
        typeof req.query.state ===
        "string"
          ? req.query.state
          : "";

      const oauthError =
        typeof req.query.error ===
        "string"
          ? req.query.error
          : "";

      /*
      |--------------------------------------------------------------------------
      | INSTAGRAM DENIED
      |--------------------------------------------------------------------------
      */

      if (oauthError) {
        console.error(
          "Instagram OAuth error:",
          oauthError
        );

        return res.redirect(
          `${FRONTEND_URL}/instagram-accounts?error=instagram_denied`
        );
      }

      /*
      |--------------------------------------------------------------------------
      | CODE VALIDATION
      |--------------------------------------------------------------------------
      */

      if (!code) {
        console.error(
          "Instagram authorization code is missing"
        );

        return res.redirect(
          `${FRONTEND_URL}/instagram-accounts?error=missing_code`
        );
      }

      /*
      |--------------------------------------------------------------------------
      | STATE VALIDATION
      |--------------------------------------------------------------------------
      */

      if (!state) {
        console.error(
          "Instagram OAuth state is missing"
        );

        return res.redirect(
          `${FRONTEND_URL}/instagram-accounts?error=missing_state`
        );
      }

      const jwtSecret =
        process.env.JWT_SECRET;

      if (!jwtSecret) {
        console.error(
          "JWT_SECRET is not configured"
        );

        return res
          .status(500)
          .send(
            "Server authentication configuration error."
          );
      }

      let oauthState: {
        sub?: string;
        purpose?: string;
      };

      try {
        oauthState =
          jwt.verify(
            state,
            jwtSecret
          ) as {
            sub?: string;
            purpose?: string;
          };
      } catch (error) {
        console.error(
          "Invalid or expired Instagram OAuth state:",
          error
        );

        return res.redirect(
          `${FRONTEND_URL}/instagram-accounts?error=invalid_state`
        );
      }

      /*
      |--------------------------------------------------------------------------
      | VERIFY STATE PURPOSE + USER
      |--------------------------------------------------------------------------
      */

      if (
        oauthState.purpose !==
          "instagram_oauth" ||
        !oauthState.sub
      ) {
        console.error(
          "Invalid Instagram OAuth state payload"
        );

        return res.redirect(
          `${FRONTEND_URL}/instagram-accounts?error=invalid_state`
        );
      }

      const userId =
        String(oauthState.sub);

      /*
      |--------------------------------------------------------------------------
      | INSTAGRAM CREDENTIAL VALIDATION
      |--------------------------------------------------------------------------
      */

      if (
        !INSTAGRAM_APP_ID ||
        !INSTAGRAM_APP_SECRET
      ) {
        console.error(
          "Instagram OAuth credentials are not configured"
        );

        return res
          .status(500)
          .send(
            "Instagram OAuth credentials are not configured."
          );
      }

      /*
      |--------------------------------------------------------------------------
      | EXCHANGE AUTHORIZATION CODE
      |--------------------------------------------------------------------------
      */

      const tokenResponse =
        await fetch(
          "https://api.instagram.com/oauth/access_token",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },

            body:
              new URLSearchParams({
                client_id:
                  INSTAGRAM_APP_ID,

                client_secret:
                  INSTAGRAM_APP_SECRET,

                grant_type:
                  "authorization_code",

                redirect_uri:
                  INSTAGRAM_REDIRECT_URI,

                code,
              }),
          }
        );

      const tokenData =
        await tokenResponse.json();

      console.log(
        "Instagram token response:",
        tokenResponse.status
      );

      if (
        !tokenResponse.ok ||
        !tokenData.access_token
      ) {
        console.error(
          "Instagram token exchange failed:",
          tokenData
        );

        return res.redirect(
          `${FRONTEND_URL}/instagram-accounts?error=token_exchange_failed`
        );
      }

      const accessToken =
        String(
          tokenData.access_token
        );

      /*
      |--------------------------------------------------------------------------
      | GET INSTAGRAM PROFILE
      |--------------------------------------------------------------------------
      */

      const profileResponse =
        await fetch(
          `https://graph.instagram.com/${GRAPH_API_VERSION}/me` +
            "?fields=user_id,username,name" +
            `&access_token=${encodeURIComponent(
              accessToken
            )}`
        );

      const profileData =
        await profileResponse.json();

      console.log(
        "Instagram profile response:",
        profileData
      );

      if (
        !profileResponse.ok ||
        !profileData.user_id ||
        !profileData.username
      ) {
        console.error(
          "Instagram profile request failed:",
          profileData
        );

        return res.redirect(
          `${FRONTEND_URL}/instagram-accounts?error=profile_failed`
        );
      }

      /*
      |--------------------------------------------------------------------------
      | SAVE INSTAGRAM ACCOUNT
      |--------------------------------------------------------------------------
      */

      const instagramAccount =
        await addInstagramAccount(
          userId,
          {
            instagramUserId:
              String(
                profileData.user_id
              ),

            username:
              String(
                profileData.username
              ),

            name:
              profileData.name
                ? String(
                    profileData.name
                  )
                : null,

            accessTokenEncrypted:
              encryptToken(
                accessToken
              ),
          }
        );

      /*
      |--------------------------------------------------------------------------
      | SUCCESS LOG
      |--------------------------------------------------------------------------
      */

      console.log(
        "======================================"
      );

      console.log(
        "✅ INSTAGRAM ACCOUNT CONNECTED"
      );

      console.log(
        "SaaS User ID:",
        userId
      );

      console.log(
        "Instagram User ID:",
        profileData.user_id
      );

      console.log(
        "Instagram Username:",
        profileData.username
      );

      console.log(
        "Database Account ID:",
        instagramAccount.id
      );

      console.log(
        "======================================"
      );

      /*
      |--------------------------------------------------------------------------
      | REDIRECT BACK TO FRONTEND
      |--------------------------------------------------------------------------
      */

      return res.redirect(
        `${FRONTEND_URL}/instagram-accounts?connected=true`
      );
    } catch (error) {
      console.error(
        "Instagram OAuth callback error:",
        error
      );

      return res.redirect(
        `${FRONTEND_URL}/instagram-accounts?error=oauth_failed`
      );
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET INSTAGRAM ACCOUNTS
|--------------------------------------------------------------------------
*/

router.get(
  "/accounts",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user is required",
        });
      }

      const accounts =
        await getInstagramAccounts(
          req.user.id
        );

      console.log(
        "Instagram accounts fetched:",
        {
          userId: req.user.id,
          count: accounts.length,
        }
      );

      return res.status(200).json({
        success: true,
        accounts,
      });
    } catch (error) {
      console.error(
        "Get Instagram accounts error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to get Instagram accounts",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ADD INSTAGRAM ACCOUNT
|--------------------------------------------------------------------------
|
| Kept for manual/API usage.
| OAuth automatically saves the account.
|--------------------------------------------------------------------------
*/

router.post(
  "/accounts",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const {
        instagramUserId,
        username,
        name,
        accessTokenEncrypted,
      } = req.body;

      if (
        !instagramUserId ||
        !username ||
        !accessTokenEncrypted
      ) {
        return res.status(400).json({
          success: false,
          message:
            "instagramUserId, username and accessTokenEncrypted are required",
        });
      }

      const account =
        await addInstagramAccount(
          req.user!.id,
          {
            instagramUserId,
            username,
            name,
            accessTokenEncrypted,
          }
        );

      return res.status(201).json({
        success: true,
        message:
          "Instagram account added successfully",
        account,
      });
    } catch (error) {
      console.error(
        "Add Instagram account error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to add Instagram account",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| REMOVE INSTAGRAM ACCOUNT
|--------------------------------------------------------------------------
*/

router.delete(
  "/accounts/:accountId",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user is required",
        });
      }

      const accountId =
        String(req.params.accountId || "").trim();

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message:
            "Instagram account ID is required",
        });
      }

      const result =
        await removeInstagramAccount(
          req.user.id,
          accountId
        );

      return res.status(200).json(result);
    } catch (error) {
      console.error(
        "Remove Instagram account error:",
        error
      );

      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove Instagram account",
      });
    }
  }
);
/*
|--------------------------------------------------------------------------
| CREATE AUTOMATION
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Media ID is intentionally NOT accepted from frontend.
|--------------------------------------------------------------------------
*/

router.post(
  "/automations",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const {
        instagramAccountId,
        targetUrl,
        targetType,
        publicReply,
        dmMessage,
        fileId,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | REQUIRED FIELDS
      |--------------------------------------------------------------------------
      */

      if (
        !instagramAccountId ||
        !targetUrl ||
        !targetType
      ) {
        return res.status(400).json({
          success: false,
          message:
            "instagramAccountId, targetUrl and targetType are required",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | TARGET TYPE VALIDATION
      |--------------------------------------------------------------------------
      */

      if (
        targetType !== "POST" &&
        targetType !== "REEL"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "targetType must be POST or REEL",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | CREATE AUTOMATION
      |--------------------------------------------------------------------------
      */

      const automation =
        await createAutomation(
          req.user!.id,
          {
            instagramAccountId,

            targetUrl,

            targetType,

            publicReply:
              publicReply || null,

            dmMessage:
              dmMessage || null,

            fileId:
              fileId || null,
          }
        );

      return res.status(201).json({
        success: true,

        message:
          "Automation created successfully",

        automation,
      });
    } catch (error) {
      console.error(
        "Create automation error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to create automation",
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
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user is required",
        });
      }

      const automations =
        await getAutomations(
          req.user.id
        );

      return res.status(200).json({
        success: true,
        automations,
      });
    } catch (error) {
      console.error(
        "Get automations error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to get automations",
      });
    }
  }
);

export default router;