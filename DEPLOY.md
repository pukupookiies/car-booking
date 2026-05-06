# 🚗 วิธี Deploy ระบบจองรถ
## Google Sheets + Apps Script + GitHub Pages

---

## ขั้นที่ 1 — สร้าง Google Sheet

1. ไปที่ https://sheets.google.com → สร้าง Spreadsheet ใหม่
2. ตั้งชื่อว่า **Car Booking**
3. copy **Spreadsheet ID** จาก URL:
   ```
   https://docs.google.com/spreadsheets/d/  ← ID อยู่ตรงนี้  /edit
   ```

---

## ขั้นที่ 2 — ตั้งค่า Google Apps Script

1. ใน Google Sheet → เมนู **Extensions → Apps Script**
2. ลบ code เดิมทิ้งทั้งหมด
3. copy code จากไฟล์ **Code.gs** วางลงไป
4. แก้บรรทัดแรก:
   ```js
   const SHEET_ID = "ใส่ ID ของ Sheet ที่ copy มา";
   ```
5. กด **Save** (Ctrl+S)
6. กด **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**  ← สำคัญมาก
7. กด **Deploy** → Copy **Web app URL** ที่ได้

---

## ขั้นที่ 3 — ใส่ URL ใน React app

แก้ไฟล์ `src/api.js` บรรทัดแรก:
```js
const API_URL = "วาง Web app URL ที่ได้จากขั้นที่ 2 ตรงนี้";
```

---

## ขั้นที่ 4 — สร้าง GitHub Repo

1. ไปที่ https://github.com → **New repository**
2. ตั้งชื่อ: **car-booking**
3. เลือก **Public**
4. กด **Create repository**

---

## ขั้นที่ 5 — แก้ config ให้ตรงกับ GitHub

แก้ไฟล์ `package.json`:
```json
"homepage": "https://ชื่อ_github_ของคุณ.github.io/car-booking"
```

แก้ไฟล์ `vite.config.js`:
```js
base: '/car-booking/',   // ← ชื่อ repo
```

---

## ขั้นที่ 6 — Push โค้ดขึ้น GitHub

เปิด Terminal ใน folder `car-booking`:

```bash
# ติดตั้ง dependencies
npm install

# เริ่มต้น git
git init
git add .
git commit -m "first commit"

# เชื่อม GitHub
git remote add origin https://github.com/ชื่อคุณ/car-booking.git
git branch -M main
git push -u origin main
```

---

## ขั้นที่ 7 — Deploy ขึ้น GitHub Pages

```bash
npm run deploy
```

รอสัก 2-3 นาที แล้วเข้าได้ที่:
```
https://ชื่อคุณ.github.io/car-booking
```

---

## ขั้นที่ 8 — เปิด GitHub Pages

1. ไปที่ GitHub repo → **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** / root
4. กด **Save**

---

## 🔄 อัปเดตแอปในอนาคต

```bash
# แก้โค้ดเสร็จแล้ว
git add .
git commit -m "update"
git push
npm run deploy
```

---

## ❗ หมายเหตุ

- Apps Script ช้าประมาณ **1-3 วินาที** ต่อ request (ปกติของ free tier)
- ถ้า Sheet มีข้อมูลเยอะ อาจช้าขึ้นนิดนึง
- ปุ่ม 🔄 ในแอปใช้ refresh ข้อมูลจาก Sheet ได้ตลอด

---

## 📁 โครงสร้างไฟล์

```
car-booking/
├── Code.gs              ← วางใน Apps Script
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── api.js           ← ใส่ Apps Script URL ตรงนี้
    └── App.jsx          ← ตัวแอปหลัก
```
