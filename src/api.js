// ใส่ URL ที่ได้จากการ Deploy Apps Script ตรงนี้
const API_URL = "https://script.google.com/macros/s/AKfycbxz_zB6d_GjUmn1GFHakJ3rPrmWrh7Nz2W_4UVY4U6Y33RM5K9Rfjtjf9ee4zRjpj5X/exec";

async function call(method, payload) {
  if (method === "GET") {
    const res = await fetch(`${API_URL}?action=${payload}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
  } else {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    return json.data;
  }
}

// ── Cars ──
export const getCars    = ()     => call("GET", "getCars");
export const addCar     = (data) => call("POST", { action:"addCar",    data });
export const updateCar  = (data) => call("POST", { action:"updateCar", data });
export const deleteCar  = (id)   => call("POST", { action:"deleteCar", data:{ id } });

// ── Users ──
export const getUsers   = ()     => call("GET", "getUsers");
export const addUser    = (data) => call("POST", { action:"addUser",    data });
export const updateUser = (data) => call("POST", { action:"updateUser", data });
export const deleteUser = (id)   => call("POST", { action:"deleteUser", data:{ id } });

// ── Bookings ──
export const getBookings    = ()     => call("GET", "getBookings");
export const addBooking     = (data) => call("POST", { action:"addBooking",    data });
export const updateBooking  = (data) => call("POST", { action:"updateBooking", data });
export const deleteBooking  = (id)   => call("POST", { action:"deleteBooking", data:{ id } });
