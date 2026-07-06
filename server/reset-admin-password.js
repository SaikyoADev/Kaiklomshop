// สคริปต์เปลี่ยนรหัสผ่าน admin แบบปลอดภัย (แฮชรหัสผ่านให้อัตโนมัติ)
// วิธีใช้: node server/reset-admin-password.js รหัสผ่านใหม่ของฉัน123
import "dotenv/config";
import crypto from "node:crypto";
import { pool } from "./db.js";

const newPassword = process.argv[2];

if (!newPassword || newPassword.length < 8) {
  console.error("กรุณาระบุรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)");
  console.error("วิธีใช้: node server/reset-admin-password.js รหัสผ่านใหม่ของฉัน123");
  process.exit(1);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
  return { salt, hash };
}

async function run() {
  const [rows] = await pool.query("SELECT id, username FROM users WHERE role = 'admin' LIMIT 1");
  const admin = rows[0];
  if (!admin) {
    console.error("ไม่พบบัญชี admin ในระบบ");
    process.exit(1);
  }

  const { salt, hash } = hashPassword(newPassword);
  await pool.query("UPDATE users SET salt = ?, passwordHash = ? WHERE id = ?", [salt, hash, admin.id]);

  console.log(`เปลี่ยนรหัสผ่านของบัญชี "${admin.username}" สำเร็จแล้ว`);
  console.log("ลองเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย");
  process.exit(0);
}

run().catch((err) => {
  console.error("เกิดข้อผิดพลาด:", err.message);
  process.exit(1);
});
