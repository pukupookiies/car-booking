import { useState, useMemo, useEffect, useCallback } from "react";
import * as api from "./api.js";

const THAI_MONTHS  = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const THAI_DAYS    = ["อา","จ","อ","พ","พฤ","ศ","ส"];
const FULL_THAI_DAYS = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"];
const CAR_EMOJIS   = ["🚗","🚐","🛻","🚙","🚌","🚑","🚒","🏎️"];
const CAR_COLORS   = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#EC4899","#14B8A6","#F97316"];
const CAR_TYPES    = ["เก๋ง","ตู้","กระบะ","SUV","รถบัส","อื่นๆ"];

const SC = {
  อนุมัติ:    { bg:"#D1FAE5", text:"#065F46", dot:"#10B981" },
  รออนุมัติ:  { bg:"#FEF3C7", text:"#92400E", dot:"#F59E0B" },
  ไม่อนุมัติ: { bg:"#FEE2E2", text:"#991B1B", dot:"#EF4444" },
};

const TODAY   = new Date();
const fmtDate = d => { const x=new Date(d); return `${x.getDate()} ${THAI_MONTHS[x.getMonth()]} ${x.getFullYear()+543}`; };
const sameDay = (a,b) => a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const toDs    = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const INP = { width:"100%", border:"1px solid #E2E8F0", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#1E293B", background:"#F8FAFC", boxSizing:"border-box", fontFamily:"inherit" };
const LBL = { fontSize:12, fontWeight:600, color:"#64748B", display:"block", marginBottom:6 };

/* ── Toast ── */
function Toast({ msg, type }) {
  if (!msg) return null;
  const bg = type==="error" ? "#EF4444" : "#10B981";
  return (
    <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:bg,color:"#fff",
      padding:"10px 20px",borderRadius:12,fontSize:13,fontWeight:700,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>
      {msg}
    </div>
  );
}

/* ── Loading Spinner ── */
function Spinner() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,flexDirection:"column",gap:12}}>
      <div style={{width:36,height:36,border:"4px solid #E2E8F0",borderTop:"4px solid #3B82F6",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <div style={{color:"#94A3B8",fontSize:13}}>กำลังโหลดข้อมูล...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── Confirm Dialog ── */
function Confirm({ msg, onOk, onCancel }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000}}>
      <div style={{background:"#fff",borderRadius:16,padding:24,margin:20,maxWidth:300,width:"100%"}}>
        <div style={{fontSize:34,textAlign:"center",marginBottom:10}}>🗑️</div>
        <div style={{fontWeight:700,color:"#1E293B",fontSize:15,textAlign:"center",marginBottom:6}}>ยืนยันการลบ</div>
        <div style={{color:"#64748B",fontSize:13,textAlign:"center",marginBottom:20}}>{msg}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,border:"1px solid #E2E8F0",borderRadius:10,padding:"10px 0",fontWeight:700,fontSize:13,cursor:"pointer",background:"#F8FAFC",color:"#64748B"}}>ยกเลิก</button>
          <button onClick={onOk}    style={{flex:1,border:"none",borderRadius:10,padding:"10px 0",fontWeight:700,fontSize:13,cursor:"pointer",background:"#EF4444",color:"#fff"}}>ลบเลย</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   APPROVAL PAGE
