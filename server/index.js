import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { pool, initDb } from "./db.js";
import { encrypt, decrypt, hashPassword, verifyPassword, passwordPolicyError } from "./crypto.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";
const isProd = process.env.NODE_ENV === "production";

const sessions = new Map();

function now() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
function toMysqlDateLocal(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
}
function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    points: Number(user.points),
    banned: Boolean(user.banned),
    banReason: user.banReason || "",
    createdAt: user.createdAt,
  };
}

const SESSION_COOKIE = "shopToken";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

function getAuth(req) {
  const token = req.cookies?.[SESSION_COOKIE] || "";
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  return session.userId;
}

async function getUserById(userId) {
  if (!userId) return null;
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
  return rows[0] || null;
}

async function requireUser(req, res) {
  const userId = getAuth(req);
  const user = await getUserById(userId);
  if (!user) {
    res.status(401).json({ ok: false, message: "กรุณาเข้าสู่ระบบก่อน" });
    return null;
  }
  if (user.banned) {
    res.status(403).json({ ok: false, message: `บัญชีนี้ถูกระงับการใช้งาน${user.banReason ? `: ${user.banReason}` : ""}` });
    return null;
  }
  return user;
}
async function requireAdmin(req, res) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (user.role !== "admin") {
    res.status(403).json({ ok: false, message: "เฉพาะผู้ดูแลระบบเท่านั้น" });
    return null;
  }
  return user;
}

async function stockCountFor(productId) {
  const [[{ c }]] = await pool.query("SELECT COUNT(*) AS c FROM stock_items WHERE productId = ? AND sold = 0", [productId]);
  return c;
}
async function productWithStock(product) {
  const stock = await stockCountFor(product.id);
  return { ...product, price: Number(product.price), stock };
}
async function topupWithUser(topup) {
  const user = await getUserById(topup.userId);
  return { ...topup, amount: Number(topup.amount), user: publicUser(user) };
}
function parseStockRows(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [username, password, ...noteParts] = row.split("|").map((p) => p.trim());
      return { username, password, note: noteParts.join(" | ") };
    })
    .filter((row) => row.username && row.password);
}

const app = express();

// Railway (and most PaaS hosts) sit the app behind a reverse proxy. Without this,
// express-rate-limit and req.ip would see the proxy's IP for every request — meaning
// all users would share one rate-limit bucket instead of getting their own.
app.set("trust proxy", 1);

// Security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, etc.)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  })
);

// Explicitly 404 well-known sensitive paths instead of falling through to the SPA index.html.
// (Without this, security scanners see HTTP 200 on /.env etc. and flag it, even though the
// real files are never actually served — this just makes that unambiguous.)
const blockedPathPattern = /(^|\/)(\.env|\.git(\/|$)|\.htaccess|\.ds_store|wp-config\.php|config\.php\.bak|phpinfo\.php|server-status|backup\.zip)/i;
app.use((req, res, next) => {
  if (blockedPathPattern.test(req.path)) {
    return res.status(404).type("text/plain").send("Not found");
  }
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// General limiter: generous, just stops obvious bot abuse of the whole API.
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "มีการเรียกใช้งานถี่เกินไป กรุณาลองใหม่อีกครั้ง" },
});
app.use("/api", generalLimiter);

// Strict limiter for login/register — the actual brute-force protection.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "พยายามเข้าสู่ระบบถี่เกินไป กรุณารอสักครู่แล้วลองใหม่" },
});

const api = express.Router();

api.get("/bootstrap", async (req, res) => {
  const userId = getAuth(req);
  let me = await getUserById(userId);
  if (me && me.banned) me = null;
  const [productRows] = await pool.query("SELECT * FROM products WHERE status = 'active' ORDER BY createdAt DESC");
  const products = await Promise.all(productRows.map(productWithStock));
  const [categoryRows] = await pool.query("SELECT DISTINCT category FROM products");
  const categories = categoryRows.map((r) => r.category);

  res.json({
    ok: true,
    me: publicUser(me),
    products,
    categories,
    bank: {
      name: "ธนาคารกรุงไทย",
      accountName: "นายณัฐวุฒิ นิลทะราช",
      accountNo: "กรอกเลขบัญชีของคุณที่นี่ (server/index.js)",
      lineNote: "เมื่อมีเงินเข้า ให้เจ้าของร้านดูแจ้งเตือน LINE Krungthai แล้วนำเลขอ้างอิงมากดยืนยันในหลังบ้าน",
    },
  });
});

