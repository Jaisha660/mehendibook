import { useState, useEffect } from "react";
import { sget, sset, sdel } from "./firebase";

const G="#C9A84C",G2="#F0C96B",BG="#0F0F0F",CARD="#1A1A1A",CARD2="#222",BORDER="#2A2A2A",TXT="#F5F5F5",MUTED="#888",GREEN="#4CAF50",RED="#ef5350",BLUE="#4A90D9";
const ADMIN_EMAIL="admin@mehendi.com",ADMIN_PASS="admin123";
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

function ReviewModal({booking,user,onSubmit,onClose}){
  const [rating,setRating]=useState(0);
  const [review,setReview]=useState("");
  const [saving,setSaving]=useState(false);
  const submit=async()=>{
    if(!rating){alert("Select a rating.");return;}
    setSaving(true);
    const reviews=await sget("reviews")||[];
    const r={id:gid(),bookingId:booking.id,artistId:booking.artistId,customerId:user.id,customerName:user.name,rating,review,ts:new Date().toISOString()};
    await sset("reviews",[...reviews,r]);
    const artists=await sget("artists")||[];
    const ar=[...reviews,r].filter(x=>x.artistId===booking.artistId);
    const avg=Number((ar.reduce((s,x)=>s+x.rating,0)/ar.length).toFixed(1));
    await sset("artists",artists.map(a=>a.id===booking.artistId?{...a,rating:avg,reviews:ar.length}:a));
    const bookings=await sget("bookings")||[];
    await sset("bookings",bookings.map(b=>b.id===booking.id?{...b,reviewed:true}:b));
    setSaving(false);onSubmit();
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:"1rem"}}>
      <div style={{background:CARD,borderRadius:20,padding:"1.5rem",width:"100%",maxWidth:360,border:`1px solid ${BORDER}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem"}}>
          <p style={{margin:0,fontWeight:700,fontSize:16}}>Rate your experience</p>
          <button onClick={onClose} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:20}}>×</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,background:CARD2,borderRadius:12,padding:"12px",marginBottom:"1.25rem"}}>
          <Av name={booking.artistName} size={44}/>
          <div><p style={{margin:0,fontWeight:600}}>{booking.artistName}</p><p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>{booking.style} · {booking.coverage}</p></div>
        </div>
        <div style={{display:"flex",justifyContent:"center",marginBottom:"0.5rem"}}><Stars rating={rating} interactive onRate={setRating}/></div>
        {rating>0&&<p style={{textAlign:"center",fontSize:12,color:G,marginBottom:"1rem"}}>{["","😞 Poor","😐 Fair","😊 Good","😄 Great","🤩 Excellent!"][rating]}</p>}
        <div style={{marginBottom:"1.25rem"}}>
          <label style={{display:"block",fontSize:12,color:MUTED,marginBottom:6}}>Write a review (optional)</label>
          <textarea value={review} onChange={e=>setReview(e.target.value)} placeholder="Share your experience…" rows={3} style={{width:"100%",boxSizing:"border-box",background:CARD2,border:`1px solid ${BORDER}`,borderRadius:12,padding:"12px 14px",color:TXT,fontSize:13,outline:"none",resize:"none"}}/>
        </div>
        <Btn full disabled={!rating||saving} onClick={submit}>{saving?"Submitting…":"Submit Review →"}</Btn>
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

// ── CUSTOMER APP ───────────────────────────────────────────
function CustomerApp({onBack}){
  const [user,setUser]=useState(null);
  const [screen,setScreen]=useState("home");
  const [artists,setArtists]=useState([]);
  const [artist,setArtist]=useState(null);
  const [booking,setBooking]=useState(null);
  const [chatBk,setChatBk]=useState(null);
  const [mode,setMode]=useState("login");
  const [form,setForm]=useState({name:"",email:"",phone:"",password:""});
  const [errs,setErrs]=useState({});
  const [authErr,setAuthErr]=useState("");
  const [reviewBk,setReviewBk]=useState(null);

  useEffect(()=>{
    const load=async()=>{const a=await sget("artists")||[];setArtists(a.filter(x=>x.status==="approved"));};
    load();const t=setInterval(load,5000);return()=>clearInterval(t);
  },[]);

  const sf=(k,v)=>{setForm(f=>({...f,[k]:v}));setErrs(e=>({...e,[k]:""}));setAuthErr("");};

  const auth=async()=>{
    if(mode==="forgot"){const c=await sget("customers")||[];if(!c.find(x=>x.email===form.email)){setAuthErr("No account found.");return;}setAuthErr("");setMode("reset");return;}
    if(mode==="reset"){if(form.password.length<6){setErrs(e=>({...e,password:"Min 6 chars"}));return;}const c=await sget("customers")||[];await sset("customers",c.map(x=>x.email===form.email?{...x,password:form.password}:x));setAuthErr("");setMode("login");setForm(f=>({...f,password:""}));return;}
    const e={};
    if(mode==="signup"){if(!form.name.trim())e.name="Required";if(!/^\d{10}$/.test(form.phone))e.phone="10 digits";}
    if(!/\S+@\S+\.\S+/.test(form.email))e.email="Valid email";
    if(form.password.length<6)e.password="Min 6 chars";
    setErrs(e);if(Object.keys(e).length)return;
    const cs=await sget("customers")||[];
    if(mode==="signup"){
      if(cs.find(c=>c.email===form.email)){setAuthErr("Account exists.");return;}
      const u={id:gid(),name:form.name,email:form.email,phone:form.phone,password:form.password,createdAt:new Date().toISOString()};
      await sset("customers",[...cs,u]);setUser(u);
    } else {
      const found=cs.find(c=>c.email===form.email&&c.password===form.password);
      if(!found){setAuthErr("Invalid email or password.");return;}
      setUser(found);
    }
  };

  if(!user) return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif"}}>
      <div style={{padding:"1rem"}}><button onClick={onBack} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:13}}>← Back</button></div>
      <AuthWrap icon="👤" title={mode==="login"?"Welcome back":mode==="signup"?"Create account":mode==="forgot"?"Forgot Password":"Reset Password"} subtitle={mode==="login"?"Sign in to book artists":mode==="signup"?"Join MehendiBook":mode==="forgot"?"Enter your email":"Enter new password"}>
        {(mode==="login"||mode==="signup")&&(
          <div style={{display:"flex",background:CARD2,borderRadius:10,padding:4,marginBottom:"1.25rem"}}>
            {["login","signup"].map(m=><button key={m} onClick={()=>{setMode(m);setErrs({});setAuthErr("");}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:500,background:mode===m?G:"transparent",color:mode===m?"#000":MUTED}}>{m==="login"?"Sign In":"Sign Up"}</button>)}
          </div>
        )}
        {mode==="signup"&&<Inp label="Full name" placeholder="Riya Sharma" value={form.name} onChange={v=>sf("name",v)} error={errs.name}/>}
        <Inp label="Email" type="email" placeholder="riya@example.com" value={form.email} onChange={v=>sf("email",v)} error={errs.email}/>
        {mode==="signup"&&<Inp label="Phone" type="tel" placeholder="9876543210" value={form.phone} onChange={v=>sf("phone",v)} error={errs.phone}/>}
        {(mode==="login"||mode==="signup"||mode==="reset")&&<Inp label={mode==="reset"?"New password":"Password"} type="password" placeholder="Min 6 characters" value={form.password} onChange={v=>sf("password",v)} error={errs.password}/>}
        {authErr&&<p style={{fontSize:12,color:RED,margin:"-4px 0 12px"}}>{authErr}</p>}
        <Btn full onClick={auth}>{mode==="login"?"Sign In →":mode==="signup"?"Create Account →":mode==="forgot"?"Continue →":"Reset Password →"}</Btn>
        {mode==="login"&&<p style={{textAlign:"center",marginTop:"1rem"}}><button onClick={()=>{setMode("forgot");setErrs({});setAuthErr("");}} style={{background:"none",border:"none",color:G,fontSize:13,cursor:"pointer"}}>Forgot password?</button></p>}
        {(mode==="forgot"||mode==="reset")&&<p style={{textAlign:"center",marginTop:"1rem"}}><button onClick={()=>{setMode("login");setErrs({});setAuthErr("");}} style={{background:"none",border:"none",color:MUTED,fontSize:13,cursor:"pointer"}}>← Back to sign in</button></p>}
      </AuthWrap>
    </div>
  );

  if(chatBk) return <ChatScreen booking={chatBk} currentUser={user} currentRole="customer" onBack={()=>setChatBk(null)}/>;
  if(screen==="profile"&&artist) return <ArtistProfile artist={artist} onBook={()=>setScreen("booking")} onBack={()=>setScreen("home")}/>;
  if(screen==="booking"&&artist) return <BookingFlow artist={artist} user={user} onConfirm={b=>{setBooking(b);setScreen("tracking");}} onBack={()=>setScreen("profile")}/>;
  if(screen==="tracking"&&booking) return <TrackingScreen booking={booking} user={user} onDone={()=>{setScreen("home");setBooking(null);setArtist(null);}} onChat={b=>setChatBk(b)}/>;

  return <CHome artists={artists} user={user} onArtist={a=>{setArtist(a);setScreen("profile");}} onSignOut={()=>setUser(null)} onChat={b=>setChatBk(b)} reviewBk={reviewBk} onReview={setReviewBk}/>;
}

function CHome({artists,user,onArtist,onSignOut,onChat,reviewBk,onReview}){
  const [tab,setTab]=useState("home");
  const [myBks,setMyBks]=useState([]);
  const [myRvs,setMyRvs]=useState([]);
  useEffect(()=>{
    const load=async()=>{
      const b=await sget("bookings")||[];setMyBks(b.filter(x=>x.customerId===user.id));
      const r=await sget("reviews")||[];setMyRvs(r.filter(x=>x.customerId===user.id));
    };
    load();const t=setInterval(load,5000);return()=>clearInterval(t);
  },[user.id]);

  return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif"}}>
      {reviewBk&&<ReviewModal booking={reviewBk} user={user} onSubmit={()=>onReview(null)} onClose={()=>onReview(null)}/>}
      <div style={{padding:"1.5rem 1rem 0",background:`linear-gradient(180deg,#1a1200,${BG})`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
          <div><p style={{margin:0,fontSize:12,color:G}}>🌿 MehendiBook</p><h1 style={{margin:"4px 0 0",fontSize:20,fontWeight:700}}>Hello, {user.name.split(" ")[0]} 👋</h1></div>
          <button onClick={onSignOut} style={{background:CARD2,border:`1px solid ${BORDER}`,color:MUTED,borderRadius:10,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Sign out</button>
        </div>
        <div style={{display:"flex",gap:2,borderBottom:`1px solid ${BORDER}`}}>
          {[{id:"home",label:"Find Artists"},{id:"bookings",label:`My Bookings${myBks.length?` (${myBks.length})`:""}`}].map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 14px",background:"none",border:"none",borderBottom:tab===t.id?`2px solid ${G}`:"2px solid transparent",color:tab===t.id?G:MUTED,cursor:"pointer",fontSize:13,fontWeight:tab===t.id?500:400,marginBottom:-1}}>{t.label}</button>)}
        </div>
      </div>
      {tab==="home"&&<FindArtists artists={artists} onArtist={onArtist}/>}
      {tab==="bookings"&&<BookingHistory bookings={myBks} reviews={myRvs} onChat={onChat} onReview={onReview}/>}
    </div>
  );
}

function FindArtists({artists,onArtist}){
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("All");
  const [loc,setLoc]=useState("Detecting location…");
  const [coords,setCoords]=useState(null);
  const R=50;
  useEffect(()=>{
    if(!navigator.geolocation){setLoc("New Delhi, India");return;}
    navigator.geolocation.getCurrentPosition(async({coords:c})=>{
      setCoords({lat:c.latitude,lng:c.longitude});
      try{const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${c.latitude}&lon=${c.longitude}&format=json`);const d=await r.json();const area=d.address?.suburb||d.address?.neighbourhood||"";const city=d.address?.city||d.address?.town||"India";setLoc(area?`${area}, ${city}`:city);}
      catch{setLoc("New Delhi, India");}
    },()=>setLoc("New Delhi, India"),{timeout:8000});
  },[]);
  const wd=artists.map(a=>{if(coords&&a.lat&&a.lng)return{...a,dist:haversine(coords.lat,coords.lng,a.lat,a.lng)};return{...a,dist:null};}).sort((a,b)=>{if(a.dist==null&&b.dist==null)return 0;if(a.dist==null)return 1;if(b.dist==null)return-1;return a.dist-b.dist;});
  const filtered=wd.filter(a=>(filter==="All"||a.styles?.includes(filter))&&(a.name.toLowerCase().includes(search.toLowerCase())||(a.tag||"").toLowerCase().includes(search.toLowerCase()))&&(a.dist==null||a.dist<=R));
  return (
    <div>
      <div style={{padding:"0.75rem 1rem 0",background:`linear-gradient(180deg,#1a1200,${BG})`}}>
        <p style={{margin:"0 0 0.5rem",fontSize:12,color:G}}>📍 {loc}</p>
        <div style={{background:CARD2,borderRadius:14,border:`1px solid ${BORDER}`,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:"0.75rem"}}>
          <span style={{opacity:0.5}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search artists, styles…" style={{background:"none",border:"none",outline:"none",color:TXT,fontSize:14,flex:1}}/>
        </div>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:12}}>
          {["All",...STYLES.slice(0,5)].map(f=><Pill key={f} active={filter===f} onClick={()=>setFilter(f)}>{f}</Pill>)}
        </div>
      </div>
      <div style={{padding:"0 1rem 2rem"}}>
        <p style={{color:MUTED,fontSize:13,margin:"0.75rem 0 1rem"}}>{coords?`${filtered.length} artists within ${R} km`:`${filtered.length} artists`}</p>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"3rem 1rem",color:MUTED}}><div style={{fontSize:40,marginBottom:10}}>🌿</div><p>No artists found nearby.</p></div>}
        {filtered.map(a=>{
          const from=a.pricing?.coverage?.["One Hand"]??DEF_PRICE.coverage["One Hand"];
          return <div key={a.id} onClick={()=>onArtist(a)} style={{background:CARD,borderRadius:18,border:`1px solid ${a.online?G+"44":BORDER}`,marginBottom:14,padding:"16px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=G} onMouseLeave={e=>e.currentTarget.style.borderColor=a.online?G+"44":BORDER}>
            <div style={{display:"flex",gap:12,marginBottom:10}}>
              <div style={{position:"relative"}}><Av name={a.name} size={52}/><div style={{position:"absolute",bottom:1,right:1,width:11,height:11,borderRadius:"50%",background:a.online?GREEN:MUTED,border:"2px solid #1A1A1A"}}/></div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div><p style={{margin:0,fontWeight:600,fontSize:15}}>{a.name}</p><p style={{margin:"2px 0 0",fontSize:11,color:G}}>{a.tag||a.styles?.[0]}</p></div>
                  <div style={{textAlign:"right"}}><p style={{margin:0,fontWeight:700,fontSize:15,color:G}}>from ₹{from}</p><p style={{margin:0,fontSize:10,color:MUTED}}>per session</p></div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5,marginTop:5}}>
                  <Stars rating={a.rating||5}/><span style={{fontSize:12}}>{a.rating||"New"}</span>
                  {a.reviews>0&&<span style={{fontSize:11,color:MUTED}}>({a.reviews})</span>}
                  <span style={{fontSize:11,color:MUTED}}>· {a.exp} exp</span>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>{(a.styles||[]).slice(0,3).map(s=><span key={s} style={{fontSize:11,padding:"2px 10px",borderRadius:99,background:G+"15",color:G,border:`1px solid ${G}33`}}>{s}</span>)}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:12,color:MUTED}}>📍 {a.location}</span>
                {a.dist!=null&&<span style={{fontSize:12,color:G,fontWeight:500}}>· {fmtD(a.dist)}</span>}
              </div>
              <span style={{fontSize:12,color:a.online?GREEN:MUTED,fontWeight:500}}>{a.online?"🟢 Online":"⚫ Offline"}</span>
            </div>
          </div>;
        })}
      </div>
    </div>
  );
}

function BookingHistory({bookings,reviews,onChat,onReview}){
  const sorted=[...bookings].reverse();
  if(!sorted.length) return <div style={{textAlign:"center",padding:"3rem 1rem",color:MUTED}}><div style={{fontSize:40,marginBottom:10}}>📋</div><p>No bookings yet.</p></div>;
  return <div style={{padding:"1rem 1rem 2rem"}}>
    {sorted.map(b=>{
      const rv=reviews.find(r=>r.bookingId===b.id);
      const canReview=b.trackStep===5&&!rv&&b.status==="accepted";
      const sc=b.status==="accepted"?"approved":b.status==="rejected"?"rejected":b.status==="completed"?"completed":"pending";
      return <div key={b.id} style={{background:CARD,borderRadius:16,border:`1px solid ${BORDER}`,padding:"14px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <p style={{margin:0,fontWeight:600,fontSize:15}}>{b.artistName}</p>
            <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>{b.style} · {b.coverage}</p>
            <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>{b.occasion} · {b.date?.label}, {b.date?.date} {b.date?.month} · {b.time}</p>
          </div>
          <div style={{textAlign:"right"}}><p style={{margin:0,fontWeight:700,color:G}}>₹{b.price}</p><Bdg label={b.status} color={sc}/></div>
        </div>
        {b.status==="accepted"&&b.trackStep!=null&&<div style={{background:CARD2,borderRadius:10,padding:"8px 12px",marginBottom:10}}><p style={{margin:0,fontSize:12,color:MUTED}}>Status: <span style={{color:G,fontWeight:500}}>{TRACK[b.trackStep]}</span></p></div>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {b.status!=="rejected"&&<Btn small variant="ghost" onClick={()=>onChat(b)}>💬 Chat</Btn>}
          {canReview&&<Btn small variant="secondary" onClick={()=>onReview(b)}>⭐ Rate & Review</Btn>}
          {rv&&<div style={{display:"flex",alignItems:"center",gap:4}}><Stars rating={rv.rating}/><span style={{fontSize:11,color:MUTED}}>Your review</span></div>}
        </div>
      </div>;
    })}
  </div>;
}

function ArtistProfile({artist,onBook,onBack}){
  const [reviews,setReviews]=useState([]);
  const p=artist.pricing||DEF_PRICE;
  useEffect(()=>{(async()=>{const r=await sget("reviews")||[];setReviews(r.filter(x=>x.artistId===artist.id));})();},[artist.id]);
  return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:`linear-gradient(180deg,#1a1200,${BG})`,padding:"1.5rem 1rem 1.5rem"}}>
        <button onClick={onBack} style={{background:CARD2,border:`1px solid ${BORDER}`,color:TXT,borderRadius:10,padding:"7px 14px",cursor:"pointer",fontSize:13,marginBottom:"1.25rem"}}>← Back</button>
        <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:"1rem"}}>
          <Av name={artist.name} size={72}/>
          <div>
            <h2 style={{margin:0,fontSize:20,fontWeight:700}}>{artist.name}</h2>
            <p style={{margin:"3px 0",fontSize:12,color:G}}>{artist.tag||artist.styles?.[0]}</p>
            <div style={{display:"flex",alignItems:"center",gap:5}}><Stars rating={artist.rating||5}/><span style={{fontSize:12}}>{artist.rating||"New"}{artist.reviews>0?` · ${artist.reviews} reviews`:""}</span></div>
          </div>
        </div>
        {artist.bio&&<p style={{margin:"0 0 1rem",fontSize:13,color:MUTED,lineHeight:1.6}}>{artist.bio}</p>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[["Experience",artist.exp],["Sessions",(artist.bookings||0)+"+"],["From","₹"+(p.coverage["One Hand"]||300)]].map(([l,v])=>(
            <div key={l} style={{background:CARD2,borderRadius:12,padding:"12px 8px",textAlign:"center",border:`1px solid ${BORDER}`}}>
              <p style={{margin:0,fontSize:18,fontWeight:700,color:G}}>{v}</p>
              <p style={{margin:"3px 0 0",fontSize:11,color:MUTED}}>{l}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:"0 1rem 2rem"}}>
        <p style={{fontWeight:600,fontSize:14,margin:"0 0 10px"}}>Coverage Prices</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:"1.5rem"}}>
          {COVERAGE.map(c=><div key={c} style={{background:CARD2,borderRadius:12,padding:"10px 12px",border:`1px solid ${BORDER}`}}>
            <p style={{margin:0,fontSize:12,color:MUTED}}>{c}</p>
            <p style={{margin:"2px 0 0",fontSize:16,fontWeight:700,color:G}}>₹{p.coverage[c]||0}</p>
          </div>)}
        </div>
        <p style={{fontWeight:600,fontSize:14,margin:"0 0 10px"}}>Design Styles & Add-ons</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:"1.5rem"}}>
          {(artist.styles||[]).map(s=>{
            const addon=p.designAddons[s]??0;
            return <div key={s} style={{background:CARD2,borderRadius:12,padding:"10px 12px",border:`1px solid ${G}33`}}>
              <p style={{margin:0,fontSize:12,color:G,fontWeight:500}}>{s}</p>
              <p style={{margin:"2px 0 0",fontSize:14,fontWeight:600,color:addon>0?G:MUTED}}>{addon>0?`+₹${addon}`:"Included"}</p>
            </div>;
          })}
        </div>
        {(p.bridalPackage||0)>0&&<p style={{fontSize:13,color:MUTED,marginBottom:"1.5rem"}}>💍 Bridal add-on: <strong style={{color:G}}>+₹{p.bridalPackage}</strong></p>}
        {artist.instagram&&<a href={artist.instagram} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:10,background:CARD2,border:`1px solid ${BORDER}`,borderRadius:12,padding:"12px 14px",marginBottom:"1.5rem",textDecoration:"none"}}>
          <span style={{fontSize:20}}>📸</span>
          <div><p style={{margin:0,fontSize:13,fontWeight:500,color:TXT}}>View on Instagram</p><p style={{margin:0,fontSize:11,color:MUTED}}>{artist.instagram.replace("https://","")}</p></div>
          <span style={{marginLeft:"auto",color:MUTED}}>→</span>
        </a>}
        {reviews.length>0&&<>
          <p style={{fontWeight:600,fontSize:14,margin:"0 0 10px"}}>Reviews ({reviews.length})</p>
          {reviews.slice(0,3).map(r=><div key={r.id} style={{background:CARD,borderRadius:12,border:`1px solid ${BORDER}`,padding:"12px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:G+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:G}}>{r.customerName[0]}</div>
                <div><p style={{margin:0,fontSize:13,fontWeight:500}}>{r.customerName}</p><Stars rating={r.rating}/></div>
              </div>
              <span style={{fontSize:11,color:MUTED}}>{ago(r.ts)}</span>
            </div>
            {r.review&&<p style={{margin:0,fontSize:12,color:MUTED,lineHeight:1.5}}>{r.review}</p>}
          </div>)}
        </>}
        <Btn full onClick={onBook}>Book Now</Btn>
      </div>
    </div>
  );
}

