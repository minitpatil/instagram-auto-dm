const express = require("express");
const router = express.Router();

const API_VERSION = process.env.GRAPH_API_VERSION || "v26.0";
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;


// ======================================================
// REEL / POST CONFIGURATION
// ======================================================
//
// sendFile: false
// -> Personal DM only
//
// sendFile: true
// -> Personal DM + TXT file link
//
// fileKey:
// -> server.js मधील allowed TXT file key
// ======================================================

const REEL_CONFIGS = {

  // ====================================================
  // REEL / POST #1
  // PERSONAL DM ONLY
  // ====================================================

  "17902878315462428": {

    publicReply:
      "Thanks for your comment! 🙌 Please check your DM.",

    dmMessage:
      "Transform my car photo into a cinematic night highway scene during heavy rain. Show the car driving at high speed with headlights on, wet-road reflections, glowing streetlights, water splashes and realistic motion blur. Keep the original car design, colour and number plate unchanged. Ultra-realistic, cinematic, 8K.",

    sendFile: false
  },


  // ====================================================
  // REEL / POST #2
  // PERSONAL DM ONLY
  // ====================================================

  "18098290736611122": {

    publicReply:
      "Thanks for your comment! 🔥 Please check your DM.",

    dmMessage:
      "Transform this car photo into a realistic cinematic monsoon scene in the Western Ghats of Maharashtra. Use only the original car, preserving its model, color, wheels, number plate, proportions, and all original details. Replace everything else with a lush Western Ghats landscape. Create a vertical stacked collage with three realistic views of the same car: Front 3/4, Side Profile, and Rear 3/4, arranged one below another in a single image. Keep the same background style and weather across all three frames. Show the car in motion on a wet Indian mountain road with correct left-side driving, matching steering angle and road curve. Add wheel motion blur, subtle tire water spray, headlights/taillights on, light monsoon rain, wet-road reflections, soft fog, overcast daylight, cinematic HDR, DSLR depth of field, ultra-realistic textures, and 8K quality.",

    sendFile: false
  },


  // ====================================================
  // REEL / POST #3
  // PERSONAL DM + TXT FILE
  // ====================================================

  "18171066685434777": {

    publicReply:
      "Thanks for your comment! 🚗 Please check your DM.",

    dmMessage:
  "Thanks for commenting! 👇 Here is your requested prompt:\n\n" +
  "🚀 Automatic prompt delivery powered by SwatPat Solutions\n" +
  "Instagram: @swatpat.solutions",

    sendFile: true,

    fileKey: "Independance_day_prompts"
  },


  // ====================================================
  // REEL / POST #4
  // PERSONAL DM + TXT FILE
  // ====================================================

  "18103988321332247": {

    publicReply:
      "Thanks for your comment! ❤️ Please check your DM.",

    dmMessage:
  "Thanks for commenting! 👇 Here is your requested prompt:\n\n" +
  "🚀 Automatic prompt delivery powered by SwatPat Solutions\n" +
  "Instagram: @swatpat.solutions",

    sendFile: true,

    fileKey: "cgi_rally_prompt"
  },

  // ====================================================
  // REEL / POST #5
  // PERSONAL DM ONLY
  // ====================================================

  "18028541873836066": {

    publicReply:
      "Thanks for your comment! 🔥 Please check your DM.",

    dmMessage:
      "Create a premium cinematic devotional double-exposure artwork from my uploaded photo.Preserve only identity(face,body proportions,height,pose,perspective,lighting,vehicle);transform only the environment.Replace modern clothes with devotional attire(men:white kurta-pyjama+saffron/cream stole;women:authentic Maharashtrian Nauvari(Kashta),9-yard Warkari drape,front tuck,traditional jewellery,bindi,tied hair,never a 6-yard saree or modern drape).Keep traditional attire unchanged.Use a 15–20ft elevated wide-angle 9:16 composition with seamless integration,matched perspective,shadows,grading and depth.Create an authentic cloud-sculpted Lord Pandurang(Vitthal,hands-on-hips) above the real Chandrabhaga River,Shri Vitthal-Rukmini Temple,ghats,Warkaris,saffron flags and mist.Unique Pandharpur every time.Subtle Vitthal vehicle graphics only.Luxury travel-poster,photorealistic,volumetric lighting.Bottom-center Marathi calligraphy:“जय हरी विठ्ठल”.8K,no watermark.",

    sendFile: false
  },

  // ====================================================
  // REEL / POST #6
  // PERSONAL DM ONLY
  // ====================================================

  "17943271003422784": {

    publicReply:
      "Thanks for your comment! 🙌 Please check your DM.",

    dmMessage:
      "Test",

    sendFile: false
  },
  // ====================================================
  // REEL / POST #7
  // PERSONAL DM ONLY
  // ====================================================

  "18613567168034674": {

    publicReply:
      "Thanks for your comment! 🙌 Please check your DM.",

    dmMessage:
      "Transform the uploaded car into an ultra-realistic 3D cinematic street-drift scene at night. Remove all background object. Keep the car’s exact identity, model, body shape and details unchanged. Car i always on center of image with front and side angle.Add a huge crowd filming with phones, thick tire smoke, wet reflective road, streetlights, storefronts, flying debris and dramatic headlights. Aggressive drift/donut action, low-angle automotive photography, realistic motion and depth. Random sporty modified-car color: Electric blue, Neon Green, Purple or Golden.  Neon lights on bottom same color as car. Glass tilted 80%. Add large spoiler if Sedan or hatchback. Photorealistic, high-detail, cinematic.strictly 9:16 Vertical image.",

    sendFile: false
  }

};


