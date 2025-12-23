
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "12345678901234567890123456789012"; // Must be 32 chars
const IV_LENGTH = 16;

export async function encrypt(text: string): Promise<string> {
    if (!text) return "";
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export async function decrypt(text: string): Promise<string> {
    if (!text) return "";
    const textParts = text.split(":");
    const ivPart = textParts.shift();
    if (!ivPart) return "";
    const iv = Buffer.from(ivPart, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