function BookingFlow({artist,user,onConfirm,onBack}){
  const [step,setStep]=useState(0);
  const [style,setStyle]=useState("");
  const [cov,setCov]=useState("");
  const [occ,setOcc]=useState("");
  const [date,setDate]=useState(null);
  const [time,setTime]=useState(null);
  const [addr,setAddr]=useState("");
  const dates=getDates(artist.blockedDates||[]);
  const price=(style&&cov)?calcP(artist,style,cov,occ):null;
  const canNext=[style&&cov&&occ,date&&time,addr.trim()][step];
  const STEPS=["Style & Coverage","Date & Time","Location"];
  const p=artist.pricing||DEF_PRICE;
  const confirm=async()=>{
    const fp=calcP(artist,style,cov,occ);
    const b={id:gid(),artistId:artist.id,artistName:artist.name,customerId:user.id,customerName:user.name,customerPhone:user.phone,style,coverage:cov,occasion:occ,date,time,address:addr,price:fp,status:"pending",trackStep:0,createdAt:new Date().toISOString()};
    const bks=await sget("bookings")||[];await sset("bookings",[...bks,b]);
    const rqs=await sget("requests")||[];await sset("requests",[...rqs,{...b}]);
    onConfirm(b);
  };
  return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif",padding:"1.5rem 1rem"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:13,padding:0,marginBottom:"1.25rem"}}>← Back</button>
      <div style={{display:"flex",alignItems:"center",marginBottom:"1.75rem"}}>
        {STEPS.map((s,i)=>(
          <div key={s} style={{display:"flex",alignItems:"center",flex:i<2?1:"none"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,background:i<step?G:i===step?G+"33":CARD2,color:i<=step?(i<step?"#000":G):MUTED,border:i===step?`2px solid ${G}`:"none"}}>{i<step?"✓":i+1}</div>
              <span style={{fontSize:10,color:i===step?G:MUTED,whiteSpace:"nowrap"}}>{s}</span>
            </div>
            {i<2&&<div style={{flex:1,height:1,background:i<step?G:BORDER,margin:"0 6px",marginBottom:18}}/>}
          </div>
        ))}
      </div>
      <div style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:"1.5rem"}}>
        <Av name={artist.name} size={38}/>
        <div style={{flex:1}}><p style={{margin:0,fontWeight:600,fontSize:14}}>{artist.name}</p><p style={{margin:0,fontSize:11,color:MUTED}}>{artist.tag}</p></div>
        <div style={{textAlign:"right"}}>{price!=null?<><p style={{margin:0,fontWeight:700,fontSize:16,color:G}}>₹{price}</p><p style={{margin:0,fontSize:10,color:MUTED}}>estimated</p></>:<p style={{margin:0,fontSize:12,color:MUTED}}>Select options</p>}</div>
      </div>
      {step===0&&(
        <div>
          <p style={{fontWeight:600,fontSize:15,margin:"0 0 12px"}}>Design Style</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:"1.5rem"}}>
            {(artist.styles||STYLES).map(s=>{const a=p.designAddons[s]||0;return <button key={s} onClick={()=>setStyle(s)} style={{padding:"8px 14px",borderRadius:99,border:`1px solid ${style===s?G:BORDER}`,background:style===s?G+"22":CARD2,color:style===s?G:MUTED,fontSize:12,cursor:"pointer"}}>{s}{a>0&&<span style={{fontSize:10,marginLeft:4}}>+₹{a}</span>}</button>;})}
          </div>
          <p style={{fontWeight:600,fontSize:15,margin:"0 0 12px"}}>Coverage</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:"1.5rem"}}>
            {COVERAGE.map(c=><button key={c} onClick={()=>setCov(c)} style={{padding:"10px 14px",borderRadius:12,border:`1px solid ${cov===c?G:BORDER}`,background:cov===c?G+"22":CARD2,cursor:"pointer",textAlign:"left"}}>
              <p style={{margin:0,fontSize:13,fontWeight:500,color:cov===c?G:TXT}}>{c}</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:cov===c?G:MUTED}}>₹{p.coverage[c]||0}</p>
            </button>)}
          </div>
          <p style={{fontWeight:600,fontSize:15,margin:"0 0 12px"}}>Occasion</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:"1.5rem"}}>
            {OCCASIONS.map(o=><button key={o} onClick={()=>setOcc(o)} style={{padding:"8px 14px",borderRadius:99,border:`1px solid ${occ===o?G:BORDER}`,background:occ===o?G+"22":CARD2,color:occ===o?G:MUTED,fontSize:12,cursor:"pointer"}}>{o}{o==="Wedding"&&p.bridalPackage>0?` +₹${p.bridalPackage}`:""}</button>)}
          </div>
        </div>
      )}
      {step===1&&(
        <div>
          <p style={{fontWeight:600,fontSize:15,margin:"0 0 12px"}}>Select Date</p>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,marginBottom:"1.5rem"}}>
            {dates.map(d=><div key={d.full} onClick={()=>{if(!d.blocked){setDate(d);setTime(null);}}} style={{minWidth:54,padding:"10px 4px",borderRadius:12,border:`1px solid ${d.blocked?"transparent":date?.full===d.full?G:BORDER}`,background:date?.full===d.full?G+"22":CARD2,color:d.blocked?BORDER:date?.full===d.full?G:MUTED,cursor:d.blocked?"not-allowed":"pointer",textAlign:"center",flexShrink:0,opacity:d.blocked?0.4:1}}>
              <p style={{margin:0,fontSize:10}}>{d.label}</p>
              <p style={{margin:"3px 0 0",fontSize:17,fontWeight:700,color:d.blocked?MUTED:date?.full===d.full?G:TXT}}>{d.date}</p>
              <p style={{margin:"2px 0 0",fontSize:10}}>{d.month}</p>
              {d.blocked&&<p style={{margin:"2px 0 0",fontSize:9,color:RED}}>Busy</p>}
            </div>)}
          </div>
          {date&&(
            <>
              <p style={{fontWeight:600,fontSize:15,margin:"0 0 12px"}}>Select Time</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:"1.5rem"}}>
                {TIMES.map(t=><button key={t} onClick={()=>setTime(t)} style={{padding:"10px 4px",borderRadius:12,border:`1px solid ${time===t?G:BORDER}`,background:time===t?G+"22":CARD2,color:time===t?G:MUTED,cursor:"pointer",fontSize:12}}>{t}</button>)}
              </div>
            </>
          )}
        </div>
      )}
      {step===2&&(
        <div>
          <p style={{fontWeight:600,fontSize:15,margin:"0 0 12px"}}>Your Address</p>
          <textarea placeholder="House no, Street, Area, City" value={addr} onChange={e=>setAddr(e.target.value)} rows={3} style={{width:"100%",boxSizing:"border-box",background:CARD2,border:`1px solid ${BORDER}`,borderRadius:12,padding:"12px 14px",color:TXT,fontSize:13,outline:"none",resize:"none",marginBottom:"1rem"}}/>
          <div style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px",marginBottom:"1rem"}}>
            <p style={{margin:"0 0 10px",fontWeight:600,fontSize:14}}>Price Breakdown</p>
            {[["Artist",artist.name],["Style",style],["Coverage",cov],["Occasion",occ],["Date",date?`${date.label}, ${date.date} ${date.month}`:""],["Time",time],["Coverage price",`₹${p.coverage[cov]||0}`],["Design add-on",`₹${p.designAddons[style]||0}`],...(occ==="Wedding"?[["Bridal add-on",`₹${p.bridalPackage||0}`]]:[])].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderTop:`1px solid ${BORDER}`,fontSize:13}}>
                <span style={{color:MUTED}}>{k}</span><span style={{color:TXT,fontWeight:500}}>{v}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0 0",fontSize:15,fontWeight:700,borderTop:`1px solid ${G}44`,marginTop:4}}>
              <span style={{color:G}}>Total</span><span style={{color:G}}>₹{price}</span>
            </div>
          </div>
        </div>
      )}
      <Btn full disabled={!canNext} onClick={()=>{if(step<2)setStep(s=>s+1);else confirm();}}>{step<2?"Continue →":"Confirm Booking →"}</Btn>
    </div>
  );
}

