# Kaiklomshop (Vue + Vite + Express + MySQL)

โปรเจกต์ร้านขายไอดีเกม ระบบเติมพอยต์ผ่าน PromptPay QR

## โครงสร้างไฟล์
- `src/` → Vue 3 (แยกเป็น component), build ด้วย Vite
- `server/` → Express API + เชื่อม MySQL ผ่าน `db.js`
- `server/crypto.js` → เข้ารหัส username/password ของสต็อกไอดีเกมก่อนเก็บลง DB
- `public/promptpay-qr.jpg` → QR โอนเงินจริงของร้าน

---

## ส่วนที่ 1: รันตอนพัฒนา (ในเครื่องตัวเอง)

### สิ่งที่ต้องติดตั้งก่อน
1. Node.js เวอร์ชัน 22 ขึ้นไป (มี `node:sqlite`/ฟีเจอร์ใหม่ที่ใช้)
2. MySQL หรือ MariaDB (ถ้าเคยลง XAMPP มาแล้วใช้ตัวนั้นได้เลย)

### ขั้นตอน
```bash
npm install
cp .env.example .env
```
เปิดไฟล์ `.env` แล้วใส่:
- `DB_PASSWORD` → รหัสผ่าน MySQL ของคุณ
- `CREDENTIAL_KEY` → รันคำสั่งนี้แล้วเอาผลลัพธ์มาใส่ (ห้ามลืมเก็บไว้ที่อื่นด้วย ถ้าคีย์นี้หายจะกู้รหัสไอดีเกมที่เข้ารหัสไว้คืนไม่ได้):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

สร้างฐานข้อมูลเปล่าไว้รอ (ครั้งแรกครั้งเดียว):
```sql
CREATE DATABASE kaiklomshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shopuser'@'localhost' IDENTIFIED BY 'รหัสผ่านเดียวกับใน .env';
GRANT ALL PRIVILEGES ON kaiklomshop.* TO 'shopuser'@'localhost';
FLUSH PRIVILEGES;
```

รัน:
```bash
npm run dev
```
เข้า **http://localhost:5173** — ระบบจะสร้างตารางและ**ย้ายข้อมูลจาก `server/database.legacy.json` เข้า MySQL อัตโนมัติครั้งแรกที่รัน** (ถ้าฐานข้อมูลว่างอยู่)

บัญชีทดสอบ: `admin` / `admin1234` และ `demo` / `123456`
**เปลี่ยนรหัสผ่าน admin ทันทีที่เข้าระบบได้ครั้งแรก**

---

## ส่วนที่ 2: เปิดใช้งานจริง — แนะนำ Railway (ง่ายสุดสำหรับเวลาจำกัด)

ทำไมแนะนำ Railway: มี MySQL ให้ในตัว ไม่ต้องเช่า VPS แยก, HTTPS ให้ฟรีอัตโนมัติ, deploy จาก GitHub ได้ใน 2-3 คลิก, มีแพ็กเกจฟรี/ราคาถูกพอสำหรับโปรเจกต์จบ

### ขั้นตอน
1. **สร้างบัญชี Railway** ที่ railway.app (ผูก GitHub ได้เลย)
2. **Push โค้ดโปรเจกต์นี้ขึ้น GitHub** (repo ใหม่ private ก็ได้)
   - **สำคัญ**: ก่อน push ให้แน่ใจว่า `.env` และ `server/database.legacy.json` ไม่ถูก commit ขึ้นไป (มีอยู่ใน `.gitignore` แล้ว) เพราะมีข้อมูลลูกค้าจริงอยู่ในนั้น
3. ใน Railway กด **New Project → Deploy from GitHub repo** เลือก repo นี้
4. กด **+ New → Database → MySQL** ในโปรเจกต์เดียวกัน Railway จะสร้าง MySQL ให้และโชว์ค่า connection (host, user, password, database) มาให้
5. ไปที่ service ของแอป (ไม่ใช่ตัว MySQL) → แท็บ **Variables** ใส่:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` → คัดลอกจากตัว MySQL ที่ Railway สร้างให้ (มักจะมีปุ่ม "Reference" ให้เชื่อมตรงได้เลยไม่ต้องพิมพ์เอง)
   - `CREDENTIAL_KEY` → รันคำสั่งสร้างคีย์แบบเดียวกับด้านบน แล้ววางที่นี่
   - `NODE_ENV` = `production`
6. ตั้ง **Build Command**: `npm run build`
   ตั้ง **Start Command**: `npm start`
7. Railway จะ deploy ให้อัตโนมัติ เสร็จแล้วจะได้ URL ชั่วคราวแบบ `xxxx.up.railway.app` — เปิดดูได้เลยว่าใช้งานได้จริง

### ต่อโดเมนจริง (ถ้าอยากได้ชื่อของตัวเอง)
1. ซื้อโดเมนจากที่ไหนก็ได้ที่ราคาถูกและง่าย เช่น **Cloudflare Registrar**, Namecheap, หรือผู้ให้บริการไทยอย่าง GoDaddy/Godaddy.co.th — โดเมน `.com` ราคาประมาณ 300-500 บาท/ปี
2. ใน Railway → service ของแอป → แท็บ **Settings → Networking → Custom Domain** ใส่โดเมนที่ซื้อมา ระบบจะให้ค่า CNAME มา
3. ไปที่หน้าจัดการ DNS ของโดเมน (ที่ Cloudflare/Namecheap) เพิ่ม CNAME record ตามที่ Railway บอก
4. รอ 10-30 นาที โดเมนจะเริ่มใช้งานได้ และ Railway จะออก HTTPS ให้อัตโนมัติ (ไม่ต้องตั้งเอง)

**ถ้าเวลาไม่พอจริงๆ** ใช้ URL ฟรีของ Railway (`xxxx.up.railway.app`) นำเสนอได้เลยโดยไม่ต้องซื้อโดเมนก็ได้ อาจารย์ดูที่ตัวระบบทำงานได้จริงมากกว่าชื่อโดเมน

---

## เช็กลิสต์ก่อนนำเสนอ/เปิดใช้งานจริง
- [ ] เปลี่ยนรหัสผ่าน admin จาก `admin1234`
- [ ] ใส่เลขบัญชี PromptPay จริงใน `server/index.js` (ตอนนี้ใส่ไว้แค่ชื่อบัญชี ยังไม่ใส่เลขบัญชี)
- [ ] ตั้งค่า `CREDENTIAL_KEY` ที่ไม่ซ้ำใคร และเก็บสำรองไว้ที่ปลอดภัย (ถ้าหายกู้รหัสไอดีเกมที่ขายไปแล้วคืนไม่ได้)
- [ ] ตรวจว่า `.env` และ `database.legacy.json` ไม่ถูก push ขึ้น GitHub
- [ ] ทดสอบซื้อสินค้าจริง 1 รอบ, เติมพอยต์จริง 1 รอบ ก่อนให้คนอื่นใช้งาน

## หมายเหตุด้านกฎหมาย
ถ้าจะรับเงินจริงจากคนทั่วไป (ไม่ใช่แค่โชว์อาจารย์) ควรตรวจสอบเรื่องการจดทะเบียนพาณิชย์อิเล็กทรอนิกส์กับ DBD และ PDPA เรื่องเก็บข้อมูลลูกค้า — อันนี้ปรึกษาผู้เชี่ยวชาญกฎหมายโดยตรง ไม่ใช่ส่วนที่ระบบซอฟต์แวร์แก้ให้ได้