api.post("/register", authLimiter, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!name || !username) {
    return res.status(400).json({ ok: false, message: "กรุณากรอกชื่อและชื่อผู้ใช้" });
  }
  const passwordError = passwordPolicyError(password);
  if (passwordError) {
    return res.status(400).json({ ok: false, message: passwordError });
  }
  const [existing] = await pool.query("SELECT id FROM users WHERE username = ?", [username]);
  if (existing.length) return res.status(400).json({ ok: false, message: "มีชื่อผู้ใช้นี้แล้ว" });

  const { salt, hash } = hashPassword(password);
  const user = { id: id("user"), name, username, salt, passwordHash: hash, role: "user", points: 0, createdAt: now() };
  await pool.query(
    "INSERT INTO users (id, name, username, salt, passwordHash, role, points, createdAt) VALUES (?,?,?,?,?,?,?,?)",
    [user.id, user.name, user.username, user.salt, user.passwordHash, user.role, user.points, user.createdAt]
  );
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_MAX_AGE_MS });
  setSessionCookie(res, token);
  res.status(201).json({ ok: true, user: publicUser(user) });
});

api.post("/login", authLimiter, async (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
  const user = rows[0];
  if (!user || !verifyPassword(password, user)) {
    return res.status(400).json({ ok: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
  }
  if (user.banned) {
    return res.status(403).json({ ok: false, message: `บัญชีนี้ถูกระงับการใช้งาน${user.banReason ? `: ${user.banReason}` : ""}` });
  }
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_MAX_AGE_MS });
  setSessionCookie(res, token);
  res.json({ ok: true, user: publicUser(user) });
});

api.post("/logout", async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) sessions.delete(token);
  clearSessionCookie(res);
  res.json({ ok: true });
});