function TrackingScreen({booking,user,onDone,onChat}){
  const [tStep,setTStep]=useState(0);
  const [status,setStatus]=useState("pending");
  const [showRv,setShowRv]=useState(false);
  const [done,setDone]=useState(false);
  useEffect(()=>{
    const poll=async()=>{const bks=await sget("bookings")||[];const live=bks.find(b=>b.id===booking.id);if(live){setStatus(live.status);if(live.trackStep!=null)setTStep(live.trackStep);}};
    poll();const t=setInterval(poll,3000);return()=>clearInterval(t);
  },[booking.id]);
  const completed=tStep===TRACK.length-1;
  if(showRv) return <ReviewModal booking={{...booking,trackStep:tStep}} user={user} onSubmit={()=>{setShowRv(false);setDone(true);}} onClose={()=>setShowRv(false)}/>;
  if(status==="pending") return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:"2rem",maxWidth:320}}>
        <div style={{fontSize:60,marginBottom:"1rem"}}>⏳</div>
        <h2 style={{color:G,margin:"0 0 0.5rem"}}>Waiting for Artist</h2>
        <p style={{color:MUTED,margin:"0 0 1.5rem"}}>Request sent to <strong style={{color:TXT}}>{booking.artistName}</strong>.</p>
        <div style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px",textAlign:"left",marginBottom:"1.5rem"}}>
          {[["Style",booking.style],["Coverage",booking.coverage],["Occasion",booking.occasion],["Date",`${booking.date?.label}, ${booking.date?.date} ${booking.date?.month}`],["Time",booking.time],["Total",`₹${booking.price}`]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderTop:`1px solid ${BORDER}`,fontSize:13}}>
              <span style={{color:MUTED}}>{k}</span><span style={{color:k==="Total"?G:TXT,fontWeight:k==="Total"?700:500}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn small variant="blue" onClick={()=>onChat(booking)}>💬 Chat with Artist</Btn>
          <Btn small variant="secondary" onClick={onDone}>Cancel & go back</Btn>
        </div>
      </div>
    </div>
  );
  if(status==="rejected") return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:"2rem",maxWidth:320}}>
        <div style={{fontSize:60,marginBottom:"1rem"}}>😔</div>
        <h2 style={{color:RED,margin:"0 0 0.5rem"}}>Booking Declined</h2>
        <p style={{color:MUTED,margin:"0 0 2rem"}}>Try booking another artist.</p>
        <Btn full onClick={onDone}>Find Another Artist</Btn>
      </div>
    </div>
  );
  if(done) return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",padding:"2rem"}}>
        <div style={{fontSize:60,marginBottom:"1rem"}}>🌿</div>
        <h2 style={{color:G,margin:"0 0 0.5rem"}}>Thank you!</h2>
        <p style={{color:MUTED,margin:"0 0 2rem"}}>Hope you loved your mehendi!</p>
        <Btn onClick={onDone}>Back to Home</Btn>
      </div>
    </div>
  );
  return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif",padding:"1.5rem 1rem"}}>
      <p style={{fontWeight:700,fontSize:18,margin:"0 0 1.5rem",color:G}}>Live Tracking</p>
      <div style={{background:CARD,borderRadius:20,border:`1px solid ${BORDER}`,padding:"2rem",marginBottom:"1.5rem",textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:10}}>{["✅","👩‍🎨","🛺","🏠","🌿","🎉"][tStep]}</div>
        <p style={{margin:0,fontWeight:700,fontSize:18,color:completed?G:TXT}}>{TRACK[tStep]}</p>
        <p style={{margin:"6px 0 0",fontSize:12,color:MUTED}}>Updates every 3 seconds</p>
      </div>
      <div style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px",marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:12}}>
        <Av name={booking.artistName} size={44}/>
        <div style={{flex:1}}>
          <p style={{margin:0,fontWeight:600}}>{booking.artistName}</p>
          <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>{booking.style} · {booking.coverage} · {booking.occasion}</p>
          <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>{booking.date?.label}, {booking.date?.date} · {booking.time}</p>
        </div>
        <Btn small variant="blue" onClick={()=>onChat(booking)}>💬</Btn>
      </div>
      <div style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px",marginBottom:"1.5rem"}}>
        {TRACK.map((s,i)=>(
          <div key={s} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",opacity:i>tStep?0.35:1}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:i<tStep?G:i===tStep?G+"33":CARD2,border:i===tStep?`2px solid ${G}`:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:i<tStep?"#000":G,flexShrink:0}}>{i<tStep?"✓":""}</div>
            <p style={{margin:0,fontSize:13,fontWeight:i===tStep?600:400,color:i===tStep?G:MUTED}}>{s}</p>
            {i===tStep&&<span style={{marginLeft:"auto",fontSize:10,color:GREEN,fontWeight:600}}>● Live</span>}
          </div>
        ))}
      </div>
      {completed&&(
        <div style={{background:CARD,borderRadius:14,border:`1px solid ${G}44`,padding:"18px",marginBottom:"1.5rem",textAlign:"center"}}>
          <p style={{margin:"0 0 12px",fontWeight:600}}>Session completed! 🎉</p>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <Btn onClick={()=>setShowRv(true)}>⭐ Rate & Review</Btn>
            <Btn variant="secondary" onClick={()=>setDone(true)}>Skip</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ARTIST APP ─────────────────────────────────────────────
function ArtistApp({onBack}){
  const [user,setUser]=useState(null);
  const [mode,setMode]=useState("login");
  const [regStep,setRegStep]=useState(0);
  const [form,setForm]=useState({name:"",email:"",phone:"",password:"",bio:"",location:"",exp:"",tag:"",instagram:""});
  const [styles,setStyles]=useState([]);
  const [pricing,setPricing]=useState(DEF_PRICE);
  const [authErr,setAuthErr]=useState("");
  const [online,setOnline]=useState(false);
  const [requests,setRequests]=useState([]);
  const [tab,setTab]=useState("requests");
  const [myBks,setMyBks]=useState([]);
  const [chatBk,setChatBk]=useState(null);
  const [blocked,setBlocked]=useState([]);

  useEffect(()=>{
    if(!user)return;
    setOnline(user.online||false);
    setBlocked(user.blockedDates||[]);
    const load=async()=>{
      const rqs=await sget("requests")||[];setRequests(rqs.filter(r=>r.artistId===user.id&&r.status==="pending"));
      const bks=await sget("bookings")||[];setMyBks(bks.filter(b=>b.artistId===user.id));
    };
    load();const t=setInterval(load,4000);return()=>clearInterval(t);
  },[user]);

  const sf=(k,v)=>{setForm(f=>({...f,[k]:v}));setAuthErr("");};
  const toggleSty=s=>setStyles(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);

  const handleAuth=async()=>{
    if(mode==="forgot"){const a=await sget("artists")||[];if(!a.find(x=>x.email===form.email)){setAuthErr("No account found.");return;}setAuthErr("");setMode("reset");return;}
    if(mode==="reset"){if(form.password.length<6){setAuthErr("Min 6 chars.");return;}const a=await sget("artists")||[];await sset("artists",a.map(x=>x.email===form.email?{...x,password:form.password}:x));setAuthErr("");setMode("login");setForm(f=>({...f,password:""}));return;}
    if(mode==="login"){const a=await sget("artists")||[];const found=a.find(x=>x.email===form.email&&x.password===form.password);if(!found){setAuthErr("Invalid email or password.");return;}setUser(found);}
    else setRegStep(1);
  };

  const register=async()=>{
    if(!form.name||!form.email||!form.password||!form.location||!form.exp||!styles.length){setAuthErr("Fill all required fields.");return;}
    const a=await sget("artists")||[];
    if(a.find(x=>x.email===form.email)){setAuthErr("Email already registered.");return;}
    let lat=null,lng=null;
    try{await new Promise(res=>navigator.geolocation.getCurrentPosition(({coords})=>{lat=coords.latitude;lng=coords.longitude;res();},()=>res(),{timeout:6000}));}catch{}
    const artist={id:gid(),...form,styles,pricing,blockedDates:[],status:"pending",online:false,bookings:0,rating:0,reviews:0,lat,lng,createdAt:new Date().toISOString()};
    await sset("artists",[...a,artist]);setUser(artist);
  };

  const toggleOnline=async()=>{
    const n=!online;setOnline(n);
    const a=await sget("artists")||[];
    await sset("artists",a.map(x=>x.id===user.id?{...x,online:n}:x));
    setUser(u=>({...u,online:n}));
  };

  const toggleDate=async(full)=>{
    const nb=blocked.includes(full)?blocked.filter(d=>d!==full):[...blocked,full];
    setBlocked(nb);
    const a=await sget("artists")||[];
    await sset("artists",a.map(x=>x.id===user.id?{...x,blockedDates:nb}:x));
    setUser(u=>({...u,blockedDates:nb}));
  };

  const updateTrack=async(bk,ts)=>{
    const bks=await sget("bookings")||[];
    await sset("bookings",bks.map(b=>b.id===bk.id?{...b,trackStep:ts}:b));
    setMyBks(p=>p.map(b=>b.id===bk.id?{...b,trackStep:ts}:b));
  };

  const handleReq=async(req,action)=>{
    const rqs=await sget("requests")||[];
    await sset("requests",rqs.map(r=>r.id===req.id?{...r,status:action}:r));
    const bks=await sget("bookings")||[];
    await sset("bookings",bks.map(b=>b.id===req.id?{...b,status:action}:b));
    setRequests(p=>p.filter(r=>r.id!==req.id));
  };

  if(chatBk) return <ChatScreen booking={chatBk} currentUser={user} currentRole="artist" onBack={()=>setChatBk(null)}/>;

  if(!user) return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif"}}>
      <div style={{padding:"1rem"}}><button onClick={onBack} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:13}}>← Back</button></div>
      {regStep===0&&(
        <AuthWrap icon="👩‍🎨" title={mode==="login"?"Artist Sign In":mode==="signup"?"Register":mode==="forgot"?"Forgot Password":"Reset Password"} subtitle={mode==="login"?"Sign in to your account":mode==="signup"?"Join MehendiBook":mode==="forgot"?"Enter your email":"Set new password"}>
          {(mode==="login"||mode==="signup")&&(
            <div style={{display:"flex",background:CARD2,borderRadius:10,padding:4,marginBottom:"1.25rem"}}>
              {["login","signup"].map(m=><button key={m} onClick={()=>{setMode(m);setAuthErr("");}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:500,background:mode===m?G:"transparent",color:mode===m?"#000":MUTED}}>{m==="login"?"Sign In":"Register"}</button>)}
            </div>
          )}
          <Inp label="Email" type="email" placeholder="artist@example.com" value={form.email} onChange={v=>sf("email",v)}/>
          {(mode==="login"||mode==="signup"||mode==="reset")&&<Inp label={mode==="reset"?"New password":"Password"} type="password" placeholder="Min 6 characters" value={form.password} onChange={v=>sf("password",v)}/>}
          {authErr&&<p style={{fontSize:12,color:RED,margin:"-4px 0 12px"}}>{authErr}</p>}
          <Btn full onClick={handleAuth}>{mode==="login"?"Sign In →":mode==="signup"?"Continue →":mode==="forgot"?"Continue →":"Reset Password →"}</Btn>
          {mode==="login"&&<p style={{textAlign:"center",marginTop:"1rem"}}><button onClick={()=>{setMode("forgot");setAuthErr("");}} style={{background:"none",border:"none",color:G,fontSize:13,cursor:"pointer"}}>Forgot password?</button></p>}
          {(mode==="forgot"||mode==="reset")&&<p style={{textAlign:"center",marginTop:"1rem"}}><button onClick={()=>{setMode("login");setAuthErr("");}} style={{background:"none",border:"none",color:MUTED,fontSize:13,cursor:"pointer"}}>← Back</button></p>}
        </AuthWrap>
      )}
      {regStep===1&&(
        <div style={{maxWidth:480,margin:"0 auto",padding:"1rem"}}>
          <h2 style={{color:G,margin:"0 0 1.5rem",fontSize:18}}>Complete your profile</h2>
          <Inp label="Full name *" placeholder="Priya Sharma" value={form.name} onChange={v=>sf("name",v)}/>
          <Inp label="Phone *" type="tel" placeholder="9876543210" value={form.phone} onChange={v=>sf("phone",v)}/>
          <Inp label="Location *" placeholder="Lajpat Nagar, Delhi" value={form.location} onChange={v=>sf("location",v)}/>
          <Inp label="Tagline" placeholder="Bridal Specialist" value={form.tag} onChange={v=>sf("tag",v)}/>
          <Inp label="Bio" placeholder="Tell customers about yourself…" value={form.bio} onChange={v=>sf("bio",v)}/>
          <Inp label="Experience *" placeholder="5 years" value={form.exp} onChange={v=>sf("exp",v)}/>
          <Inp label="Instagram URL" placeholder="https://instagram.com/yourhandle" value={form.instagram} onChange={v=>sf("instagram",v)}/>
          <p style={{fontSize:12,color:MUTED,margin:"0 0 8px"}}>Design styles *</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:"1.5rem"}}>
            {STYLES.map(s=><button key={s} onClick={()=>toggleSty(s)} style={{padding:"7px 14px",borderRadius:99,border:`1px solid ${styles.includes(s)?G:BORDER}`,background:styles.includes(s)?G+"22":CARD2,color:styles.includes(s)?G:MUTED,fontSize:12,cursor:"pointer"}}>{s}</button>)}
          </div>
          <PriceEditor pricing={pricing} onChange={setPricing}/>
          {authErr&&<p style={{fontSize:12,color:RED,margin:"-4px 0 12px"}}>{authErr}</p>}
          <Btn full onClick={register}>Submit for Approval →</Btn>
        </div>
      )}
    </div>
  );

  const allDates=getDates([]);
  return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:`linear-gradient(180deg,#1a1200,${BG})`,padding:"1.5rem 1rem 1rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <Av name={user.name} size={44}/>
            <div>
              <p style={{margin:0,fontWeight:600,fontSize:15}}>{user.name}</p>
              <Bdg label={user.status==="approved"?(online?"Online":"Offline"):user.status} color={user.status==="approved"?(online?"online":"offline"):user.status}/>
            </div>
          </div>
          <button onClick={()=>setUser(null)} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:12}}>Sign out</button>
        </div>
        {user.status==="pending"&&<div style={{background:G+"15",border:`1px solid ${G}44`,borderRadius:12,padding:"12px 14px",marginBottom:"1rem"}}><p style={{margin:0,fontSize:13,color:G}}>⏳ Your profile is under review.</p></div>}
        {user.status==="approved"&&(
          <div style={{background:CARD,borderRadius:14,border:`1px solid ${BORDER}`,padding:"14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><p style={{margin:0,fontWeight:600,fontSize:14}}>Go {online?"Offline":"Online"}</p><p style={{margin:0,fontSize:12,color:MUTED}}>{online?"Visible to customers":"Hidden from customers"}</p></div>
            <div onClick={toggleOnline} style={{width:52,height:28,borderRadius:99,background:online?GREEN:BORDER,cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:online?27:3,transition:"left 0.2s"}}/>
            </div>
          </div>
        )}
      </div>
      <div style={{padding:"0 1rem 2rem"}}>
        <Tabs tabs={[{id:"requests",label:"Requests",count:requests.length},{id:"bookings",label:"Bookings"},{id:"calendar",label:"Calendar"},{id:"profile",label:"Profile"}]} active={tab==="editprofile"?"profile":tab} onChange={setTab}/>
        {tab==="requests"&&(
          <div>
            {requests.length===0?<div style={{textAlign:"center",padding:"2rem",color:MUTED}}><div style={{fontSize:36,marginBottom:8}}>📭</div><p>No new requests.</p></div>:
              requests.map(r=>(
                <div key={r.id} style={{background:CARD,borderRadius:14,border:`1px solid ${G}44`,padding:"14px",marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <div>
                      <p style={{margin:0,fontWeight:600}}>{r.customerName}</p>
                      <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>{r.style} · {r.coverage} · {r.occasion}</p>
                      <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>{r.date?.label}, {r.date?.date} {r.date?.month} · {r.time}</p>
                      <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>📍 {r.address}</p>
                    </div>
                    <p style={{margin:0,fontWeight:700,color:G,fontSize:16}}>₹{r.price}</p>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <Btn small variant="success" onClick={()=>handleReq(r,"accepted")}>✓ Accept</Btn>
                    <Btn small variant="danger" onClick={()=>handleReq(r,"rejected")}>✕ Decline</Btn>
                    <Btn small variant="ghost" onClick={()=>setChatBk(r)}>💬 Chat</Btn>
                  </div>
                </div>
              ))}
          </div>
        )}
        {tab==="bookings"&&(
          <div>
            {myBks.length===0?<div style={{textAlign:"center",padding:"2rem",color:MUTED}}><div style={{fontSize:36,marginBottom:8}}>📅</div><p>No bookings yet.</p></div>:
              [...myBks].reverse().map(b=>{
                const ts=b.trackStep??0;
                return (
                  <div key={b.id} style={{background:CARD,borderRadius:14,border:`1px solid ${b.status==="accepted"?G+"44":BORDER}`,padding:"14px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div>
                        <p style={{margin:0,fontWeight:600,fontSize:14}}>{b.customerName}</p>
                        <p style={{margin:"2px 0 0",fontSize:12,color:MUTED}}>{b.style} · {b.coverage} · {b.date?.label}, {b.date?.date} · {b.time}</p>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <p style={{margin:0,color:G,fontWeight:700}}>₹{b.price}</p>
                        <Bdg label={b.status} color={b.status==="accepted"?"approved":b.status==="rejected"?"rejected":"pending"}/>
                      </div>
                    </div>
                    {b.status==="accepted"&&(
                      <div style={{marginBottom:8}}>
                        <p style={{margin:"0 0 6px",fontSize:12,color:MUTED}}>Update status:</p>
                        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
                          {TRACK.map((s,i)=><button key={s} onClick={()=>updateTrack(b,i)} style={{padding:"6px 10px",borderRadius:99,border:`1px solid ${ts===i?G:BORDER}`,background:ts===i?G+"22":ts>i?G+"11":CARD2,color:ts===i?G:ts>i?G+"88":MUTED,fontSize:11,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{ts>i?"✓ ":""}{s}</button>)}
                        </div>
                      </div>
                    )}
                    <Btn small variant="ghost" onClick={()=>setChatBk(b)}>💬 Chat with Customer</Btn>
                  </div>
                );
              })}
          </div>
        )}
        {tab==="calendar"&&(
          <div>
            <p style={{fontSize:13,color:MUTED,margin:"0 0 1rem",lineHeight:1.6}}>Tap a date to mark as <strong style={{color:RED}}>unavailable</strong>.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:"1.5rem"}}>
              {allDates.map(d=>{
                const isB=blocked.includes(d.full);
                return <div key={d.full} onClick={()=>toggleDate(d.full)} style={{padding:"10px 6px",borderRadius:12,border:`1px solid ${isB?RED:BORDER}`,background:isB?RED+"22":CARD2,cursor:"pointer",textAlign:"center"}}>
                  <p style={{margin:0,fontSize:10,color:isB?RED:MUTED}}>{d.label}</p>
                  <p style={{margin:"3px 0 0",fontSize:16,fontWeight:700,color:isB?RED:TXT}}>{d.date}</p>
                  <p style={{margin:"2px 0 0",fontSize:10,color:isB?RED:MUTED}}>{d.month}</p>
                  {isB&&<p style={{margin:"2px 0 0",fontSize:9,color:RED,fontWeight:600}}>BLOCKED</p>}
                </div>;
              })}
            </div>
          </div>
        )}
        {tab==="profile"&&(
          <div>
            {[["Name",user.name],["Email",user.email],["Phone",user.phone],["Location",user.location],["Experience",user.exp],["Styles",(user.styles||[]).join(", ")],["Instagram",user.instagram||"Not added"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${BORDER}`,fontSize:13}}>
                <span style={{color:MUTED}}>{k}</span>
                {k==="Instagram"&&user.instagram?<a href={user.instagram} target="_blank" rel="noopener noreferrer" style={{color:G,fontWeight:500,textDecoration:"none"}}>📸 View</a>:<span style={{color:TXT,fontWeight:500,textAlign:"right",maxWidth:"60%"}}>{v}</span>}
              </div>
            ))}
            <div style={{marginTop:"1.5rem"}}><Btn full variant="secondary" onClick={()=>setTab("editprofile")}>✏️ Edit Profile</Btn></div>
          </div>
        )}
        {tab==="editprofile"&&(
          <EditProfile user={user} onSave={async updated=>{
            const a=await sget("artists")||[];
            await sset("artists",a.map(x=>x.id===user.id?{...x,...updated}:x));
            setUser(u=>({...u,...updated}));setTab("profile");
          }} onCancel={()=>setTab("profile")}/>
        )}
      </div>
    </div>
  );
}

// ── ADMIN APP ──────────────────────────────────────────────
function AdminApp({onBack}){
  const [loggedIn,setLoggedIn]=useState(false);
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [tab,setTab]=useState("artists");
  const [artists,setArtists]=useState([]);
  const [bookings,setBookings]=useState([]);
  const [customers,setCustomers]=useState([]);
  const [reviews,setReviews]=useState([]);
  const [lastRefresh,setLastRefresh]=useState("");
  const [viewArtist,setViewArtist]=useState(null);

  const load=async()=>{
    const a=await sget("artists");setArtists(a||[]);
    const b=await sget("bookings");setBookings(b||[]);
    const c=await sget("customers");setCustomers(c||[]);
    const r=await sget("reviews");setReviews(r||[]);
    setLastRefresh(new Date().toLocaleTimeString());
  };
  useEffect(()=>{ if(loggedIn){ load(); const t=setInterval(load,5000); return()=>clearInterval(t); } },[loggedIn]);

  const updateArtist=async(id,patch)=>{
    const updated=artists.map(a=>a.id===id?{...a,...patch}:a);
    setArtists(updated);await sset("artists",updated);
  };

  if(!loggedIn) return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif"}}>
      <div style={{padding:"1rem"}}><button onClick={onBack} style={{background:"none",border:"none",color:MUTED,cursor:"pointer",fontSize:13}}>← Back</button></div>
      <AuthWrap icon="⚙️" title="Admin Login" subtitle="MehendiBook operations dashboard">
        <Inp label="Email" type="email" placeholder="admin@mehendi.com" value={email} onChange={setEmail}/>
        <Inp label="Password" type="password" placeholder="••••••••" value={pass} onChange={setPass}/>
        {err&&<p style={{fontSize:12,color:RED,margin:"-4px 0 12px"}}>{err}</p>}
        <Btn full onClick={()=>{ if(email===ADMIN_EMAIL&&pass===ADMIN_PASS) setLoggedIn(true); else setErr("Invalid. Hint: admin@mehendi.com / admin123"); }}>Sign In →</Btn>
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
            <Btn small variant="ghost" onClick={()=>setLoggedIn(false)}>Sign out</Btn>
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
        <Tabs tabs={[{id:"artists",label:"Artists",count:artists.length},{id:"bookings",label:"Bookings",count:bookings.length},{id:"customers",label:"Customers",count:customers.length},{id:"reviews",label:"Reviews",count:reviews.length}]} active={tab} onChange={setTab}/>
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

// ── ROOT ───────────────────────────────────────────────────
export default function App(){
  const [role,setRole]=useState(null);
  if(role==="customer") return <CustomerApp onBack={()=>setRole(null)}/>;
  if(role==="artist") return <ArtistApp onBack={()=>setRole(null)}/>;
  if(role==="admin") return <AdminApp onBack={()=>setRole(null)}/>;
  return (
    <div style={{background:BG,minHeight:"100vh",color:TXT,fontFamily:"system-ui,sans-serif",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{maxWidth:400,width:"100%",padding:"2rem 1rem",textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:"1rem"}}>🌿</div>
        <h1 style={{fontSize:26,fontWeight:700,margin:"0 0 4px",color:G}}>MehendiBook</h1>
        <p style={{fontSize:14,color:MUTED,margin:"0 0 2.5rem"}}>Choose how you want to continue</p>
        {[{id:"customer",icon:"👤",label:"I'm a Customer",desc:"Find & book mehendi artists near you"},{id:"artist",icon:"👩‍🎨",label:"I'm an Artist",desc:"Register and start accepting bookings"},{id:"admin",icon:"⚙️",label:"Admin Panel",desc:"Manage the entire platform"}].map(r=>(
          <div key={r.id} onClick={()=>setRole(r.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px",border:`1px solid ${BORDER}`,borderRadius:16,marginBottom:12,cursor:"pointer",textAlign:"left",background:CARD}} onMouseEnter={e=>e.currentTarget.style.borderColor=G} onMouseLeave={e=>e.currentTarget.style.borderColor=BORDER}>
            <div style={{width:44,height:44,borderRadius:12,background:G+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{r.icon}</div>
            <div><p style={{margin:0,fontWeight:600,fontSize:15,color:TXT}}>{r.label}</p><p style={{margin:0,fontSize:12,color:MUTED}}>{r.desc}</p></div>
            <span style={{marginLeft:"auto",color:MUTED}}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}
