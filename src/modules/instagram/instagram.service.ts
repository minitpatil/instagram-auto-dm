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
| GET MEDIA PERMALINK FROM MEDIA ID
|--------------------------------------------------------------------------
|
| IMPORTANT:
| User does NOT need to provide Media ID.
|
| Instagram webhook gives us the media ID.
| We use that ID internally to fetch the permalink.
|--------------------------------------------------------------------------
*/

async function getMediaPermalink(
  mediaId: string,
  accessToken: string
): Promise<string | null> {
  try {
    const url =
      `${GRAPH_API_BASE}/${encodeURIComponent(
        mediaId
      )}` +
      `?fields=id,permalink`;

    console.log("🔎 Looking up Instagram media:");
    console.log("Media ID:", mediaId);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    console.log("🔎 Media lookup response:");
    console.log(
      JSON.stringify(data, null, 2)
    );

    if (!response.ok) {
      console.error(
        "❌ Failed to get Instagram media permalink:",
        data
      );

      return null;
    }

    return data.permalink
      ? String(data.permalink)
      : null;
  } catch (error) {
    console.error(
      "❌ Media permalink lookup error:",
      error
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| NORMALIZE INSTAGRAM URL
|--------------------------------------------------------------------------
*/

function normalizeInstagramUrl(
  value: string
): string {
  try {
    const url = new URL(value.trim());

    url.protocol = "https:";
    url.hostname = url.hostname
      .toLowerCase()
      .replace(/^www\./, "");

    /*
    | Remove query parameters and hash.
    |
    | Example:
    | https://www.instagram.com/p/ABC123/?utm_source=x
    |
    | becomes:
    |
    | https://instagram.com/p/ABC123
    */

    url.search = "";
    url.hash = "";

    url.pathname = url.pathname.replace(
      /\/+$/,
      ""
    );

    return url.toString();
  } catch {
    return value
      .trim()
      .replace(/\/+$/, "")
      .toLowerCase();
  }
}

/*
|--------------------------------------------------------------------------
| INSTAGRAM URL MATCH
|--------------------------------------------------------------------------
*/

function instagramUrlsMatch(
  first: string,
  second: string
): boolean {
  return (
    normalizeInstagramUrl(first) ===
    normalizeInstagramUrl(second)
  );
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
  console.log(
    "Instagram User ID:",
    instagramUserId
  );
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
  const existingAccount =
    await prisma.instagramAccount.findUnique({
      where: {
        instagramUserId:
          input.instagramUserId,
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
      instagramUserId:
        input.instagramUserId,
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
  targetType: "POST" | "REEL";
  publicReply?: string | null;
  dmMessage?: string | null;
  fileId?: string | null;
}

export async function createAutomation(
  userId: string,
  input: CreateAutomationInput
) {
  console.log(
    "======================================"
  );
  console.log("🤖 CREATING AUTOMATION");
  console.log("User ID:", userId);
  console.log(
    "Instagram Account ID:",
    input.instagramAccountId
  );
  console.log(
    "Target URL:",
    input.targetUrl
  );
  console.log(
    "Target Type:",
    input.targetType
  );
  console.log("File ID:", input.fileId);
  console.log(
    "======================================"
  );

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
  | VERIFY TARGET URL
  |--------------------------------------------------------------------------
  */

  let normalizedTargetUrl: string;

  try {
    const parsedUrl = new URL(
      input.targetUrl.trim()
    );

    const hostname =
      parsedUrl.hostname
        .toLowerCase()
        .replace(/^www\./, "");

    if (
      hostname !== "instagram.com"
    ) {
      throw new Error(
        "Target URL must be an Instagram URL"
      );
    }

    const pathname =
      parsedUrl.pathname.toLowerCase();

    const isPost =
      pathname.startsWith("/p/");

    const isReel =
      pathname.startsWith("/reel/") ||
      pathname.startsWith("/reels/");

    if (
      input.targetType === "POST" &&
      !isPost
    ) {
      throw new Error(
        "POST automation requires an Instagram post URL."
      );
    }

    if (
      input.targetType === "REEL" &&
      !isReel
    ) {
      throw new Error(
        "REEL automation requires an Instagram reel URL."
      );
    }

    normalizedTargetUrl =
      normalizeInstagramUrl(
        input.targetUrl
      );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Invalid Instagram target URL"
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
  }

  /*
  |--------------------------------------------------------------------------
  | PREVENT DUPLICATE AUTOMATION
  |--------------------------------------------------------------------------
  */

  const existingAutomation =
    await prisma.automation.findFirst({
      where: {
        userId,
        instagramAccountId:
          input.instagramAccountId,
        status: "ACTIVE",
      },
    });

  if (existingAutomation) {
    const sameTarget =
      instagramUrlsMatch(
        existingAutomation.targetUrl,
        normalizedTargetUrl
      );

    if (sameTarget) {
      throw new Error(
        "An active automation already exists for this Instagram post/reel."
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE AUTOMATION
  |--------------------------------------------------------------------------
  |
  | mediaId intentionally remains NULL.
  |
  | The webhook will receive the Media ID later and
  | use it internally to identify the target media.
  |--------------------------------------------------------------------------
  */

  const automation =
    await prisma.automation.create({
      data: {
        userId,

        instagramAccountId:
          input.instagramAccountId,

        targetUrl:
          normalizedTargetUrl,

        mediaId: null,

        targetType:
          input.targetType,

        publicReply:
          input.publicReply || null,

        dmMessage:
          input.dmMessage || null,

        fileId:
          validFileId,

        status: "ACTIVE",
      },
    });

  console.log(
    "======================================"
  );
  console.log(
    "✅ AUTOMATION CREATED"
  );
  console.log(
    "Automation ID:",
    automation.id
  );
  console.log(
    "Target URL:",
    automation.targetUrl
  );
  console.log(
    "Media ID: NULL (resolved by webhook)"
  );
  console.log(
    "======================================"
  );

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
  console.log(
    "======================================"
  );
  console.log(
    "🔥 WEBHOOK SERVICE STARTED"
  );
  console.log(
    "======================================"
  );

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
      if (
        change.field !== "comments"
      ) {
        continue;
      }

      const value =
        change.value || {};

      const mediaId =
        value.media?.id
          ? String(value.media.id)
          : "";

      const commentId =
        value.id
          ? String(value.id)
          : "";

      const commentText =
        value.text;

      const username =
        value.from?.username;

      const commenterId =
        value.from?.id
          ? String(value.from.id)
          : "";

      /*
      |--------------------------------------------------------------------------
      | IGNORE OUR OWN REPLY
      |--------------------------------------------------------------------------
      */

      if (
        commenterId &&
        commenterId === instagramUserId
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

      if (
        !mediaId ||
        !commentId
      ) {
        console.log(
          "❌ Media ID or Comment ID missing"
        );

        continue;
      }

      console.log(
        "--------------------------------------"
      );

      console.log(
        "🔥 COMMENT RECEIVED"
      );

      console.log(
        "Media ID:",
        mediaId
      );

      console.log(
        "Comment ID:",
        commentId
      );

      console.log(
        "Username:",
        username
      );

      console.log(
        "Comment:",
        commentText
      );

      console.log(
        "--------------------------------------"
      );

      /*
      |--------------------------------------------------------------------------
      | GET ACTUAL MEDIA PERMALINK
      |--------------------------------------------------------------------------
      |
      | This is the important part.
      |
      | User did not provide Media ID.
      |
      | Meta webhook gives us mediaId.
      | We ask Instagram API for its permalink.
      |--------------------------------------------------------------------------
      */

      const mediaPermalink =
        await getMediaPermalink(
          mediaId,
          accessToken
        );

      if (!mediaPermalink) {
        console.log(
          "❌ Could not resolve media permalink:",
          mediaId
        );

        continue;
      }

      console.log(
        "🔗 Media permalink:",
        mediaPermalink
      );

      /*
      |--------------------------------------------------------------------------
      | FIND AUTOMATION BY TARGET URL
      |--------------------------------------------------------------------------
      */

      const candidateAutomations =
        await prisma.automation.findMany({
          where: {
            instagramAccountId:
              account.id,

            status: "ACTIVE",
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      const automation =
        candidateAutomations.find(
          (item) =>
            instagramUrlsMatch(
              item.targetUrl,
              mediaPermalink
            )
        );

      if (!automation) {
        console.log(
          "❌ NO AUTOMATION FOUND FOR MEDIA URL"
        );

        console.log(
          "Webhook media URL:",
          mediaPermalink
        );

        console.log(
          "Available automation URLs:"
        );

        for (
          const item of candidateAutomations
        ) {
          console.log(
            "-",
            item.targetUrl
          );
        }

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | SAVE MEDIA ID INTERNALLY
      |--------------------------------------------------------------------------
      |
      | User never needs to see or enter this.
      |
      | We store it after the first successful webhook match.
      |--------------------------------------------------------------------------
      */

      if (
        automation.mediaId !== mediaId
      ) {
        await prisma.automation.update({
          where: {
            id: automation.id,
          },

          data: {
            mediaId,
          },
        });

        console.log(
          "✅ Media ID saved internally:",
          mediaId
        );
      }

      console.log(
        "✅ AUTOMATION MATCHED:",
        automation.id
      );

      console.log(
        "🤖 AUTOMATION DETAILS"
      );

      console.log(
        "User ID:",
        automation.userId
      );

      console.log(
        "Instagram Account ID:",
        automation.instagramAccountId
      );

      console.log(
        "Target URL:",
        automation.targetUrl
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

      let publicReplySent =
        false;

      let dmSent =
        false;

      let lastError:
        string | null = null;

      /*
      |--------------------------------------------------------------------------
      | PUBLIC REPLY
      |--------------------------------------------------------------------------
      */

      if (
        automation.publicReply
      ) {
        try {
          console.log(
            "📢 Sending public reply..."
          );

          await sendPublicReply(
            commentId,
            automation.publicReply,
            accessToken
          );

          publicReplySent =
            true;

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

      console.log(
        "======================================"
      );

      console.log(
        "📎 FILE PROCESSING"
      );

      console.log(
        "Automation File ID:",
        automation.fileId
      );

      console.log(
        "Automation User ID:",
        automation.userId
      );

      if (
        automation.fileId
      ) {
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

          if (
            publicBaseUrl
          ) {
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

          console.log(
            dmText
          );

          await sendPrivateReply(
            instagramUserId,
            commentId,
            dmText,
            accessToken
          );

          dmSent =
            true;

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
          eventType:
            success
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

/*
|--------------------------------------------------------------------------
| REMOVE INSTAGRAM ACCOUNT
|--------------------------------------------------------------------------
*/

export async function removeInstagramAccount(
  userId: string,
  instagramAccountId: string
) {
  console.log("======================================");
  console.log("🗑️ REMOVING INSTAGRAM ACCOUNT");
  console.log("User ID:", userId);
  console.log("Instagram Account ID:", instagramAccountId);
  console.log("======================================");

  const account =
    await prisma.instagramAccount.findFirst({
      where: {
        id: instagramAccountId,
        userId,
      },
    });

  if (!account) {
    throw new Error(
      "Instagram account not found or does not belong to this user"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE / DISABLE AUTOMATIONS FIRST
  |--------------------------------------------------------------------------
  */

  await prisma.automation.updateMany({
    where: {
      instagramAccountId: account.id,
      userId,
    },
    data: {
      status: "DISABLED",
    },
  });

  /*
  |--------------------------------------------------------------------------
  | DELETE INSTAGRAM ACCOUNT
  |--------------------------------------------------------------------------
  */

  await prisma.instagramAccount.delete({
    where: {
      id: account.id,
    },
  });

  console.log(
    "✅ Instagram account removed:",
    account.username
  );

  return {
    success: true,
    message: "Instagram account removed successfully",
  };
}