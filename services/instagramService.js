const axios = require("axios");
const {
  BASE_URL,
  IG_ACCESS_TOKEN,
} = require("../config/constants");

async function replyToComment(commentId, message) {
  try {
    const response = await axios.post(
      `${BASE_URL}/${commentId}/replies`,
      {
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${IG_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Public Reply Sent:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "❌ Reply Error:",
      error.response?.data || error.message
    );

    throw error;
  }
}

module.exports = {
  replyToComment,
};