// ======================================================
// DUPLICATE PROTECTION
// ======================================================

const processingComments = new Set();

const processedComments = new Set();

const publicRepliesSent = new Set();

const privateDMsSent = new Set();

const followRequiredRepliesSent = new Set();


// ======================================================
// CREATE TXT FILE URL
// ======================================================

function getFileUrl(req, fileKey) {

  const publicBaseUrl =
    process.env.PUBLIC_BASE_URL;

  if (publicBaseUrl) {

    return `${publicBaseUrl.replace(/\/$/, "")}/file/${fileKey}`;

  }

  return `${req.protocol}://${req.get("host")}/file/${fileKey}`;
}


// ======================================================
// SEND PUBLIC COMMENT REPLY
// ======================================================

async function sendPublicReply(commentId, message) {

  console.log("");
  console.log("📢 SENDING PUBLIC COMMENT REPLY");
  console.log("------------------------------------------");
  console.log("Comment ID:", commentId);
  console.log("Reply:", message);
  console.log("------------------------------------------");

  try {

    const url =
      `https://graph.instagram.com/${API_VERSION}/${commentId}/replies`;

    const response = await fetch(url, {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization":
          `Bearer ${INSTAGRAM_ACCESS_TOKEN}`
      },

      body: JSON.stringify({
        message: message
      })

    });

    const result = await response.json();

    if (!response.ok) {

      console.error("");
      console.error("❌ PUBLIC REPLY FAILED");

      console.error(
        JSON.stringify(result, null, 2)
      );

      return false;
    }

    console.log("");
    console.log("✅ PUBLIC REPLY SENT");

    console.log(
      JSON.stringify(result, null, 2)
    );

    return true;

  } catch (error) {

    console.error("");
    console.error("❌ PUBLIC REPLY ERROR");
    console.error(error);

    return false;
  }
}


// ======================================================
// SEND PRIVATE DM
// ======================================================

async function sendPrivateDM(
  instagramUserId,
  commentId,
  message
) {

  console.log("");
  console.log("📩 SENDING PRIVATE DM");
  console.log("------------------------------------------");
  console.log("Instagram User ID:", instagramUserId);
  console.log("Comment ID:", commentId);
  console.log("DM:", message);
  console.log("------------------------------------------");

  try {

    const url =
      `https://graph.instagram.com/${API_VERSION}/${instagramUserId}/messages`;

    const response = await fetch(url, {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "Authorization":
          `Bearer ${INSTAGRAM_ACCESS_TOKEN}`
      },

      body: JSON.stringify({

        recipient: {
          comment_id: commentId
        },

        message: {
          text: message
        }

      })

    });

    const result = await response.json();

    if (!response.ok) {

      console.error("");
      console.error("❌ PRIVATE DM FAILED");

      console.error(
        JSON.stringify(result, null, 2)
      );


      // ==================================================
      // CHECK FOLLOW REQUIRED ERROR
      // ==================================================

      const errorMessage =
        result?.error?.message?.toLowerCase() || "";

      const errorType =
        result?.error?.type?.toLowerCase() || "";

      const errorCode =
        result?.error?.code;

      const errorSubcode =
        result?.error?.error_subcode;


      const followRequired =
        errorMessage.includes("follow you") ||
        errorMessage.includes("follow this profile") ||
        errorMessage.includes("unless they follow") ||
        errorMessage.includes("can't message this profile") ||
        errorMessage.includes("cannot message this profile") ||
        (
          errorMessage.includes("follow") &&
          errorMessage.includes("message")
        );


      if (followRequired) {

        console.log("");
        console.log(
          "⚠️ DM BLOCKED: USER MUST FOLLOW FIRST"
        );

        console.log(
          "Error Code:",
          errorCode
        );

        console.log(
          "Error Subcode:",
          errorSubcode
        );

        console.log(
          "Error Type:",
          errorType
        );
      }


      return {
        success: false,
        followRequired: followRequired,
        error: result
      };
    }


    console.log("");
    console.log("✅ PRIVATE DM SENT");

    console.log(
      JSON.stringify(result, null, 2)
    );


    return {
      success: true,
      followRequired: false,
      result: result
    };


  } catch (error) {

    console.error("");
    console.error("❌ PRIVATE DM ERROR");
    console.error(error);

    return {
      success: false,
      followRequired: false,
      error: error
    };
  }
}


