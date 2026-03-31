import { useState, useEffect, useCallback } from 'react';
import { db } from './db.js';

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const getWeekId = (date = new Date()) => { const d = new Date(date); d.setDate(d.getDate()-d.getDay()); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const todayIdx = () => new Date().getDay();
const dayDate = (wk,i) => { const d = new Date(wk+"T12:00:00"); d.setDate(d.getDate()+i); return `${d.getMonth()+1}/${d.getDate()}`; };
const isDone = d => d.usedMicro || d.completed || (d.exercises?.length > 0 && d.exercises.every(e=>e.completed));

function useLayout(){ const[w,sW]=useState(window.innerWidth); useEffect(()=>{const h=()=>sW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w>=1024?"D":w>=600?"T":"P";}
const isW=l=>l!=="P";

// ─── ICON ───
const SHCIcon = ({size=28,theme="dark"}) => {
  const accent = theme==="dark"?"#c8ff00":"#0055ff";
  const bg = theme==="dark"?"#000":"#fff";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="28" fill={bg}/>
      <path d="M60 18 L95 35 L95 65 Q95 95 60 105 Q25 95 25 65 L25 35 Z" stroke={accent} strokeWidth="3" fill={accent} fillOpacity="0.04"/>
      <polyline points="35,62 45,62 50,48 56,78 62,52 67,65 73,58 85,62" stroke={accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M60 24 Q55 32 58 36 Q54 30 52 36 Q50 42 56 44 Q54 40 56 38 Q58 42 60 38 Q62 42 64 38 Q66 40 64 44 Q70 42 68 36 Q66 30 62 36 Q65 32 60 24Z" fill={accent} opacity="0.6"/>
    </svg>
  );
};

// ─── THEMES ───
const T = {
  dark: {
    bg:"#000",card:"rgba(255,255,255,0.03)",cb:"rgba(255,255,255,0.06)",
    text:"#f0f0f0",tm:"#909090",tf:"#606060",
    accent:"#c8ff00",ag:"rgba(200,255,0,0.15)",at:"#000",
    green:"#00ff88",gg:"rgba(0,255,136,0.1)",yellow:"#ffcc00",red:"#ff3355",
    ib:"rgba(255,255,255,0.04)",ibr:"rgba(255,255,255,0.08)",
    exBg:"rgba(100,100,255,0.03)",exB:"rgba(100,100,255,0.08)",exBd:"rgba(0,255,136,0.15)",
    cBg:"rgba(0,255,136,0.03)",cB:"rgba(0,255,136,0.08)",
    mpBg:"rgba(100,100,255,0.04)",
    miBg:"rgba(255,204,0,0.04)",miB:"rgba(255,204,0,0.12)",
    kl:"#888",ks:"#444",ti:"#666",di:"#555",ds:"rgba(200,255,0,0.06)",
    dBg:"rgba(255,255,255,0.04)",dB:"rgba(255,255,255,0.1)",dc:"#888",
    bf:"rgba(255,255,255,0.05)",bm:"rgba(255,255,255,0.08)",
    gl:"rgba(255,255,255,0.02)",tog:"☀️",cs:"dark",
  },
  light: {
    bg:"#fff",card:"rgba(0,0,0,0.02)",cb:"rgba(0,0,0,0.06)",
    text:"#111",tm:"#555",tf:"#999",
    accent:"#0055ff",ag:"rgba(0,85,255,0.08)",at:"#fff",
    green:"#00b359",gg:"rgba(0,179,89,0.08)",yellow:"#e6a800",red:"#e63946",
    ib:"rgba(0,0,0,0.025)",ibr:"rgba(0,0,0,0.08)",
    exBg:"rgba(0,85,255,0.02)",exB:"rgba(0,85,255,0.08)",exBd:"rgba(0,179,89,0.15)",
    cBg:"rgba(0,179,89,0.02)",cB:"rgba(0,179,89,0.08)",
    mpBg:"rgba(0,85,255,0.03)",
    miBg:"rgba(230,168,0,0.05)",miB:"rgba(230,168,0,0.15)",
    kl:"#444",ks:"#aaa",ti:"#999",di:"#999",ds:"rgba(0,85,255,0.06)",
    dBg:"rgba(0,0,0,0.04)",dB:"rgba(0,0,0,0.1)",dc:"#888",
    bf:"rgba(0,0,0,0.05)",bm:"rgba(0,0,0,0.08)",
    gl:"rgba(0,0,0,0.015)",tog:"🌙",cs:"light",
  }
};

const sty=(l,t)=>{const w=isW(l);return{
  i:{background:t.ib,border:`1px solid ${t.ibr}`,borderRadius:8,color:t.text,fontFamily:"'Overpass Mono',monospace",width:"100%",boxSizing:"border-box",padding:w?"10px 14px":"8px 10px",fontSize:w?15:14,outline:"none"},
  c:{background:t.card,borderRadius:14,border:`1px solid ${t.cb}`,padding:w?18:12,marginBottom:w?14:10,backdropFilter:"blur(20px)"},
  lb:{color:t.tm,fontSize:w?13:12,marginBottom:4,display:"block",fontWeight:600},
  b:{borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontFamily:"'Overpass Mono',monospace",padding:w?"10px 18px":"8px 14px",fontSize:w?14:13},
  bg:{borderRadius:8,border:`1px solid ${t.bm}`,cursor:"pointer",background:"transparent",fontFamily:"'Overpass Mono',monospace",color:t.tm,padding:w?"8px 16px":"6px 12px",fontSize:w?14:13},
};};

// ─── WORKOUT DAY ───
function WDay({plan,log,onLogChange,s,l,t}){
  const[sa,sSa]=useState(null),[fm,sFm]=useState({}),[cd,sCd]=useState(null);
  const w=isW(l);
  const hasLog = log.exercises !== undefined;
  const exercises = hasLog ? (Array.isArray(log.exercises) ? log.exercises : []) : (Array.isArray(plan.exercises) ? plan.exercises.map(e=>({...e,sets:[],completed:false})) : []);
  const hasCardioLog = log.cardio !== undefined;
  const cardio = hasCardioLog ? (Array.isArray(log.cardio) ? log.cardio : []) : (Array.isArray(plan.cardio) ? plan.cardio.map(c=>({...c,completed:false})) : []);
  const usedMicro = log.usedMicro || false;
  const completed = log.completed || false;
  const notes = log.notes ?? plan.notes ?? "";
  const dayDone = usedMicro || completed || (exercises.length>0 && exercises.every(e=>e.completed));

  const save = (updates) => onLogChange({exercises,cardio,usedMicro,completed,notes,...updates});
  const uE=(i,u)=>{const ex=[...exercises];ex[i]={...ex[i],...u};save({exercises:ex});};
  const uS=(ei,si,f,v)=>{const ex=[...exercises];ex[ei]={...ex[ei],sets:ex[ei].sets.map((x,j)=>j===si?{...x,[f]:v}:x)};save({exercises:ex});};
  const aE=()=>{if(!fm.n)return;save({exercises:[...exercises,{name:fm.n,targetSets:fm.s||"",targetReps:fm.r||"",rpe:fm.p||"",sets:[],completed:false,notes:""}]});sFm({});sSa(null);};
  const aC=()=>{if(!fm.ct)return;save({cardio:[...cardio,{type:fm.ct,duration:fm.cd||"",distance:fm.ci||"",completed:false,notes:""}]});sFm({});sSa(null);};
  const dl=(tp,i)=>{const k=`${tp}${i}`;if(cd===k){if(tp==="e")save({exercises:exercises.filter((_,j)=>j!==i)});else save({cardio:cardio.filter((_,j)=>j!==i)});sCd(null);}else{sCd(k);setTimeout(()=>sCd(c=>c===k?null:c),3000);}};
  const kd=(e,f)=>{if(e.key==="Enter"){e.preventDefault();f();}};
  const dBtn=(a)=>({background:a?t.red:t.dBg,border:a?`1px solid ${t.red}`:`1px solid ${t.dB}`,borderRadius:8,cursor:"pointer",fontSize:13,color:a?"#fff":t.dc,fontFamily:"'Overpass Mono',monospace",padding:"4px 10px",fontWeight:700});

  return(<div style={s.c}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div><span style={{color:t.accent,fontSize:w?18:16,fontWeight:800}}>{plan.day||DAYS[plan.dayIndex||0]}</span>{plan.focus&&<span style={{color:t.tm,fontSize:w?15:13,marginLeft:10}}>— {plan.focus}</span>}</div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>{dayDone&&!usedMicro&&<span style={{color:t.green,fontSize:14}}>✓ Done</span>}{usedMicro&&<span style={{color:t.yellow,fontSize:14}}>⚡ Micro</span>}</div>
    </div>
    {plan.notes&&<div style={{color:t.tf,fontSize:13,marginBottom:10,fontStyle:"italic"}}>{plan.notes}</div>}
    {plan.microOption&&<div style={{background:t.miBg,border:`1px solid ${t.miB}`,borderRadius:10,padding:12,marginBottom:14,fontSize:14}}><span style={{color:t.yellow}}>⚡ Streak Saver: </span><span style={{color:t.tm}}>{plan.microOption}</span>
      <button onClick={()=>save({usedMicro:!usedMicro,completed:!usedMicro||completed})} style={{...s.b,marginLeft:10,padding:"5px 14px",fontSize:12,background:usedMicro?t.yellow:t.gl,color:usedMicro?"#000":t.tm,border:`1px solid ${t.bm}`}}>{usedMicro?"Used ✓":"Use This"}</button></div>}

    {exercises.map((ex,ei)=><div key={ei} style={{background:t.exBg,borderRadius:12,padding:w?14:10,marginBottom:10,border:`1px solid ${ex.completed?t.exBd:t.exB}`,boxShadow:ex.completed?`inset 0 0 20px ${t.gg}`:"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
          <input type="checkbox" checked={ex.completed||false} onChange={e=>uE(ei,{completed:e.target.checked})} style={{accentColor:t.green,width:w?20:18,height:w?20:18,cursor:"pointer",flexShrink:0}}/>
          <span style={{color:ex.completed?t.green:t.text,fontSize:w?16:15,fontWeight:700,textDecoration:ex.completed?"line-through":"none",opacity:ex.completed?.6:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.name}</span>
        </div>
        <button onClick={()=>dl("e",ei)} style={dBtn(cd===`e${ei}`)}>{cd===`e${ei}`?"Delete?":"✕"}</button>
      </div>
      {ex.targetSets&&<div style={{color:t.tf,fontSize:13,marginBottom:8,paddingLeft:w?30:28}}>Target: {ex.targetSets}×{ex.targetReps}{ex.rpe?` @ RPE ${ex.rpe}`:""}</div>}
      {ex.sets?.length>0&&<div style={{paddingLeft:w?30:28}}>
        <div style={{display:"grid",gridTemplateColumns:"30px 1fr 1fr 24px",gap:6,marginBottom:6,fontSize:13,color:t.tf}}><span>#</span><span>Reps</span><span>Weight</span><span></span></div>
        {ex.sets.map((z,si)=><div key={si} style={{display:"grid",gridTemplateColumns:"30px 1fr 1fr 24px",gap:6,marginBottom:5,alignItems:"center"}}>
          <span style={{color:t.tf,fontSize:14}}>{si+1}</span>
          <input value={z.reps} onChange={e=>uS(ei,si,"reps",e.target.value)} placeholder="—" style={{...s.i,padding:"6px 10px"}}/>
          <input value={z.weight} onChange={e=>uS(ei,si,"weight",e.target.value)} placeholder="lbs" style={{...s.i,padding:"6px 10px"}}/>
          <button onClick={()=>uE(ei,{sets:ex.sets.filter((_,j)=>j!==si)})} style={{background:"none",border:`1px solid ${t.dB}`,borderRadius:4,color:t.dc,cursor:"pointer",fontSize:13,padding:"3px 7px"}}>✕</button>
        </div>)}
      </div>}
      <div style={{paddingLeft:w?30:28,marginTop:8}}><button onClick={()=>uE(ei,{sets:[...(ex.sets||[]),{reps:"",weight:""}]})} style={{...s.bg,padding:"5px 14px"}}>+ set</button></div>
      <div style={{paddingLeft:w?30:28,marginTop:8}}><input value={ex.notes||""} onChange={e=>uE(ei,{notes:e.target.value})} placeholder="Notes..." style={{...s.i,padding:"6px 10px"}}/></div>
    </div>)}

    {cardio.map((c,ci)=><div key={ci} style={{background:t.cBg,borderRadius:12,padding:w?12:10,marginBottom:10,border:`1px solid ${t.cB}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
          <input type="checkbox" checked={c.completed||false} onChange={e=>save({cardio:cardio.map((x,j)=>j===ci?{...x,completed:e.target.checked}:x)})} style={{accentColor:t.green,width:w?20:18,height:w?20:18,cursor:"pointer"}}/>
          <span style={{color:t.green,fontSize:w?15:14,fontWeight:600}}>{c.type}</span>{c.duration&&<span style={{color:t.tm,fontSize:13}}>{c.duration}min</span>}
        </div>
        <button onClick={()=>dl("c",ci)} style={dBtn(cd===`c${ci}`)}>{cd===`c${ci}`?"Delete?":"✕"}</button>
      </div>
      <input value={c.notes||""} onChange={e=>save({cardio:cardio.map((x,j)=>j===ci?{...x,notes:e.target.value}:x)})} placeholder="Cardio notes..." style={{...s.i,padding:"6px 10px",marginTop:8}}/>
    </div>)}

    <div style={{display:"flex",gap:8,marginTop:14}}>
      <button onClick={()=>sSa(sa==="e"?null:"e")} style={s.bg}>+ Exercise</button>
      <button onClick={()=>sSa(sa==="c"?null:"c")} style={s.bg}>+ Cardio</button>
    </div>
    {sa==="e"&&<div style={{background:t.gl,borderRadius:10,padding:12,marginTop:10,display:"flex",gap:8,flexWrap:"wrap",alignItems:"end",border:`1px solid ${t.bm}`}}>
      <div style={{flex:"2 1 140px"}}><label style={s.lb}>Exercise</label><input value={fm.n||""} onChange={e=>sFm({...fm,n:e.target.value})} onKeyDown={e=>kd(e,aE)} autoFocus style={s.i}/></div>
      <div style={{flex:"1 1 60px"}}><label style={s.lb}>Sets</label><input value={fm.s||""} onChange={e=>sFm({...fm,s:e.target.value})} onKeyDown={e=>kd(e,aE)} style={s.i}/></div>
      <div style={{flex:"1 1 60px"}}><label style={s.lb}>Reps</label><input value={fm.r||""} onChange={e=>sFm({...fm,r:e.target.value})} onKeyDown={e=>kd(e,aE)} style={s.i}/></div>
      <div style={{flex:"1 1 50px"}}><label style={s.lb}>RPE</label><input value={fm.p||""} onChange={e=>sFm({...fm,p:e.target.value})} onKeyDown={e=>kd(e,aE)} style={s.i}/></div>
      <button onClick={aE} style={{...s.b,background:t.accent,color:t.at}}>Add</button></div>}
    {sa==="c"&&<div style={{background:t.gl,borderRadius:10,padding:12,marginTop:10,display:"flex",gap:8,flexWrap:"wrap",alignItems:"end",border:`1px solid ${t.bm}`}}>
      <div style={{flex:"2 1 120px"}}><label style={s.lb}>Type</label><input value={fm.ct||""} onChange={e=>sFm({...fm,ct:e.target.value})} onKeyDown={e=>kd(e,aC)} autoFocus style={s.i}/></div>
      <div style={{flex:"1 1 60px"}}><label style={s.lb}>Min</label><input value={fm.cd||""} onChange={e=>sFm({...fm,cd:e.target.value})} onKeyDown={e=>kd(e,aC)} style={s.i}/></div>
      <div style={{flex:"1 1 70px"}}><label style={s.lb}>Dist</label><input value={fm.ci||""} onChange={e=>sFm({...fm,ci:e.target.value})} onKeyDown={e=>kd(e,aC)} style={s.i}/></div>
      <button onClick={aC} style={{...s.b,background:t.green,color:"#000"}}>Add</button></div>}
    <textarea placeholder="Day notes..." value={notes} onChange={e=>save({notes:e.target.value})} style={{...s.i,width:"100%",marginTop:12,minHeight:40,resize:"vertical",boxSizing:"border-box"}}/>
  </div>);
}

// ─── MEAL DAY ───
function MDay({planned:rawPlanned,logged,onLogChange,s,l,t}){
  const w=isW(l);
  const planned = Array.isArray(rawPlanned) ? rawPlanned : [];
  const meals = planned.map((p,i)=>{const lg=logged?.[i]||{}; return{...p,...lg,planned:p.planned};});
  const up=(i,f,v)=>{const m=[...meals.map(x=>({actual:x.actual||"",confirmed:x.confirmed||false,notes:x.notes||""}))];m[i]={...m[i],[f]:v};onLogChange(m);};
  return(<div style={s.c}>
    <div style={{color:t.accent,fontSize:w?18:16,fontWeight:800,marginBottom:12}}>{planned[0]?.day||""}</div>
    {meals.map((m,i)=><div key={i} style={{background:m.confirmed?t.cBg:t.exBg,borderRadius:12,padding:w?14:10,marginBottom:10,border:`1px solid ${m.confirmed?t.exBd:t.exB}`,boxShadow:m.confirmed?`inset 0 0 20px ${t.gg}`:"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{color:t.tm,fontSize:w?14:13,fontWeight:700}}>{m.slot}</span>
        <button onClick={()=>up(i,"confirmed",!m.confirmed)} style={{...s.b,padding:"5px 14px",fontSize:12,background:m.confirmed?t.green:t.gl,color:m.confirmed?"#000":t.tm,border:m.confirmed?"none":`1px solid ${t.bm}`}}>{m.confirmed?"Ate ✓":"Confirm"}</button>
      </div>
      {m.planned&&<div style={{color:t.tm,fontSize:w?14:13,marginBottom:8,padding:"8px 12px",background:t.mpBg,borderRadius:8}}><span style={{color:t.tf,fontSize:12}}>PLAN → </span>{m.planned}</div>}
      <input value={m.actual||""} onChange={e=>up(i,"actual",e.target.value)} placeholder={m.planned?"What I actually ate (blank = followed plan)":"What I ate..."} style={s.i}/>
      <input value={m.notes||""} onChange={e=>up(i,"notes",e.target.value)} placeholder="Meal notes..." style={{...s.i,marginTop:6}}/>
    </div>)}
  </div>);
}

// ─── BODY ───
function Body({data,onChange,s,l,t}){
  const w=isW(l);
  return(<div style={s.c}>
    <div style={{color:t.accent,fontSize:w?18:16,fontWeight:800,marginBottom:16}}>Body Measurements</div>
    <div style={{display:"grid",gridTemplateColumns:w?"1fr 1fr 1fr":"1fr 1fr",gap:w?12:8}}>
      {[["weight","Weight (lbs)","⚖️"],["bodyFat","Body Fat %","📊"],["waist","Waist (in)","📏"],["chest","Chest (in)","📐"],["arms","Arms (in)","💪"]].map(([k,lb,ic])=>
        <div key={k}><label style={s.lb}>{ic} {lb}</label><input value={data[k]||""} onChange={e=>onChange({...data,[k]:e.target.value})} style={s.i}/></div>)}
      <div><label style={s.lb}>📅 Date</label><input type="date" value={data.date||""} onChange={e=>onChange({...data,date:e.target.value})} style={{...s.i,colorScheme:t.cs}}/></div>
    </div>
  </div>);
}

// ════════════════ MAIN APP ════════════════
export default function App() {
  const l = useLayout(), w = isW(l);
  const [mode, setMode] = useState(() => {try{return localStorage.getItem("shc-theme")||"dark"}catch{return"dark"}});
  const t = T[mode];
  const s = sty(l,t);
  const toggleMode = () => {const m=mode==="dark"?"light":"dark";setMode(m);try{localStorage.setItem("shc-theme",m)}catch{}};

  const [wk, setWk] = useState(getWeekId());
  const [plan, setPlan] = useState(null);
  const [woLogs, setWoLogs] = useState({});
  const [mlLogs, setMlLogs] = useState({});
  const [meas, setMeas] = useState({weight:"",bodyFat:"",waist:"",chest:"",arms:"",date:""});
  const [tab, setTab] = useState("w");
  const [day, setDay] = useState(todayIdx());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const load = useCallback(async (showLoading=true) => {
    if(showLoading) setLoading(true);
    try {
      const [p, wl, ml, m] = await Promise.all([db.getPlan(wk),db.getWorkoutLogs(wk),db.getMealLogs(wk),db.getMeasurements(wk)]);
      setPlan(p);
      const wMap = {}; wl.forEach(x => wMap[x.day_index] = {exercises:x.exercises||[],cardio:x.cardio||[],usedMicro:x.used_micro||false,completed:x.completed||false,notes:x.notes||""}); setWoLogs(wMap);
      const mMap = {}; ml.forEach(x => mMap[x.day_index] = x); setMlLogs(mMap);
      if(m) setMeas({weight:m.weight||"",bodyFat:m.body_fat||"",waist:m.waist||"",chest:m.chest||"",arms:m.arms||"",date:m.measured_at||""});
      else setMeas({weight:"",bodyFat:"",waist:"",chest:"",arms:"",date:""});
      setError(null);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }, [wk]);

  useEffect(()=>{load();},[load]);
  const refresh = async () => { setRefreshing(true); await load(false); setRefreshing(false); };

  const updateWoLog = (dayIndex, logData) => { setWoLogs(prev => ({...prev, [dayIndex]: {...(prev[dayIndex]||{}), ...logData}})); setDirty(true); };
  const updateMlLog = (dayIndex, meals) => { setMlLogs(prev => ({...prev, [dayIndex]: {...(prev[dayIndex]||{}), meals}})); setDirty(true); };
  const updateMeas = (m) => { setMeas(m); setDirty(true); };

  const saveAll = async () => {
    setSaving(true); setSaveMsg("");
    try {
      const promises = [];
      Object.entries(woLogs).forEach(([di, log]) => { promises.push(db.upsertWorkoutLog(wk, parseInt(di), log)); });
      Object.entries(mlLogs).forEach(([di, log]) => { if (log.meals) promises.push(db.upsertMealLog(wk, parseInt(di), log.meals)); });
      if (meas.weight || meas.bodyFat || meas.waist || meas.chest || meas.arms) promises.push(db.upsertMeasurements(wk, meas));
      await Promise.all(promises);
      setDirty(false); setSaveMsg("Saved ✓"); setTimeout(() => setSaveMsg(""), 3000);
    } catch(e) { setSaveMsg("Save failed!"); }
    setSaving(false);
  };

  const wp = Array.isArray(plan?.workout_plan) ? plan.workout_plan : [];
  const mp = Array.isArray(plan?.meal_plan) ? plan.meal_plan : [];
  const streak = DAYS.reduce((a,_,i)=>{const p=wp[i]||{exercises:[]};const lg=woLogs[i]||{};const ex=lg.exercises?.length?lg.exercises:p.exercises||[];return a+((lg.usedMicro||lg.completed||(ex.length>0&&ex.every(e=>e.completed)))?1:0);},0);
  const mealsDone = DAYS.reduce((a,_,i)=>{const lg=mlLogs[i];if(!lg?.meals)return a;return a+lg.meals.filter(m=>m.confirmed).length;},0);

  if(loading) return <div style={{background:t.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:t.accent,fontFamily:"monospace",transition:"all .3s"}}>Loading...</div>;

  const noPlan = !plan;

  return (
    <div style={{background:t.bg,minHeight:"100vh",color:t.text,fontFamily:"'Overpass Mono','SF Mono',monospace",padding:l==="D"?"24px 40px":w?"20px 28px":"14px",maxWidth:l==="D"?960:w?720:600,margin:"0 auto",transition:"background .4s,color .3s"}}>
      <style>{`@keyframes sp{from{transform:rotate(0)}to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=Overpass+Mono:wght@400;700&display=swap');`}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:w?24:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <SHCIcon size={w?32:28} theme={mode}/>
          <h1 style={{color:t.accent,fontSize:w?20:17,fontWeight:900,margin:0,letterSpacing:1}}>Shreyash Health Console</h1>
          <button onClick={toggleMode} style={{background:t.gl,border:`1px solid ${t.bm}`,borderRadius:10,padding:"4px 10px",cursor:"pointer",fontSize:16,lineHeight:1,backdropFilter:"blur(10px)"}}>{t.tog}</button>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {saveMsg&&<span style={{color:t.green,fontSize:12}}>{saveMsg}</span>}
          {dirty&&<button onClick={saveAll} disabled={saving} style={{background:saving?t.bm:t.accent,color:saving?t.tm:t.at,border:"none",borderRadius:8,padding:"6px 16px",cursor:saving?"wait":"pointer",fontSize:13,fontWeight:700,fontFamily:"'Overpass Mono',monospace"}}>{saving?"Saving...":"Save"}</button>}
          <button onClick={refresh} disabled={refreshing} style={{background:t.gl,border:`1px solid ${t.bm}`,borderRadius:8,padding:"5px 12px",color:refreshing?t.accent:t.tm,cursor:"pointer",fontSize:14,backdropFilter:"blur(10px)",animation:refreshing?"sp .8s linear infinite":"none"}}>↻</button>
        </div>
      </div>

      <div style={{color:t.tf,fontSize:13,marginBottom:20,letterSpacing:1}}>Week of {wk}</div>

      {error&&<div style={{color:t.red,fontSize:13,marginBottom:12,padding:10,background:`${t.red}11`,borderRadius:10,border:`1px solid ${t.red}33`}}>Error: {error}</div>}

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:w?12:6,marginBottom:w?20:12}}>
        {[{v:streak,m:"/7",l:"WORKOUTS",c:t.accent,g:t.ag},{v:mealsDone,m:"/21",l:"MEALS",c:t.green,g:t.gg},{v:"🔥"+streak,m:"",l:"STREAK",c:streak>=5?t.accent:streak>=3?t.yellow:t.red,g:"transparent"}].map((k,i)=>(
          <div key={i} style={{...s.c,textAlign:"center",marginBottom:0,background:`linear-gradient(135deg,${k.g},${t.card})`}}>
            <div style={{color:k.c,fontSize:l==="D"?32:w?28:22,fontWeight:900}}>{k.v}<span style={{fontSize:w?14:11,color:t.ks}}>{k.m}</span></div>
            <div style={{color:t.kl,fontSize:12,fontWeight:700,letterSpacing:2,marginTop:2}}>{k.l}</div>
          </div>
        ))}
      </div>

      {noPlan&&<div style={{...s.c,border:`1px solid ${t.miB}`,background:t.miBg,textAlign:"center",padding:24}}>
        <div style={{color:t.yellow,fontSize:15,fontWeight:700,marginBottom:8}}>No plan for this week yet</div>
        <div style={{color:t.tm,fontSize:13}}>Ask Ishaan to generate your plan — it'll appear here automatically.</div>
      </div>}

      {!noPlan&&<>
        <div style={{display:"flex",gap:6,borderBottom:`1px solid ${t.bf}`,paddingBottom:10,marginBottom:16}}>
          {[["w","🏋️","Workouts"],["m","🍛","Meals"],["b","📏","Body"]].map(([id,ic,lb])=>
            <button key={id} onClick={()=>setTab(id)} style={{padding:l==="D"?"10px 24px":w?"10px 18px":"8px 14px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:700,fontSize:w?14:13,fontFamily:"'Overpass Mono',monospace",background:tab===id?t.accent:"transparent",color:tab===id?t.at:t.ti,boxShadow:tab===id?`0 0 20px ${t.ag}`:"none",transition:"all .2s"}}>{ic} {lb}</button>)}
        </div>

        {tab!=="b"&&<div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
          {SHORT.map((d,i)=>{const isT=i===todayIdx()&&wk===getWeekId();return<button key={d} onClick={()=>setDay(i)} style={{padding:w?"8px 14px":"6px 10px",borderRadius:10,border:isT?`1.5px solid ${t.accent}`:`1px solid ${t.bm}`,cursor:"pointer",fontSize:w?13:12,fontFamily:"'Overpass Mono',monospace",background:day===i?t.ds:"transparent",color:day===i?t.accent:t.di,fontWeight:day===i?700:400,boxShadow:isT?`0 0 12px ${t.ag}`:"none",transition:"all .2s"}}>
            {d} <span style={{fontSize:10,opacity:.5}}>{dayDate(wk,i)}</span>
          </button>;})}
          <button onClick={()=>setDay(-1)} style={{padding:w?"8px 14px":"6px 10px",borderRadius:10,border:`1px solid ${t.bm}`,cursor:"pointer",fontSize:w?13:12,fontFamily:"'Overpass Mono',monospace",background:day===-1?t.ds:"transparent",color:day===-1?t.accent:t.di,fontWeight:day===-1?700:400}}>ALL</button>
        </div>}

        {tab==="w"&&(day===-1
          ? wp.map((p,i)=><WDay key={i} plan={{...p,day:DAYS[i]}} log={woLogs[i]||{}} onLogChange={d=>updateWoLog(i,d)} s={s} l={l} t={t}/>)
          : wp[day] ? <WDay plan={{...wp[day],day:DAYS[day]}} log={woLogs[day]||{}} onLogChange={d=>updateWoLog(day,d)} s={s} l={l} t={t}/> : <div style={{color:t.tf,padding:20}}>No plan for this day</div>
        )}
        {tab==="m"&&(day===-1
          ? mp.map((p,i)=><MDay key={i} planned={p.meals||[]} logged={mlLogs[i]?.meals} onLogChange={m=>updateMlLog(i,m)} s={s} l={l} t={t}/>)
          : mp[day] ? <MDay planned={mp[day].meals||[]} logged={mlLogs[day]?.meals} onLogChange={m=>updateMlLog(day,m)} s={s} l={l} t={t}/> : <div style={{color:t.tf,padding:20}}>No meal plan for this day</div>
        )}
        {tab==="b"&&<Body data={meas} onChange={updateMeas} s={s} l={l} t={t}/>}
      </>}

      <div style={{display:"flex",justifyContent:"center",gap:w?16:10,marginTop:w?28:20,paddingTop:14,borderTop:`1px solid ${t.bf}`}}>
        <button onClick={()=>{const d=new Date(wk+"T12:00:00");d.setDate(d.getDate()-7);setWk(getWeekId(d));}} style={s.bg}>← Prev</button>
        <button onClick={()=>{setWk(getWeekId());setDay(todayIdx());}} style={{...s.bg,color:t.accent,borderColor:t.accent,boxShadow:`0 0 12px ${t.ag}`}}>This Week</button>
        <button onClick={()=>{const d=new Date(wk+"T12:00:00");d.setDate(d.getDate()+7);setWk(getWeekId(d));}} style={s.bg}>Next →</button>
      </div>
    </div>
  );
}