api.post("/purchase", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [productRows] = await conn.query("SELECT * FROM products WHERE id = ? FOR UPDATE", [req.body.productId]);
    const product = productRows[0];
    if (!product || product.status !== "active") {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: "ไม่พบสินค้า" });
    }

    // Lock one unsold stock row so two simultaneous buyers can't grab the same item.
    const [stockRows] = await conn.query(
      "SELECT * FROM stock_items WHERE productId = ? AND sold = 0 ORDER BY createdAt ASC LIMIT 1 FOR UPDATE",
      [product.id]
    );
    const stockItem = stockRows[0];
    if (!stockItem) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "สินค้าหมดสต็อก" });
    }

    const [userRows] = await conn.query("SELECT * FROM users WHERE id = ? FOR UPDATE", [user.id]);
    const freshUser = userRows[0];
    if (Number(freshUser.points) < Number(product.price)) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "พอยต์ไม่เพียงพอ" });
    }

    const newPoints = Number(freshUser.points) - Number(product.price);
    await conn.query("UPDATE users SET points = ? WHERE id = ?", [newPoints, user.id]);

    const orderId = id("order");
    await conn.query("UPDATE stock_items SET sold = 1, orderId = ? WHERE id = ?", [orderId, stockItem.id]);

    const createdAt = now();
    await conn.query(
      `INSERT INTO orders (id, userId, productId, productTitle, price, stockItemId, cred_username_enc, cred_password_enc, cred_note, createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [orderId, user.id, product.id, product.title, product.price, stockItem.id, stockItem.username_enc, stockItem.password_enc, stockItem.note || "", createdAt]
    );

    await conn.commit();

    res.json({
      ok: true,
      user: publicUser({ ...freshUser, points: newPoints }),
      order: {
        id: orderId,
        productTitle: product.title,
        price: Number(product.price),
        credential: { username: decrypt(stockItem.username_enc), password: decrypt(stockItem.password_enc), note: stockItem.note || "" },
        createdAt,
      },
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ ok: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
  } finally {
    conn.release();
  }
});

api.post("/topups", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const amount = Math.round(Number(req.body.amount || 0));
  const slipRef = String(req.body.slipRef || "").trim();
  const transferAt = String(req.body.transferAt || "").trim();
  if (!Number.isFinite(amount) || amount <= 0 || !slipRef) {
    return res.status(400).json({ ok: false, message: "กรุณากรอกยอดและเลขอ้างอิงสลิป" });
  }
  const topup = { id: id("topup"), userId: user.id, amount, slipRef, transferAt, status: "pending", createdAt: now() };
  await pool.query(
    "INSERT INTO topups (id, userId, amount, slipRef, transferAt, status, createdAt) VALUES (?,?,?,?,?,?,?)",
    [topup.id, topup.userId, topup.amount, topup.slipRef, topup.transferAt, topup.status, topup.createdAt]
  );
  res.status(201).json({ ok: true, topup });
});

api.get("/topups", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const [rows] = await pool.query("SELECT * FROM topups WHERE userId = ? ORDER BY createdAt DESC", [user.id]);
  res.json({ ok: true, topups: rows.map((t) => ({ ...t, amount: Number(t.amount) })) });
});

api.get("/orders", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const [rows] = await pool.query("SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC", [user.id]);
  const orders = rows.map((o) => ({
    id: o.id,
    productTitle: o.productTitle,
    price: Number(o.price),
    createdAt: o.createdAt,
    credential: { username: decrypt(o.cred_username_enc), password: decrypt(o.cred_password_enc), note: o.cred_note || "" },
  }));
  res.json({ ok: true, orders });
});

api.post("/me/change-password", authLimiter, async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");

  if (!verifyPassword(currentPassword, user)) {
    return res.status(400).json({ ok: false, message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
  }
  const passwordError = passwordPolicyError(newPassword);
  if (passwordError) {
    return res.status(400).json({ ok: false, message: passwordError });
  }

  const { salt, hash } = hashPassword(newPassword);
  await pool.query("UPDATE users SET salt = ?, passwordHash = ? WHERE id = ?", [salt, hash, user.id]);

  // Log out every other session for this account as a safety measure.
  for (const [token, session] of sessions.entries()) {
    if (session.userId === user.id) sessions.delete(token);
  }
  const newToken = crypto.randomBytes(24).toString("hex");
  sessions.set(newToken, { userId: user.id, expiresAt: Date.now() + SESSION_MAX_AGE_MS });
  setSessionCookie(res, newToken);

  res.json({ ok: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" });
});

api.get("/admin", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const [productRows] = await pool.query("SELECT * FROM products ORDER BY createdAt DESC");
  const products = await Promise.all(productRows.map(productWithStock));
  const [topupRows] = await pool.query("SELECT * FROM topups WHERE adminHidden = 0 ORDER BY createdAt DESC");
  const topups = await Promise.all(topupRows.map(topupWithUser));
  const [orderRows] = await pool.query("SELECT id, userId, productId, productTitle, price, createdAt FROM orders ORDER BY createdAt DESC");
  const [[{ userCount }]] = await pool.query("SELECT COUNT(*) AS userCount FROM users");
  const [[{ memberCount }]] = await pool.query("SELECT COUNT(*) AS memberCount FROM users WHERE role != 'admin'");
  const [[{ pendingTopups }]] = await pool.query("SELECT COUNT(*) AS pendingTopups FROM topups WHERE status = 'pending'");
  const [[{ orderCount }]] = await pool.query("SELECT COUNT(*) AS orderCount FROM orders");

  res.json({
    ok: true,
    products,
    topups,
    orders: orderRows.map((o) => ({ ...o, price: Number(o.price) })),
    stats: { userCount, memberCount, pendingTopups, orderCount },
  });
});

// Paginated + searchable member list — keeps the admin panel usable once there are
// hundreds of members instead of dumping everyone into one long unscrollable list.
api.get("/admin/users", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const page = Math.max(1, Math.round(Number(req.query.page || 1)));
  const pageSize = Math.min(100, Math.max(1, Math.round(Number(req.query.pageSize || 20))));
  const search = String(req.query.search || "").trim();
  const offset = (page - 1) * pageSize;

  const whereClause = search ? "WHERE username LIKE ? OR name LIKE ?" : "";
  const params = search ? [`%${search}%`, `%${search}%`] : [];

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users ${whereClause}`, params);
  const [rows] = await pool.query(
    `SELECT * FROM users ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  res.json({ ok: true, users: rows.map(publicUser), total, page, pageSize });
});

api.post("/admin/products", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const product = {
    id: id("prod"),
    title: String(req.body.title || "").trim(),
    game: String(req.body.game || "Roblox").trim(),
    category: String(req.body.category || "Roblox ID").trim(),
    price: Math.max(1, Math.round(Number(req.body.price || 0))),
    image: String(req.body.image || "").trim(),
    description: String(req.body.description || "").trim(),
    status: req.body.status === "hidden" ? "hidden" : "active",
    createdAt: now(),
  };
  if (!product.title || !product.price) return res.status(400).json({ ok: false, message: "กรุณากรอกชื่อสินค้าและราคา" });
  await pool.query(
    "INSERT INTO products (id, title, game, category, price, image, description, status, createdAt) VALUES (?,?,?,?,?,?,?,?,?)",
    [product.id, product.title, product.game, product.category, product.price, product.image, product.description, product.status, product.createdAt]
  );
  res.status(201).json({ ok: true, product: await productWithStock(product) });
});

api.patch("/admin/products/:id", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
  const product = rows[0];
  if (!product) return res.status(404).json({ ok: false, message: "ไม่พบสินค้า" });

  const updated = { ...product };
  ["title", "game", "category", "image", "description"].forEach((key) => {
    if (req.body[key] !== undefined) updated[key] = String(req.body[key]).trim();
  });
  if (req.body.price !== undefined) updated.price = Math.max(1, Math.round(Number(req.body.price || 0)));
  if (req.body.status !== undefined) updated.status = req.body.status === "hidden" ? "hidden" : "active";

  await pool.query(
    "UPDATE products SET title=?, game=?, category=?, image=?, description=?, price=?, status=? WHERE id=?",
    [updated.title, updated.game, updated.category, updated.image, updated.description, updated.price, updated.status, product.id]
  );
  res.json({ ok: true, product: await productWithStock(updated) });
});

api.delete("/admin/products/:id", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
  const product = rows[0];
  if (!product) return res.status(404).json({ ok: false, message: "ไม่พบสินค้า" });

  const [[{ soldCount }]] = await pool.query("SELECT COUNT(*) AS soldCount FROM stock_items WHERE productId = ? AND sold = 1", [product.id]);

  // A spin-wheel prize pointing at this product would silently become unwinnable
  // forever once the product is gone — deactivate it and tell the admin why.
  const [affectedPrizes] = await pool.query(
    "SELECT id, label FROM spin_prizes WHERE productId = ? AND active = 1",
    [product.id]
  );
  if (affectedPrizes.length) {
    await pool.query("UPDATE spin_prizes SET active = 0 WHERE productId = ?", [product.id]);
  }

  await pool.query("DELETE FROM stock_items WHERE productId = ? AND sold = 0", [product.id]);
  await pool.query("DELETE FROM products WHERE id = ?", [product.id]);

  res.json({
    ok: true,
    deletedProductId: product.id,
    soldHistoryKept: soldCount,
    deactivatedSpinPrizes: affectedPrizes.map((p) => p.label),
  });
});

api.post("/admin/products/:id/stock", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
  const product = rows[0];
  if (!product) return res.status(404).json({ ok: false, message: "ไม่พบสินค้า" });

  const stockRows = parseStockRows(req.body.rows);
  if (!stockRows.length) return res.status(400).json({ ok: false, message: "กรุณาเพิ่มสต็อกแบบ user|password|หมายเหตุ" });

  const createdAt = now();
  for (const row of stockRows) {
    await pool.query(
      "INSERT INTO stock_items (id, productId, username_enc, password_enc, note, sold, createdAt) VALUES (?,?,?,?,?,0,?)",
      [id("stock"), product.id, encrypt(row.username), encrypt(row.password), row.note, createdAt]
    );
  }
  res.status(201).json({ ok: true, added: stockRows.length, product: await productWithStock(product) });
});

api.patch("/admin/topups/:id", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const [rows] = await pool.query("SELECT * FROM topups WHERE id = ?", [req.params.id]);
  const topup = rows[0];
  if (!topup) return res.status(404).json({ ok: false, message: "ไม่พบรายการเติมเงิน" });

  if (req.body.hidden === true) {
    await pool.query("UPDATE topups SET adminHidden = 1, hiddenAt = ?, hiddenBy = ? WHERE id = ?", [now(), admin.id, topup.id]);
    const [freshRows] = await pool.query("SELECT * FROM topups WHERE id = ?", [topup.id]);
    return res.json({ ok: true, topup: await topupWithUser(freshRows[0]) });
  }

  if (topup.status !== "pending") return res.status(400).json({ ok: false, message: "รายการนี้ตรวจสอบแล้ว" });
  const status = req.body.status === "approved" ? "approved" : "rejected";
  const lineRef = String(req.body.lineRef || "").trim();
  const note = String(req.body.note || "").trim();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      "UPDATE topups SET status=?, lineRef=?, note=?, reviewedAt=?, reviewedBy=? WHERE id=?",
      [status, lineRef, note, now(), admin.id, topup.id]
    );
    if (status === "approved") {
      await conn.query("UPDATE users SET points = points + ? WHERE id = ?", [topup.amount, topup.userId]);
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  const [freshRows] = await pool.query("SELECT * FROM topups WHERE id = ?", [topup.id]);
  res.json({ ok: true, topup: await topupWithUser(freshRows[0]) });
});

api.post("/admin/topups/hide-reviewed", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const [result] = await pool.query(
    "UPDATE topups SET adminHidden = 1, hiddenAt = ?, hiddenBy = ? WHERE status != 'pending' AND adminHidden = 0",
    [now(), admin.id]
  );
  res.json({ ok: true, hidden: result.affectedRows });
});

api.post("/admin/users/:id/points", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const user = await getUserById(req.params.id);
  if (!user) return res.status(404).json({ ok: false, message: "ไม่พบผู้ใช้" });
  const amount = Math.round(Number(req.body.amount || 0));
  const defaultNote = amount >= 0 ? "เพิ่มพอยต์โดยแอดมิน" : "ลดพอยต์โดยแอดมิน";
  const note = String(req.body.note || defaultNote).trim();
  if (!Number.isFinite(amount) || amount === 0) {
    return res.status(400).json({ ok: false, message: "กรุณากรอกจำนวนพอยต์ (ใส่เลขติดลบเพื่อลด)" });
  }
  if (amount < 0 && Number(user.points) + amount < 0) {
    return res.status(400).json({ ok: false, message: "พอยต์ของสมาชิกจะติดลบ กรุณาใส่จำนวนที่น้อยกว่านี้" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("UPDATE users SET points = points + ? WHERE id = ?", [amount, user.id]);
    const topup = {
      id: id("topup"), userId: user.id, amount, slipRef: "ADMIN-MANUAL", status: "approved",
      lineRef: "admin-direct", note, source: "admin", createdAt: now(), reviewedAt: now(), reviewedBy: admin.id,
    };
    await conn.query(
      `INSERT INTO topups (id, userId, amount, slipRef, status, lineRef, note, source, createdAt, reviewedAt, reviewedBy)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [topup.id, topup.userId, topup.amount, topup.slipRef, topup.status, topup.lineRef, topup.note, topup.source, topup.createdAt, topup.reviewedAt, topup.reviewedBy]
    );
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  const freshUser = await getUserById(user.id);
  const [topupRows] = await pool.query("SELECT * FROM topups WHERE userId = ? ORDER BY createdAt DESC LIMIT 1", [user.id]);
  res.json({ ok: true, user: publicUser(freshUser), topup: await topupWithUser(topupRows[0]) });
});

