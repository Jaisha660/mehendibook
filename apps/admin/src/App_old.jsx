import { useState, useEffect } from "react";
import { sget, sset, sdel, sgetCollection, sgetOne, ssetOne, supdateOne, sdelOne, authLogIn, authLogOut, onAuthChange } from "./firebase";

const G="#C9A84C",G2="#F0C96B",BG="#0F0F0F",CARD="#1A1A1A",CARD2="#222",BORDER="#2A2A2A",TXT="#F5F5F5",MUTED="#888",GREEN="#4CAF50",RED="#ef5350",BLUE="#4A90D9";
// Only this exact email is treated as Admin — you created this account yourself in Firebase Console.
const ADMIN_EMAIL="jaaiishah00123@gmail.com";
const COVERAGE=["One Hand","Both Hands","Half Arm","Full Arm"];
const STYLES=["Arabic","Floral","Rajasthani","Geometric","Minimal","Glitter","Fusion","Bridal"];
const OCCASIONS=["Wedding","Eid","Karwa Chauth","Teej","Birthday","Party","Other"];
const TIMES=["10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM"];
const TRACK=["Booking Confirmed","Artist Assigned","On the Way","Arrived","In Progress","Completed"];
const DEF_PRICE={coverage:{"One Hand":300,"Both Hands":500,"Half Arm":800,"Full Arm":1200},designAddons:{"Arabic":0,"Floral":100,"Rajasthani":200,"Geometric":0,"Minimal":0,"Glitter":150,"Fusion":100,"Bridal":500},bridalPackage:500};

