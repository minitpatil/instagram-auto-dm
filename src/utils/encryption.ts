import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const secret = process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error(
      "INSTAGRAM_TOKEN_ENCRYPTION_KEY is not configured"
    );
  }

  return crypto
    .createHash("sha256")
    .update(secret)
    .digest();
}

export function encryptToken(token: string): string {
  const key = getEncryptionKey();

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();

  const parts = encryptedToken.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted Instagram token format");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}