api.patch("/admin/users/:id/role", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const user = await getUserById(req.params.id);
  if (!user) return res.status(404).json({ ok: false, message: "ไม่พบผู้ใช้" });
  const role = req.body.role === "admin" ? "admin" : "user";

  if (user.id === admin.id && role === "user") {
    return res.status(400).json({ ok: false, message: "ไม่สามารถถอดสิทธิ์แอดมินของตัวเองได้" });
  }
  if (user.role === "admin" && role === "user") {
    const [[{ adminCount }]] = await pool.query("SELECT COUNT(*) AS adminCount FROM users WHERE role = 'admin'");
    if (adminCount <= 1) {
      return res.status(400).json({ ok: false, message: "ต้องมีแอดมินอย่างน้อย 1 คนเสมอ" });
    }
  }

  await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, user.id]);
  const freshUser = await getUserById(user.id);
  res.json({ ok: true, user: publicUser(freshUser) });
});

api.patch("/admin/users/:id/ban", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const user = await getUserById(req.params.id);
  if (!user) return res.status(404).json({ ok: false, message: "ไม่พบผู้ใช้" });
  if (user.role === "admin") return res.status(400).json({ ok: false, message: "ไม่สามารถแบนบัญชีแอดมินได้" });

  const banned = Boolean(req.body.banned);
  const banReason = banned ? String(req.body.reason || "").trim() : null;
  await pool.query("UPDATE users SET banned = ?, banReason = ? WHERE id = ?", [banned ? 1 : 0, banReason, user.id]);

  if (banned) {
    for (const [token, session] of sessions.entries()) {
      if (session.userId === user.id) sessions.delete(token);
    }
  }

  const freshUser = await getUserById(user.id);
  res.json({ ok: true, user: publicUser(freshUser) });
});

