import "dotenv/config";
import express from "express";

import authRoutes from "./modules/auth/auth.routes.ts";

const app = express();

app.use(express.json());

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/healthz", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

/*
|--------------------------------------------------------------------------
| SERVER
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log("======================================");
  console.log("🚀 TypeScript API Server Started");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("======================================");
});