function haversine(a,b,c,d){const R=6371,dL=(c-a)*Math.PI/180,dO=(d-b)*Math.PI/180,x=Math.sin(dL/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dO/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function fmtD(km){return km<1?`${Math.round(km*1000)} m away`:`${km.toFixed(1)} km away`;}
function getDates(blocked=[]){const dy=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],mn=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],t=new Date();return Array.from({length:14},(_,i)=>{const d=new Date(t);d.setDate(t.getDate()+i);const full=d.toDateString();return{label:i===0?"Today":dy[d.getDay()],date:`${d.getDate()}`,month:mn[d.getMonth()],full,blocked:blocked.includes(full)};});}
function ini(n){return n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();}
function gid(){return Math.random().toString(36).slice(2,9);}
function calcP(a,s,c,o){const p=a.pricing||DEF_PRICE;return(p.coverage[c]||0)+(p.designAddons[s]||0)+(o==="Wedding"?(p.bridalPackage||0):0);}
function ago(ts){const m=Math.floor((Date.now()-new Date(ts))/60000);if(m<1)return"just now";if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`;}

// ── UI Components ──────────────────────────────────────────
function Av({name,size=48}){return <div style={{width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${G},${G2})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontWeight:700,fontSize:size*.3,flexShrink:0}}>{ini(name)}</div>;}

function Btn({children,onClick,variant="primary",disabled,full,small}){
  const map={primary:{background:`linear-gradient(135deg,${G},${G2})`,color:"#000",border:"none",fontWeight:600},secondary:{background:"transparent",color:G,border:`1px solid ${G}`,fontWeight:500},ghost:{background:CARD2,color:TXT,border:`1px solid ${BORDER}`},danger:{background:"transparent",color:RED,border:`1px solid ${RED}`,fontWeight:500},success:{background:"transparent",color:GREEN,border:`1px solid ${GREEN}`,fontWeight:500},blue:{background:BLUE,color:"#fff",border:"none",fontWeight:600}};
  const s=map[variant]||map.primary;
  return <button onClick={onClick} disabled={disabled} style={{...s,padding:small?"7px 14px":"12px 22px",borderRadius:12,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,fontSize:small?12:14,width:full?"100%":undefined,boxSizing:"border-box"}}>{children}</button>;
}

function Inp({label,type="text",placeholder,value,onChange,error}){
  return <div style={{marginBottom:"0.9rem"}}>
    {label&&<label style={{display:"block",fontSize:12,color:MUTED,marginBottom:5}}>{label}</label>}
    <input type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",boxSizing:"border-box",background:CARD2,border:`1px solid ${error?RED:BORDER}`,borderRadius:12,padding:"12px 14px",color:TXT,fontSize:14,outline:"none"}}/>
    {error&&<p style={{margin:"4px 0 0",fontSize:11,color:RED}}>{error}</p>}
  </div>;
}

function Bdg({label,color}){
  const m={pending:[G+"22",G],approved:[GREEN+"22",GREEN],rejected:[RED+"22",RED],online:[GREEN+"22",GREEN],offline:[BORDER,MUTED],suspended:[RED+"22",RED],completed:[BLUE+"22",BLUE]};
  const [bg,fg]=m[color]||[CARD2,MUTED];
  return <span style={{fontSize:11,fontWeight:500,padding:"3px 10px",borderRadius:99,background:bg,color:fg}}>{label}</span>;
}

function Stars({rating,interactive,onRate}){
  return <span>{[1,2,3,4,5].map(i=><span key={i} onClick={()=>interactive&&onRate&&onRate(i)} style={{color:i<=Math.round(rating)?G:"#333",fontSize:interactive?28:13,cursor:interactive?"pointer":"default",marginRight:interactive?4:0}}>★</span>)}</span>;
}

function Pill({children,active,onClick}){return <button onClick={onClick} style={{padding:"6px 14px",borderRadius:99,border:`1px solid ${active?G:BORDER}`,background:active?G+"22":"transparent",color:active?G:MUTED,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>{children}</button>;}

function AuthWrap({icon,title,subtitle,children}){
  return <div style={{maxWidth:400,margin:"0 auto",padding:"2rem 1rem"}}>
    <div style={{textAlign:"center",marginBottom:"1.75rem"}}>
      <div style={{width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${G},${G2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 1rem"}}>{icon}</div>
      <h2 style={{margin:"0 0 4px",fontSize:20,fontWeight:700,color:TXT}}>{title}</h2>
      <p style={{margin:0,fontSize:13,color:MUTED}}>{subtitle}</p>
    </div>
    {children}
  </div>;
}

function Tabs({tabs,active,onChange}){
  return <div style={{display:"flex",gap:2,borderBottom:`1px solid ${BORDER}`,marginBottom:"1.25rem",overflowX:"auto"}}>
    {tabs.map(t=><button key={t.id} onClick={()=>onChange(t.id)} style={{padding:"8px 14px",background:"none",border:"none",borderBottom:active===t.id?`2px solid ${G}`:"2px solid transparent",color:active===t.id?G:MUTED,cursor:"pointer",fontSize:13,fontWeight:active===t.id?500:400,marginBottom:-1,whiteSpace:"nowrap"}}>{t.label}{t.count!=null?` (${t.count})`:""}</button>)}
  </div>;
}

function PriceEditor({pricing,onChange}){
  const p=pricing||DEF_PRICE;
  return <div>
    <p style={{fontWeight:600,fontSize:14,margin:"0 0 8px"}}>Coverage Prices (₹)</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:"1rem"}}>
      {COVERAGE.map(c=><div key={c}><label style={{display:"block",fontSize:11,color:MUTED,marginBottom:3}}>{c}</label><input type="number" value={p.coverage[c]||0} onChange={e=>onChange({...p,coverage:{...p.coverage,[c]:Number(e.target.value)}})} style={{width:"100%",boxSizing:"border-box",background:CARD2,border:`1px solid ${BORDER}`,borderRadius:10,padding:"8px 10px",color:TXT,fontSize:13,outline:"none"}}/></div>)}
    </div>
    <p style={{fontWeight:600,fontSize:14,margin:"0 0 8px"}}>Design Add-on Prices (₹)</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:"1rem"}}>
      {STYLES.map(s=><div key={s}><label style={{display:"block",fontSize:11,color:MUTED,marginBottom:3}}>{s}</label><input type="number" value={p.designAddons[s]||0} onChange={e=>onChange({...p,designAddons:{...p.designAddons,[s]:Number(e.target.value)}})} style={{width:"100%",boxSizing:"border-box",background:CARD2,border:`1px solid ${BORDER}`,borderRadius:10,padding:"8px 10px",color:TXT,fontSize:13,outline:"none"}}/></div>)}
    </div>
    <p style={{fontWeight:600,fontSize:14,margin:"0 0 8px"}}>Bridal Package Add-on (₹)</p>
    <input type="number" value={p.bridalPackage||0} onChange={e=>onChange({...p,bridalPackage:Number(e.target.value)})} style={{width:"100%",boxSizing:"border-box",background:CARD2,border:`1px solid ${BORDER}`,borderRadius:10,padding:"8px 10px",color:TXT,fontSize:13,outline:"none",marginBottom:"1rem"}}/>
  </div>;
}

function EditProfile({user,onSave,onCancel}){
  const [f,setF]=useState({name:user.name||"",phone:user.phone||"",location:user.location||"",tag:user.tag||"",bio:user.bio||"",exp:user.exp||"",instagram:user.instagram||""});
  const [styles,setStyles]=useState(user.styles||[]);
  const [pricing,setPricing]=useState(user.pricing||DEF_PRICE);
  const [saving,setSaving]=useState(false);
  const sf=(k,v)=>setF(x=>({...x,[k]:v}));
  const save=async()=>{if(!f.name||!f.location||!f.exp||!styles.length){alert("Fill required fields.");return;}setSaving(true);await onSave({...f,styles,pricing});setSaving(false);};
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem"}}>
      <p style={{margin:0,fontWeight:600,fontSize:15}}>Edit Profile</p>
      <button onClick={onCancel} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:13}}>Cancel</button>
    </div>
    <Inp label="Full name *" placeholder="Priya Sharma" value={f.name} onChange={v=>sf("name",v)}/>
    <Inp label="Phone" type="tel" placeholder="9876543210" value={f.phone} onChange={v=>sf("phone",v)}/>
    <Inp label="Location *" placeholder="Lajpat Nagar, Delhi" value={f.location} onChange={v=>sf("location",v)}/>
    <Inp label="Tagline" placeholder="Bridal Specialist" value={f.tag} onChange={v=>sf("tag",v)}/>
    <Inp label="Bio" placeholder="Tell customers about yourself…" value={f.bio} onChange={v=>sf("bio",v)}/>
    <Inp label="Experience *" placeholder="5 years" value={f.exp} onChange={v=>sf("exp",v)}/>
    <Inp label="Instagram URL" placeholder="https://instagram.com/yourhandle" value={f.instagram} onChange={v=>sf("instagram",v)}/>
    <p style={{fontSize:12,color:MUTED,margin:"0 0 8px"}}>Design styles *</p>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:"1.5rem"}}>
      {STYLES.map(s=><button key={s} onClick={()=>setStyles(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])} style={{padding:"7px 14px",borderRadius:99,border:`1px solid ${styles.includes(s)?G:BORDER}`,background:styles.includes(s)?G+"22":CARD2,color:styles.includes(s)?G:MUTED,fontSize:12,cursor:"pointer"}}>{s}</button>)}
    </div>
    <PriceEditor pricing={pricing} onChange={setPricing}/>
    <Btn full disabled={saving} onClick={save}>{saving?"Saving…":"Save Changes →"}</Btn>
  </div>;
}

function ArtistModal({artist,onClose,onApprove,onReject}){
  const p=artist.pricing||DEF_PRICE;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:999}}>
      <div style={{background:CARD,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{padding:"1rem",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${BORDER}`}}>
          <p style={{margin:0,fontWeight:700,fontSize:16}}>Artist Profile</p>
          <button onClick={onClose} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:22}}>×</button>
        </div>
        <div style={{padding:"1rem"}}>
          <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:"1rem"}}>
            <Av name={artist.name} size={60}/>
            <div>
              <p style={{margin:0,fontWeight:700,fontSize:17}}>{artist.name}</p>
              <p style={{margin:"3px 0",fontSize:12,color:G}}>{artist.tag||"Mehendi Artist"}</p>
              <p style={{margin:0,fontSize:12,color:MUTED}}>{artist.email} · {artist.phone}</p>
            </div>
          </div>
          {artist.bio&&<p style={{fontSize:13,color:MUTED,lineHeight:1.6,marginBottom:"1rem",background:CARD2,borderRadius:10,padding:"10px 12px"}}>{artist.bio}</p>}
          {[["Location",`📍 ${artist.location}`],["Experience",artist.exp]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderTop:`1px solid ${BORDER}`,fontSize:13}}>
              <span style={{color:MUTED}}>{k}</span><span style={{color:TXT,fontWeight:500}}>{v}</span>
            </div>
          ))}
          {artist.instagram&&<div style={{padding:"7px 0",borderTop:`1px solid ${BORDER}`}}>
            <a href={artist.instagram} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:G,textDecoration:"none"}}>📸 {artist.instagram.replace("https://","")}</a>
          </div>}
          <p style={{fontWeight:600,fontSize:14,margin:"1rem 0 8px"}}>Design Styles</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:"1rem"}}>
            {(artist.styles||[]).map(s=><span key={s} style={{fontSize:12,padding:"4px 12px",borderRadius:99,background:G+"15",color:G,border:`1px solid ${G}33`}}>{s}</span>)}
          </div>
          <p style={{fontWeight:600,fontSize:14,margin:"0 0 8px"}}>Coverage Prices</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:"1rem"}}>
            {COVERAGE.map(c=><div key={c} style={{background:CARD2,borderRadius:10,padding:"8px 12px",border:`1px solid ${BORDER}`}}>
              <p style={{margin:0,fontSize:12,color:MUTED}}>{c}</p>
              <p style={{margin:"2px 0 0",fontSize:15,fontWeight:700,color:G}}>₹{p.coverage[c]||0}</p>
            </div>)}
          </div>
          <p style={{fontWeight:600,fontSize:14,margin:"0 0 8px"}}>Design Add-on Prices</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:"1rem"}}>
            {STYLES.map(s=><div key={s} style={{background:CARD2,borderRadius:10,padding:"8px 12px",border:`1px solid ${BORDER}`}}>
              <p style={{margin:0,fontSize:12,color:MUTED}}>{s}</p>
              <p style={{margin:"2px 0 0",fontSize:14,fontWeight:600,color:(p.designAddons[s]||0)>0?G:MUTED}}>{(p.designAddons[s]||0)>0?`+₹${p.designAddons[s]}`:"Included"}</p>
            </div>)}
          </div>
          {(p.bridalPackage||0)>0&&<p style={{fontSize:13,color:MUTED,marginBottom:"1rem"}}>💍 Bridal add-on: <strong style={{color:G}}>+₹{p.bridalPackage}</strong></p>}
          {(onApprove||onReject)&&(
            <div style={{display:"flex",gap:10,marginTop:"0.5rem"}}>
              {onApprove&&<Btn full variant="success" onClick={onApprove}>✓ Approve</Btn>}
              {onReject&&<Btn full variant="danger" onClick={onReject}>✕ Reject</Btn>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function ChatScreen({booking,currentUser,currentRole,onBack}){
  const [msgs,setMsgs]=useState([]);
  const [text,setText]=useState("");
  const key=`chats/${booking.id}`;
  useEffect(()=>{
    const load=async()=>{const m=await sget(key)||[];setMsgs(m);};
    load();const t=setInterval(load,3000);return()=>clearInterval(t);
  },[booking.id]);
  const send=async()=>{
    if(!text.trim())return;
    const msg={id:gid(),text:text.trim(),sender:currentRole,senderName:currentUser.name,ts:new Date().toISOString()};
    const m=await sget(key)||[];
    await sset(key,[...m,msg]);
    setMsgs(p=>[...p,msg]);setText("");
  };
  const other=currentRole==="customer"?booking.artistName:booking.customerName;
  return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"1rem 1rem 0.75rem",borderBottom:`1px solid ${BORDER}`,background:CARD,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:18,padding:0}}>←</button>
        <Av name={other} size={36}/>
        <div>
          <p style={{margin:0,fontWeight:600,fontSize:14}}>{other}</p>
          <p style={{margin:0,fontSize:11,color:MUTED}}>{booking.style} · {booking.coverage} · {booking.date?.label}, {booking.date?.date}</p>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"1rem",display:"flex",flexDirection:"column",gap:8}}>
        {msgs.length===0&&<div style={{textAlign:"center",padding:"3rem 1rem",color:MUTED}}><div style={{fontSize:36,marginBottom:8}}>💬</div><p>Say hello to {other}!</p></div>}
        {msgs.map(m=>{
          const me=m.sender===currentRole;
          return <div key={m.id} style={{display:"flex",justifyContent:me?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"75%",background:me?`linear-gradient(135deg,${G},${G2})`:CARD2,color:me?"#000":TXT,borderRadius:me?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px"}}>
              <p style={{margin:0,fontSize:14,lineHeight:1.4}}>{m.text}</p>
              <p style={{margin:"4px 0 0",fontSize:10,opacity:0.6,textAlign:"right"}}>{ago(m.ts)}</p>
            </div>
          </div>;
        })}
      </div>
      <div style={{padding:"0.75rem 1rem",borderTop:`1px solid ${BORDER}`,background:CARD,display:"flex",gap:10,alignItems:"center"}}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message…" style={{flex:1,background:CARD2,border:`1px solid ${BORDER}`,borderRadius:24,padding:"10px 16px",color:TXT,fontSize:14,outline:"none"}}/>
        <button onClick={send} disabled={!text.trim()} style={{width:40,height:40,borderRadius:"50%",background:text.trim()?`linear-gradient(135deg,${G},${G2})`:"transparent",border:text.trim()?"none":`1px solid ${BORDER}`,cursor:text.trim()?"pointer":"not-allowed",fontSize:18,flexShrink:0}}>→</button>
      </div>
    </div>
  );
}


