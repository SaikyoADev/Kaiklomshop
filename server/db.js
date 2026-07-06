import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encrypt } from "./crypto.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const legacyJsonPath = path.join(__dirname, "database.legacy.json");

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "shopuser",
  password: process.env.DB_PASSWORD || "shoppass123",
  database: process.env.DB_NAME || "kaiklomshop",
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4_unicode_ci",
});

async function createSchema() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        salt VARCHAR(64) NOT NULL,
        passwordHash VARCHAR(128) NOT NULL,
        role VARCHAR(16) NOT NULL DEFAULT 'user',
        points BIGINT NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        game VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        price INT NOT NULL,
        image TEXT,
        description TEXT,
        status VARCHAR(16) NOT NULL DEFAULT 'active',
        createdAt DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS stock_items (
        id VARCHAR(64) PRIMARY KEY,
        productId VARCHAR(64) NOT NULL,
        username_enc TEXT NOT NULL,
        password_enc TEXT NOT NULL,
        note TEXT,
        sold TINYINT(1) NOT NULL DEFAULT 0,
        orderId VARCHAR(64),
        createdAt DATETIME NOT NULL,
        INDEX idx_stock_product (productId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS topups (
        id VARCHAR(64) PRIMARY KEY,
        userId VARCHAR(64) NOT NULL,
        amount BIGINT NOT NULL,
        slipRef VARCHAR(255),
        transferAt VARCHAR(64),
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        lineRef VARCHAR(255),
        note TEXT,
        source VARCHAR(32),
        createdAt DATETIME NOT NULL,
        reviewedAt DATETIME NULL,
        reviewedBy VARCHAR(64),
        adminHidden TINYINT(1) NOT NULL DEFAULT 0,
        hiddenAt DATETIME NULL,
        hiddenBy VARCHAR(64),
        INDEX idx_topups_user (userId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        userId VARCHAR(64) NOT NULL,
        productId VARCHAR(64) NOT NULL,
        productTitle VARCHAR(255) NOT NULL,
        price INT NOT NULL,
        stockItemId VARCHAR(64) NOT NULL,
        cred_username_enc TEXT NOT NULL,
        cred_password_enc TEXT NOT NULL,
        cred_note TEXT,
        createdAt DATETIME NOT NULL,
        INDEX idx_orders_user (userId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } finally {
    conn.release();
  }
}

function toMysqlDate(iso) {
  if (!iso) return null;
  return new Date(iso).toISOString().slice(0, 19).replace("T", " ");
}

async function migrateFromJsonIfNeeded() {
  const [[{ c }]] = await pool.query("SELECT COUNT(*) AS c FROM users");
  if (c > 0) return; // already has data
  if (!fs.existsSync(legacyJsonPath)) return;

  console.log("Migrating data from database.legacy.json into MySQL (one-time)...");
  const legacy = JSON.parse(fs.readFileSync(legacyJsonPath, "utf8"));

  for (const u of legacy.users || []) {
    await pool.query(
      `INSERT INTO users (id, name, username, salt, passwordHash, role, points, createdAt) VALUES (?,?,?,?,?,?,?,?)`,
      [u.id, u.name, u.username, u.salt, u.passwordHash, u.role, u.points, toMysqlDate(u.createdAt)]
    );
  }

  for (const p of legacy.products || []) {
    await pool.query(
      `INSERT INTO products (id, title, game, category, price, image, description, status, createdAt) VALUES (?,?,?,?,?,?,?,?,?)`,
      [p.id, p.title, p.game, p.category, p.price, p.image || "", p.description || "", p.status || "active", toMysqlDate(p.createdAt)]
    );
  }

  for (const s of legacy.stockItems || []) {
    await pool.query(
      `INSERT INTO stock_items (id, productId, username_enc, password_enc, note, sold, orderId, createdAt) VALUES (?,?,?,?,?,?,?,?)`,
      [s.id, s.productId, encrypt(s.username), encrypt(s.password), s.note || "", s.sold ? 1 : 0, s.orderId || null, toMysqlDate(s.createdAt)]
    );
  }

  for (const t of legacy.topups || []) {
    await pool.query(
      `INSERT INTO topups (id, userId, amount, slipRef, transferAt, status, lineRef, note, source, createdAt, reviewedAt, reviewedBy, adminHidden, hiddenAt, hiddenBy) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        t.id, t.userId, t.amount, t.slipRef || "", t.transferAt || "", t.status, t.lineRef || "", t.note || "",
        t.source || null, toMysqlDate(t.createdAt), toMysqlDate(t.reviewedAt), t.reviewedBy || null,
        t.adminHidden ? 1 : 0, toMysqlDate(t.hiddenAt), t.hiddenBy || null,
      ]
    );
  }

  for (const o of legacy.orders || []) {
    await pool.query(
      `INSERT INTO orders (id, userId, productId, productTitle, price, stockItemId, cred_username_enc, cred_password_enc, cred_note, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [o.id, o.userId, o.productId, o.productTitle, o.price, o.stockItemId, encrypt(o.credential?.username), encrypt(o.credential?.password), o.credential?.note || "", toMysqlDate(o.createdAt)]
    );
  }

  console.log(
    `Migration done: ${legacy.users?.length || 0} users, ${legacy.products?.length || 0} products, ` +
    `${legacy.stockItems?.length || 0} stock items, ${legacy.topups?.length || 0} topups, ${legacy.orders?.length || 0} orders.`
  );
}

export async function initDb() {
  await createSchema();
  await migrateFromJsonIfNeeded();
}
