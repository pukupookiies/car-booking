// ============================================================
//  CAR BOOKING — Google Apps Script Backend
//  วาง code นี้ใน Apps Script แล้ว Deploy เป็น Web App
// ============================================================

const SHEET_ID = "1ksiRIXLjTo2GBx2a7wor4L7ahvnJPKs5pgS__cQGaPI";

const SS        = SpreadsheetApp.openById(SHEET_ID);
const SH_CARS   = () => getOrCreate("CARS",   ["id","name","plate","type","color","emoji"]);
const SH_USERS  = () => getOrCreate("USERS",  ["id","name","dept"]);
const SH_BK     = () => getOrCreate("BOOKINGS",["id","carId","user","purpose","startDate","endDate","startTime","endTime","status","note"]);

function getOrCreate(name, headers) {
  let sh = SS.getSheetByName(name);
  if (!sh) {
    sh = SS.insertSheet(name);
    sh.appendRow(headers);
  }
  return sh;
}

// ── CORS helper ──
function cors(output) {
  return output
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader("Access-Control-Allow-Origin", "*")
    .addHeader("Access-Control-Allow-Methods", "GET,POST")
    .addHeader("Access-Control-Allow-Headers", "Content-Type");
}

function ok(data)  { return cors(ContentService.createTextOutput(JSON.stringify({ ok:true,  data }))); }
function err(msg)  { return cors(ContentService.createTextOutput(JSON.stringify({ ok:false, error: msg }))); }

// ── Sheet → Array of objects ──
function sheetToArr(sh) {
  const rows = sh.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });
}

// ── Find row index by id (1-based, includes header) ──
function findRow(sh, id) {
  const ids = sh.getRange(1, 1, sh.getLastRow()).getValues().flat();
  const idx = ids.indexOf(String(id));
  return idx === -1 ? -1 : idx + 1;
}

// ── GET handler ──
function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === "getCars")     return ok(sheetToArr(SH_CARS()));
    if (action === "getUsers")    return ok(sheetToArr(SH_USERS()));
    if (action === "getBookings") return ok(sheetToArr(SH_BK()));
    return err("unknown action");
  } catch(ex) { return err(ex.message); }
}

// ── POST handler ──
function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents);
    const action = body.action;
    const data   = body.data;

    // ── CARS ──
    if (action === "addCar") {
      const id = Date.now().toString();
      SH_CARS().appendRow([id, data.name, data.plate, data.type, data.color, data.emoji]);
      return ok({ id });
    }
    if (action === "updateCar") {
      const sh  = SH_CARS();
      const row = findRow(sh, data.id);
      if (row < 0) return err("car not found");
      sh.getRange(row, 1, 1, 6).setValues([[data.id, data.name, data.plate, data.type, data.color, data.emoji]]);
      return ok(true);
    }
    if (action === "deleteCar") {
      const sh  = SH_CARS();
      const row = findRow(sh, data.id);
      if (row < 0) return err("car not found");
      sh.deleteRow(row);
      return ok(true);
    }

    // ── USERS ──
    if (action === "addUser") {
      const id = Date.now().toString();
      SH_USERS().appendRow([id, data.name, data.dept]);
      return ok({ id });
    }
    if (action === "updateUser") {
      const sh  = SH_USERS();
      const row = findRow(sh, data.id);
      if (row < 0) return err("user not found");
      sh.getRange(row, 1, 1, 3).setValues([[data.id, data.name, data.dept]]);
      return ok(true);
    }
    if (action === "deleteUser") {
      const sh  = SH_USERS();
      const row = findRow(sh, data.id);
      if (row < 0) return err("user not found");
      sh.deleteRow(row);
      return ok(true);
    }

    // ── BOOKINGS ──
    if (action === "addBooking") {
      const id = Date.now().toString();
      SH_BK().appendRow([
        id, data.carId||"", data.user, data.purpose,
        data.startDate, data.endDate, data.startTime, data.endTime,
        "รออนุมัติ", data.note||""
      ]);
      return ok({ id });
    }
    if (action === "updateBooking") {
      const sh  = SH_BK();
      const row = findRow(sh, data.id);
      if (row < 0) return err("booking not found");
      sh.getRange(row, 1, 1, 10).setValues([[
        data.id, data.carId||"", data.user, data.purpose,
        data.startDate, data.endDate, data.startTime, data.endTime,
        data.status, data.note||""
      ]]);
      return ok(true);
    }
    if (action === "deleteBooking") {
      const sh  = SH_BK();
      const row = findRow(sh, data.id);
      if (row < 0) return err("booking not found");
      sh.deleteRow(row);
      return ok(true);
    }

    return err("unknown action");
  } catch(ex) { return err(ex.message); }
}
