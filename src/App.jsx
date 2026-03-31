import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from './db.js';

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const getWeekId = (date = new Date()) => { const d = new Date(date); d.setDate(d.getDate()-d.getDay()); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const todayIdx = () => new Date().getDay();
const dayDate = (wk,i) => { const d = new Date(wk+"T12:00:00"); d.setDate(d.getDate()+i); return `${d.getMonth()+1}/${d.getDate()}`; };
const isDone = d => d.usedMicro || d.completed || (d.exercises?.length > 0 && d.exercises.every(e=>e.completed));

const emptyDayPlan = (day) => ({focus:"",exercises:[],cardio:[],microOption:"",notes:""});
const emptyMeals = () => [{slot:"Breakfast (8am)",planned:"",actual:"",confirmed:false,notes:""},{slot:"Lunch (12pm)",planned:"",actual:"",confirmed:false,notes:""},{slot:"Snack (4pm)",planned:"",actual:"",confirmed:false,notes:""}];

function useLayout(){ const[w,sW]=useState(window.innerWidth); useEffect(()=>{const h=()=>sW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w>=1024?"D":w>=600?"T":"P";}
const isW=l=>l!=="P";
const sty=l=>{const w=isW(l);return{
  i:{background:"#111",border:"1px solid #262626",borderRadius:6,color:"#e0e0e0",fontFamily:"'Overpass Mono',monospace",width:"100%",boxSizing:"border-box",padding:w?"8px 12px":"6px 8px",fontSize:w?13:12,outline:"none"},
  c:{background:"#0e0e0e",borderRadius:12,border:"1px solid #1c1c1c",padding:w?16:10,marginBottom:w?12:8},
  lb:{color:"#505050",fontSize:w?11:10,marginBottom:3,display:"block",fontWeight:600},
  b:{borderRadius:6,border:"none",cursor:"pointer",fontWeight:700,fontFamily:"'Overpass Mono',monospace",padding:w?"8px 16px":"6px 12px",fontSize:w?12:11},
  bg:{borderRadius:6,border:"1px solid #262626",cursor:"pointer",background:"transparent",fontFamily:"'Overpass Mono',monospace",color:"#606060",padding:w?"6px 14px":"4px 10px",fontSize:w?12:11},
};};

// ─── WORKOUT DAY COMPONENT ───
function WDay({plan,log,onLogChange,s,l}){
  const[sa,sSa]=useState(null),[fm,sFm]=useState({}),[cd,sCd]=useState(null);
  const w=isW(l);
  const data = {...plan,...log}; // merge plan + log
  const exercises = log.exercises?.length ? log.exercises : plan.exercises?.map(e=>({...e,sets:[],completed:false})) || [];
  const cardio = log.cardio?.length ? log.cardio : plan.cardio?.map(c=>({...c,completed:false})) || [];
  const usedMicro = log.usedMicro || false;
  const completed = log.completed || false;
  const notes = log.notes ?? plan.notes ?? "";
  const dayDone = usedMicro || completed || (exercises.length>0 && exercises.every(e=>e.completed));

  const save = (updates) => onLogChange({exercises,cardio,usedMicro,completed,notes,...updates});
  const uE=(i,u)=>{const ex=[...exercises];ex[i]={...ex[i],...u};save({exercises:ex});};
  const uS=(ei,si,f,v)=>{const ex=[...exercises];ex[ei]={...ex[ei],sets:ex[ei].sets.map((x,j)=>j===si?{...x,[f]:v}:x)};save({exercises:ex});};
  const aE=()=>{if(!fm.n)return;save({exercises:[...exercises,{name:fm.n,targetSets:fm.s||"",targetReps:fm.r||"",rpe:fm.p||"",sets:[],completed:false,notes:""}]});sFm({});sSa(null);};
  const aC=()=>{if(!fm.ct)return;save({cardio:[...cardio,{type:fm.ct,duration:fm.cd||"",distance:fm.ci||"",completed:false,notes:""}]});sFm({});sSa(null);};
  const dl=(t,i)=>{const k=`${t}${i}`;if(cd===k){if(t==="e")save({exercises:exercises.filter((_,j)=>j!==i)});else save({cardio:cardio.filter((_,j)=>j!==i)});sCd(null);}else{sCd(k);setTimeout(()=>sCd(c=>c===k?null:c),3000);}};
  const kd=(e,f)=>{if(e.key==="Enter"){e.preventDefault();f();}};

  return(<div style={s.c}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div><span style={{color:"#c8ff00",fontSize:w?16:14,fontWeight:800}}>{plan.day||DAYS[plan.dayIndex||0]}</span>{plan.focus&&<span style={{color:"#606060",fontSize:w?13:11,marginLeft:8}}>— {plan.focus}</span>}</div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>{dayDone&&!usedMicro&&<span style={{color:"#4ade80",fontSize:11}}>✓ Done</span>}{usedMicro&&<span style={{color:"#fbbf24",fontSize:11}}>⚡ Micro</span>}</div>
    </div>
    {plan.notes&&<div style={{color:"#4a4a4a",fontSize:11,marginBottom:8,fontStyle:"italic"}}>{plan.notes}</div>}
    {plan.microOption&&<div style={{background:"#141408",border:"1px solid #2a2a00",borderRadius:8,padding:w?10:8,marginBottom:10,fontSize:w?12:11}}><span style={{color:"#fbbf24"}}>⚡ Streak Saver: </span><span style={{color:"#909090"}}>{plan.microOption}</span>
      <button onClick={()=>save({usedMicro:!usedMicro,completed:!usedMicro||completed})} style={{...s.b,marginLeft:8,padding:"3px 10px",fontSize:10,background:usedMicro?"#fbbf24":"#262626",color:usedMicro?"#000":"#606060"}}>{usedMicro?"Used ✓":"Use This"}</button></div>}

    {exercises.map((ex,ei)=><div key={ei} style={{background:"#0a0a14",borderRadius:8,padding:w?12:8,marginBottom:8,border:ex.completed?"1px solid #1a2a1a":"1px solid #181825"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
          <input type="checkbox" checked={ex.completed||false} onChange={e=>uE(ei,{completed:e.target.checked})} style={{accentColor:"#4ade80",width:w?16:14,height:w?16:14,cursor:"pointer",flexShrink:0}}/>
          <span style={{color:ex.completed?"#4ade80":"#d0d0d0",fontSize:w?14:12,fontWeight:700,textDecoration:ex.completed?"line-through":"none",opacity:ex.completed?.6:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.name}</span>
        </div>
        <button onClick={()=>dl("e",ei)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:cd===`e${ei}`?"#ef4444":"#333",fontFamily:"monospace"}}>{cd===`e${ei}`?"del?":"✕"}</button>
      </div>
      {ex.targetSets&&<div style={{color:"#404040",fontSize:10,marginBottom:6,paddingLeft:w?24:22}}>Target: {ex.targetSets}×{ex.targetReps}{ex.rpe?` @ RPE ${ex.rpe}`:""}</div>}
      {ex.sets?.length>0&&<div style={{paddingLeft:w?24:22}}>
        <div style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr 24px 20px",gap:4,marginBottom:4,fontSize:10,color:"#404040"}}><span>#</span><span>Reps</span><span>Weight</span><span>✓</span><span></span></div>
        {ex.sets.map((z,si)=><div key={si} style={{display:"grid",gridTemplateColumns:"28px 1fr 1fr 24px 20px",gap:4,marginBottom:3,alignItems:"center"}}>
          <span style={{color:"#404040",fontSize:11}}>{si+1}</span>
          <input value={z.reps} onChange={e=>uS(ei,si,"reps",e.target.value)} placeholder="—" style={{...s.i,padding:"4px 6px"}}/>
          <input value={z.weight} onChange={e=>uS(ei,si,"weight",e.target.value)} placeholder="lbs" style={{...s.i,padding:"4px 6px"}}/>
          <input type="checkbox" checked={z.done||false} onChange={e=>uS(ei,si,"done",e.target.checked)} style={{accentColor:"#4ade80",cursor:"pointer"}}/>
          <button onClick={()=>uE(ei,{sets:ex.sets.filter((_,j)=>j!==si)})} style={{background:"none",border:"none",color:"#333",cursor:"pointer",fontSize:10}}>✕</button>
        </div>)}
      </div>}
      <div style={{paddingLeft:w?24:22,marginTop:6}}><button onClick={()=>uE(ei,{sets:[...(ex.sets||[]),{reps:"",weight:"",done:false}]})} style={{...s.bg,padding:"2px 8px",fontSize:10}}>+ set</button></div>
      <div style={{paddingLeft:w?24:22,marginTop:6}}><input value={ex.notes||""} onChange={e=>uE(ei,{notes:e.target.value})} placeholder="Notes..." style={{...s.i,padding:"4px 8px",fontSize:11,background:"#080810"}}/></div>
    </div>)}

    {cardio.map((c,ci)=><div key={ci} style={{background:"#0a120a",borderRadius:8,padding:w?10:8,marginBottom:8,border:c.completed?"1px solid #1a2a1a":"1px solid #152015"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
          <input type="checkbox" checked={c.completed||false} onChange={e=>save({cardio:cardio.map((x,j)=>j===ci?{...x,completed:e.target.checked}:x)})} style={{accentColor:"#4ade80",cursor:"pointer"}}/>
          <span style={{color:"#4ade80",fontSize:w?13:12}}>{c.type}</span>{c.duration&&<span style={{color:"#505050",fontSize:11}}>{c.duration}min</span>}
        </div>
        <button onClick={()=>dl("c",ci)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:cd===`c${ci}`?"#ef4444":"#333"}}>{cd===`c${ci}`?"del?":"✕"}</button>
      </div>
      <input value={c.notes||""} onChange={e=>save({cardio:cardio.map((x,j)=>j===ci?{...x,notes:e.target.value}:x)})} placeholder="Cardio notes..." style={{...s.i,padding:"4px 8px",fontSize:11,background:"#081008",marginTop:6}}/>
    </div>)}

    <div style={{display:"flex",gap:6,marginTop:10}}>
      <button onClick={()=>sSa(sa==="e"?null:"e")} style={s.bg}>+ Exercise</button>
      <button onClick={()=>sSa(sa==="c"?null:"c")} style={s.bg}>+ Cardio</button>
    </div>
    {sa==="e"&&<div style={{background:"#111",borderRadius:8,padding:10,marginTop:8,display:"flex",gap:6,flexWrap:"wrap",alignItems:"end"}}>
      <div style={{flex:"2 1 140px"}}><label style={s.lb}>Exercise</label><input value={fm.n||""} onChange={e=>sFm({...fm,n:e.target.value})} onKeyDown={e=>kd(e,aE)} autoFocus style={s.i}/></div>
      <div style={{flex:"1 1 60px"}}><label style={s.lb}>Sets</label><input value={fm.s||""} onChange={e=>sFm({...fm,s:e.target.value})} onKeyDown={e=>kd(e,aE)} style={s.i}/></div>
      <div style={{flex:"1 1 60px"}}><label style={s.lb}>Reps</label><input value={fm.r||""} onChange={e=>sFm({...fm,r:e.target.value})} onKeyDown={e=>kd(e,aE)} style={s.i}/></div>
      <div style={{flex:"1 1 50px"}}><label style={s.lb}>RPE</label><input value={fm.p||""} onChange={e=>sFm({...fm,p:e.target.value})} onKeyDown={e=>kd(e,aE)} style={s.i}/></div>
      <button onClick={aE} style={{...s.b,background:"#c8ff00",color:"#000"}}>Add</button></div>}
    {sa==="c"&&<div style={{background:"#111",borderRadius:8,padding:10,marginTop:8,display:"flex",gap:6,flexWrap:"wrap",alignItems:"end"}}>
      <div style={{flex:"2 1 120px"}}><label style={s.lb}>Type</label><input value={fm.ct||""} onChange={e=>sFm({...fm,ct:e.target.value})} onKeyDown={e=>kd(e,aC)} autoFocus style={s.i}/></div>
      <div style={{flex:"1 1 60px"}}><label style={s.lb}>Min</label><input value={fm.cd||""} onChange={e=>sFm({...fm,cd:e.target.value})} onKeyDown={e=>kd(e,aC)} style={s.i}/></div>
      <div style={{flex:"1 1 70px"}}><label style={s.lb}>Dist</label><input value={fm.ci||""} onChange={e=>sFm({...fm,ci:e.target.value})} onKeyDown={e=>kd(e,aC)} style={s.i}/></div>
      <button onClick={aC} style={{...s.b,background:"#4ade80",color:"#000"}}>Add</button></div>}
    <textarea placeholder="Day notes..." value={notes} onChange={e=>save({notes:e.target.value})} style={{...s.i,width:"100%",marginTop:10,minHeight:36,resize:"vertical",boxSizing:"border-box"}}/>
  </div>);
}

// ─── MEAL DAY ───
function MDay({planned,logged,onLogChange,s,l}){
  const w=isW(l);
  const meals = planned.map((p,i)=>{const lg=logged?.[i]||{}; return{...p,...lg,planned:p.planned};});
  const up=(i,f,v)=>{const m=[...meals.map(x=>({actual:x.actual||"",confirmed:x.confirmed||false,notes:x.notes||""}))];m[i]={...m[i],[f]:v};onLogChange(m);};
  return(<div style={s.c}>
    <div style={{color:"#c8ff00",fontSize:w?16:14,fontWeight:800,marginBottom:10}}>{planned[0]?.day||""}</div>
    {meals.map((m,i)=><div key={i} style={{background:m.confirmed?"#0a120a":"#0a0a14",borderRadius:8,padding:w?12:8,marginBottom:8,border:m.confirmed?"1px solid #1a2a1a":"1px solid #181825"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{color:"#707070",fontSize:w?12:11,fontWeight:700}}>{m.slot}</span>
        <button onClick={()=>up(i,"confirmed",!m.confirmed)} style={{...s.b,padding:"3px 10px",fontSize:10,background:m.confirmed?"#4ade80":"#262626",color:m.confirmed?"#000":"#606060"}}>{m.confirmed?"Ate ✓":"Confirm"}</button>
      </div>
      {m.planned&&<div style={{color:"#909090",fontSize:w?12:11,marginBottom:6,padding:"6px 8px",background:"#080814",borderRadius:6}}><span style={{color:"#404040",fontSize:10}}>PLAN → </span>{m.planned}</div>}
      <input value={m.actual||""} onChange={e=>up(i,"actual",e.target.value)} placeholder={m.planned?"What I actually ate (blank = followed plan)":"What I ate..."} style={s.i}/>
      <input value={m.notes||""} onChange={e=>up(i,"notes",e.target.value)} placeholder="Meal notes..." style={{...s.i,marginTop:4,fontSize:11,background:"#080810"}}/>
    </div>)}
  </div>);
}

// ─── BODY ───
function Body({data,onChange,s,l}){
  const w=isW(l);
  return(<div style={s.c}>
    <div style={{color:"#c8ff00",fontSize:w?16:14,fontWeight:800,marginBottom:14}}>Body Measurements</div>
    <div style={{display:"grid",gridTemplateColumns:w?"1fr 1fr 1fr":"1fr 1fr",gap:w?12:8}}>
      {[["weight","Weight (lbs)","⚖️"],["bodyFat","Body Fat %","📊"],["waist","Waist (in)","📏"],["chest","Chest (in)","📐"],["arms","Arms (in)","💪"]].map(([k,lb,ic])=>
        <div key={k}><label style={s.lb}>{ic} {lb}</label><input value={data[k]||""} onChange={e=>onChange({...data,[k]:e.target.value})} style={s.i}/></div>)}
      <div><label style={s.lb}>📅 Date</label><input type="date" value={data.date||""} onChange={e=>onChange({...data,date:e.target.value})} style={{...s.i,colorScheme:"dark"}}/></div>
    </div>
  </div>);
}

// ════════════════ MAIN APP ════════════════
export default function App() {
  const l = useLayout(), s = sty(l), w = isW(l);
  const [wk, setWk] = useState(getWeekId());
  const [plan, setPlan] = useState(null); // from weekly_plans table
  const [woLogs, setWoLogs] = useState({}); // {dayIndex: log}
  const [mlLogs, setMlLogs] = useState({}); // {dayIndex: meals}
  const [meas, setMeas] = useState({weight:"",bodyFat:"",waist:"",chest:"",arms:"",date:""});
  const [tab, setTab] = useState("w");
  const [day, setDay] = useState(todayIdx());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load all data for current week
  const load = useCallback(async (showLoading=true) => {
    if(showLoading) setLoading(true);
    try {
      const [p, wl, ml, m] = await Promise.all([
        db.getPlan(wk),
        db.getWorkoutLogs(wk),
        db.getMealLogs(wk),
        db.getMeasurements(wk),
      ]);
      setPlan(p);
      const wMap = {}; wl.forEach(x => wMap[x.day_index] = x); setWoLogs(wMap);
      const mMap = {}; ml.forEach(x => mMap[x.day_index] = x); setMlLogs(mMap);
      if(m) setMeas({weight:m.weight||"",bodyFat:m.body_fat||"",waist:m.waist||"",chest:m.chest||"",arms:m.arms||"",date:m.measured_at||""});
      else setMeas({weight:"",bodyFat:"",waist:"",chest:"",arms:"",date:""});
      setError(null);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }, [wk]);

  useEffect(()=>{load();},[load]);

  const refresh = async () => { setRefreshing(true); await load(false); setRefreshing(false); };

  // Save workout log
  const saveWoLog = async (dayIndex, logData) => {
    const updated = {...woLogs, [dayIndex]: {...(woLogs[dayIndex]||{}), ...logData}};
    setWoLogs(updated);
    setSaving(true);
    await db.upsertWorkoutLog(wk, dayIndex, logData);
    setSaving(false);
  };

  // Save meal log
  const saveMlLog = async (dayIndex, meals) => {
    const updated = {...mlLogs, [dayIndex]: {...(mlLogs[dayIndex]||{}), meals}};
    setMlLogs(updated);
    setSaving(true);
    await db.upsertMealLog(wk, dayIndex, meals);
    setSaving(false);
  };

  // Save measurements
  const saveMeas = async (m) => {
    setMeas(m);
    setSaving(true);
    await db.upsertMeasurements(wk, m);
    setSaving(false);
  };

  // Compute stats
  const wp = plan?.workout_plan || [];
  const mp = plan?.meal_plan || [];
  const streak = DAYS.reduce((a,_,i)=>{
    const p = wp[i]||{exercises:[]}; const lg = woLogs[i]||{};
    const ex = lg.exercises?.length ? lg.exercises : p.exercises||[];
    const d = lg.usedMicro||lg.completed||(ex.length>0&&ex.every(e=>e.completed));
    return a+(d?1:0);
  },0);
  const mealsDone = DAYS.reduce((a,_,i)=>{
    const lg = mlLogs[i]; if(!lg?.meals) return a;
    return a+lg.meals.filter(m=>m.confirmed).length;
  },0);

  if(loading) return <div style={{background:"#080808",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#c8ff00",fontFamily:"monospace"}}>Loading...</div>;

  const noPlan = !plan;

  return (
    <div style={{background:"#080808",minHeight:"100vh",color:"#ddd",fontFamily:"'Overpass Mono','SF Mono',monospace",padding:l==="D"?"24px 40px":w?"20px 28px":"14px",maxWidth:l==="D"?960:w?720:600,margin:"0 auto"}}>
      <style>{`@keyframes sp{from{transform:rotate(0)}to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=Overpass+Mono:wght@400;700&display=swap');`}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:w?20:14}}>
        <div>
          <h1 style={{color:"#c8ff00",fontSize:l==="D"?28:w?24:20,fontWeight:900,margin:0,letterSpacing:4}}>SHC</h1>
          <div style={{color:"#2a2a2a",fontSize:w?11:10}}>Shreyash Health Console · {wk}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {saving&&<span style={{color:"#c8ff00",fontSize:9}}>saving...</span>}
          <button onClick={refresh} disabled={refreshing} style={{background:"none",border:"1px solid #222",borderRadius:6,padding:"5px 10px",color:refreshing?"#c8ff00":"#505050",cursor:"pointer",fontSize:14,animation:refreshing?"sp .8s linear infinite":"none"}}>↻</button>
        </div>
      </div>

      {error&&<div style={{color:"#ef4444",fontSize:11,marginBottom:10,padding:8,background:"#1a0a0a",borderRadius:8}}>Error: {error}</div>}

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:w?12:6,marginBottom:w?16:10}}>
        <div style={{...s.c,textAlign:"center",marginBottom:0}}><div style={{color:"#c8ff00",fontSize:l==="D"?32:w?28:22,fontWeight:900}}>{streak}<span style={{fontSize:w?14:11,color:"#2a2a2a"}}>/7</span></div><div style={{color:"#2a2a2a",fontSize:w?10:9,fontWeight:700,letterSpacing:1.5}}>WORKOUTS</div></div>
        <div style={{...s.c,textAlign:"center",marginBottom:0}}><div style={{color:"#4ade80",fontSize:l==="D"?32:w?28:22,fontWeight:900}}>{mealsDone}<span style={{fontSize:w?14:11,color:"#2a2a2a"}}>/21</span></div><div style={{color:"#2a2a2a",fontSize:w?10:9,fontWeight:700,letterSpacing:1.5}}>MEALS</div></div>
        <div style={{...s.c,textAlign:"center",marginBottom:0}}><div style={{color:streak>=5?"#c8ff00":streak>=3?"#fbbf24":"#ef4444",fontSize:l==="D"?32:w?28:22,fontWeight:900}}>🔥{streak}</div><div style={{color:"#2a2a2a",fontSize:w?10:9,fontWeight:700,letterSpacing:1.5}}>STREAK</div></div>
      </div>

      {noPlan&&<div style={{...s.c,border:"1px solid #2a2a00",background:"#0e0e06",textAlign:"center",padding:20}}>
        <div style={{color:"#fbbf24",fontSize:14,fontWeight:700,marginBottom:8}}>No plan for this week yet</div>
        <div style={{color:"#606060",fontSize:12}}>Ask Ishaan to generate your plan — it'll appear here automatically.</div>
      </div>}

      {!noPlan&&<>
        {/* Tabs */}
        <div style={{display:"flex",gap:w?6:4,borderBottom:"1px solid #1c1c1c",paddingBottom:8,marginBottom:w?16:10}}>
          {[["w","🏋️","Workouts"],["m","🍛","Meals"],["b","📏","Body"]].map(([id,ic,lb])=>
            <button key={id} onClick={()=>setTab(id)} style={{padding:l==="D"?"10px 24px":w?"10px 18px":"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:w?14:12,fontFamily:"'Overpass Mono',monospace",background:tab===id?"#c8ff00":"transparent",color:tab===id?"#080808":"#404040"}}>{ic} {lb}</button>)}
        </div>

        {/* Day selector */}
        {tab!=="b"&&<div style={{display:"flex",gap:w?6:4,marginBottom:w?16:10,flexWrap:"wrap"}}>
          {SHORT.map((d,i)=>{const isT=i===todayIdx()&&wk===getWeekId();return<button key={d} onClick={()=>setDay(i)} style={{padding:w?"8px 14px":"6px 10px",borderRadius:8,border:isT?"1.5px solid #c8ff00":"1px solid #222",cursor:"pointer",fontSize:w?12:11,fontFamily:"'Overpass Mono',monospace",position:"relative",background:day===i?"#141420":"transparent",color:day===i?"#c8ff00":"#505050",fontWeight:day===i?700:400}}>
            {d} <span style={{fontSize:9,opacity:.5}}>{dayDate(wk,i)}</span>
          </button>;})}
          <button onClick={()=>setDay(-1)} style={{padding:w?"8px 14px":"6px 10px",borderRadius:8,border:"1px solid #222",cursor:"pointer",fontSize:w?12:11,fontFamily:"'Overpass Mono',monospace",background:day===-1?"#141420":"transparent",color:day===-1?"#c8ff00":"#505050",fontWeight:day===-1?700:400}}>ALL</button>
        </div>}

        {/* Content */}
        {tab==="w"&&(day===-1
          ? wp.map((p,i)=><WDay key={i} plan={{...p,day:DAYS[i]}} log={woLogs[i]||{}} onLogChange={d=>saveWoLog(i,d)} s={s} l={l}/>)
          : wp[day] ? <WDay plan={{...wp[day],day:DAYS[day]}} log={woLogs[day]||{}} onLogChange={d=>saveWoLog(day,d)} s={s} l={l}/> : <div style={{color:"#404040",padding:20}}>No plan for this day</div>
        )}
        {tab==="m"&&(day===-1
          ? mp.map((p,i)=><MDay key={i} planned={p.meals||[]} logged={mlLogs[i]?.meals} onLogChange={m=>saveMlLog(i,m)} s={s} l={l}/>)
          : mp[day] ? <MDay planned={mp[day].meals||[]} logged={mlLogs[day]?.meals} onLogChange={m=>saveMlLog(day,m)} s={s} l={l}/> : <div style={{color:"#404040",padding:20}}>No meal plan for this day</div>
        )}
        {tab==="b"&&<Body data={meas} onChange={saveMeas} s={s} l={l}/>}
      </>}

      {/* Week nav */}
      <div style={{display:"flex",justifyContent:"center",gap:w?16:10,marginTop:w?28:20,paddingTop:14,borderTop:"1px solid #141414"}}>
        <button onClick={()=>{const d=new Date(wk+"T12:00:00");d.setDate(d.getDate()-7);setWk(getWeekId(d));}} style={s.bg}>← Prev</button>
        <button onClick={()=>{setWk(getWeekId());setDay(todayIdx());}} style={{...s.bg,color:"#c8ff00",borderColor:"#333"}}>This Week</button>
        <button onClick={()=>{const d=new Date(wk+"T12:00:00");d.setDate(d.getDate()+7);setWk(getWeekId(d));}} style={s.bg}>Next →</button>
      </div>
      <div style={{textAlign:"center",color:"#141414",fontSize:9,marginTop:10}}>supabase · vercel</div>
    </div>
  );
}