// ── ADMIN APP ──────────────────────────────────────────────
function BarChart({data,valueFmt}){
  // data: [{label, value}], renders a simple horizontal-scroll bar chart, no external chart library needed.
  const max=Math.max(1,...data.map(d=>d.value));
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:10,height:140,overflowX:"auto",padding:"0 4px 4px"}}>
      {data.map((d,i)=>(
        <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:38,flexShrink:0}}>
          <p style={{margin:"0 0 4px",fontSize:10,color:G,fontWeight:600}}>{valueFmt?valueFmt(d.value):d.value}</p>
          <div style={{width:24,height:Math.max(4,(d.value/max)*90),background:`linear-gradient(180deg,${G2},${G})`,borderRadius:"4px 4px 0 0"}}/>
          <p style={{margin:"6px 0 0",fontSize:9,color:MUTED,textAlign:"center",whiteSpace:"nowrap"}}>{d.label}</p>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPanel({bookings,artists}){
  const paidStatuses=["accepted","completed"];
  const paid=bookings.filter(b=>paidStatuses.includes(b.status));

  // Revenue for each of the last 7 days
  const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d;});
  const revByDay=days.map(d=>{
    const key=d.toDateString();
    const total=paid.filter(b=>b.createdAt&&new Date(b.createdAt).toDateString()===key).reduce((s,b)=>s+Number(b.price||0),0);
    return{label:d.toLocaleDateString(undefined,{weekday:"short"}),value:total};
  });
  const totalRevenue=paid.reduce((s,b)=>s+Number(b.price||0),0);

  // Busiest artists — top 5 by total booking count
  const countByArtist={};
  bookings.forEach(b=>{countByArtist[b.artistId]=(countByArtist[b.artistId]||0)+1;});
  const busiest=Object.entries(countByArtist).map(([id,count])=>({label:(artists.find(a=>a.id===id)?.name||"Unknown").split(" ")[0],value:count})).sort((a,b)=>b.value-a.value).slice(0,5);

  // Status breakdown
  const statuses=["pending","accepted","rejected","completed","cancelled"];
  const statusCounts=statuses.map(s=>({label:s,value:bookings.filter(b=>b.status===s).length})).filter(s=>s.value>0);
  const statusColors={pending:G,accepted:GREEN,rejected:RED,completed:"#4A90D9",cancelled:MUTED};

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:"1.5rem"}}>
        <div style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px",textAlign:"center"}}>
          <p style={{margin:0,fontSize:11,color:MUTED}}>Total Revenue</p>
          <p style={{margin:"4px 0 0",fontSize:22,fontWeight:700,color:G}}>₹{totalRevenue}</p>
        </div>
        <div style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px",textAlign:"center"}}>
          <p style={{margin:0,fontSize:11,color:MUTED}}>Confirmed Bookings</p>
          <p style={{margin:"4px 0 0",fontSize:22,fontWeight:700,color:G}}>{paid.length}</p>
        </div>
      </div>

      <p style={{fontSize:13,fontWeight:600,margin:"0 0 10px"}}>Revenue — last 7 days</p>
      <div style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px",marginBottom:"1.5rem"}}>
        <BarChart data={revByDay} valueFmt={v=>v?`₹${v}`:""}/>
      </div>

      <p style={{fontSize:13,fontWeight:600,margin:"0 0 10px"}}>Busiest artists</p>
      <div style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px",marginBottom:"1.5rem"}}>
        {busiest.length===0?<p style={{fontSize:12,color:MUTED,margin:0}}>No bookings yet.</p>:<BarChart data={busiest}/>}
      </div>

      <p style={{fontSize:13,fontWeight:600,margin:"0 0 10px"}}>Booking status breakdown</p>
      <div style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px"}}>
        {statusCounts.length===0?<p style={{fontSize:12,color:MUTED,margin:0}}>No bookings yet.</p>:(
          <div>
            <div style={{display:"flex",height:14,borderRadius:8,overflow:"hidden",marginBottom:10}}>
              {statusCounts.map(s=><div key={s.label} style={{flex:s.value,background:statusColors[s.label]}}/>)}
            </div>
            <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
              {statusCounts.map(s=>(
                <div key={s.label} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:9,height:9,borderRadius:"50%",background:statusColors[s.label]}}/>
                  <span style={{fontSize:11,color:MUTED,textTransform:"capitalize"}}>{s.label} ({s.value})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminApp({onBack}){
  const [loggedIn,setLoggedIn]=useState(false);
  const [authChecked,setAuthChecked]=useState(false);
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");

  // Restore session automatically if the browser already has a valid admin login
  useEffect(()=>{
    const unsub=onAuthChange(fbUser=>{
      setLoggedIn(!!fbUser && fbUser.email===ADMIN_EMAIL);
      setAuthChecked(true);
    });
    return()=>unsub();
  },[]);

  const login=async()=>{
    setErr("");
    try{
      const fbUser=await authLogIn(email,pass);
      if(fbUser.email!==ADMIN_EMAIL){
        await authLogOut();
        setErr("This account is not authorized as Admin.");
        return;
      }
      setLoggedIn(true);
    }catch(e){
      setErr("Invalid email or password.");
    }
  };

  const logoutAdmin=async()=>{await authLogOut();setLoggedIn(false);};
  const [tab,setTab]=useState("artists");
  const [artists,setArtists]=useState([]);
  const [bookings,setBookings]=useState([]);
  const [customers,setCustomers]=useState([]);
  const [reviews,setReviews]=useState([]);
  const [lastRefresh,setLastRefresh]=useState("");
  const [viewArtist,setViewArtist]=useState(null);

  const load=async()=>{
    const a=await sgetCollection("artists");setArtists(a);
    const b=await sgetCollection("bookings");setBookings(b);
    const c=await sgetCollection("customers");setCustomers(c);
    const r=await sgetCollection("reviews");setReviews(r);
    setLastRefresh(new Date().toLocaleTimeString());
  };
  useEffect(()=>{ if(loggedIn){ load(); const t=setInterval(load,5000); return()=>clearInterval(t); } },[loggedIn]);

  const updateArtist=async(id,patch)=>{
    setArtists(prev=>prev.map(a=>a.id===id?{...a,...patch}:a));
    await supdateOne("artists",id,patch);
  };

  if(!loggedIn) return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif"}}>
      <div style={{padding:"1rem"}}><button onClick={onBack} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:13}}>← Back</button></div>
      <AuthWrap icon="⚙️" title="Admin Login" subtitle="MehendiBook operations dashboard">
        <Inp label="Email" type="email" placeholder="you@example.com" value={email} onChange={setEmail}/>
        <Inp label="Password" type="password" placeholder="••••••••" value={pass} onChange={setPass}/>
        {err&&<p style={{fontSize:12,color:RED,margin:"-4px 0 12px"}}>{err}</p>}
        <Btn full onClick={login}>Sign In →</Btn>
      </AuthWrap>
    </div>
  );

  const pending=artists.filter(a=>a.status==="pending");
  const approved=artists.filter(a=>a.status==="approved");
  const onlineN=artists.filter(a=>a.online&&a.status==="approved").length;
  const revenue=bookings.filter(b=>b.status==="accepted").reduce((s,b)=>s+Number(b.price||0),0);

  return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif"}}>
      {viewArtist&&(
        <ArtistModal
          artist={viewArtist}
          onClose={()=>setViewArtist(null)}
          onApprove={viewArtist.status==="pending"?async()=>{ await updateArtist(viewArtist.id,{status:"approved"}); setViewArtist(null); }:undefined}
          onReject={viewArtist.status==="pending"?async()=>{ await updateArtist(viewArtist.id,{status:"rejected"}); setViewArtist(null); }:undefined}
        />
      )}
      <div style={{background:`linear-gradient(180deg,#1a1200,${BG})`,padding:"1.5rem 1rem 1rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem"}}>
          <div>
            <p style={{margin:0,fontSize:12,color:G}}>🌿 MehendiBook</p>
            <h2 style={{margin:"4px 0 0",fontSize:18,fontWeight:700}}>Admin Dashboard</h2>
            {lastRefresh&&<p style={{margin:0,fontSize:10,color:MUTED}}>Updated {lastRefresh}</p>}
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn small variant="ghost" onClick={load}>↻</Btn>
            <Btn small variant="ghost" onClick={logoutAdmin}>Sign out</Btn>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {[["Artists",artists.length,`${pending.length} pending`],["Online",onlineN,"now"],["Bookings",bookings.length,`₹${revenue}`],["Reviews",reviews.length,"total"]].map(([l,v,s])=>(
            <div key={l} style={{background:CARD,borderRadius:12,padding:"10px 8px",textAlign:"center",border:`1px solid ${BORDER}`}}>
              <p style={{margin:0,fontSize:10,color:MUTED}}>{l}</p>
              <p style={{margin:"3px 0 0",fontSize:20,fontWeight:700,color:G}}>{v}</p>
              <p style={{margin:0,fontSize:10,color:MUTED}}>{s}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"0 1rem 2rem"}}>
        <Tabs tabs={[{id:"analytics",label:"Analytics"},{id:"artists",label:"Artists",count:artists.length},{id:"bookings",label:"Bookings",count:bookings.length},{id:"customers",label:"Customers",count:customers.length},{id:"reviews",label:"Reviews",count:reviews.length}]} active={tab} onChange={setTab}/>
        {tab==="analytics"&&<AnalyticsPanel bookings={bookings} artists={artists}/>}
        {tab==="artists"&&(
          <div>
            {pending.length>0&&(
              <>
                <p style={{fontSize:12,fontWeight:600,color:MUTED,margin:"0 0 10px"}}>PENDING APPROVAL</p>
                {pending.map(a=>(
                  <div key={a.id} style={{background:CARD,borderRadius:14,border:`1px solid ${G}44`,padding:"14px",marginBottom:12}}>
                    <div style={{display:"flex",gap:12,marginBottom:10}}>
                      <Av name={a.name} size={44}/>
                      <div style={{flex:1}}>
                        <p style={{margin:0,fontWeight:600}}>{a.name}</p>
                        <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>{a.email} · {a.phone}</p>
                        <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>📍 {a.location} · {a.exp}</p>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:5}}>{(a.styles||[]).map(s=><span key={s} style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:G+"15",color:G}}>{s}</span>)}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <Btn small variant="success" onClick={()=>updateArtist(a.id,{status:"approved"})}>✓ Approve</Btn>
                      <Btn small variant="danger" onClick={()=>updateArtist(a.id,{status:"rejected"})}>✕ Reject</Btn>
                      <Btn small variant="ghost" onClick={()=>setViewArtist(a)}>👁 View</Btn>
                    </div>
                  </div>
                ))}
              </>
            )}
            {approved.length>0&&(
              <>
                <p style={{fontSize:12,fontWeight:600,color:MUTED,margin:"12px 0 10px"}}>APPROVED</p>
                {approved.map(a=>(
                  <div key={a.id} style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px",marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <Av name={a.name} size={40}/>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <p style={{margin:0,fontWeight:600}}>{a.name}</p>
                          <Bdg label={a.online?"Online":"Offline"} color={a.online?"online":"offline"}/>
                        </div>
                        <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>📍 {a.location} · {a.exp}</p>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}><Stars rating={a.rating||0}/><span style={{fontSize:11,color:MUTED}}>({a.reviews||0} reviews)</span></div>
                        <div style={{display:"flex",gap:8,marginTop:8}}>
                          <Btn small variant="danger" onClick={()=>updateArtist(a.id,{status:"suspended"})}>Suspend</Btn>
                          <Btn small variant="ghost" onClick={()=>setViewArtist(a)}>👁 View Profile</Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {artists.filter(a=>a.status==="rejected"||a.status==="suspended").map(a=>(
              <div key={a.id} style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",opacity:0.6}}>
                <div><p style={{margin:0,fontWeight:600,fontSize:14}}>{a.name}</p><p style={{margin:0,fontSize:12,color:MUTED}}>{a.email}</p></div>
                <div style={{display:"flex",gap:6}}><Bdg label={a.status} color={a.status}/><Btn small variant="success" onClick={()=>updateArtist(a.id,{status:"approved"})}>Restore</Btn></div>
              </div>
            ))}
            {artists.length===0&&<div style={{textAlign:"center",padding:"2rem",color:MUTED}}><div style={{fontSize:36,marginBottom:8}}>👩‍🎨</div><p>No artists yet.</p></div>}
          </div>
        )}
        {tab==="bookings"&&(
          <div>
            {bookings.length===0?<div style={{textAlign:"center",padding:"2rem",color:MUTED}}><div style={{fontSize:36,marginBottom:8}}>📅</div><p>No bookings yet.</p></div>:
              [...bookings].reverse().map(b=>(
                <div key={b.id} style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <div>
                      <p style={{margin:0,fontWeight:600,fontSize:14}}>{b.customerName}</p>
                      <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>Artist: {b.artistName}</p>
                      <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>{b.style} · {b.coverage} · {b.occasion}</p>
                      <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>{b.date?.label}, {b.date?.date} · {b.time}</p>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <p style={{margin:0,fontWeight:700,color:G}}>₹{b.price}</p>
                      <Bdg label={b.status} color={b.status==="accepted"?"approved":b.status==="rejected"?"rejected":"pending"}/>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
        {tab==="customers"&&(
          <div>
            {customers.length===0?<div style={{textAlign:"center",padding:"2rem",color:MUTED}}><div style={{fontSize:36,marginBottom:8}}>👤</div><p>No customers yet.</p></div>:
              customers.map(c=>(
                <div key={c.id} style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
                  <Av name={c.name} size={38}/>
                  <div><p style={{margin:0,fontWeight:600,fontSize:14}}>{c.name}</p><p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>{c.email} · {c.phone}</p></div>
                  <span style={{marginLeft:"auto",fontSize:11,padding:"2px 8px",borderRadius:99,background:G+"15",color:G}}>{bookings.filter(b=>b.customerId===c.id).length} bookings</span>
                </div>
              ))}
          </div>
        )}
        {tab==="reviews"&&(
          <div>
            {reviews.length===0?<div style={{textAlign:"center",padding:"2rem",color:MUTED}}><div style={{fontSize:36,marginBottom:8}}>⭐</div><p>No reviews yet.</p></div>:
              [...reviews].reverse().map(r=>(
                <div key={r.id} style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <p style={{margin:0,fontWeight:600,fontSize:14}}>{r.customerName}</p>
                        <Stars rating={r.rating}/>
                      </div>
                      <p style={{margin:0,fontSize:12,color:MUTED}}>Artist: {artists.find(a=>a.id===r.artistId)?.name||"Unknown"}</p>
                      {r.review&&<p style={{margin:"6px 0 0",fontSize:13,color:TXT,lineHeight:1.5}}>{r.review}</p>}
                    </div>
                    <span style={{fontSize:11,color:MUTED,whiteSpace:"nowrap"}}>{ago(r.ts)}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ── ROOT (Admin-only entry point) ───────────────────────────
export default function App(){
  return <AdminApp onBack={()=>{}}/>;
}