api.delete("/admin/users/:id", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const user = await getUserById(req.params.id);
  if (!user) return res.status(404).json({ ok: false, message: "ไม่พบผู้ใช้" });
  if (user.id === admin.id || user.role === "admin") return res.status(400).json({ ok: false, message: "ไม่สามารถลบบัญชีแอดมินได้" });

  await pool.query("UPDATE topups SET adminHidden = 1 WHERE userId = ?", [user.id]);
  await pool.query("DELETE FROM users WHERE id = ?", [user.id]);
  for (const [token, session] of sessions.entries()) {
    if (session.userId === user.id) sessions.delete(token);
  }
  res.json({ ok: true, deletedUserId: user.id });
});

// ---- Redeem codes ----

function generateCode() {
  // Human-friendly code like KAIKLOM-XXXX-XXXX
  const part = () => crypto.randomBytes(3).toString("hex").toUpperCase();
  return `KAIKLOM-${part()}-${part()}`;
}

api.post("/redeem", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const code = String(req.body.code || "").trim().toUpperCase();
  if (!code) return res.status(400).json({ ok: false, message: "กรุณากรอกโค้ด" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query("SELECT * FROM redeem_codes WHERE code = ? FOR UPDATE", [code]);
    const redeemCode = rows[0];
    if (!redeemCode || !redeemCode.active) {
      await conn.rollback();
      return res.status(404).json({ ok: false, message: "ไม่พบโค้ดนี้ หรือโค้ดถูกปิดใช้งานแล้ว" });
    }
    if (redeemCode.expiresAt && new Date(redeemCode.expiresAt) < new Date()) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "โค้ดนี้หมดอายุแล้ว" });
    }
    if (redeemCode.usedCount >= redeemCode.maxUses) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "โค้ดนี้ถูกใช้ครบจำนวนแล้ว" });
    }

    const [existingUse] = await conn.query(
      "SELECT id FROM redeem_code_uses WHERE codeId = ? AND userId = ?",
      [redeemCode.id, user.id]
    );
    if (existingUse.length) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "คุณใช้โค้ดนี้ไปแล้ว" });
    }

    await conn.query("UPDATE redeem_codes SET usedCount = usedCount + 1 WHERE id = ?", [redeemCode.id]);
    await conn.query("INSERT INTO redeem_code_uses (id, codeId, userId, usedAt) VALUES (?,?,?,?)", [
      id("redeemuse"), redeemCode.id, user.id, now(),
    ]);
    await conn.query("UPDATE users SET points = points + ? WHERE id = ?", [redeemCode.points, user.id]);

    await conn.commit();

    const freshUser = await getUserById(user.id);
    res.json({ ok: true, pointsAdded: redeemCode.points, user: publicUser(freshUser) });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ ok: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
  } finally {
    conn.release();
  }
});

