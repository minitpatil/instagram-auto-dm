require("dotenv").config();

module.exports = {
  BASE_URL: `https://graph.instagram.com/${process.env.GRAPH_API_VERSION}`,
  IG_ACCESS_TOKEN: process.env.IG_ACCESS_TOKEN,
};