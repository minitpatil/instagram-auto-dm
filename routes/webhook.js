const express = require("express");
const router = express.Router();

const API_VERSION = process.env.GRAPH_API_VERSION || "v26.0";
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;


// ======================================================
// IMPORTANT:
// फक्त या Media/Reel/Post IDs वर automation चालेल.
// नवीन Reel add करायची असेल तर इथे एक नवीन entry add कर.
// ======================================================

const REEL_CONFIGS = {

  // ====================================================
  // REEL / POST #1
  // ====================================================

  "17902878315462428": {
    publicReply:
      "Thanks for your comment! 🙌 Please check your DM.",

    dmMessage:
      "Transform my car photo into a cinematic night highway scene during heavy rain. Show the car driving at high speed with headlights on, wet-road reflections, glowing streetlights, water splashes and realistic motion blur. Keep the original car design, colour and number plate unchanged. Ultra-realistic, cinematic, 8K."
  },


  // ====================================================
  // REEL / POST #2
  // ====================================================

  "18098290736611122": {
    publicReply:
      "Thanks for your comment! 🔥 Please check your DM.",

    dmMessage:
      "Transform this car photo into a realistic cinematic monsoon scene in the Western Ghats of Maharashtra. Use only the original car, preserving its model, color, wheels, number plate, proportions, and all original details. Replace everything else with a lush Western Ghats landscape. Create a vertical stacked collage with three realistic views of the same car: Front 3/4, Side Profile, and Rear 3/4, arranged one below another in a single image. Keep the same background style and weather across all three frames. Show the car in motion on a wet Indian mountain road with correct left-side driving, matching steering angle and road curve. Add wheel motion blur, subtle tire water spray, headlights/taillights on, light monsoon rain, wet-road reflections, soft fog, overcast daylight, cinematic HDR, DSLR depth of field, ultra-realistic textures, and 8K quality."
  },


  // ====================================================
  // REEL / POST #3
  // ====================================================

  "YOUR_REEL_ID_3": {
    publicReply:
      "Thanks for your comment! 🚗 Please check your DM.",

    dmMessage:
      "YOUR THIRD REEL PROMPT HERE"
  },


  // ====================================================
  // REEL / POST #4
  // ====================================================

  "YOUR_REEL_ID_4": {
    publicReply:
      "Thanks for your comment! ❤️ Please check your DM.",

    dmMessage:
      "YOUR FOURTH REEL PROMPT HERE"
  }

};


// ======================================================
// DUPLICATE PROTECTION
// ======================================================

// Currently processing comments
const processingComments = new Set();

// Successfully processed comments
const processedComments = new Set();

// Public replies already sent
const publicRepliesSent = new Set();

// Private DMs already sent
const privateDMsSent = new Set();


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
// SEND PRIVATE DM / PRIVATE REPLY
// ======================================================
//
// IMPORTANT:
//
// Meta Private Reply API:
// POST
// /{INSTAGRAM_USER_ID}/messages
//
// recipient:
// {
//   comment_id: COMMENT_ID
// }
//
// म्हणजे COMMENTER ID URL मध्ये देऊ नये.
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

      return false;
    }

    console.log("");
    console.log("✅ PRIVATE DM SENT");
    console.log(
      JSON.stringify(result, null, 2)
    );

    return true;

  } catch (error) {

    console.error("");
    console.error("❌ PRIVATE DM ERROR");
    console.error(error);

    return false;
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


      // ------------------------------------------------
      // IMPORTANT:
      // entry.id = आपल्या Instagram Professional
      // Account चा ID
      // ------------------------------------------------

      const instagramUserId = entry.id;


      // =================================================
      // COMMENTS EVENTS
      // =================================================

      for (const change of entry.changes || []) {


        // ------------------------------------------------
        // फक्त comments event process करायचा
        // ------------------------------------------------

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
        //
        // आपल्या Instagram account कडून comment आला
        // तर automation चालू करू नये.
        //
        // entry.id = आपल्या IG account ID
        //
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
        // जर Reel/Post configured नसेल
        // तर काहीही करू नका.
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
        // PRIVATE DM
        // =================================================

        let privateDMSuccess = false;


        if (
          !privateDMsSent.has(
            String(commentId)
          )
        ) {

          privateDMSuccess =
            await sendPrivateDM(
              instagramUserId,
              commentId,
              config.dmMessage
            );


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

        //
        // दोन्ही successfully झाले तरच comment
        // processed म्हणून mark कर.
        //
        // =================================================

        if (
          publicReplySuccess &&
          privateDMSuccess
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