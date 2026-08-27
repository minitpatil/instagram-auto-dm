import { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../../middleware/auth.ts";
import {
  createFile,
  getFiles,
  getFileById,
  getPublicFileById,
  deleteFile,
} from "./file.service.ts";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/*
|--------------------------------------------------------------------------
| PUBLIC FILE
|--------------------------------------------------------------------------
| Instagram ला JWT token देता येणार नाही.
| त्यामुळे हा route authentication शिवाय accessible असला पाहिजे.
|
| URL:
| /api/files/public/:id
|
*/

router.get("/public/:id", async (req, res) => {
  try {
    const file = await getPublicFileById(req.params.id);

    if (!file) {
      return res.status(404).send("File not found");
    }

    const buffer = Buffer.from(file.content, "base64");

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${file.name}"`
    );

    return res.send(buffer);
  } catch (error) {
    console.error("PUBLIC FILE ERROR:", error);

    return res.status(500).send("Failed to load file");
  }
});

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES
|--------------------------------------------------------------------------
*/

router.use(authenticateToken);

/*
|--------------------------------------------------------------------------
| UPLOAD FILE
|--------------------------------------------------------------------------
*/

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const allowedTypes = [
      "text/plain",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only TXT, JPG, PNG and WEBP files are allowed",
      });
    }

    const file = await createFile({
      userId,
      name: req.file.originalname,
      content: req.file.buffer.toString("base64"),
      mimeType: req.file.mimetype,
    });

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      file: {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        createdAt: file.createdAt,
      },
    });
  } catch (error) {
    console.error("FILE UPLOAD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "File upload failed",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET FILES
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const files = await getFiles(userId);

    return res.json({
      success: true,
      files,
    });
  } catch (error) {
    console.error("GET FILES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get files",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET FILE BY ID
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const file = await getFileById(userId, req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    return res.json({
      success: true,
      file,
    });
  } catch (error) {
    console.error("GET FILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get file",
    });
  }
});

/*
|--------------------------------------------------------------------------
| DELETE FILE
|--------------------------------------------------------------------------
*/

router.delete("/:id", async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await deleteFile(userId, req.params.id);

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    return res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("DELETE FILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete file",
    });
  }
});

export default router;