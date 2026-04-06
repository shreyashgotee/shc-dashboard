import { useState, useEffect, useCallback } from 'react';
import { db, auth, pin } from './db.js';

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
// week_id = Monday date. day_index: 0=Mon,1=Tue,...6=Sun
const getWeekId = (date = new Date()) => { const d = new Date(date); const jsDay = d.getDay(); const diff = jsDay === 0 ? 6 : jsDay - 1; d.setDate(d.getDate() - diff); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const todayIdx = () => { const jsDay = new Date().getDay(); return jsDay === 0 ? 6 : jsDay - 1; }; // Mon=0,...Sun=6
const localDate = () => new Date().toLocaleDateString('en-CA');
const dayDate = (wk,dayIdx) => { const d = new Date(wk+"T12:00:00"); d.setDate(d.getDate()+dayIdx); return `${d.getMonth()+1}/${d.getDate()}`; };
function useLayout(){ const[w,sW]=useState(window.innerWidth); useEffect(()=>{const h=()=>sW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);return w>=1024?"D":w>=600?"T":"P";}
const isW=l=>l!=="P";

function AutoTA({value,onChange,placeholder,style:extraStyle}) {
  const ref = useCallback(node => {
    if (node) { node.style.height = "auto"; node.style.height = node.scrollHeight + "px"; }
  }, [value]);
  return <textarea ref={ref} value={value} onChange={onChange} placeholder={placeholder} rows={1}
    onInput={e=>{e.target.style.height="auto";e.target.style.height=e.target.scrollHeight+"px";}}
    style={{...extraStyle,resize:"none",overflow:"hidden",minHeight:36}}/>;
}

const Icon = ({size=28,accent="#c8ff00",bg="#000"}) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" rx="28" fill={bg}/>
    <path d="M60 18 L95 35 L95 65 Q95 95 60 105 Q25 95 25 65 L25 35 Z" stroke={accent} strokeWidth="3" fill={accent} fillOpacity="0.04"/>
    <polyline points="35,62 45,62 50,48 56,78 62,52 67,65 73,58 85,62" stroke={accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M60 24 Q55 32 58 36 Q54 30 52 36 Q50 42 56 44 Q54 40 56 38 Q58 42 60 38 Q62 42 64 38 Q66 40 64 44 Q70 42 68 36 Q66 30 62 36 Q65 32 60 24Z" fill={accent} opacity="0.6"/>
  </svg>
);

const T = {
  dark: {bg:"#000",card:"rgba(255,255,255,0.03)",cb:"rgba(255,255,255,0.06)",text:"#f0f0f0",tm:"#909090",tf:"#606060",accent:"#c8ff00",ag:"rgba(200,255,0,0.15)",at:"#000",green:"#00ff88",gg:"rgba(0,255,136,0.1)",yellow:"#ffcc00",red:"#ff3355",ib:"rgba(255,255,255,0.04)",ibr:"rgba(255,255,255,0.08)",exBg:"rgba(100,100,255,0.03)",exB:"rgba(100,100,255,0.08)",exBd:"rgba(0,255,136,0.15)",cBg:"rgba(0,255,136,0.03)",cB:"rgba(0,255,136,0.08)",mpBg:"rgba(100,100,255,0.04)",miBg:"rgba(255,204,0,0.04)",miB:"rgba(255,204,0,0.12)",kl:"#888",ks:"#444",ti:"#666",di:"#555",ds:"rgba(200,255,0,0.06)",dBg:"rgba(255,255,255,0.04)",dB:"rgba(255,255,255,0.1)",dc:"#888",bf:"rgba(255,255,255,0.05)",bm:"rgba(255,255,255,0.08)",gl:"rgba(255,255,255,0.02)",tog:"\u2600\uFE0F",cs:"dark"},
  light:{bg:"#fff",card:"rgba(0,0,0,0.02)",cb:"rgba(0,0,0,0.06)",text:"#111",tm:"#555",tf:"#999",accent:"#0055ff",ag:"rgba(0,85,255,0.08)",at:"#fff",green:"#00b359",gg:"rgba(0,179,89,0.08)",yellow:"#e6a800",red:"#e63946",ib:"rgba(0,0,0,0.025)",ibr:"rgba(0,0,0,0.08)",exBg:"rgba(0,85,255,0.02)",exB:"rgba(0,85,255,0.08)",exBd:"rgba(0,179,89,0.15)",cBg:"rgba(0,179,89,0.02)",cB:"rgba(0,179,89,0.08)",mpBg:"rgba(0,85,255,0.03)",miBg:"rgba(230,168,0,0.05)",miB:"rgba(230,168,0,0.15)",kl:"#444",ks:"#aaa",ti:"#999",di:"#999",ds:"rgba(0,85,255,0.06)",dBg:"rgba(0,0,0,0.04)",dB:"rgba(0,0,0,0.1)",dc:"#888",bf:"rgba(0,0,0,0.05)",bm:"rgba(0,0,0,0.08)",gl:"rgba(0,0,0,0.015)",tog:"\uD83C\uDF19",cs:"light"}
};

const sty=(l,t)=>{const w=isW(l);return{
  i:{background:t.ib,border:"1px solid "+t.ibr,borderRadius:8,color:t.text,fontFamily:"'Overpass Mono',monospace",width:"100%",boxSizing:"border-box",padding:w?"10px 14px":"8px 10px",fontSize:w?15:14,outline:"none"},
  c:{background:t.card,borderRadius:14,border:"1px solid "+t.cb,padding:w?18:12,marginBottom:w?14:10,backdropFilter:"blur(20px)"},
  lb:{color:t.tm,fontSize:w?13:12,marginBottom:4,display:"block",fontWeight:600},
  b:{borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontFamily:"'Overpass Mono',monospace",padding:w?"10px 18px":"8px 14px",fontSize:w?14:13},
  bg:{borderRadius:8,border:"1px solid "+t.bm,cursor:"pointer",background:"transparent",fontFamily:"'Overpass Mono',monospace",color:t.tm,padding:w?"8px 16px":"6px 12px",fontSize:w?14:13},
};};

function LoginScreen({onLogin,t}) {
  const [email,setEmail]=useState(""), [pass,setPass]=useState("");
  const [isSignup,setIsSignup]=useState(false), [err,setErr]=useState(""), [loading,setLoading]=useState(false), [done,setDone]=useState(false);
  const go=async()=>{setErr("");setLoading(true);try{if(isSignup){await auth.signup(email,pass);setDone(true);}else{await auth.login(email,pass);onLogin();}}catch(e){setErr(e.message);}setLoading(false);};
  const iStyle={background:t.ib,border:"1px solid "+t.ibr,borderRadius:8,color:t.text,padding:"12px 16px",fontSize:15,width:"100%",boxSizing:"border-box",marginBottom:10,outline:"none",fontFamily:"'Overpass Mono',monospace"};
  return(
    <div style={{background:t.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Overpass Mono',monospace",padding:20}}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Overpass+Mono:wght@400;700&display=swap');"}</style>
      <div style={{maxWidth:380,width:"100%",textAlign:"center"}}>
        <div style={{marginBottom:28}}><Icon size={64} accent={t.accent} bg={t.bg}/></div>
        <h1 style={{color:t.accent,fontSize:20,fontWeight:900,margin:"0 0 6px",letterSpacing:1}}>Shreyash Health Console</h1>
        <p style={{color:t.tm,fontSize:13,margin:"0 0 28px"}}>{isSignup?"Create your account":"Sign in to continue"}</p>
        {done?(<div><div style={{color:t.green,fontSize:14,marginBottom:12}}>Account created!</div><p style={{color:t.tm,fontSize:12,marginBottom:16}}>Check your email to confirm, then sign in.</p><button onClick={()=>{setIsSignup(false);setDone(false);}} style={{background:t.accent,color:t.at,border:"none",borderRadius:8,padding:"10px 24px",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Overpass Mono',monospace"}}>Sign In</button></div>):(
        <div>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={iStyle}/>
          <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" type="password" onKeyDown={e=>{if(e.key==="Enter")go();}} style={{...iStyle,marginBottom:16}}/>
          {err&&<div style={{color:t.red,fontSize:12,marginBottom:12}}>{err}</div>}
          <button onClick={go} disabled={loading} style={{background:t.accent,color:t.at,border:"none",borderRadius:8,padding:"12px 0",cursor:loading?"wait":"pointer",fontSize:15,fontWeight:700,width:"100%",fontFamily:"'Overpass Mono',monospace",opacity:loading?.6:1}}>{loading?"...":(isSignup?"Create Account":"Sign In")}</button>
          <p style={{color:t.tm,fontSize:12,marginTop:16,cursor:"pointer"}} onClick={()=>{setIsSignup(!isSignup);setErr("");}}>{isSignup?"Already have an account? Sign in":"Need an account? Sign up"}</p>
        </div>)}
      </div>
    </div>
  );
}

function PinSetup({onComplete,t}) {
  const [p1,setP1]=useState(""), [p2,setP2]=useState(""), [err,setErr]=useState(""), [loading,setLoading]=useState(false);
  const pinStyle={background:t.ib,border:"1px solid "+t.ibr,borderRadius:8,color:t.text,padding:"14px",fontSize:24,width:"100%",boxSizing:"border-box",marginBottom:10,outline:"none",fontFamily:"'Overpass Mono',monospace",textAlign:"center",letterSpacing:12};
  const go=async()=>{
    if(p1.length!==4||!/^\d{4}$/.test(p1)){setErr("PIN must be exactly 4 digits");return;}
    if(p1!==p2){setErr("PINs don't match");return;}
    setLoading(true);try{await pin.setPin(p1);onComplete();}catch(e){setErr(e.message);}setLoading(false);
  };
  return(
    <div style={{background:t.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Overpass Mono',monospace",padding:20}}>
      <div style={{maxWidth:340,width:"100%",textAlign:"center"}}>
        <div style={{marginBottom:20}}><Icon size={48} accent={t.accent} bg={t.bg}/></div>
        <h2 style={{color:t.accent,fontSize:18,fontWeight:800,margin:"0 0 8px"}}>Set Your Save PIN</h2>
        <p style={{color:t.tm,fontSize:12,margin:"0 0 24px"}}>This 4-digit PIN is required every time you save. Protects data on shared devices.</p>
        <input value={p1} onChange={e=>setP1(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="Enter PIN" type="password" inputMode="numeric" maxLength={4} style={pinStyle}/>
        <input value={p2} onChange={e=>setP2(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="Confirm PIN" type="password" inputMode="numeric" maxLength={4} onKeyDown={e=>{if(e.key==="Enter")go();}} style={{...pinStyle,marginBottom:16}}/>
        {err&&<div style={{color:t.red,fontSize:12,marginBottom:12}}>{err}</div>}
        <button onClick={go} disabled={loading} style={{background:t.accent,color:t.at,border:"none",borderRadius:8,padding:"12px 0",cursor:"pointer",fontSize:15,fontWeight:700,width:"100%",fontFamily:"'Overpass Mono',monospace"}}>{loading?"...":"Set PIN"}</button>
        <p style={{color:t.tf,fontSize:11,marginTop:16,cursor:"pointer"}} onClick={onComplete}>Skip for now</p>
      </div>
    </div>
  );
}

function PinModal({onVerify,onCancel,t}) {
  const [val,setVal]=useState(""), [err,setErr]=useState(""), [loading,setLoading]=useState(false);
  const go=async()=>{setErr("");setLoading(true);const ok=await pin.verify(val);if(ok){onVerify();}else{setErr("Wrong PIN");setVal("");}setLoading(false);};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(8px)"}}>
      <div style={{background:t.bg,border:"1px solid "+t.cb,borderRadius:16,padding:28,maxWidth:320,width:"90%",textAlign:"center",fontFamily:"'Overpass Mono',monospace"}}>
        <div style={{fontSize:28,marginBottom:12}}>&#x1F512;</div>
        <h3 style={{color:t.text,fontSize:16,fontWeight:700,margin:"0 0 8px"}}>Enter PIN to Save</h3>
        <p style={{color:t.tm,fontSize:12,margin:"0 0 20px"}}>4-digit PIN required to write changes</p>
        <input value={val} onChange={e=>setVal(e.target.value.replace(/\D/g,'').slice(0,4))} type="password" inputMode="numeric" maxLength={4} autoFocus onKeyDown={e=>{if(e.key==="Enter"&&val.length===4)go();if(e.key==="Escape")onCancel();}} style={{background:t.ib,border:"1px solid "+t.ibr,borderRadius:8,color:t.text,padding:"14px",fontSize:28,width:"100%",boxSizing:"border-box",marginBottom:14,outline:"none",fontFamily:"'Overpass Mono',monospace",textAlign:"center",letterSpacing:14}}/>
        {err&&<div style={{color:t.red,fontSize:12,marginBottom:10}}>{err}</div>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={onCancel} style={{flex:1,background:t.gl,border:"1px solid "+t.bm,borderRadius:8,padding:"10px",cursor:"pointer",color:t.tm,fontSize:13,fontFamily:"'Overpass Mono',monospace"}}>Cancel</button>
          <button onClick={go} disabled={loading||val.length<4} style={{flex:1,background:t.accent,color:t.at,border:"none",borderRadius:8,padding:"10px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Overpass Mono',monospace",opacity:(loading||val.length<4)?.5:1}}>{loading?"...":"Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── WORKOUT DAY ───
function WDay({plan,log,onLogChange,s,l,t}){
  const[sa,sSa]=useState(null),[fm,sFm]=useState({}),[cd,sCd]=useState(null);
  const w=isW(l);
  const exercises=(log.exercises!==undefined)?(Array.isArray(log.exercises)?log.exercises:[]):(Array.isArray(plan.exercises)?plan.exercises.map(e=>({...e,sets:[],completed:false})):[]);
  const cardio=(log.cardio!==undefined)?(Array.isArray(log.cardio)?log.cardio:[]):(Array.isArray(plan.cardio)?plan.cardio.map(c=>({...c,completed:false})):[]);
  const usedMicro=log.usedMicro||false;
  const notes=log.notes??plan.notes??"";
  const exAnyDone=exercises.length>0&&exercises.some(e=>e.completed);
  const cardioAnyDone=cardio.length>0&&cardio.some(c=>c.completed);
  const dayDone=usedMicro||exAnyDone||cardioAnyDone;
  const save=(u)=>{
    const next={exercises,cardio,usedMicro,notes,...u};
    const nEx=next.exercises||[];const nCd=next.cardio||[];
    next.completed=next.usedMicro||(nEx.length>0&&nEx.some(e=>e.completed))||(nCd.length>0&&nCd.some(c=>c.completed));
    onLogChange(next);
  };
  const uE=(i,u)=>{const ex=[...exercises];ex[i]={...ex[i],...u};save({exercises:ex});};
  const uS=(ei,si,f,v)=>{const ex=[...exercises];ex[ei]={...ex[ei],sets:ex[ei].sets.map((x,j)=>j===si?{...x,[f]:v}:x)};save({exercises:ex});};
  const aE=()=>{if(!fm.n)return;save({exercises:[...exercises,{name:fm.n,targetSets:fm.s||"",targetReps:fm.r||"",rpe:fm.p||"",sets:[],completed:false,notes:""}]});sFm({});sSa(null);};
  const aC=()=>{if(!fm.ct)return;save({cardio:[...cardio,{type:fm.ct,duration:fm.cd||"",distance:fm.ci||"",completed:false,notes:""}]});sFm({});sSa(null);};
  const dl=(tp,i)=>{const k=tp+i;if(cd===k){if(tp==="e")save({exercises:exercises.filter((_,j)=>j!==i)});else save({cardio:cardio.filter((_,j)=>j!==i)});sCd(null);}else{sCd(k);setTimeout(()=>sCd(c=>c===k?null:c),3000);}};
  const kd=(e,f)=>{if(e.key==="Enter"){e.preventDefault();f();}};
  const dBtn=(a)=>({background:a?t.red:t.dBg,border:"1px solid "+(a?t.red:t.dB),borderRadius:8,cursor:"pointer",fontSize:13,color:a?"#fff":t.dc,fontFamily:"'Overpass Mono',monospace",padding:"4px 10px",fontWeight:700});

  return(<div style={s.c}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div><span style={{color:t.accent,fontSize:w?18:16,fontWeight:800}}>{plan.day||DAYS[plan.dayIndex||0]}</span>{plan.focus&&<span style={{color:t.tm,fontSize:w?15:13,marginLeft:10}}>{"— "+plan.focus}</span>}</div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>{dayDone&&!usedMicro&&<span style={{color:t.green,fontSize:14}}>Done</span>}{usedMicro&&<span style={{color:t.yellow,fontSize:14}}>Micro</span>}</div>
    </div>
    {plan.notes&&<div style={{color:t.tf,fontSize:13,marginBottom:10,fontStyle:"italic"}}>{plan.notes}</div>}
    {plan.microOption&&<div style={{background:t.miBg,border:"1px solid "+t.miB,borderRadius:10,padding:12,marginBottom:14,fontSize:14}}><span style={{color:t.yellow}}>Streak Saver: </span><span style={{color:t.tm}}>{plan.microOption}</span>
      <button onClick={()=>save({usedMicro:!usedMicro,completed:!usedMicro||completed})} style={{...s.b,marginLeft:10,padding:"5px 14px",fontSize:12,background:usedMicro?t.yellow:t.gl,color:usedMicro?"#000":t.tm,border:"1px solid "+t.bm}}>{usedMicro?"Used":"Use This"}</button></div>}

    {exercises.map((ex,ei)=><div key={ei} style={{background:t.exBg,borderRadius:12,padding:w?14:10,marginBottom:10,border:"1px solid "+(ex.completed?t.exBd:t.exB),boxShadow:ex.completed?"inset 0 0 20px "+t.gg:"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
          <input type="checkbox" checked={ex.completed||false} onChange={e=>uE(ei,{completed:e.target.checked})} style={{accentColor:t.green,width:w?20:18,height:w?20:18,cursor:"pointer",flexShrink:0}}/>
          <span style={{color:ex.completed?t.green:t.text,fontSize:w?16:15,fontWeight:700,textDecoration:ex.completed?"line-through":"none",opacity:ex.completed?.6:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.name}</span>
        </div>
        <button onClick={()=>dl("e",ei)} style={dBtn(cd==="e"+ei)}>{cd==="e"+ei?"Delete?":"X"}</button>
      </div>
      {ex.targetSets&&<div style={{color:t.tf,fontSize:13,marginBottom:8,paddingLeft:w?30:28}}>{"Target: "+ex.targetSets+"x"+ex.targetReps+(ex.rpe?" @ RPE "+ex.rpe:"")}</div>}
      {ex.sets&&ex.sets.length>0&&<div style={{paddingLeft:w?30:28}}>
        <div style={{display:"grid",gridTemplateColumns:"30px 1fr 1fr 24px",gap:6,marginBottom:6,fontSize:13,color:t.tf}}><span>#</span><span>{(ex.sets[0]?.mode==="time")?"Time":"Reps"}</span><span>Weight</span><span></span></div>
        {ex.sets.map((z,si)=><div key={si} style={{display:"grid",gridTemplateColumns:"30px 1fr 1fr 24px",gap:6,marginBottom:5,alignItems:"center"}}>
          <span style={{color:t.tf,fontSize:14}}>{si+1}</span>
          <div style={{position:"relative"}}>
            <input value={(z.mode==="time"?z.time:z.reps)||""} onChange={e=>{if(z.mode==="time")uS(ei,si,"time",e.target.value);else uS(ei,si,"reps",e.target.value);}} placeholder={z.mode==="time"?"sec":"-"} style={{...s.i,padding:"6px 10px",paddingRight:36}}/>
            <button onClick={()=>uS(ei,si,"mode",z.mode==="time"?"reps":"time")} style={{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",background:t.gl,border:"1px solid "+t.bm,borderRadius:4,color:z.mode==="time"?t.yellow:t.tm,cursor:"pointer",fontSize:9,padding:"2px 4px",fontFamily:"'Overpass Mono',monospace"}}>{z.mode==="time"?"T":"R"}</button>
          </div>
          <input value={z.weight||""} onChange={e=>uS(ei,si,"weight",e.target.value)} placeholder="lbs" style={{...s.i,padding:"6px 10px"}}/>
          <button onClick={()=>uE(ei,{sets:ex.sets.filter((_,j)=>j!==si)})} style={{background:"none",border:"1px solid "+t.dB,borderRadius:4,color:t.dc,cursor:"pointer",fontSize:13,padding:"3px 7px"}}>X</button>
        </div>)}
      </div>}
      <div style={{paddingLeft:w?30:28,marginTop:8}}><button onClick={()=>uE(ei,{sets:[...(ex.sets||[]),{reps:"",weight:"",mode:"reps"}]})} style={{...s.bg,padding:"5px 14px"}}>+ set</button></div>
      <div style={{paddingLeft:w?30:28,marginTop:8}}><AutoTA value={ex.notes||""} onChange={e=>uE(ei,{notes:e.target.value})} placeholder="Notes..." style={{...s.i,padding:"6px 10px"}}/></div>
    </div>)}

    {cardio.map((c,ci)=><div key={ci} style={{background:t.cBg,borderRadius:12,padding:w?12:10,marginBottom:10,border:"1px solid "+t.cB}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
          <input type="checkbox" checked={c.completed||false} onChange={e=>save({cardio:cardio.map((x,j)=>j===ci?{...x,completed:e.target.checked}:x)})} style={{accentColor:t.green,width:w?20:18,height:w?20:18,cursor:"pointer"}}/>
          <span style={{color:t.green,fontSize:w?15:14,fontWeight:600}}>{c.type}</span>{c.duration&&<span style={{color:t.tm,fontSize:13}}>{c.duration+"min"}</span>}
        </div>
        <button onClick={()=>dl("c",ci)} style={dBtn(cd==="c"+ci)}>{cd==="c"+ci?"Delete?":"X"}</button>
      </div>
      <AutoTA value={c.notes||""} onChange={e=>save({cardio:cardio.map((x,j)=>j===ci?{...x,notes:e.target.value}:x)})} placeholder="Cardio notes..." style={{...s.i,padding:"6px 10px",marginTop:8}}/>
    </div>)}

    <div style={{display:"flex",gap:8,marginTop:14}}>
      <button onClick={()=>sSa(sa==="e"?null:"e")} style={s.bg}>+ Exercise</button>
      <button onClick={()=>sSa(sa==="c"?null:"c")} style={s.bg}>+ Cardio</button>
    </div>
    {sa==="e"&&<div style={{background:t.gl,borderRadius:10,padding:12,marginTop:10,display:"flex",gap:8,flexWrap:"wrap",alignItems:"end",border:"1px solid "+t.bm}}>
      <div style={{flex:"2 1 140px"}}><label style={s.lb}>Exercise</label><input value={fm.n||""} onChange={e=>sFm({...fm,n:e.target.value})} onKeyDown={e=>kd(e,aE)} autoFocus style={s.i}/></div>
      <div style={{flex:"1 1 60px"}}><label style={s.lb}>Sets</label><input value={fm.s||""} onChange={e=>sFm({...fm,s:e.target.value})} onKeyDown={e=>kd(e,aE)} style={s.i}/></div>
      <div style={{flex:"1 1 60px"}}><label style={s.lb}>Reps</label><input value={fm.r||""} onChange={e=>sFm({...fm,r:e.target.value})} onKeyDown={e=>kd(e,aE)} style={s.i}/></div>
      <div style={{flex:"1 1 50px"}}><label style={s.lb}>RPE</label><input value={fm.p||""} onChange={e=>sFm({...fm,p:e.target.value})} onKeyDown={e=>kd(e,aE)} style={s.i}/></div>
      <button onClick={aE} style={{...s.b,background:t.accent,color:t.at}}>Add</button></div>}
    {sa==="c"&&<div style={{background:t.gl,borderRadius:10,padding:12,marginTop:10,display:"flex",gap:8,flexWrap:"wrap",alignItems:"end",border:"1px solid "+t.bm}}>
      <div style={{flex:"2 1 120px"}}><label style={s.lb}>Type</label><input value={fm.ct||""} onChange={e=>sFm({...fm,ct:e.target.value})} onKeyDown={e=>kd(e,aC)} autoFocus style={s.i}/></div>
      <div style={{flex:"1 1 60px"}}><label style={s.lb}>Min</label><input value={fm.cd||""} onChange={e=>sFm({...fm,cd:e.target.value})} onKeyDown={e=>kd(e,aC)} style={s.i}/></div>
      <div style={{flex:"1 1 70px"}}><label style={s.lb}>Dist</label><input value={fm.ci||""} onChange={e=>sFm({...fm,ci:e.target.value})} onKeyDown={e=>kd(e,aC)} style={s.i}/></div>
      <button onClick={aC} style={{...s.b,background:t.green,color:"#000"}}>Add</button></div>}
    <AutoTA placeholder="Day notes..." value={notes} onChange={e=>save({notes:e.target.value})} style={{...s.i,width:"100%",marginTop:12,boxSizing:"border-box"}}/>
  </div>);
}

// ─── MEAL DAY ───
function MDay({planned:rawP,logged,onLogChange,s,l,t}){
  const w=isW(l); const planned=Array.isArray(rawP)?rawP:[];
  const meals=planned.map((p,i)=>{const lg=logged?.[i]||{};return{...p,...lg,planned:p.planned};});
  const up=(i,f,v)=>{const m=[...meals.map(x=>({actual:x.actual||"",confirmed:x.confirmed||false,notes:x.notes||""}))];m[i]={...m[i],[f]:v};onLogChange(m);};
  return(<div style={s.c}>
    <div style={{color:t.accent,fontSize:w?18:16,fontWeight:800,marginBottom:12}}>{planned[0]?.day||""}</div>
    {meals.map((m,i)=><div key={i} style={{background:m.confirmed?t.cBg:t.exBg,borderRadius:12,padding:w?14:10,marginBottom:10,border:"1px solid "+(m.confirmed?t.exBd:t.exB),boxShadow:m.confirmed?"inset 0 0 20px "+t.gg:"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{color:t.tm,fontSize:w?14:13,fontWeight:700}}>{m.slot}</span>
        <button onClick={()=>up(i,"confirmed",!m.confirmed)} style={{...s.b,padding:"5px 14px",fontSize:12,background:m.confirmed?t.green:t.gl,color:m.confirmed?"#000":t.tm,border:m.confirmed?"none":"1px solid "+t.bm}}>{m.confirmed?"Ate":"Confirm"}</button>
      </div>
      {m.planned&&<div style={{color:t.tm,fontSize:w?14:13,marginBottom:8,padding:"8px 12px",background:t.mpBg,borderRadius:8}}><span style={{color:t.tf,fontSize:12}}>PLAN: </span>{m.planned}</div>}
      <AutoTA value={m.actual||""} onChange={e=>up(i,"actual",e.target.value)} placeholder={m.planned?"What I actually ate (blank = followed plan)":"What I ate..."} style={s.i}/>
      <AutoTA value={m.notes||""} onChange={e=>up(i,"notes",e.target.value)} placeholder="Meal notes..." style={{...s.i,marginTop:6}}/>
    </div>)}
  </div>);
}

// ─── BODY ───
function Body({data,onChange,s,l,t}){
  const w=isW(l);
  return(<div style={s.c}>
    <div style={{color:t.accent,fontSize:w?18:16,fontWeight:800,marginBottom:16}}>Body Measurements</div>
    <div style={{display:"grid",gridTemplateColumns:w?"1fr 1fr 1fr":"1fr 1fr",gap:w?12:8}}>
      {[["weight","Weight (lbs)"],["bodyFat","Body Fat %"],["waist","Waist (in)"],["chest","Chest (in)"],["arms","Arms (in)"]].map(([k,lb])=>
        <div key={k}><label style={s.lb}>{lb}</label><input value={data[k]||""} onChange={e=>onChange({...data,[k]:e.target.value})} style={s.i}/></div>)}
      <div><label style={s.lb}>Date</label><input type="date" value={data.date||""} onChange={e=>onChange({...data,date:e.target.value})} style={{...s.i,colorScheme:t.cs}}/></div>
    </div>
  </div>);
}

// ════════════════ MAIN APP ════════════════
export default function App() {
  const l=useLayout(),w=isW(l);
  const [mode,setMode]=useState(()=>{try{return localStorage.getItem("shc-theme")||"dark"}catch{return"dark"}});
  const t=T[mode],s=sty(l,t);
  const toggleMode=()=>{const m=mode==="dark"?"light":"dark";setMode(m);try{localStorage.setItem("shc-theme",m)}catch{}};

  const [authed,setAuthed]=useState(false);
  const [authLoading,setAuthLoading]=useState(true);
  const [pinReady,setPinReady]=useState(null);
  useEffect(()=>{auth.init().then(sess=>{setAuthed(!!sess);setAuthLoading(false);});},[]);
  useEffect(()=>{if(authed)pin.hasPin().then(has=>setPinReady(has));},[authed]);

  if(authLoading) return <div style={{background:t.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:t.accent,fontFamily:"monospace",transition:"all .3s"}}>Loading...</div>;
  if(!authed) return <LoginScreen onLogin={()=>setAuthed(true)} t={t}/>;
  if(pinReady===null) return <div style={{background:t.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:t.accent,fontFamily:"monospace"}}>Loading...</div>;
  if(pinReady===false) return <PinSetup onComplete={()=>setPinReady(true)} t={t}/>;

  return <Dashboard l={l} w={w} t={t} s={s} mode={mode} toggleMode={toggleMode} onLogout={()=>{auth.logout();setAuthed(false);}}/>;
}

function Dashboard({l,w,t,s,mode,toggleMode,onLogout}) {
  const [wk,setWk]=useState(getWeekId());
  const [plan,setPlan]=useState(null);
  const [woLogs,setWoLogs]=useState({});
  const [mlLogs,setMlLogs]=useState({});
  const [meas,setMeas]=useState({weight:"",bodyFat:"",waist:"",chest:"",arms:"",date:""});
  const [tab,setTab]=useState("w");
  const [day,setDay]=useState(todayIdx());
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [refreshing,setRefreshing]=useState(false);
  const [error,setError]=useState(null);
  const [dirty,setDirty]=useState(false);
  const [saveMsg,setSaveMsg]=useState("");
  const [showPin,setShowPin]=useState(false);
  const [streakData,setStreakData]=useState({current_streak:0,longest_streak:0,last_freeze_date:null});
  const [freezeMsg,setFreezeMsg]=useState("");

  const loadStreak=useCallback(async()=>{
    try{const s=await db.getStreak();if(s)setStreakData(s);}catch{}
  },[]);

  const load=useCallback(async(showL=true)=>{
    if(showL)setLoading(true);
    try{
      const[p,wl,ml,m]=await Promise.all([db.getPlan(wk),db.getWorkoutLogs(wk),db.getMealLogs(wk),db.getMeasurements(wk)]);
      setPlan(p);
      const wMap={};wl.forEach(x=>wMap[x.day_index]={exercises:x.exercises||[],cardio:x.cardio||[],usedMicro:x.used_micro||false,completed:x.completed||false,notes:x.notes||""});setWoLogs(wMap);
      const mMap={};ml.forEach(x=>mMap[x.day_index]=x);setMlLogs(mMap);
      if(m)setMeas({weight:m.weight||"",bodyFat:m.body_fat||"",waist:m.waist||"",chest:m.chest||"",arms:m.arms||"",date:m.measured_at||""});
      else setMeas({weight:"",bodyFat:"",waist:"",chest:"",arms:"",date:""});
      setError(null);
    }catch(e){setError(e.message);}
    setLoading(false);
  },[wk]);

  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(!loading)loadStreak();},[loading,loadStreak]);
  const refresh=async()=>{setRefreshing(true);await load(false);await loadStreak();setRefreshing(false);};

  const updateWoLog=(di,d)=>{setWoLogs(p=>({...p,[di]:{...(p[di]||{}),...d}}));setDirty(true);};
  const updateMlLog=(di,meals)=>{setMlLogs(p=>({...p,[di]:{...(p[di]||{}),meals}}));setDirty(true);};
  const updateMeas=(m)=>{setMeas(m);setDirty(true);};

  const doSave=async()=>{
    setSaving(true);setSaveMsg("");setShowPin(false);
    try{
      const pr=[];
      Object.entries(woLogs).forEach(([di,log])=>{pr.push(db.upsertWorkoutLog(wk,parseInt(di),log));});
      Object.entries(mlLogs).forEach(([di,log])=>{if(log.meals)pr.push(db.upsertMealLog(wk,parseInt(di),log.meals));});
      if(meas.weight||meas.bodyFat||meas.waist||meas.chest||meas.arms)pr.push(db.upsertMeasurements(wk,meas));
      await Promise.all(pr);
      setDirty(false);setSaveMsg("Saved");setTimeout(()=>setSaveMsg(""),3000);
      // Update streak if any activity was completed today
      const todayLog=woLogs[todayIdx()];
      if(todayLog){
        const ex=Array.isArray(todayLog.exercises)?todayLog.exercises:[];
        const cd=Array.isArray(todayLog.cardio)?todayLog.cardio:[];
        const anyDone=todayLog.usedMicro||todayLog.completed||(ex.length>0&&ex.some(e=>e.completed))||(cd.length>0&&cd.some(c=>c.completed));
        if(anyDone) await db.updateStreak(localDate());
      }
      await loadStreak();
    }catch(e){setSaveMsg("Failed!");}
    setSaving(false);
  };

  const handleSave=async()=>{
    const hasP=await pin.hasPin();
    if(hasP){setShowPin(true);}else{doSave();}
  };

  const wp=Array.isArray(plan?.workout_plan)?plan.workout_plan:[];
  const mp=Array.isArray(plan?.meal_plan)?plan.meal_plan:[];
  const weekDone=DAYS.reduce((a,_,i)=>{const lg=woLogs[i]||{};const ex=Array.isArray(lg.exercises)?lg.exercises:[];const cd=Array.isArray(lg.cardio)?lg.cardio:[];return a+((lg.usedMicro||lg.completed||(ex.length>0&&ex.some(e=>e.completed))||(cd.length>0&&cd.some(c=>c.completed)))?1:0);},0);
  const mealsDone=DAYS.reduce((a,_,i)=>{const lg=mlLogs[i];if(!lg?.meals)return a;return a+lg.meals.filter(m=>m.confirmed).length;},0);

  if(loading) return <div style={{background:t.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:t.accent,fontFamily:"monospace"}}>Loading...</div>;

  const noPlan=!plan;

  return(
    <div style={{background:t.bg,minHeight:"100vh",color:t.text,fontFamily:"'Overpass Mono','SF Mono',monospace",padding:l==="D"?"24px 40px":w?"20px 28px":"14px",maxWidth:l==="D"?960:w?720:600,margin:"0 auto",transition:"background .4s,color .3s"}}>
      <style>{"@keyframes sp{from{transform:rotate(0)}to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=Overpass+Mono:wght@400;700&display=swap');"}</style>

      {showPin&&<PinModal onVerify={doSave} onCancel={()=>setShowPin(false)} t={t}/>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:w?24:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Icon size={w?32:28} accent={t.accent} bg={t.bg}/>
          <h1 style={{color:t.accent,fontSize:w?20:17,fontWeight:900,margin:0,letterSpacing:1}}>Shreyash Health Console</h1>
          <button onClick={toggleMode} style={{background:t.gl,border:"1px solid "+t.bm,borderRadius:10,padding:"4px 10px",cursor:"pointer",fontSize:16,lineHeight:1,backdropFilter:"blur(10px)"}}>{t.tog}</button>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {saveMsg&&<span style={{color:t.green,fontSize:12}}>{saveMsg}</span>}
          {dirty&&<button onClick={handleSave} disabled={saving} style={{background:saving?t.bm:t.accent,color:saving?t.tm:t.at,border:"none",borderRadius:8,padding:"6px 16px",cursor:saving?"wait":"pointer",fontSize:13,fontWeight:700,fontFamily:"'Overpass Mono',monospace"}}>{saving?"Saving...":"Save"}</button>}
          <button onClick={refresh} disabled={refreshing} style={{background:t.gl,border:"1px solid "+t.bm,borderRadius:8,padding:"5px 12px",color:refreshing?t.accent:t.tm,cursor:"pointer",fontSize:14,backdropFilter:"blur(10px)",animation:refreshing?"sp .8s linear infinite":"none"}}>&#x21bb;</button>
          <button onClick={onLogout} style={{background:t.gl,border:"1px solid "+t.bm,borderRadius:8,padding:"5px 10px",color:t.tf,cursor:"pointer",fontSize:11,fontFamily:"'Overpass Mono',monospace",backdropFilter:"blur(10px)"}}>&#x23FB;</button>
        </div>
      </div>

      <div style={{color:t.tf,fontSize:13,marginBottom:20,letterSpacing:1}}>{"Week of "+wk}</div>

      {error&&<div style={{color:t.red,fontSize:13,marginBottom:12,padding:10,background:t.red+"11",borderRadius:10,border:"1px solid "+t.red+"33"}}>{"Error: "+error}</div>}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:w?12:6,marginBottom:w?20:12}}>
        {[{v:weekDone,m:"/7",la:"WORKOUTS",c:t.accent,g:t.ag},{v:mealsDone,m:"/21",la:"MEALS",c:t.green,g:t.gg}].map((k,i)=>(
          <div key={i} style={{...s.c,textAlign:"center",marginBottom:0,background:"linear-gradient(135deg,"+k.g+","+t.card+")"}}>
            <div style={{color:k.c,fontSize:l==="D"?32:w?28:22,fontWeight:900}}>{k.v}<span style={{fontSize:w?14:11,color:t.ks}}>{k.m}</span></div>
            <div style={{color:t.kl,fontSize:12,fontWeight:700,letterSpacing:2,marginTop:2}}>{k.la}</div>
          </div>
        ))}
        <div style={{...s.c,textAlign:"center",marginBottom:0,position:"relative"}}>
          <div style={{color:streakData.current_streak>=14?t.accent:streakData.current_streak>=7?t.yellow:t.red,fontSize:l==="D"?32:w?28:22,fontWeight:900}}>{"\uD83D\uDD25"}{streakData.current_streak}</div>
          <div style={{color:t.kl,fontSize:12,fontWeight:700,letterSpacing:2,marginTop:2}}>STREAK</div>
          {streakData.longest_streak>0&&<div style={{color:t.tf,fontSize:10,marginTop:2}}>{"Best: "+streakData.longest_streak}</div>}
          <button onClick={async()=>{setFreezeMsg("");const r=await db.freezeStreak(localDate());if(r.error){setFreezeMsg(r.error);setTimeout(()=>setFreezeMsg(""),3000);}else{setFreezeMsg("Frozen!");await loadStreak();setTimeout(()=>setFreezeMsg(""),3000);}}} style={{position:"absolute",top:6,right:6,background:t.gl,border:"1px solid "+t.bm,borderRadius:6,padding:"2px 6px",cursor:"pointer",fontSize:12}} title="Freeze streak for today">{"\u2744\uFE0F"}</button>
          {freezeMsg&&<div style={{color:freezeMsg.includes("!")?t.red:t.accent,fontSize:10,marginTop:4}}>{freezeMsg}</div>}
        </div>
      </div>

      {noPlan&&<div style={{...s.c,border:"1px solid "+t.miB,background:t.miBg,textAlign:"center",padding:24}}>
        <div style={{color:t.yellow,fontSize:15,fontWeight:700,marginBottom:8}}>No plan for this week yet</div>
        <div style={{color:t.tm,fontSize:13}}>Ask Ishaan to generate your plan.</div>
      </div>}

      {!noPlan&&<>
        <div style={{display:"flex",gap:6,borderBottom:"1px solid "+t.bf,paddingBottom:10,marginBottom:16}}>
          {[["w","Workouts"],["m","Meals"],["b","Body"]].map(([id,lb])=>
            <button key={id} onClick={()=>setTab(id)} style={{padding:l==="D"?"10px 24px":w?"10px 18px":"8px 14px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:700,fontSize:w?14:13,fontFamily:"'Overpass Mono',monospace",background:tab===id?t.accent:"transparent",color:tab===id?t.at:t.ti,boxShadow:tab===id?"0 0 20px "+t.ag:"none",transition:"all .2s"}}>{lb}</button>)}
        </div>

        {tab!=="b"&&<div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
          {SHORT.map((d,i)=>{const isT=i===todayIdx()&&wk===getWeekId();return<button key={d} onClick={()=>setDay(i)} style={{padding:w?"8px 14px":"6px 10px",borderRadius:10,border:isT?"1.5px solid "+t.accent:"1px solid "+t.bm,cursor:"pointer",fontSize:w?13:12,fontFamily:"'Overpass Mono',monospace",background:day===i?t.ds:"transparent",color:day===i?t.accent:t.di,fontWeight:day===i?700:400,boxShadow:isT?"0 0 12px "+t.ag:"none",transition:"all .2s"}}>
            {d+" "}<span style={{fontSize:10,opacity:.5}}>{dayDate(wk,i)}</span>
          </button>;})}
          <button onClick={()=>setDay(-1)} style={{padding:w?"8px 14px":"6px 10px",borderRadius:10,border:"1px solid "+t.bm,cursor:"pointer",fontSize:w?13:12,fontFamily:"'Overpass Mono',monospace",background:day===-1?t.ds:"transparent",color:day===-1?t.accent:t.di,fontWeight:day===-1?700:400}}>ALL</button>
        </div>}

        {tab==="w"&&(day===-1
          ?wp.map((p,i)=><WDay key={i} plan={{...p,day:DAYS[i]}} log={woLogs[i]||{}} onLogChange={d=>updateWoLog(i,d)} s={s} l={l} t={t}/>)
          :wp[day]?<WDay plan={{...wp[day],day:DAYS[day]}} log={woLogs[day]||{}} onLogChange={d=>updateWoLog(day,d)} s={s} l={l} t={t}/>:<div style={{color:t.tf,padding:20}}>No plan for this day</div>
        )}
        {tab==="m"&&(day===-1
          ?mp.map((p,i)=><MDay key={i} planned={p.meals||[]} logged={mlLogs[i]?.meals} onLogChange={m=>updateMlLog(i,m)} s={s} l={l} t={t}/>)
          :mp[day]?<MDay planned={mp[day].meals||[]} logged={mlLogs[day]?.meals} onLogChange={m=>updateMlLog(day,m)} s={s} l={l} t={t}/>:<div style={{color:t.tf,padding:20}}>No meal plan for this day</div>
        )}
        {tab==="b"&&<Body data={meas} onChange={updateMeas} s={s} l={l} t={t}/>}
      </>}

      <div style={{display:"flex",justifyContent:"center",gap:w?16:10,marginTop:w?28:20,paddingTop:14,borderTop:"1px solid "+t.bf}}>
        <button onClick={()=>{const d=new Date(wk+"T12:00:00");d.setDate(d.getDate()-7);setWk(getWeekId(d));}} style={s.bg}>Prev</button>
        <button onClick={()=>{setWk(getWeekId());setDay(todayIdx());}} style={{...s.bg,color:t.accent,borderColor:t.accent,boxShadow:"0 0 12px "+t.ag}}>This Week</button>
        <button onClick={()=>{const d=new Date(wk+"T12:00:00");d.setDate(d.getDate()+7);setWk(getWeekId(d));}} style={s.bg}>Next</button>
      </div>
    </div>
  );
}