api.get("/admin/codes", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const [rows] = await pool.query("SELECT * FROM redeem_codes ORDER BY createdAt DESC");
  res.json({ ok: true, codes: rows.map((c) => ({ ...c, points: Number(c.points) })) });
});

api.post("/admin/codes", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const points = Math.round(Number(req.body.points || 0));
  const maxUses = Math.max(1, Math.round(Number(req.body.maxUses || 1)));
  const expiresAt = req.body.expiresAt ? toMysqlDateLocal(req.body.expiresAt) : null;
  const customCode = String(req.body.code || "").trim().toUpperCase();

  if (!points || points <= 0) return res.status(400).json({ ok: false, message: "กรุณากรอกจำนวนพอยต์มากกว่า 0" });

  const code = customCode || generateCode();
  const codeRow = { id: id("code"), code, points, maxUses, createdAt: now(), createdBy: admin.id };

  try {
    await pool.query(
      "INSERT INTO redeem_codes (id, code, points, maxUses, expiresAt, createdAt, createdBy) VALUES (?,?,?,?,?,?,?)",
      [codeRow.id, codeRow.code, codeRow.points, codeRow.maxUses, expiresAt, codeRow.createdAt, codeRow.createdBy]
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(400).json({ ok: false, message: "โค้ดนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น" });
    throw error;
  }

  res.status(201).json({ ok: true, code: { ...codeRow, usedCount: 0, active: 1, expiresAt } });
});

api.patch("/admin/codes/:id", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const [rows] = await pool.query("SELECT * FROM redeem_codes WHERE id = ?", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ ok: false, message: "ไม่พบโค้ดนี้" });
  const active = req.body.active === false ? 0 : 1;
  await pool.query("UPDATE redeem_codes SET active = ? WHERE id = ?", [active, req.params.id]);
  res.json({ ok: true });
});

