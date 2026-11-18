# Kaiklomshop (Vue + Vite + Express + MySQL)

โปรเจกต์ร้านขายไอดีเกม ระบบเติมพอยต์โดยให้ผู้ใช้ติดต่อแอดมินก่อนทำรายการ

## โครงสร้างไฟล์
- `src/` → Vue 3 (แยกเป็น component), build ด้วย Vite
- `server/` → Express API + เชื่อม MySQL ผ่าน `db.js`
- `server/crypto.js` → เข้ารหัส username/password ของสต็อกไอดีเกมก่อนเก็บลง DB
- `public/` → ไฟล์สาธารณะของหน้าเว็บ โดยไม่เก็บ QR หรือข้อมูลบัญชีรับเงินจริง

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

## ส่วนที่ 2: Deploy ฟรีด้วย Render + TiDB Cloud

เว็บและ API รันบน Render ส่วนฐานข้อมูลใช้ TiDB Cloud Starter โหมด MySQL-compatible โดย Render จะอ่านการตั้งค่าจาก `render.yaml` อัตโนมัติ

### ขั้นตอน
1. สร้างฐานข้อมูล TiDB Cloud Starter แบบ **MySQL Compatible** และตั้ง spending limit เป็น `0` เพื่อใช้โควตาฟรี
2. ใน TiDB กด **Connect** แล้วเลือกการเชื่อมต่อแบบ Public / General จากนั้นจด `Host`, `Port`, `User`, `Password` และ `Database` ไว้ให้ครบ (Starter ต้องใช้ TLS)
3. อัปโหลดโปรเจกต์ขึ้น GitHub โดยใช้ repository แบบ Private ห้ามอัปโหลด `.env`, `node_modules`, `dist` หรือ `server/database.legacy.json`
4. ใน Render เลือก **New → Blueprint** แล้วเชื่อม repository ที่อัปโหลดไว้ จากนั้น Render จะใช้ `render.yaml` ตั้งค่า build และ start command
5. ใน Environment ของบริการ Render ใส่ `DB_HOST`, `DB_USER`, `DB_PASSWORD` และ `DB_NAME` จาก TiDB; `DB_PORT=4000` และ `DB_SSL=true` ตั้งไว้แล้วใน `render.yaml`
6. ตั้ง `INITIAL_ADMIN_PASSWORD` เป็นรหัสผ่านที่เดายาก แล้วบันทึกและ deploy
7. เปิด URL ที่ Render แสดง แล้วเข้าสู่ระบบด้วยชื่อผู้ใช้ `admin` และรหัสผ่านที่ตั้งไว้

`CREDENTIAL_KEY` จะถูกสร้างอัตโนมัติจาก `render.yaml` ห้ามลบหรือเปลี่ยนหลังเริ่มมีข้อมูลสต็อก เพราะใช้ถอดรหัสบัญชีเกมที่เก็บไว้

Render Free อาจพักเว็บเมื่อไม่มีผู้เข้าใช้งาน ส่วน TiDB Starter กำหนดให้ใช้ TLS ผ่าน public endpoint

---

## เช็กลิสต์ก่อนนำเสนอ/เปิดใช้งานจริง
- [ ] เปลี่ยนรหัสผ่าน admin จาก `admin1234`
- [ ] อย่า commit QR Code หรือข้อมูลบัญชีรับเงินจริงขึ้น GitHub ให้เก็บไว้เฉพาะช่องทางหลังบ้าน/แอดมิน
- [ ] ตั้งค่า `CREDENTIAL_KEY` ที่ไม่ซ้ำใคร และเก็บสำรองไว้ที่ปลอดภัย (ถ้าหายกู้รหัสไอดีเกมที่ขายไปแล้วคืนไม่ได้)
- [ ] ตรวจว่า `.env` และ `database.legacy.json` ไม่ถูก push ขึ้น GitHub
- [ ] ทดสอบซื้อสินค้าจริง 1 รอบ, เติมพอยต์จริง 1 รอบ ก่อนให้คนอื่นใช้งาน

## หมายเหตุด้านกฎหมาย
ถ้าจะรับเงินจริงจากคนทั่วไป (ไม่ใช่แค่โชว์อาจารย์) ควรตรวจสอบเรื่องการจดทะเบียนพาณิชย์อิเล็กทรอนิกส์กับ DBD และ PDPA เรื่องเก็บข้อมูลลูกค้า — อันนี้ปรึกษาผู้เชี่ยวชาญกฎหมายโดยตรง ไม่ใช่ส่วนที่ระบบซอฟต์แวร์แก้ให้ได้
