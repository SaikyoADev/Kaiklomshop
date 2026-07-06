import crypto from "node:crypto";

// AES-256-GCM encryption for sensitive fields (game account username/password).
// The key MUST come from an environment variable in production — never hardcode it.
// Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const keyHex = process.env.CREDENTIAL_KEY;

// Temporary diagnostic log — safe to leave in, never prints the actual key value.
console.log(
  `[crypto.js] NODE_ENV=${process.env.NODE_ENV || "(not set)"} | ` +
  `CREDENTIAL_KEY present=${Boolean(keyHex)} | length=${keyHex ? keyHex.length : 0}`
);

if (!keyHex && process.env.NODE_ENV === "production") {
  throw new Error(
    "CREDENTIAL_KEY environment variable is required in production. " +
    "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}

// Fallback key ONLY for local development so `npm run dev` works out of the box.
// Never rely on this in production — set CREDENTIAL_KEY yourself.
const key = Buffer.from(keyHex || "0".repeat(64), "hex");

export function encrypt(plainText) {
  if (plainText === null || plainText === undefined) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store iv + authTag + ciphertext together, base64-encoded, so it's one column value.
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decrypt(payload) {
  if (payload === null || payload === undefined || payload === "") return "";
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