api.delete("/admin/codes/:id", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  await pool.query("DELETE FROM redeem_code_uses WHERE codeId = ?", [req.params.id]);
  await pool.query("DELETE FROM redeem_codes WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

// ---- Spin wheel ----

async function getSpinSettings() {
  const [rows] = await pool.query("SELECT * FROM spin_settings WHERE id = 1");
  return rows[0] || { costPerSpin: 10 };
}

async function getEligiblePrizesForSpin(conn) {
  // Active prizes only; product prizes need at least 1 unsold stock item to be eligible right now.
  const [rows] = await conn.query("SELECT * FROM spin_prizes WHERE active = 1");
  const eligible = [];
  for (const prize of rows) {
    if (prize.type === "product") {
      const [[{ c }]] = await conn.query("SELECT COUNT(*) AS c FROM stock_items WHERE productId = ? AND sold = 0", [prize.productId]);
      if (c > 0) eligible.push(prize);
    } else {
      eligible.push(prize);
    }
  }
  return eligible;
}

function pickWeighted(prizes) {
  const total = prizes.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * total;
  for (const prize of prizes) {
    if (roll < prize.weight) return prize;
    roll -= prize.weight;
  }
  return prizes[prizes.length - 1];
}

api.get("/spin", async (req, res) => {
  const settings = await getSpinSettings();
  const [rows] = await pool.query("SELECT * FROM spin_prizes WHERE active = 1 ORDER BY createdAt ASC");
  const total = rows.reduce((sum, p) => sum + p.weight, 0) || 1;
  const prizes = rows.map((p) => ({
    id: p.id,
    label: p.label,
    type: p.type,
    color: p.color,
    percent: Math.round((p.weight / total) * 1000) / 10,
  }));
  res.json({ ok: true, costPerSpin: Number(settings.costPerSpin), prizes });
});

api.post("/spin", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [settingsRows] = await conn.query("SELECT * FROM spin_settings WHERE id = 1 FOR UPDATE");
    const cost = Number(settingsRows[0]?.costPerSpin ?? 10);

    const [userRows] = await conn.query("SELECT * FROM users WHERE id = ? FOR UPDATE", [user.id]);
    const freshUser = userRows[0];
    if (Number(freshUser.points) < cost) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "พอยต์ไม่เพียงพอสำหรับหมุนกงล้อ" });
    }

    const eligible = await getEligiblePrizesForSpin(conn);
    if (!eligible.length) {
      await conn.rollback();
      return res.status(400).json({ ok: false, message: "ยังไม่มีของรางวัลให้หมุนตอนนี้" });
    }

    const prize = pickWeighted(eligible);
    const newPoints = Number(freshUser.points) - cost;
    await conn.query("UPDATE users SET points = ? WHERE id = ?", [newPoints, user.id]);

    let pointsWon = 0;
    let codeWon = null;
    const createdAt = now();

    if (prize.type === "points") {
      pointsWon = Number(prize.pointsValue) || 0;
      await conn.query("UPDATE users SET points = points + ? WHERE id = ?", [pointsWon, user.id]);
    } else if (prize.type === "code") {
      pointsWon = Number(prize.pointsValue) || 0;
      codeWon = `SPIN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      await conn.query(
        "INSERT INTO redeem_codes (id, code, points, maxUses, createdAt, createdBy) VALUES (?,?,?,?,?,?)",
        [id("code"), codeWon, pointsWon, 1, createdAt, "spin-wheel"]
      );
    } else if (prize.type === "product") {
      const [stockRows] = await conn.query(
        "SELECT * FROM stock_items WHERE productId = ? AND sold = 0 ORDER BY createdAt ASC LIMIT 1 FOR UPDATE",
        [prize.productId]
      );
      const stockItem = stockRows[0];
      if (stockItem) {
        const [productRows] = await conn.query("SELECT * FROM products WHERE id = ?", [prize.productId]);
        const product = productRows[0];
        const orderId = id("order");
        await conn.query("UPDATE stock_items SET sold = 1, orderId = ? WHERE id = ?", [orderId, stockItem.id]);
        await conn.query(
          `INSERT INTO orders (id, userId, productId, productTitle, price, stockItemId, cred_username_enc, cred_password_enc, cred_note, createdAt)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [orderId, user.id, prize.productId, product?.title || prize.label, 0, stockItem.id, stockItem.username_enc, stockItem.password_enc, stockItem.note || "", createdAt]
        );
      }
    }

    await conn.query(
      "INSERT INTO spin_history (id, userId, prizeId, prizeLabel, prizeType, pointsWon, codeWon, createdAt) VALUES (?,?,?,?,?,?,?,?)",
      [id("spin"), user.id, prize.id, prize.label, prize.type, pointsWon, codeWon, createdAt]
    );

    await conn.commit();

    const [finalUserRows] = await pool.query("SELECT * FROM users WHERE id = ?", [user.id]);
    res.json({
      ok: true,
      prizeId: prize.id,
      prizeLabel: prize.label,
      prizeType: prize.type,
      pointsWon,
      codeWon,
      user: publicUser(finalUserRows[0]),
    });
  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ ok: false, message: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
  } finally {
    conn.release();
  }
});