══════════════════════════════════ */
function ApprovalPage({ bookings, cars, onUpdate, loading }) {
  const pending = bookings.filter(b => b.status === "รออนุมัติ");
  const [sel, setSel]         = useState(null);
  const [carId, setCarId]     = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [tab, setTab]         = useState("pending");
  const [saving, setSaving]   = useState(false);
  const allSorted = [...bookings].sort((a,b)=>String(b.id).localeCompare(String(a.id)));

  function openApprove(b) { setSel(b); setCarId(b.carId||null); setRejectNote(""); }

  async function doApprove() {
    setSaving(true);
    await onUpdate({...sel, carId: carId||"", status:"อนุมัติ"});
    setSel(null); setSaving(false);
  }
  async function doReject() {
    setSaving(true);
    await onUpdate({...sel, status:"ไม่อนุมัติ", note: rejectNote||sel.note});
    setSel(null); setSaving(false);
  }

  function BkRow({ b }) {
    const car = cars.find(c=>String(c.id)===String(b.carId));
    const s   = SC[b.status] || SC["รออนุมัติ"];
    return (
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #E2E8F0",padding:"14px",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:"#1E293B",fontSize:14,marginBottom:2}}>📋 {b.purpose}</div>
            <div style={{fontSize:12,color:"#64748B"}}>👤 {b.user}</div>
            <div style={{fontSize:12,color:"#64748B"}}>📅 {fmtDate(b.startDate)}{b.startDate!==b.endDate?` – ${fmtDate(b.endDate)}`:""}</div>
            <div style={{fontSize:12,color:"#64748B"}}>⏰ {b.startTime} – {b.endTime}</div>
            {b.note&&<div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>📝 {b.note}</div>}
          </div>
          <span style={{background:s.bg,color:s.text,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap",flexShrink:0}}>{b.status}</span>
        </div>
        <div style={{background:"#F8FAFC",borderRadius:10,padding:"8px 12px",marginBottom:b.status==="รออนุมัติ"?10:0,display:"flex",alignItems:"center",gap:8}}>
          {car ? (<><span style={{fontSize:20}}>{car.emoji}</span>
            <div><div style={{fontSize:12,fontWeight:700,color:"#1E293B"}}>{car.name}</div>
            <div style={{fontSize:11,color:"#94A3B8"}}>🔖 {car.plate} · {car.type}</div></div>
          </>) : <div style={{fontSize:12,color:"#94A3B8"}}>🚗 ยังไม่ได้มอบหมายรถ</div>}
        </div>
        {b.status==="รออนุมัติ"&&(
          <button onClick={()=>openApprove(b)}
            style={{width:"100%",border:"none",borderRadius:10,padding:"10px 0",fontWeight:700,fontSize:13,cursor:"pointer",background:"#1E3A5F",color:"#fff"}}>
            ✅ พิจารณาคำขอนี้
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{padding:14}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        {[["รออนุมัติ","⏳","#FEF3C7","#92400E"],["อนุมัติ","✅","#D1FAE5","#065F46"],["ไม่อนุมัติ","❌","#FEE2E2","#991B1B"]].map(([lb,ic,bg,tc])=>(
          <div key={lb} style={{background:bg,borderRadius:12,padding:"10px 6px",textAlign:"center"}}>
            <div style={{fontSize:20}}>{ic}</div>
            <div style={{fontSize:22,fontWeight:800,color:tc}}>{bookings.filter(b=>b.status===lb).length}</div>
            <div style={{fontSize:10,color:tc}}>{lb}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[["pending",`⏳ รออนุมัติ (${pending.length})`],["all","📋 ทั้งหมด"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{flex:1,border:"none",borderRadius:10,padding:"9px 0",fontWeight:700,fontSize:12,cursor:"pointer",
              background:tab===t?"#1E3A5F":"#E2E8F0",color:tab===t?"#fff":"#64748B"}}>{l}</button>
        ))}
      </div>
      {loading ? <Spinner/> : (
        tab==="pending"
          ? pending.length===0
            ? <div style={{textAlign:"center",padding:"40px 0",color:"#94A3B8"}}>✅ ไม่มีคำขอรออนุมัติ</div>
            : pending.map(b=><BkRow key={b.id} b={b}/>)
          : allSorted.map(b=><BkRow key={b.id} b={b}/>)
      )}

      {sel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"flex-end",zIndex:2000}}
          onClick={e=>{if(e.target===e.currentTarget)setSel(null);}}>
          <div style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"88vh",overflowY:"auto",padding:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontWeight:800,fontSize:17,color:"#1E293B"}}>📋 พิจารณาคำขอ</div>
              <button onClick={()=>setSel(null)} style={{background:"#F1F5F9",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16}}>✕</button>
            </div>
            <div style={{background:"#F8FAFC",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontWeight:700,color:"#1E293B",fontSize:14,marginBottom:4}}>📋 {sel.purpose}</div>
              <div style={{fontSize:12,color:"#64748B"}}>👤 {sel.user}</div>
              <div style={{fontSize:12,color:"#64748B"}}>📅 {fmtDate(sel.startDate)}{sel.startDate!==sel.endDate?` – ${fmtDate(sel.endDate)}`:""}</div>
              <div style={{fontSize:12,color:"#64748B"}}>⏰ {sel.startTime} – {sel.endTime}</div>
              {sel.note&&<div style={{fontSize:11,color:"#94A3B8",marginTop:4}}>📝 {sel.note}</div>}
            </div>
            <div style={{marginBottom:16}}>
              <label style={LBL}>🚗 มอบหมายรถ</label>
              <div onClick={()=>setCarId(null)}
                style={{border:`2px solid ${!carId?"#F59E0B":"#E2E8F0"}`,borderRadius:10,padding:"10px 12px",
                  marginBottom:8,cursor:"pointer",background:!carId?"#FFFBEB":"#fff",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>❓</span>
                <div style={{fontSize:13,fontWeight:600,color:"#94A3B8"}}>ยังไม่ระบุรถ</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {cars.map(car=>(
                  <div key={car.id} onClick={()=>setCarId(String(car.id))}
                    style={{border:`2px solid ${String(carId)===String(car.id)?car.color:"#E2E8F0"}`,borderRadius:10,padding:"10px",
                      cursor:"pointer",background:String(carId)===String(car.id)?car.color+"11":"#fff",display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:20}}>{car.emoji}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#1E293B",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{car.name}</div>
                      <div style={{fontSize:10,color:"#94A3B8"}}>🔖 {car.plate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={LBL}>📝 เหตุผล (กรณีไม่อนุมัติ)</label>
              <textarea style={{...INP,resize:"none"}} rows={2} value={rejectNote} onChange={e=>setRejectNote(e.target.value)} placeholder="ระบุเหตุผลหากไม่อนุมัติ"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <button onClick={doReject} disabled={saving}
                style={{border:"2px solid #FEE2E2",borderRadius:12,padding:14,fontWeight:700,fontSize:14,cursor:"pointer",background:"#fff",color:"#EF4444",opacity:saving?.6:1}}>
                {saving?"⏳...":"❌ ไม่อนุมัติ"}
              </button>
              <button onClick={doApprove} disabled={saving}
                style={{border:"none",borderRadius:12,padding:14,fontWeight:700,fontSize:14,cursor:"pointer",background:carId?"#10B981":"#94A3B8",color:"#fff",opacity:saving?.6:1}}>
                {saving?"⏳...":"✅ อนุมัติ"}
              </button>
            </div>
            {!carId&&<div style={{textAlign:"center",fontSize:11,color:"#F59E0B",marginTop:8}}>⚠️ ยังไม่ได้เลือกรถ</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   SETTINGS PAGE
══════════════════════════════════ */
function Settings({ cars, users, onCarAdd, onCarUpdate, onCarDelete, onUserAdd, onUserUpdate, onUserDelete }) {
  const [tab, setTab]   = useState("cars");
  const blankCar  = { name:"", plate:"", type:"เก๋ง", color:CAR_COLORS[0], emoji:CAR_EMOJIS[0] };
  const blankUser = { name:"", dept:"" };
  const [cf, setCf]     = useState(blankCar);
  const [uf, setUf]     = useState(blankUser);
  const [eid, setEid]   = useState(null);
  const [eud, setEud]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving]   = useState(false);

  const resetCar  = () => { setCf(blankCar);  setEid(null); };
  const resetUser = () => { setUf(blankUser); setEud(null); };

  async function saveCar() {
    if (!cf.name.trim()||!cf.plate.trim()) return;
    setSaving(true);
    if (eid) await onCarUpdate({...cf, id:eid});
    else     await onCarAdd(cf);
    resetCar(); setSaving(false);
  }
  async function saveUser() {
    if (!uf.name.trim()) return;
    setSaving(true);
    if (eud) await onUserUpdate({...uf, id:eud});
    else     await onUserAdd(uf);
    resetUser(); setSaving(false);
  }

  return (
    <div style={{padding:14}}>
      {confirm&&<Confirm msg={confirm.msg} onOk={confirm.onOk} onCancel={()=>setConfirm(null)}/>}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["cars","🚗 รถ"],["users","👤 ผู้จอง"]].map(([t,l])=>(
          <button key={t} onClick={()=>{setTab(t);resetCar();resetUser();}}
            style={{flex:1,border:"none",borderRadius:10,padding:"10px 0",fontWeight:700,fontSize:13,cursor:"pointer",
              background:tab===t?"#1E3A5F":"#E2E8F0",color:tab===t?"#fff":"#64748B"}}>{l}</button>
        ))}
      </div>

      {tab==="cars"&&(
        <div>
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:16,marginBottom:14}}>
            <div style={{fontWeight:700,color:"#1E293B",fontSize:14,marginBottom:14}}>{eid?"✏️ แก้ไขรถ":"➕ เพิ่มรถใหม่"}</div>
            <div style={{marginBottom:12}}>
              <span style={LBL}>ไอคอน</span>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {CAR_EMOJIS.map(e=><button key={e} onClick={()=>setCf(f=>({...f,emoji:e}))}
                  style={{width:40,height:40,borderRadius:8,border:`2px solid ${cf.emoji===e?"#3B82F6":"#E2E8F0"}`,background:cf.emoji===e?"#EFF6FF":"#fff",fontSize:20,cursor:"pointer"}}>{e}</button>)}
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <span style={LBL}>สี</span>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {CAR_COLORS.map(c=><button key={c} onClick={()=>setCf(f=>({...f,color:c}))}
                  style={{width:30,height:30,borderRadius:"50%",background:c,border:`3px solid ${cf.color===c?"#1E293B":"transparent"}`,cursor:"pointer"}}/>)}
              </div>
            </div>
            <div style={{display:"grid",gap:10}}>
              <div><label style={LBL}>ชื่อรถ *</label><input style={INP} value={cf.name} onChange={e=>setCf(f=>({...f,name:e.target.value}))} placeholder="เช่น Toyota Commuter"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={LBL}>ทะเบียนรถ *</label><input style={INP} value={cf.plate} onChange={e=>setCf(f=>({...f,plate:e.target.value}))} placeholder="เช่น กข 1234"/></div>
                <div><label style={LBL}>ประเภท</label>
                  <select style={INP} value={cf.type} onChange={e=>setCf(f=>({...f,type:e.target.value}))}>
                    {CAR_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{marginTop:12,padding:"10px 14px",borderRadius:10,border:`2px dashed ${cf.color}`,background:cf.color+"18",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:26}}>{cf.emoji}</span>
              <div><div style={{fontWeight:700,color:"#1E293B",fontSize:13}}>{cf.name||"ชื่อรถ"}</div>
              <div style={{fontSize:11,color:"#64748B"}}>🔖 {cf.plate||"ทะเบียน"} · {cf.type}</div></div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              {eid&&<button onClick={resetCar} style={{flex:1,border:"1px solid #E2E8F0",borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer",background:"#fff",color:"#64748B"}}>ยกเลิก</button>}
              <button onClick={saveCar} disabled={saving} style={{flex:2,border:"none",borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer",background:"#1E3A5F",color:"#fff",opacity:saving?.6:1}}>
                {saving?"⏳ กำลังบันทึก...":eid?"💾 บันทึก":"➕ เพิ่มรถ"}
              </button>
            </div>
          </div>
          <div style={{fontSize:12,fontWeight:600,color:"#64748B",marginBottom:8}}>รายการรถ ({cars.length} คัน)</div>
          {cars.map(car=>(
            <div key={car.id} style={{background:"#fff",borderRadius:12,border:"1px solid #E2E8F0",padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12,borderLeft:`4px solid ${car.color}`}}>
              <span style={{fontSize:24}}>{car.emoji}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,color:"#1E293B",fontSize:13}}>{car.name}</div>
                <div style={{fontSize:12,color:"#64748B"}}>🔖 <b>{car.plate}</b> · {car.type}</div>
              </div>
              <button onClick={()=>{setCf({name:car.name,plate:car.plate,type:car.type,color:car.color,emoji:car.emoji});setEid(car.id);}}
                style={{background:"#EFF6FF",border:"none",borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:600,color:"#2563EB",cursor:"pointer"}}>แก้ไข</button>
              <button onClick={()=>setConfirm({msg:`ลบรถ "${car.name}"?`,onOk:async()=>{setConfirm(null);await onCarDelete(car.id);}})}
                style={{background:"#FEF2F2",border:"none",borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:600,color:"#DC2626",cursor:"pointer"}}>ลบ</button>
            </div>
          ))}
        </div>
      )}

      {tab==="users"&&(
        <div>
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:16,marginBottom:14}}>
            <div style={{fontWeight:700,color:"#1E293B",fontSize:14,marginBottom:14}}>{eud?"✏️ แก้ไขผู้จอง":"➕ เพิ่มผู้จองใหม่"}</div>
            <div style={{display:"grid",gap:10}}>
              <div><label style={LBL}>ชื่อ-นามสกุล *</label><input style={INP} value={uf.name} onChange={e=>setUf(f=>({...f,name:e.target.value}))} placeholder="เช่น สมชาย ใจดี"/></div>
              <div><label style={LBL}>หน่วยงาน / แผนก</label><input style={INP} value={uf.dept} onChange={e=>setUf(f=>({...f,dept:e.target.value}))} placeholder="เช่น ฝ่ายบริหาร"/></div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              {eud&&<button onClick={resetUser} style={{flex:1,border:"1px solid #E2E8F0",borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer",background:"#fff",color:"#64748B"}}>ยกเลิก</button>}
              <button onClick={saveUser} disabled={saving} style={{flex:2,border:"none",borderRadius:10,padding:10,fontWeight:700,fontSize:13,cursor:"pointer",background:"#1E3A5F",color:"#fff",opacity:saving?.6:1}}>
                {saving?"⏳ กำลังบันทึก...":eud?"💾 บันทึก":"➕ เพิ่มผู้จอง"}
              </button>
            </div>
          </div>
          <div style={{fontSize:12,fontWeight:600,color:"#64748B",marginBottom:8}}>รายชื่อผู้จอง ({users.length} คน)</div>
          {users.map(u=>(
            <div key={u.id} style={{background:"#fff",borderRadius:12,border:"1px solid #E2E8F0",padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#3B82F6",flexShrink:0}}>{u.name.charAt(0)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,color:"#1E293B",fontSize:13}}>{u.name}</div>
                <div style={{fontSize:12,color:"#94A3B8"}}>{u.dept||"—"}</div>
              </div>
              <button onClick={()=>{setUf({name:u.name,dept:u.dept});setEud(u.id);}}
                style={{background:"#EFF6FF",border:"none",borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:600,color:"#2563EB",cursor:"pointer"}}>แก้ไข</button>
              <button onClick={()=>setConfirm({msg:`ลบผู้จอง "${u.name}"?`,onOk:async()=>{setConfirm(null);await onUserDelete(u.id);}})}
                style={{background:"#FEF2F2",border:"none",borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:600,color:"#DC2626",cursor:"pointer"}}>ลบ</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   MAIN APP
══════════════════════════════════ */
export default function App() {
  const [cars,     setCars]     = useState([]);
  const [users,    setUsers]    = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);

  const [view,    setView]    = useState("month");
  const [curDate, setCurDate] = useState(TODAY);
  const [showModal,setModal]  = useState(false);
  const [selBk,   setSelBk]  = useState(null);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);

  const [fUser,   setFUser]   = useState("ทั้งหมด");
  const [fCar,    setFCar]    = useState(0);
  const [fStatus, setFStatus] = useState("ทั้งหมด");

  function showToast(msg, type="success") {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 3000);
  }

  // ── Load all data ──
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c,u,b] = await Promise.all([api.getCars(), api.getUsers(), api.getBookings()]);
      setCars(c);
      setUsers(u);
      setBookings(b);
    } catch(e) {
      showToast("โหลดข้อมูลไม่ได้: "+e.message, "error");
    }
    setLoading(false);
  }, []);

  useEffect(()=>{ loadAll(); }, [loadAll]);

  // ── Car ops ──
  async function onCarAdd(data)    { try { await api.addCar(data);    await loadAll(); showToast("เพิ่มรถสำเร็จ"); } catch(e){ showToast(e.message,"error"); } }
  async function onCarUpdate(data) { try { await api.updateCar(data); await loadAll(); showToast("แก้ไขรถสำเร็จ"); } catch(e){ showToast(e.message,"error"); } }
  async function onCarDelete(id)   { try { await api.deleteCar(id);   await loadAll(); showToast("ลบรถสำเร็จ"); } catch(e){ showToast(e.message,"error"); } }

  // ── User ops ──
  async function onUserAdd(data)    { try { await api.addUser(data);    await loadAll(); showToast("เพิ่มผู้จองสำเร็จ"); } catch(e){ showToast(e.message,"error"); } }
  async function onUserUpdate(data) { try { await api.updateUser(data); await loadAll(); showToast("แก้ไขผู้จองสำเร็จ"); } catch(e){ showToast(e.message,"error"); } }
  async function onUserDelete(id)   { try { await api.deleteUser(id);   await loadAll(); showToast("ลบผู้จองสำเร็จ"); } catch(e){ showToast(e.message,"error"); } }

  // ── Booking ops ──
  async function onBookingUpdate(data) {
    try { await api.updateBooking(data); await loadAll(); showToast("อัปเดตสำเร็จ"); }
    catch(e){ showToast(e.message,"error"); }
  }

  const pendingCount = bookings.filter(b=>b.status==="รออนุมัติ").length;

  const filtered = useMemo(()=>bookings.filter(b=>{
    if (fUser!=="ทั้งหมด"&&b.user!==fUser) return false;
    if (fCar!==0&&String(b.carId)!==String(fCar)) return false;
    if (fStatus!=="ทั้งหมด"&&b.status!==fStatus) return false;
    return true;
  }),[bookings,fUser,fCar,fStatus]);

  function dayBks(date){
    return filtered.filter(b=>{
      const s=new Date(b.startDate),e=new Date(b.endDate);
      const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());
      return d>=new Date(s.getFullYear(),s.getMonth(),s.getDate())&&d<=new Date(e.getFullYear(),e.getMonth(),e.getDate());
    });
  }

  function openNew(date){
    setForm({carId:"",user:users[0]?.name||"",purpose:"",startDate:toDs(date),endDate:toDs(date),startTime:"08:00",endTime:"17:00",status:"รออนุมัติ",note:""});
    setSelBk(null); setModal(true);
  }
  function openEdit(b){ setForm({...b}); setSelBk(b); setModal(true); }

  async function save(){
    if (!form.purpose||!form.startDate) return;
    setSaving(true);
    try {
      if (selBk) { await api.updateBooking(form); showToast("แก้ไขสำเร็จ"); }
      else        { await api.addBooking(form);    showToast("ส่งคำขอสำเร็จ"); }
      await loadAll();
      setModal(false);
    } catch(e){ showToast(e.message,"error"); }
    setSaving(false);
  }

  async function del(id){
    setSaving(true);
    try { await api.deleteBooking(id); await loadAll(); setModal(false); showToast("ลบสำเร็จ"); }
    catch(e){ showToast(e.message,"error"); }
    setSaving(false);
  }

  function nav(dir){
    const d=new Date(curDate);
    view==="month"?d.setMonth(d.getMonth()+dir):d.setDate(d.getDate()+dir*7);
    setCurDate(d);
  }

  /* Month */
  function MonthView(){
    const yr=curDate.getFullYear(),mo=curDate.getMonth();
    const fd=new Date(yr,mo,1).getDay(),dim=new Date(yr,mo+1,0).getDate();
    const cells=[...Array(fd).fill(null),...Array.from({length:dim},(_,i)=>new Date(yr,mo,i+1))];
    return(
      <div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:1}}>
          {THAI_DAYS.map(d=><div key={d} style={{textAlign:"center",padding:"7px 0",fontSize:11,fontWeight:700,color:"#64748B",background:"#F8FAFC"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {cells.map((date,i)=>{
            if(!date) return <div key={i} style={{minHeight:86,background:"#F8FAFC",borderRadius:8}}/>;
            const dbs=dayBks(date),isT=sameDay(date,TODAY);
            return(
              <div key={i} onClick={()=>openNew(date)}
                style={{minHeight:86,background:isT?"#EFF6FF":"#fff",borderRadius:8,border:isT?"2px solid #3B82F6":"1px solid #E2E8F0",padding:5,cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 12px rgba(0,0,0,.08)"}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                <div style={{fontSize:12,fontWeight:isT?700:500,color:isT?"#2563EB":"#374151",width:22,height:22,borderRadius:"50%",
                  background:isT?"#DBEAFE":"transparent",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:3}}>{date.getDate()}</div>
                {dbs.slice(0,3).map(b=>{
                  const car=cars.find(c=>String(c.id)===String(b.carId));
                  const s=SC[b.status]||SC["รออนุมัติ"];
                  return <div key={b.id} onClick={e=>{e.stopPropagation();openEdit(b);}}
                    style={{fontSize:10,background:s.bg,color:s.text,borderRadius:4,padding:"2px 4px",marginBottom:2,
                      whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",borderLeft:`3px solid ${car?.color||s.dot}`}}>
                    {car?car.emoji:"❓"} {b.user}
                  </div>;
                })}
                {dbs.length>3&&<div style={{fontSize:9,color:"#94A3B8"}}>+{dbs.length-3}</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* Week */
  function WeekView(){
    const ws=new Date(curDate);ws.setDate(curDate.getDate()-curDate.getDay());
    const days=Array.from({length:7},(_,i)=>{const d=new Date(ws);d.setDate(ws.getDate()+i);return d;});
    return(
      <div style={{overflowX:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,minWidth:560}}>
          {days.map((date,i)=>{
            const dbs=dayBks(date),isT=sameDay(date,TODAY);
            return(
              <div key={i} style={{background:isT?"#EFF6FF":"#fff",borderRadius:12,border:isT?"2px solid #3B82F6":"1px solid #E2E8F0",overflow:"hidden"}}>
                <div onClick={()=>openNew(date)} style={{padding:"9px 6px 7px",textAlign:"center",cursor:"pointer",background:isT?"#DBEAFE":"#F8FAFC"}}>
                  <div style={{fontSize:10,color:"#94A3B8",marginBottom:1}}>{FULL_THAI_DAYS[i]}</div>
                  <div style={{fontSize:18,fontWeight:800,color:isT?"#2563EB":"#1E293B"}}>{date.getDate()}</div>
                </div>
                <div style={{padding:5}}>
                  {!dbs.length&&<div style={{fontSize:10,color:"#CBD5E1",textAlign:"center",padding:"6px 0"}}>ว่าง</div>}
                  {dbs.map(b=>{
                    const car=cars.find(c=>String(c.id)===String(b.carId));
                    const s=SC[b.status]||SC["รออนุมัติ"];
                    return <div key={b.id} onClick={()=>openEdit(b)}
                      style={{fontSize:10,background:s.bg,borderLeft:`3px solid ${car?.color||s.dot}`,borderRadius:4,padding:"4px 5px",marginBottom:3,cursor:"pointer"}}>
                      <div style={{fontWeight:700,color:s.text}}>{car?`${car.emoji} ${car.name}`:"❓ ยังไม่ระบุรถ"}</div>
                      {car&&<div style={{color:"#64748B",fontSize:9}}>🔖{car.plate}</div>}
                      <div style={{color:"#64748B"}}>{b.user}</div>
                    </div>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* List */
  function ListView(){
    const sorted=[...filtered].sort((a,b)=>a.startDate.localeCompare(b.startDate));
    return(
      <div>
        {!sorted.length&&<div style={{textAlign:"center",padding:40,color:"#94A3B8"}}>ไม่มีรายการ</div>}
        {sorted.map(b=>{
          const car=cars.find(c=>String(c.id)===String(b.carId));
          const s=SC[b.status]||SC["รออนุมัติ"];
          return(
            <div key={b.id} onClick={()=>openEdit(b)}
              style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:12,border:"1px solid #E2E8F0",padding:"12px 14px",marginBottom:8,cursor:"pointer"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.08)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
              <div style={{width:42,height:42,borderRadius:10,background:car?car.color+"22":"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                {car?car.emoji:"❓"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,color:"#1E293B",fontSize:13}}>
                  {car?<>{car.name} <span style={{color:"#94A3B8",fontWeight:400,fontSize:11}}>🔖{car.plate}</span></>
                      :<span style={{color:"#94A3B8"}}>ยังไม่ระบุรถ</span>}
                </div>
                <div style={{fontSize:12,color:"#64748B"}}>👤 {b.user} · 📋 {b.purpose}</div>
                <div style={{fontSize:11,color:"#94A3B8"}}>📅 {fmtDate(b.startDate)}{b.startDate!==b.endDate?` – ${fmtDate(b.endDate)}`:""} · ⏰ {b.startTime}–{b.endTime}</div>
              </div>
              <span style={{background:s.bg,color:s.text,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20,whiteSpace:"nowrap"}}>{b.status}</span>
            </div>
          );
        })}
      </div>
    );
  }

  /* Overview */
  function Overview(){
    const cStats=cars.map(car=>{
      const cb=filtered.filter(b=>String(b.carId)===String(car.id));
      return {car,total:cb.length,ok:cb.filter(b=>b.status==="อนุมัติ").length,wait:cb.filter(b=>b.status==="รออนุมัติ").length};
    });
    const uStats=users.map(u=>({u,n:filtered.filter(b=>b.user===u.name).length})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);
    const mx=Math.max(...uStats.map(x=>x.n),1);
    return(
      <div style={{display:"grid",gap:16}}>
        <div>
          <div style={{fontWeight:700,color:"#1E293B",marginBottom:12,fontSize:15}}>📊 ภาพรวมรายรถ</div>
          {cars.length===0&&<div style={{color:"#94A3B8",fontSize:13,textAlign:"center",padding:20}}>ยังไม่มีรถในระบบ</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {cStats.map(({car,total,ok,wait})=>(
              <div key={car.id} style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:14,borderTop:`4px solid ${car.color}`}}>
                <div style={{fontSize:26,marginBottom:3}}>{car.emoji}</div>
                <div style={{fontWeight:700,color:"#1E293B",fontSize:13}}>{car.name}</div>
                <div style={{color:"#64748B",fontSize:11}}>🔖 <b>{car.plate}</b> · {car.type}</div>
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  {[[ok,"#16A34A","#F0FDF4","อนุมัติ"],[wait,"#D97706","#FFFBEB","รออนุมัติ"],[total,"#475569","#F8FAFC","ทั้งหมด"]].map(([n,tc,bg,lb])=>(
                    <div key={lb} style={{flex:1,background:bg,borderRadius:8,padding:"5px 4px",textAlign:"center"}}>
                      <div style={{fontSize:17,fontWeight:800,color:tc}}>{n}</div>
                      <div style={{fontSize:9,color:tc}}>{lb}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {uStats.length>0&&(
          <div>
            <div style={{fontWeight:700,color:"#1E293B",marginBottom:12,fontSize:15}}>👤 การจองตามผู้ใช้</div>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:16}}>
              {uStats.map(({u,n})=>(
                <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#3B82F6",flexShrink:0}}>{u.name.charAt(0)}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:13,fontWeight:600,color:"#1E293B"}}>{u.name} <span style={{color:"#94A3B8",fontWeight:400,fontSize:11}}>{u.dept}</span></span>
                      <span style={{fontSize:12,color:"#64748B"}}>{n} ครั้ง</span>
                    </div>
                    <div style={{height:6,background:"#F1F5F9",borderRadius:99}}>
                      <div style={{height:"100%",borderRadius:99,background:"#3B82F6",width:`${(n/mx)*100}%`}}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const hdrLabel = view==="month"
    ? `${THAI_MONTHS[curDate.getMonth()]} ${curDate.getFullYear()+543}`
    : (()=>{const d=new Date(curDate);d.setDate(d.getDate()-d.getDay());return `สัปดาห์ ${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`;})();

  const TABS=[["month","📅","เดือน"],["week","📆","สัปดาห์"],["list","📋","รายการ"],["approve","✅","อนุมัติ",pendingCount],["overview","📊","ภาพรวม"],["settings","⚙️","ตั้งค่า"]];
  const noFilter=view==="approve"||view==="settings";

  return(
    <div style={{minHeight:"100vh",background:"#F1F5F9",fontFamily:"'Sarabun',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"/>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}

      <div style={{background:"#1E3A5F",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{color:"#93C5FD",fontSize:11,fontWeight:600,letterSpacing:1}}>VEHICLE BOOKING</div>
          <div style={{color:"#fff",fontSize:18,fontWeight:800}}>🚗 ระบบจองรถ</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={loadAll} style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"none",borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer"}} title="รีเฟรช">🔄</button>
          {!noFilter&&<button onClick={()=>openNew(TODAY)} style={{background:"#3B82F6",color:"#fff",border:"none",borderRadius:10,padding:"9px 16px",fontWeight:700,fontSize:13,cursor:"pointer"}}>＋ จองรถ</button>}
        </div>
      </div>

      <div style={{background:"#fff",borderBottom:"1px solid #E2E8F0",display:"flex",overflowX:"auto"}}>
        {TABS.map(([v,icon,lb,badge])=>(
          <button key={v} onClick={()=>setView(v)}
            style={{flex:"0 0 auto",background:"none",border:"none",padding:"10px 10px",fontSize:10,fontWeight:view===v?700:500,
              color:view===v?"#2563EB":"#64748B",borderBottom:view===v?"2px solid #2563EB":"2px solid transparent",cursor:"pointer",position:"relative"}}>
            <div style={{fontSize:15}}>{icon}</div>{lb}
            {badge>0&&<span style={{position:"absolute",top:6,right:4,background:"#EF4444",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{badge}</span>}
          </button>
        ))}
      </div>

      {!noFilter&&(
        <div style={{background:"#fff",borderBottom:"1px solid #F1F5F9",padding:"8px 12px",display:"flex",gap:6,overflowX:"auto"}}>
          <select value={fUser} onChange={e=>setFUser(e.target.value)} style={{fontSize:11,border:"1px solid #E2E8F0",borderRadius:8,padding:"5px 8px",color:"#374151",background:"#F8FAFC"}}>
            <option value="ทั้งหมด">👤 ทุกคน</option>
            {users.map(u=><option key={u.id} value={u.name}>{u.name}</option>)}
          </select>
          <select value={fCar} onChange={e=>setFCar(e.target.value)} style={{fontSize:11,border:"1px solid #E2E8F0",borderRadius:8,padding:"5px 8px",color:"#374151",background:"#F8FAFC"}}>
            <option value={0}>🚗 ทุกคัน</option>
            {cars.map(c=><option key={c.id} value={c.id}>{c.emoji}{c.name}</option>)}
          </select>
          <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={{fontSize:11,border:"1px solid #E2E8F0",borderRadius:8,padding:"5px 8px",color:"#374151",background:"#F8FAFC"}}>
            <option value="ทั้งหมด">🔘 ทุกสถานะ</option>
            <option value="อนุมัติ">✅ อนุมัติ</option>
            <option value="รออนุมัติ">⏳ รออนุมัติ</option>
            <option value="ไม่อนุมัติ">❌ ไม่อนุมัติ</option>
          </select>
        </div>
      )}

      {(view==="month"||view==="week")&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:"#fff",borderBottom:"1px solid #F1F5F9"}}>
          <button onClick={()=>nav(-1)} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:16}}>‹</button>
          <div style={{fontWeight:700,color:"#1E293B",fontSize:14}}>{hdrLabel}</div>
          <button onClick={()=>nav(1)}  style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:16}}>›</button>
        </div>
      )}

      <div style={{padding:noFilter?0:12}}>
        {loading && view!=="settings" ? <Spinner/> : null}
        {!loading&&view==="month"    &&<MonthView/>}
        {!loading&&view==="week"     &&<WeekView/>}
        {!loading&&view==="list"     &&<ListView/>}
        {view==="approve" &&<ApprovalPage bookings={bookings} cars={cars} onUpdate={onBookingUpdate} loading={loading}/>}
        {!loading&&view==="overview" &&<Overview/>}
        {view==="settings"&&<Settings cars={cars} users={users}
          onCarAdd={onCarAdd} onCarUpdate={onCarUpdate} onCarDelete={onCarDelete}
          onUserAdd={onUserAdd} onUserUpdate={onUserUpdate} onUserDelete={onUserDelete}/>}
      </div>

      {!noFilter&&!loading&&(
        <div style={{padding:"0 12px 24px",display:"flex",gap:10,flexWrap:"wrap"}}>
          {cars.map(c=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#64748B"}}>
              <div style={{width:9,height:9,borderRadius:3,background:c.color}}/>{c.emoji}{c.name}<span style={{color:"#CBD5E1"}}>({c.plate})</span>
            </div>
          ))}
        </div>
      )}

      {showModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"flex-end",zIndex:1000}}
          onClick={e=>{if(e.target===e.currentTarget)setModal(false);}}>
          <div style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"88vh",overflowY:"auto",padding:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
              <div style={{fontWeight:800,fontSize:17,color:"#1E293B"}}>{selBk?"✏️ แก้ไขการจอง":"➕ จองรถ"}</div>
              <button onClick={()=>setModal(false)} style={{background:"#F1F5F9",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",fontSize:16}}>✕</button>
            </div>
            <div style={{display:"grid",gap:14}}>
              <div><label style={LBL}>👤 ผู้จอง</label>
                <select value={form.user||""} onChange={e=>setForm(f=>({...f,user:e.target.value}))} style={INP}>
                  {users.map(u=><option key={u.id} value={u.name}>{u.name}{u.dept?` (${u.dept})`:""}</option>)}
                </select>
              </div>
              <div><label style={LBL}>📋 วัตถุประสงค์</label>
                <input style={INP} value={form.purpose||""} onChange={e=>setForm(f=>({...f,purpose:e.target.value}))} placeholder="ระบุวัตถุประสงค์"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={LBL}>📅 วันเริ่ม</label><input type="date" style={INP} value={form.startDate||""} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></div>
                <div><label style={LBL}>📅 วันสิ้นสุด</label><input type="date" style={INP} value={form.endDate||""} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={LBL}>⏰ เวลาเริ่ม</label><input type="time" style={INP} value={form.startTime||"08:00"} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))}/></div>
                <div><label style={LBL}>⏰ เวลาสิ้นสุด</label><input type="time" style={INP} value={form.endTime||"17:00"} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))}/></div>
              </div>
              <div><label style={LBL}>📝 หมายเหตุ</label>
                <textarea style={{...INP,resize:"none"}} rows={2} value={form.note||""} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="หมายเหตุ (ถ้ามี)"/>
              </div>
              <div style={{background:"#FEF3C7",borderRadius:10,padding:"9px 13px",fontSize:12,color:"#92400E",display:"flex",gap:8,alignItems:"center"}}>
                ⏳ <span>การจองจะถูกตั้งเป็น <b>รออนุมัติ</b> — ผู้อนุมัติจะเลือกรถและอนุมัติในหน้า ✅</span>
              </div>
              <div style={{display:"flex",gap:10,paddingTop:4}}>
                {selBk&&<button onClick={()=>del(selBk.id)} disabled={saving}
                  style={{flex:1,border:"2px solid #FEE2E2",borderRadius:12,padding:14,fontWeight:700,fontSize:14,cursor:"pointer",background:"#fff",color:"#EF4444",opacity:saving?.6:1}}>
                  🗑 ลบ</button>}
                <button onClick={save} disabled={saving}
                  style={{flex:2,border:"none",borderRadius:12,padding:14,fontWeight:700,fontSize:14,cursor:"pointer",background:"#2563EB",color:"#fff",opacity:saving?.6:1}}>
                  {saving?"⏳ กำลังบันทึก...":selBk?"💾 บันทึก":"✅ ส่งคำขอ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
