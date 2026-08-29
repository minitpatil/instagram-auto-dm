import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes.ts";
import instagramRoutes from "./modules/instagram/instagram.routes.ts";
import webhookRoutes from "./modules/webhook/webhook.routes.ts";
import fileRoutes from "./modules/file/file.routes.ts";


const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());


//app.use(cors());
app.use(express.json());
app.use("/api/files", fileRoutes);

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
app.use("/api/instagram", instagramRoutes);
app.use("/webhook", webhookRoutes);
/*
|--------------------------------------------------------------------------
| SERVER
|--------------------------------------------------------------------------
*/

const PORT = 3001;

app.listen(PORT, () => {
  console.log("======================================");
  console.log("🚀 TypeScript API Server Started");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("======================================");
});