api.get("/admin/spin-prizes", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const [rows] = await pool.query("SELECT * FROM spin_prizes ORDER BY createdAt ASC");
  const total = rows.filter((p) => p.active).reduce((sum, p) => sum + p.weight, 0) || 1;
  const prizes = await Promise.all(
    rows.map(async (p) => {
      let stock = null;
      if (p.type === "product" && p.productId) stock = await stockCountFor(p.productId);
      return { ...p, weight: Number(p.weight), pointsValue: p.pointsValue !== null ? Number(p.pointsValue) : null, percent: Math.round((p.weight / total) * 1000) / 10, stock };
    })
  );
  const settings = await getSpinSettings();
  res.json({ ok: true, prizes, costPerSpin: Number(settings.costPerSpin) });
});

api.post("/admin/spin-prizes", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const type = ["points", "code", "product"].includes(req.body.type) ? req.body.type : "points";
  const label = String(req.body.label || "").trim();
  const weight = Math.max(1, Math.round(Number(req.body.weight || 10)));
  const color = String(req.body.color || "#f59e0b").trim();
  const pointsValue = type !== "product" ? Math.max(0, Math.round(Number(req.body.pointsValue || 0))) : null;
  const productId = type === "product" ? String(req.body.productId || "").trim() : null;

  if (!label) return res.status(400).json({ ok: false, message: "กรุณากรอกชื่อรางวัล" });
  if (type === "product" && !productId) return res.status(400).json({ ok: false, message: "กรุณาเลือกสินค้าสำหรับรางวัลนี้" });

  const prizeId = id("prize");
  await pool.query(
    "INSERT INTO spin_prizes (id, label, type, pointsValue, productId, color, weight, active, createdAt) VALUES (?,?,?,?,?,?,?,1,?)",
    [prizeId, label, type, pointsValue, productId, color, weight, now()]
  );
  res.status(201).json({ ok: true, prizeId });
});

api.patch("/admin/spin-prizes/:id", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const [rows] = await pool.query("SELECT * FROM spin_prizes WHERE id = ?", [req.params.id]);
  const prize = rows[0];
  if (!prize) return res.status(404).json({ ok: false, message: "ไม่พบรางวัลนี้" });

  const updated = { ...prize };
  if (req.body.label !== undefined) updated.label = String(req.body.label).trim();
  if (req.body.weight !== undefined) updated.weight = Math.max(1, Math.round(Number(req.body.weight || 10)));
  if (req.body.color !== undefined) updated.color = String(req.body.color).trim();
  if (req.body.pointsValue !== undefined) updated.pointsValue = Math.max(0, Math.round(Number(req.body.pointsValue || 0)));
  if (req.body.active !== undefined) updated.active = req.body.active ? 1 : 0;

  await pool.query(
    "UPDATE spin_prizes SET label=?, weight=?, color=?, pointsValue=?, active=? WHERE id=?",
    [updated.label, updated.weight, updated.color, updated.pointsValue, updated.active, prize.id]
  );
  res.json({ ok: true });
});

api.delete("/admin/spin-prizes/:id", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  await pool.query("DELETE FROM spin_prizes WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

api.patch("/admin/spin-settings", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const costPerSpin = Math.max(1, Math.round(Number(req.body.costPerSpin || 10)));
  await pool.query("UPDATE spin_settings SET costPerSpin = ? WHERE id = 1", [costPerSpin]);
  res.json({ ok: true, costPerSpin });
});

api.get("/admin/spin-history", async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const [rows] = await pool.query(
    `SELECT h.*, u.username, u.name FROM spin_history h LEFT JOIN users u ON u.id = h.userId ORDER BY h.createdAt DESC LIMIT 100`
  );
  res.json({ ok: true, history: rows.map((r) => ({ ...r, pointsWon: Number(r.pointsWon) })) });
});

app.use("/api", api);

if (isProd) {
  const distDir = path.join(root, "..", "dist");
  app.use(express.static(distDir));
  app.use((req, res) => res.sendFile(path.join(distDir, "index.html")));
}

// Centralized error logger — catches anything that slipped past a route's own
// try/catch (including rejected promises in async handlers, which Express 5
// forwards here automatically). Logs full detail server-side, but only ever
// sends a generic message to the client so nothing internal leaks.
app.use((err, req, res, next) => {
  console.error(`[unhandled error] ${req.method} ${req.originalUrl}:`, err);
  if (res.headersSent) return next(err);
  res.status(500).json({ ok: false, message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง" });
});

async function start() {
  await initDb();
  app.listen(port, host, () => {
    console.log(`API server running at http://${host}:${port}/`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
