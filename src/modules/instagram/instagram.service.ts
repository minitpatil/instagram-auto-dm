import { prisma } from "../../lib/prisma";
import { decryptToken } from "../../utils/encryption";

const GRAPH_API_VERSION =
  process.env.GRAPH_API_VERSION || "v26.0";

const GRAPH_API_BASE =
  `https://graph.instagram.com/${GRAPH_API_VERSION}`;

/*
|--------------------------------------------------------------------------
| INSTAGRAM API REQUEST
|--------------------------------------------------------------------------
*/

async function instagramRequest(
  endpoint: string,
  accessToken: string,
  body: Record<string, any>
) {
  console.log("🌐 Instagram API Request:");
  console.log("Endpoint:", endpoint);
  console.log("Body:", JSON.stringify(body, null, 2));

  const response = await fetch(
    `${GRAPH_API_BASE}${endpoint}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  console.log("🌐 Instagram API Response:");
  console.log("Status:", response.status);
  console.log(
    "Response:",
    JSON.stringify(data, null, 2)
  );

  if (!response.ok) {
    throw new Error(
      `Instagram API Error ${response.status}: ${JSON.stringify(
        data
      )}`
    );
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| PUBLIC COMMENT REPLY
|--------------------------------------------------------------------------
*/

async function sendPublicReply(
  commentId: string,
  message: string,
  accessToken: string
) {
  console.log("📢 PUBLIC REPLY");
  console.log("Comment ID:", commentId);
  console.log("Message:", message);

  return instagramRequest(
    `/${commentId}/replies`,
    accessToken,
    {
      message,
    }
  );
}

/*
|--------------------------------------------------------------------------
| PRIVATE DM
|--------------------------------------------------------------------------
*/

async function sendPrivateReply(
  instagramUserId: string,
  commentId: string,
  message: string,
  accessToken: string
) {
  console.log("📩 PRIVATE DM");
  console.log("Instagram User ID:", instagramUserId);
  console.log("Comment ID:", commentId);
  console.log("Message:", message);

  return instagramRequest(
    `/${instagramUserId}/messages`,
    accessToken,
    {
      recipient: {
        comment_id: commentId,
      },
      message: {
        text: message,
      },
    }
  );
}

/*
|--------------------------------------------------------------------------
| ADD INSTAGRAM ACCOUNT
|--------------------------------------------------------------------------
*/

interface AddInstagramAccountInput {
  instagramUserId: string;
  username: string;
  name?: string | null;
  accessTokenEncrypted: string;
}

export async function addInstagramAccount(
  userId: string,
  input: AddInstagramAccountInput
) {
  /*
  |--------------------------------------------------------------------------
  | CHECK IF INSTAGRAM ACCOUNT ALREADY EXISTS
  |--------------------------------------------------------------------------
  */

  const existingAccount =
    await prisma.instagramAccount.findUnique({
      where: {
        instagramUserId: input.instagramUserId,
      },
    });

  /*
  |--------------------------------------------------------------------------
  | PREVENT ACCOUNT TRANSFER BETWEEN USERS
  |--------------------------------------------------------------------------
  */

  if (
    existingAccount &&
    existingAccount.userId !== userId
  ) {
    throw new Error(
      "This Instagram account is already connected to another user."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE EXISTING ACCOUNT
  |--------------------------------------------------------------------------
  */

  if (existingAccount) {
    return prisma.instagramAccount.update({
      where: {
        id: existingAccount.id,
      },
      data: {
        username: input.username,
        name: input.name || null,
        accessTokenEncrypted:
          input.accessTokenEncrypted,
        status: "ACTIVE",
      },
    });
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE NEW ACCOUNT
  |--------------------------------------------------------------------------
  */

  return prisma.instagramAccount.create({
    data: {
      userId,
      instagramUserId: input.instagramUserId,
      username: input.username,
      name: input.name || null,
      accessTokenEncrypted:
        input.accessTokenEncrypted,
      status: "ACTIVE",
    },
  });
}

/*
|--------------------------------------------------------------------------
| GET INSTAGRAM ACCOUNTS
|--------------------------------------------------------------------------
*/

export async function getInstagramAccounts(
  userId: string
) {
  return prisma.instagramAccount.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      instagramUserId: true,
      username: true,
      name: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/*
|--------------------------------------------------------------------------
| CREATE AUTOMATION
|--------------------------------------------------------------------------
*/

interface CreateAutomationInput {
  instagramAccountId: string;
  targetUrl: string;
  mediaId?: string | null;
  targetType: "POST" | "REEL";
  publicReply?: string | null;
  dmMessage?: string | null;
  fileId?: string | null;
}

export async function createAutomation(
  userId: string,
  input: CreateAutomationInput
) {
  console.log("======================================");
  console.log("🤖 CREATING AUTOMATION");
  console.log("User ID:", userId);
  console.log(
    "Instagram Account ID:",
    input.instagramAccountId
  );
  console.log("Media ID:", input.mediaId);
  console.log("File ID:", input.fileId);
  console.log("Target URL:", input.targetUrl);
  console.log("Target Type:", input.targetType);
  console.log("======================================");

  /*
  |--------------------------------------------------------------------------
  | VERIFY INSTAGRAM ACCOUNT
  |--------------------------------------------------------------------------
  */

  const instagramAccount =
    await prisma.instagramAccount.findFirst({
      where: {
        id: input.instagramAccountId,
        userId,
        status: "ACTIVE",
      },
    });

  if (!instagramAccount) {
    throw new Error(
      "Instagram account not found or does not belong to this user"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | VERIFY FILE
  |--------------------------------------------------------------------------
  */

  let validFileId: string | null = null;

  if (input.fileId) {
    const file =
      await prisma.file.findFirst({
        where: {
          id: input.fileId,
          userId,
        },
      });

    if (!file) {
      throw new Error(
        "File not found or does not belong to this user"
      );
    }

    validFileId = file.id;

    console.log("✅ FILE VERIFIED");
    console.log("File ID:", file.id);
    console.log("File Name:", file.name);
  } else {
    console.log("⚠️ No fileId supplied");
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE AUTOMATION
  |--------------------------------------------------------------------------
  */

  const automation =
    await prisma.automation.create({
      data: {
        userId,
        instagramAccountId:
          input.instagramAccountId,

        targetUrl: input.targetUrl,
        mediaId: input.mediaId || null,
        targetType: input.targetType,

        publicReply:
          input.publicReply || null,

        dmMessage:
          input.dmMessage || null,

        fileId: validFileId,

        status: "ACTIVE",
      },
    });

  console.log("======================================");
  console.log("✅ AUTOMATION CREATED");
  console.log("Automation ID:", automation.id);
  console.log("User ID:", automation.userId);
  console.log(
    "Instagram Account ID:",
    automation.instagramAccountId
  );
  console.log("Media ID:", automation.mediaId);
  console.log("File ID:", automation.fileId);
  console.log("======================================");

  return automation;
}

/*
|--------------------------------------------------------------------------
| GET AUTOMATIONS
|--------------------------------------------------------------------------
*/

export async function getAutomations(
  userId: string
) {
  return prisma.automation.findMany({
    where: {
      userId,
    },
    include: {
      file: {
        select: {
          id: true,
          name: true,
          mimeType: true,
        },
      },
      instagramAccount: {
        select: {
          id: true,
          instagramUserId: true,
          username: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/*
|--------------------------------------------------------------------------
| PROCESS INSTAGRAM WEBHOOK
|--------------------------------------------------------------------------
*/

export async function processInstagramWebhook(
  body: any
) {
  console.log("======================================");
  console.log("🔥 WEBHOOK SERVICE STARTED");
  console.log("======================================");

  for (const entry of body.entry || []) {
    const instagramUserId =
      String(entry.id || "");

    console.log(
      "Instagram Account ID:",
      instagramUserId
    );

    /*
    |--------------------------------------------------------------------------
    | FIND INSTAGRAM ACCOUNT
    |--------------------------------------------------------------------------
    */

    const account =
      await prisma.instagramAccount.findFirst({
        where: {
          instagramUserId,
          status: "ACTIVE",
        },
      });

    if (!account) {
      console.log(
        "❌ Instagram account not found:",
        instagramUserId
      );

      continue;
    }

    console.log(
      "✅ Instagram account found:",
      account.id
    );

    /*
    |--------------------------------------------------------------------------
    | DECRYPT ACCOUNT-SPECIFIC ACCESS TOKEN
    |--------------------------------------------------------------------------
    */

    let accessToken: string;

    try {
      accessToken = decryptToken(
        account.accessTokenEncrypted
      );
    } catch (error) {
      console.error(
        "❌ Failed to decrypt Instagram access token:",
        error
      );

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | PROCESS COMMENTS
    |--------------------------------------------------------------------------
    */

    for (const change of entry.changes || []) {
      if (change.field !== "comments") {
        continue;
      }

      const value = change.value || {};

      const mediaId =
        value.media?.id;

      const commentId =
        value.id;

      const commentText =
        value.text;

      const username =
        value.from?.username;

      const commenterId =
        value.from?.id;

      /*
      |--------------------------------------------------------------------------
      | IGNORE OUR OWN REPLY
      |--------------------------------------------------------------------------
      */

      if (
        commenterId &&
        String(commenterId) === instagramUserId
      ) {
        console.log(
          "⏭️ Ignoring own Instagram reply"
        );

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | VALIDATE COMMENT
      |--------------------------------------------------------------------------
      */

      if (!mediaId || !commentId) {
        console.log(
          "❌ Media ID or Comment ID missing"
        );

        continue;
      }

      console.log("--------------------------------------");
      console.log("🔥 COMMENT RECEIVED");
      console.log("Media ID:", mediaId);
      console.log("Comment ID:", commentId);
      console.log("Username:", username);
      console.log("Comment:", commentText);
      console.log("--------------------------------------");

      /*
      |--------------------------------------------------------------------------
      | FIND AUTOMATION
      |--------------------------------------------------------------------------
      */

      const automation =
        await prisma.automation.findFirst({
          where: {
            instagramAccountId: account.id,
            mediaId,
            status: "ACTIVE",
          },
          orderBy: {
            createdAt: "desc",
          },
        });

      if (!automation) {
        console.log(
          "❌ NO AUTOMATION FOUND:",
          mediaId
        );

        continue;
      }

      console.log(
        "✅ AUTOMATION MATCHED:",
        automation.id
      );

      console.log("🤖 AUTOMATION DETAILS");
      console.log(
        "User ID:",
        automation.userId
      );
      console.log(
        "Instagram Account ID:",
        automation.instagramAccountId
      );
      console.log(
        "File ID:",
        automation.fileId
      );
      console.log(
        "Public Reply:",
        automation.publicReply
      );
      console.log(
        "DM Message:",
        automation.dmMessage
      );

      /*
      |--------------------------------------------------------------------------
      | DUPLICATE PROTECTION
      |--------------------------------------------------------------------------
      */

      const existingLog =
        await prisma.automationLog.findFirst({
          where: {
            automationId:
              automation.id,
            commentId,
          },
        });

      if (existingLog) {
        console.log(
          "⏭️ Automation already processed comment:",
          commentId
        );

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | CREATE AUTOMATION LOG
      |--------------------------------------------------------------------------
      */

      const log =
        await prisma.automationLog.create({
          data: {
            automationId:
              automation.id,
            eventType:
              "COMMENT_RECEIVED",
            commenterUsername:
              username,
            commentId,
            success: false,
          },
        });

      let publicReplySent = false;
      let dmSent = false;
      let lastError:
        string | null = null;

      /*
      |--------------------------------------------------------------------------
      | PUBLIC REPLY
      |--------------------------------------------------------------------------
      */

      if (automation.publicReply) {
        try {
          console.log(
            "📢 Sending public reply..."
          );

          await sendPublicReply(
            commentId,
            automation.publicReply,
            accessToken
          );

          publicReplySent = true;

          console.log(
            "✅ PUBLIC REPLY SENT"
          );
        } catch (error) {
          lastError =
            error instanceof Error
              ? error.message
              : "Public reply failed";

          console.error(
            "❌ PUBLIC REPLY FAILED:",
            error
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | FILE PROCESSING
      |--------------------------------------------------------------------------
      */

      let fileUrl:
        string | null = null;

      console.log("======================================");
      console.log("📎 FILE PROCESSING");
      console.log(
        "Automation File ID:",
        automation.fileId
      );
      console.log(
        "Automation User ID:",
        automation.userId
      );

      if (automation.fileId) {
        const file =
          await prisma.file.findFirst({
            where: {
              id: automation.fileId,
              userId:
                automation.userId,
            },
          });

        if (!file) {
          console.log(
            "❌ FILE NOT FOUND:",
            automation.fileId
          );
        } else {
          console.log(
            "✅ FILE FOUND"
          );

          console.log(
            "File ID:",
            file.id
          );

          console.log(
            "File Name:",
            file.name
          );

          console.log(
            "File MIME:",
            file.mimeType
          );

          const publicBaseUrl =
            process.env.PUBLIC_BASE_URL;

          console.log(
            "PUBLIC_BASE_URL:",
            publicBaseUrl
          );

          if (publicBaseUrl) {
            fileUrl =
              `${publicBaseUrl.replace(
                /\/$/,
                ""
              )}/api/files/public/${file.id}`;

            console.log(
              "🔗 GENERATED FILE URL:"
            );

            console.log(fileUrl);
          } else {
            console.log(
              "❌ PUBLIC_BASE_URL missing"
            );
          }
        }
      } else {
        console.log(
          "⚠️ Automation has NO fileId"
        );
      }

      console.log(
        "======================================"
      );

      /*
      |--------------------------------------------------------------------------
      | PRIVATE DM
      |--------------------------------------------------------------------------
      */

      if (
        automation.dmMessage ||
        fileUrl
      ) {
        try {
          console.log(
            "📩 Sending private DM..."
          );

          let dmText =
            automation.dmMessage ||
            "";

          if (fileUrl) {
            dmText +=
              `\n\n📎 ${fileUrl}`;
          }

          console.log(
            "📨 FINAL DM TEXT:"
          );

          console.log(dmText);

          await sendPrivateReply(
            instagramUserId,
            commentId,
            dmText,
            accessToken
          );

          dmSent = true;

          console.log(
            "✅ PRIVATE DM SENT"
          );
        } catch (error) {
          lastError =
            error instanceof Error
              ? error.message
              : "Private DM failed";

          console.error(
            "❌ PRIVATE DM FAILED:",
            error
          );
        }
      } else {
        console.log(
          "⚠️ No DM message and no file URL"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | AUTOMATION RESULT
      |--------------------------------------------------------------------------
      */

      const success =
        (!automation.publicReply ||
          publicReplySent) &&
        (!automation.dmMessage &&
        !fileUrl
          ? true
          : dmSent);

      await prisma.automationLog.update({
        where: {
          id: log.id,
        },
        data: {
          eventType: success
            ? "AUTOMATION_COMPLETED"
            : "AUTOMATION_FAILED",

          success,

          errorMessage:
            lastError,
        },
      });

      console.log(
        "======================================"
      );

      console.log(
        success
          ? "✅ AUTOMATION COMPLETED"
          : "❌ AUTOMATION FAILED"
      );

      console.log(
        "======================================"
      );
    }
  }

  console.log(
    "🔥 WEBHOOK SERVICE FINISHED"
  );
}