// ======================================================
// WEBHOOK POST
// ======================================================

router.post("/", async (req, res) => {

  console.log("");
  console.log("==========================================");
  console.log("        INSTAGRAM WEBHOOK EVENT");
  console.log("==========================================");

  console.log(
    JSON.stringify(req.body, null, 2)
  );

  console.log(
    "=========================================="
  );


  // ====================================================
  // META ला लगेच 200 response
  // ====================================================

  res.sendStatus(200);


  try {

    const body = req.body;


    // ==================================================
    // INSTAGRAM WEBHOOK आहे का?
    // ==================================================

    if (body.object !== "instagram") {

      console.log(
        "⏭️ Ignored: Not Instagram webhook"
      );

      return;
    }


    // ==================================================
    // ENTRY LOOP
    // ==================================================

    for (const entry of body.entry || []) {

      const instagramUserId = entry.id;


      // =================================================
      // COMMENTS EVENTS
      // =================================================

      for (const change of entry.changes || []) {

        if (change.field !== "comments") {

          console.log(
            "⏭️ Ignored event:",
            change.field
          );

          continue;
        }


        const value = change.value || {};


        // =================================================
        // MEDIA / REEL ID
        // =================================================

        const mediaId =
          value.media?.id;


        // =================================================
        // COMMENT ID
        // =================================================

        const commentId =
          value.id;


        // =================================================
        // COMMENT TEXT
        // =================================================

        const commentText =
          value.text || "";


        // =================================================
        // COMMENTER INFO
        // =================================================

        const commenterId =
          value.from?.id;

        const username =
          value.from?.username ||
          "there";


        console.log("");
        console.log("------------------------------------------");
        console.log("💬 New Comment:", commentText);
        console.log("👤 From:", username);
        console.log("👤 Commenter ID:", commenterId);
        console.log("🎬 Media ID:", mediaId);
        console.log("🆔 Comment ID:", commentId);
        console.log("------------------------------------------");


        // =================================================
        // BASIC VALIDATION
        // =================================================

        if (!mediaId) {

          console.log(
            "⚠️ Media ID not found"
          );

          continue;
        }


        if (!commentId) {

          console.log(
            "⚠️ Comment ID not found"
          );

          continue;
        }


        // =================================================
        // OWN COMMENT IGNORE
        // =================================================

        if (
          commenterId &&
          String(commenterId) ===
          String(instagramUserId)
        ) {

          console.log("");
          console.log(
            "⏭️ IGNORED: Comment created by our own account"
          );

          continue;
        }


        // =================================================
        // CHECK REEL / POST CONFIGURATION
        // =================================================

        const config =
          REEL_CONFIGS[String(mediaId)];


        // =================================================
        // NOT CONFIGURED
        // =================================================

        if (!config) {

          console.log("");
          console.log(
            "⏭️ IGNORED: This Reel/Post is NOT configured"
          );

          console.log(
            "Media ID:",
            mediaId
          );

          continue;
        }


        // =================================================
        // DUPLICATE PROTECTION
        // =================================================

        if (
          processedComments.has(
            String(commentId)
          )
        ) {

          console.log("");
          console.log(
            "⏭️ DUPLICATE COMMENT IGNORED"
          );

          console.log(
            "Comment ID:",
            commentId
          );

          continue;
        }


        // =================================================
        // IF SAME COMMENT IS CURRENTLY PROCESSING
        // =================================================

        if (
          processingComments.has(
            String(commentId)
          )
        ) {

          console.log("");
          console.log(
            "⏭️ COMMENT ALREADY PROCESSING"
          );

          continue;
        }


        // =================================================
        // MARK AS PROCESSING
        // =================================================

        processingComments.add(
          String(commentId)
        );


        console.log("");
        console.log(
          "🎯 AUTOMATION MATCH FOUND"
        );

        console.log(
          "Media ID:",
          mediaId
        );

        console.log(
          "Comment ID:",
          commentId
        );


        // =================================================
        // PUBLIC COMMENT REPLY
        // =================================================

        let publicReplySuccess = false;


        if (
          !publicRepliesSent.has(
            String(commentId)
          )
        ) {

          publicReplySuccess =
            await sendPublicReply(
              commentId,
              config.publicReply
            );


          if (publicReplySuccess) {

            publicRepliesSent.add(
              String(commentId)
            );

          }

        } else {

          console.log(
            "⏭️ PUBLIC REPLY ALREADY SENT"
          );

          publicReplySuccess = true;
        }


        // =================================================
        // BUILD PERSONAL DM
        // =================================================

        let finalDMMessage =
          config.dmMessage;


        // =================================================
        // ADD TXT FILE LINK ONLY WHEN:
        //
        // sendFile === true
        // AND
        // fileKey exists
        // =================================================

        if (
          config.sendFile === true &&
          config.fileKey
        ) {

          const fileUrl =
            getFileUrl(
              req,
              config.fileKey
            );


          finalDMMessage =
            `${config.dmMessage}\n\n${fileUrl}`;


          console.log("");
          console.log(
            "📄 TXT FILE ENABLED"
          );

          console.log(
            "File Key:",
            config.fileKey
          );

          console.log(
            "File URL:",
            fileUrl
          );

        } else {

          console.log("");
          console.log(
            "📄 TXT FILE: NOT REQUIRED FOR THIS REEL"
          );
        }


        // =================================================
        // PRIVATE DM
        // =================================================

        let privateDMSuccess = false;
        let followRequired = false;


        if (
          !privateDMsSent.has(
            String(commentId)
          )
        ) {

          const dmResult =
            await sendPrivateDM(
              instagramUserId,
              commentId,
              finalDMMessage
            );


          privateDMSuccess =
            dmResult.success;

          followRequired =
            dmResult.followRequired;


          if (privateDMSuccess) {

            privateDMsSent.add(
              String(commentId)
            );

          }

        } else {

          console.log(
            "⏭️ PRIVATE DM ALREADY SENT"
          );

          privateDMSuccess = true;
        }


        // =================================================
        // FOLLOW REQUIRED FALLBACK
        // =================================================

        let followReplySuccess = false;


        if (
          !privateDMSuccess &&
          followRequired
        ) {

          if (
            !followRequiredRepliesSent.has(
              String(commentId)
            )
          ) {

            console.log("");
            console.log(
              "📢 USER MUST FOLLOW FIRST"
            );


            const followReply =
              config.followRequiredReply ||
              "Please follow us first, then check your DM. 🙏";


            followReplySuccess =
              await sendPublicReply(
                commentId,
                followReply
              );


            if (followReplySuccess) {

              followRequiredRepliesSent.add(
                String(commentId)
              );

            }

          } else {

            console.log(
              "⏭️ FOLLOW REQUIRED REPLY ALREADY SENT"
            );

            followReplySuccess = true;
          }

        }


        // =================================================
        // FINAL RESULT
        // =================================================

        console.log("");
        console.log(
          "=========================================="
        );

        console.log(
          "        🎉 AUTOMATION RESULT"
        );

        console.log(
          "=========================================="
        );


        console.log(
          "Public Reply:",
          publicReplySuccess
            ? "✅ SENT"
            : "❌ FAILED"
        );


        console.log(
          "Private DM:",
          privateDMSuccess
            ? "✅ SENT"
            : "❌ FAILED"
        );


        console.log(
          "TXT File:",
          config.sendFile === true
            ? `✅ ${config.fileKey}`
            : "⏭️ NOT REQUIRED"
        );


        console.log(
          "Follow Required Reply:",
          followReplySuccess
            ? "✅ SENT"
            : followRequired
              ? "❌ FAILED"
              : "⏭️ NOT REQUIRED"
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
          "=========================================="
        );


        // =================================================
        // MARK COMPLETE
        // =================================================

        const normalFlowComplete =
          publicReplySuccess &&
          privateDMSuccess;


        const followFlowComplete =
          publicReplySuccess &&
          followRequired &&
          followReplySuccess;


        if (
          normalFlowComplete ||
          followFlowComplete
        ) {

          processedComments.add(
            String(commentId)
          );

        }


        // =================================================
        // REMOVE FROM PROCESSING
        // =================================================

        processingComments.delete(
          String(commentId)
        );

      }

    }

  } catch (error) {

    console.error("");
    console.error(
      "❌ WEBHOOK PROCESSING ERROR"
    );

    console.error(error);

  }

});


// ======================================================
// TOKEN CHECK
// ======================================================

console.log("");

console.log(
  "🔐 TOKEN LOADED:",
  !!INSTAGRAM_ACCESS_TOKEN
);

console.log(
  "📡 API VERSION:",
  API_VERSION
);

console.log(
  "🎯 CONFIGURED REELS:",
  Object.keys(REEL_CONFIGS)
);


// ======================================================
// EXPORT
// ======================================================

module.exports = router;