import { useState, useRef, useEffect } from "react";

/* ══════════════════════════════════════════════════════════
   🔧 ФИКСИКИ — Семейное приложение
   Николай (админ) | Иван | Василий | Дмитрий | Мастер 5
   ══════════════════════════════════════════════════════════ */

const FAMILY = [
  { id:1, name:"Николай", pass:"1111", role:"admin_master", pin:"0001", avatar:"👨‍🔧", online:true },
  { id:2, name:"Иван", pass:"2222", role:"master", pin:"0002", avatar:"🧑‍🔧", online:true },
  { id:3, name:"Василий", pass:"3333", role:"master", pin:"0003", avatar:"👷", online:true },
  { id:4, name:"Дмитрий", pass:"4444", role:"master", pin:"0004", avatar:"🔧", online:false },
  { id:5, name:"Мастер 5", pass:"5555", role:"master", pin:"0005", avatar:"⚡", online:false },
];

const CATS = {
  wash:{icon:"🫧",label:"Стиральная машина"},
  dish:{icon:"🍽",label:"Посудомоечная"},
  dryer:{icon:"💨",label:"Сушильная машина"},
  stove:{icon:"🔥",label:"Плита / духовка"},
  micro:{icon:"📡",label:"Микроволновка"},
  small:{icon:"🔌",label:"Мелкая техника"},
  fridge:{icon:"❄️",label:"Холодильник"},
  cond:{icon:"🌀",label:"Кондиционер"},
  tv:{icon:"📺",label:"Телевизор"},
  boiler:{icon:"🚿",label:"Бойлер / водонагреватель"},
  other:{icon:"🔧",label:"Другое"},
};

const fmt = n => n?.toLocaleString("ru-RU") ?? "—";

const SC = {
  scheduled:{l:"Запланирован",c:"#4d9fff",i:"🕐"},
  en_route:{l:"В пути",c:"#ff8c42",i:"🚗"},
  in_progress:{l:"В работе",c:"#e879f9",i:"🔧"},
  waiting_parts:{l:"Ждёт детали",c:"#ffd93d",i:"📦"},
  completed:{l:"Выполнен",c:"#6bcb77",i:"✅"},
};

const DELAY_MSGS = {
  delay_15:["⏱ {name}, чуть задерживаюсь — буду через 15 минут! Техника подождала столько — потерпит ещё немного 😊","{name}, извините, задержка 15 мин. Пробки тоже нуждаются в ремонте 🚗😅 Скоро буду!"],
  delay_30:["⏰ {name}, задержусь на полчаса — предыдущий ремонт был упрямым, но я победил 💪 Еду!","⏰ {name}, прошу прощения! Опаздываю на 30 мин. Мастер Фиксик непобедим, но пробки сильны 😅"],
  delay_60:["🕐 {name}, серьёзная задержка, буду через час. Если удобнее перенести — напишите 🙏","🕐 {name}, извиняюсь! Задержка ~1 час. Вы в приоритете — могу перенести на удобное время!"],
  reschedule:["📅 {name}, сегодня не успеваю 😔 Давайте перенесём? Завтра приеду первым делом! 🙏"],
};

const STATUS_MSGS = {
  en_route:["{name}, ваш мастер {master} выехал! Буду примерно в {time}. Спешу на помощь! 🚗","{name}, выезжаю к вам. Ориентировочно в {time}. До встречи!"],
  in_progress:["{name}, приступил к диагностике {device}. Скоро расскажу что нашёл!"],
  completed:["{name}, ремонт {device} завершён! Гарантия 30 дней. Спасибо за доверие! ✅","{name}, всё готово! {device} работает. Рад был помочь! 🔧"],
};

const TIPS = {
  wash:[{id:"w1",title:"Чистка фильтра",icon:"🧹"},{id:"w2",title:"Профилактика накипи",icon:"💧"},{id:"w3",title:"Уход за уплотнителем",icon:"🔄"}],
  dish:[{id:"d1",title:"Промывка машины",icon:"🍽"},{id:"d2",title:"Чистка фильтра ПММ",icon:"🔩"}],
  dryer:[{id:"dr1",title:"Чистка фильтра сушилки",icon:"💨"},{id:"dr2",title:"Проверка вентиляции",icon:"🌬"}],
  stove:[{id:"s1",title:"Чистка духовки",icon:"🔥"},{id:"s2",title:"Проверка конфорок",icon:"♨️"}],
  micro:[{id:"m1",title:"Чистка микроволновки",icon:"📡"}],
  small:[{id:"sm1",title:"Уход за мелкой техникой",icon:"🔌"}],
};

/* ═══════════════════════ STORAGE ═══════════════════════ */

const SK = "fixiki-data";
const loadData = () => { try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : null; } catch(e) { return null; } };
const saveData = (data) => { try { localStorage.setItem(SK, JSON.stringify(data)); } catch(e) {} };

const DEFAULT_DATA = {
  clients: {},
  tasks: {},
  wallet: {},
  messages: {},
  partners: [
    {id:"p1",name:"Андрей",phone:"+7 (903) 555-11-22",spec:["fridge","cond"],rating:5,notes:"Надёжный, работает быстро. Холодильники любой сложности.",referrals:[]},
    {id:"p2",name:"Сергей М.",phone:"+7 (916) 333-44-55",spec:["tv","boiler"],rating:4,notes:"Телевизоры, бойлеры. Берёт недорого.",referrals:[]},
  ],
  referrals: [],
};

/* ═══════════════════════ SHARED UI ═══════════════════════ */

const openNav = (a) => { const e=encodeURIComponent(a); window.open(`https://www.google.com/maps/search/?api=1&query=${e}`,"_blank"); };

const Badge = ({status}) => { const s=SC[status]||SC.scheduled; return <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:`${s.c}15`,color:s.c,border:`1px solid ${s.c}30`,display:"inline-flex",alignItems:"center",gap:4}}>{s.i} {s.l}</span>; };

const Addr = ({address}) => (
  <button onClick={e=>{e.stopPropagation();openNav(address);}} style={{display:"flex",alignItems:"center",gap:6,background:"#4d9fff12",border:"1px solid #4d9fff30",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:12,color:"#4d9fff",fontWeight:600,width:"100%",textAlign:"left"}}>
    <span style={{fontSize:16}}>📍</span><span style={{flex:1}}>{address}</span><span>🧭</span>
  </button>
);

const Sig = ({name}) => (
  <div style={{background:"#ff8c420c",borderRadius:10,padding:10,borderLeft:"3px solid #ff8c42",marginTop:10}}>
    <div style={{fontSize:12,color:"#ffd93d",fontWeight:600,lineHeight:1.5}}>Ваш Фиксик — мастер бытовой техники<br/><span style={{color:"#ff8c42"}}>{name}</span></div>
  </div>
);

const Input = ({label,value,onChange,placeholder,type="text",big}) => (
  <div style={{marginBottom:10}}>
    {label&&<div style={{fontSize:10,fontWeight:700,color:"#8892b0",letterSpacing:.5,marginBottom:4}}>{label}</div>}
    {big ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",minHeight:60,background:"#090d1a",border:"1px solid #2e3a5f",borderRadius:10,padding:"10px 12px",color:"#d0d8f0",fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box"}}/>
    : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",background:"#090d1a",border:"1px solid #2e3a5f",borderRadius:10,padding:"10px 12px",color:"#d0d8f0",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>}
  </div>
);

const Btn = ({children,onClick,color="#ff8c42",outline,disabled,full}) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding:"12px 20px",borderRadius:12,cursor:disabled?"default":"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,
    width:full?"100%":"auto",transition:"all 0.2s",
    ...(outline ? {border:`1px solid ${color}30`,background:"#090d1a",color:"#b0b8d1"} : {border:"none",background:disabled?"#1e2a4a":`linear-gradient(135deg,${color},${color}cc)`,color:disabled?"#555":"#fff"}),
  }}>{children}</button>
);

/* ═══════════════════════ AI SCANNER ═══════════════════════ */

const ScannerTab = ({masterName}) => {
  const [mode,setMode]=useState(null);
  const [scanning,setScanning]=useState(false);
  const [progress,setProgress]=useState(0);
  const [result,setResult]=useState(null);
  const [img,setImg]=useState(null);
  const [error,setError]=useState("");
  const fRef=useRef(null);

  const MODES = [
    {key:"shildik",icon:"🏷",title:"Шильдик / наклейка",desc:"Прочитаю модель, серийник, характеристики",color:"#6bcb77"},
    {key:"part",icon:"🔩",title:"Деталь / запчасть",desc:"Определю что это, найду артикул и аналоги",color:"#ff8c42"},
    {key:"error",icon:"⚠️",title:"Код ошибки",desc:"Расшифрую ошибку, дам шаги диагностики",color:"#ff6b6b"},
    {key:"problem",icon:"🔍",title:"Описать поломку",desc:"Опишите проблему — дам диагностику",color:"#e879f9"},
  ];

  const analyzeWithAI = async (imageData, modeKey) => {
    setScanning(true); setProgress(10); setError(""); setResult(null);

    const prompts = {
      shildik: "Это фото шильдика/наклейки бытовой техники. Прочитай всю информацию: бренд, модель, серийный номер, год выпуска, характеристики. Ответь строго JSON: {brand,model,serial,year,category,specs:[{label,value}],commonIssues:[строка]}. category одно из: wash,dish,dryer,stove,micro,small",
      part: "Это фото детали/запчасти бытовой техники. Определи: что это, артикул, аналоги, к каким моделям подходит, примерная цена, состояние. Ответь JSON: {name,number,alts:[],fits:[],price,condition,recommendation}",
      error: "Это фото дисплея бытовой техники с кодом ошибки. Расшифруй: код, устройство, что означает, причины с вероятностями, шаги диагностики. JSON: {code,device,meaning,causes:[{text,probability}],steps:[строка],quickFix}",
      problem: "Описание поломки бытовой техники. Дай диагностику: вероятные причины, шаги проверки, нужные инструменты, рекомендация. JSON: {causes:[{text,probability}],steps:[строка],tools:[строка],recommendation}",
    };

    try {
      setProgress(30);
      const messages = [{role:"user", content: imageData ? [
        {type:"image",source:{type:"base64",media_type:"image/jpeg",data:imageData}},
        {type:"text",text:prompts[modeKey]}
      ] : prompts[modeKey]}];

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages}),
      });
      setProgress(70);
      const data = await resp.json();
      setProgress(90);

      const text = data.content?.map(c=>c.text||"").join("") || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setResult({type:modeKey, data:parsed});
      } else {
        setResult({type:"text", data:{text}});
      }
      setProgress(100);
    } catch(e) {
      setError("Не удалось подключиться к AI. Проверьте интернет. Детали: " + e.message);
    }
    setScanning(false);
  };

  const handleFile = (e) => {
    const f=e.target.files?.[0]; if(!f)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const full = ev.target.result;
      setImg(full);
      const base64 = full.split(",")[1];
      analyzeWithAI(base64, mode);
    };
    reader.readAsDataURL(f);
    e.target.value="";
  };

  const reset=()=>{setMode(null);setScanning(false);setResult(null);setImg(null);setProgress(0);setError("");};

  if(!mode) return <div style={{animation:"slideIn 0.3s ease"}}>
    <div style={{background:"linear-gradient(135deg,#1a1025,#1e2a4a)",borderRadius:16,padding:18,border:"1px solid #2e3a5f",marginBottom:18}}>
      <div style={{fontSize:16,fontWeight:800,color:"#f0e6ff",marginBottom:4}}>📸 AI-Сканер Фиксики</div>
      <div style={{fontSize:12,color:"#b0b8d1",lineHeight:1.5}}>Сфотографируйте или опишите — AI определит и подскажет</div>
    </div>
    {MODES.map((m,i)=><button key={m.key} onClick={()=>setMode(m.key)} style={{display:"flex",alignItems:"center",gap:12,width:"100%",background:"#0e1222",borderRadius:14,padding:16,border:"1px solid #1e2a4a",marginBottom:10,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.2s"}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=m.color} onMouseLeave={e=>e.currentTarget.style.borderColor="#1e2a4a"}>
      <div style={{width:46,height:46,borderRadius:12,background:`${m.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{m.icon}</div>
      <div><div style={{fontSize:14,fontWeight:800,color:"#f0e6ff"}}>{m.title}</div><div style={{fontSize:11,color:"#8892b0"}}>{m.desc}</div></div>
    </button>)}
  </div>;

  const modeInfo = MODES.find(m=>m.key===mode);

  return <div style={{animation:"slideIn 0.3s ease"}}>
    <input ref={fRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleFile}/>
    <button onClick={reset} style={{background:"none",border:"none",color:"#ff8c42",fontSize:13,cursor:"pointer",marginBottom:12,fontFamily:"inherit"}}>← Назад</button>

    {error && <div style={{background:"#ff6b6b12",border:"1px solid #ff6b6b30",borderRadius:10,padding:12,marginBottom:14,fontSize:12,color:"#ff6b6b"}}> ⚠️ {error}</div>}

    {!scanning && !result && <>
      <div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:44,marginBottom:8}}>{modeInfo.icon}</div><div style={{fontSize:16,fontWeight:800,color:"#f0e6ff"}}>{modeInfo.title}</div></div>

      {mode==="problem" ? <div>
        <Input label="ОПИШИТЕ ПРОБЛЕМУ" placeholder="Например: стиралка Samsung не отжимает, гремит на высоких оборотах..." big value="" onChange={v=>{}}/>
        <Btn full color={modeInfo.color} onClick={()=>analyzeWithAI(null,mode)}>🤖 Анализировать</Btn>
      </div> : <>
        <div onClick={()=>fRef.current?.click()} style={{background:"#0e1222",borderRadius:20,padding:36,border:"2px dashed #2e3a5f",textAlign:"center",cursor:"pointer",marginBottom:14}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=modeInfo.color} onMouseLeave={e=>e.currentTarget.style.borderColor="#2e3a5f"}>
          <div style={{fontSize:36,marginBottom:8}}>📷</div>
          <div style={{fontSize:14,fontWeight:700,color:"#f0e6ff"}}>Нажмите чтобы сфотографировать</div>
          <div style={{fontSize:11,color:"#8892b0",marginTop:4}}>Или выбрать фото из галереи</div>
        </div>
      </>}
    </>}

    {scanning && <div style={{textAlign:"center",padding:"30px 0"}}>
      {img && <div style={{width:160,height:160,borderRadius:16,overflow:"hidden",margin:"0 auto 16px",border:"2px solid #2e3a5f"}}><img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
      <div style={{fontSize:44,marginBottom:10,animation:"pulse 1.5s ease infinite"}}>🤖</div>
      <div style={{fontSize:14,fontWeight:700,color:"#f0e6ff",marginBottom:4}}>AI анализирует...</div>
      <div style={{maxWidth:280,margin:"0 auto",height:4,borderRadius:2,background:"#1a1a2e",overflow:"hidden"}}><div style={{width:`${progress}%`,height:"100%",borderRadius:2,background:modeInfo.color,transition:"width 0.5s"}}/></div>
    </div>}

    {result && <div style={{animation:"slideIn 0.4s ease"}}>
      {img && <div style={{width:"100%",height:150,borderRadius:14,overflow:"hidden",marginBottom:14,border:"2px solid #6bcb7740"}}><img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}

      {result.type==="shildik" && result.data.brand && <>
        <div style={{fontSize:18,fontWeight:900,color:"#f0e6ff",marginBottom:2}}>{result.data.brand} {result.data.model}</div>
        {result.data.serial && <div style={{fontSize:11,color:"#8892b0",fontFamily:"'JetBrains Mono',monospace",marginBottom:12}}>S/N: {result.data.serial} {result.data.year && `• ${result.data.year}`}</div>}
        {result.data.specs?.length > 0 && <div style={{background:"#090d1a",borderRadius:12,padding:14,marginBottom:10}}>
          {result.data.specs.map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12,borderBottom:i<result.data.specs.length-1?"1px solid #1a1a3e":"none"}}><span style={{color:"#8892b0"}}>{s.label}</span><span style={{color:"#d0d8f0",fontWeight:600}}>{s.value}</span></div>)}
        </div>}
        {result.data.commonIssues?.length > 0 && <div style={{background:"#090d1a",borderRadius:12,padding:14,marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:"#ffd93d",letterSpacing:1,marginBottom:8}}>⚠️ ТИПИЧНЫЕ ПОЛОМКИ</div>
          {result.data.commonIssues.map((x,i)=><div key={i} style={{fontSize:12,color:"#d0d8f0",padding:"3px 0"}}>{typeof x==="string"?x:JSON.stringify(x)}</div>)}
        </div>}
      </>}

      {result.type==="part" && <>
        <div style={{fontSize:18,fontWeight:900,color:"#f0e6ff"}}>{result.data.name}</div>
        {result.data.number && <div style={{fontSize:14,color:"#ff8c42",fontFamily:"'JetBrains Mono',monospace",marginBottom:12}}>{result.data.number}</div>}
        <div style={{background:"#090d1a",borderRadius:12,padding:14,marginBottom:10}}>
          {[{l:"Аналоги",v:result.data.alts?.join(", ")},{l:"Подходит к",v:result.data.fits?.join(", ")},{l:"Цена",v:result.data.price}].filter(f=>f.v).map((f,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:12,borderBottom:"1px solid #1a1a3e"}}><span style={{color:"#8892b0"}}>{f.l}</span><span style={{color:"#d0d8f0",fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{f.v}</span></div>)}
        </div>
        {result.data.condition && <div style={{background:"#ff6b6b0c",borderRadius:10,padding:12,borderLeft:"3px solid #ff6b6b",marginBottom:10,fontSize:12,color:"#d0d8f0"}}>🔍 {result.data.condition}</div>}
        {result.data.recommendation && <div style={{background:"#6bcb770c",borderRadius:10,padding:12,borderLeft:"3px solid #6bcb77",marginBottom:12,fontSize:12,color:"#d0d8f0"}}>💡 {result.data.recommendation}</div>}
      </>}

      {result.type==="error" && <>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{background:"#ff6b6b20",borderRadius:10,padding:"6px 12px"}}><span style={{fontSize:22,fontWeight:900,color:"#ff6b6b",fontFamily:"'JetBrains Mono',monospace"}}>{result.data.code}</span></div>
          <div><div style={{fontSize:16,fontWeight:800,color:"#f0e6ff"}}>{result.data.meaning}</div><div style={{fontSize:12,color:"#ff8c42"}}>{result.data.device}</div></div>
        </div>
        {result.data.quickFix && <div style={{background:"#ffd93d0c",borderRadius:10,padding:12,borderLeft:"3px solid #ffd93d",marginBottom:10,fontSize:12,color:"#d0d8f0"}}>⚡ {result.data.quickFix}</div>}
        {result.data.causes?.map((c,i)=><div key={i} style={{marginBottom:6}}><div style={{fontSize:12,color:"#d0d8f0"}}>{c.text}</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{height:5,borderRadius:3,background:"#1a1a2e",flex:1,overflow:"hidden"}}><div style={{width:`${c.probability}%`,height:"100%",borderRadius:3,background:c.probability>=30?"#ff6b6b":"#ffd93d"}}/></div><span style={{fontSize:11,fontWeight:700,color:c.probability>=30?"#ff6b6b":"#ffd93d",minWidth:30}}>{c.probability}%</span></div>
        </div>)}
        {result.data.steps?.length > 0 && <div style={{background:"#090d1a",borderRadius:12,padding:14,marginTop:10}}>
          <div style={{fontSize:10,fontWeight:700,color:"#6bcb77",letterSpacing:1,marginBottom:8}}>🩺 ДИАГНОСТИКА</div>
          {result.data.steps.map((s,i)=><div key={i} style={{display:"flex",gap:8,padding:"5px 0",fontSize:12,color:"#d0d8f0"}}><span style={{color:"#6bcb77",fontWeight:800}}>{i+1}.</span>{s}</div>)}
        </div>}
      </>}

      {(result.type==="problem"||result.type==="text") && <>
        {result.data.causes?.map((c,i)=><div key={i} style={{fontSize:12,color:"#d0d8f0",padding:"4px 0"}}>{c.text} — <b style={{color:"#ff8c42"}}>{c.probability}%</b></div>)}
        {result.data.steps?.map((s,i)=><div key={i} style={{fontSize:12,color:"#d0d8f0",padding:"3px 0"}}><span style={{color:"#6bcb77"}}>{i+1}.</span> {s}</div>)}
        {result.data.recommendation && <div style={{background:"#6bcb770c",borderRadius:10,padding:12,borderLeft:"3px solid #6bcb77",marginTop:10,fontSize:12,color:"#d0d8f0"}}>💡 {result.data.recommendation}</div>}
        {result.data.text && <div style={{fontSize:13,color:"#d0d8f0",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{result.data.text}</div>}
      </>}

      <div style={{marginTop:16}}><Btn full outline onClick={reset}>📸 Новое сканирование</Btn></div>
    </div>}
  </div>;
};

/* ═══════════════════════ ADD CLIENT FORM ═══════════════════════ */

const AddClientForm = ({onSave,onCancel}) => {
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [address,setAddress]=useState("");
  const [cat,setCat]=useState("");
  const [device,setDevice]=useState("");
  const [problem,setProblem]=useState("");
  const [notes,setNotes]=useState("");

  return <div style={{background:"#0e1222",borderRadius:16,border:"2px solid #6bcb77",padding:18,animation:"slideIn 0.3s ease"}}>
    <div style={{fontSize:15,fontWeight:800,color:"#6bcb77",marginBottom:14}}>➕ Новый клиент</div>
    <Input label="ИМЯ КЛИЕНТА" value={name} onChange={setName} placeholder="Например: Анна"/>
    <Input label="ТЕЛЕФОН" value={phone} onChange={setPhone} placeholder="+7 (___) ___-__-__"/>
    <Input label="АДРЕС" value={address} onChange={setAddress} placeholder="Улица, дом, квартира"/>
    <div style={{fontSize:10,fontWeight:700,color:"#8892b0",letterSpacing:.5,marginBottom:6}}>ТИП ТЕХНИКИ</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
      {Object.entries(CATS).map(([k,v])=><button key={k} onClick={()=>setCat(k)} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${cat===k?"#ff8c42":"#1e2a4a"}`,background:cat===k?"#ff8c4218":"#090d1a",color:cat===k?"#ff8c42":"#b0b8d1",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>{v.icon} {v.label}</button>)}
    </div>
    <Input label="МАРКА И МОДЕЛЬ" value={device} onChange={setDevice} placeholder="Например: Samsung WW65A4S21"/>
    <Input label="ПРОБЛЕМА" value={problem} onChange={setProblem} placeholder="Что сломалось?" big/>
    <Input label="ЗАМЕТКИ (необязательно)" value={notes} onChange={setNotes} placeholder="Код домофона, этаж, особенности..."/>
    <div style={{display:"flex",gap:8,marginTop:14}}>
      <Btn outline onClick={onCancel}>Отмена</Btn>
      <Btn full color="#6bcb77" disabled={!name||!phone} onClick={()=>onSave({id:`c${Date.now()}`,name,phone,address,devices:[{name:device,cat:cat||"wash"}],notes,visits:[],photos:[],problem})}>✅ Сохранить</Btn>
    </div>
  </div>;
};

/* ═══════════════════════ ADD TASK FORM ═══════════════════════ */

const AddTaskForm = ({clients,onSave,onCancel}) => {
  const [client,setClient]=useState("");
  const [date,setDate]=useState("");
  const [time,setTime]=useState("");
  const [end,setEnd]=useState("");
  const [problem,setProblem]=useState("");

  return <div style={{background:"#0e1222",borderRadius:16,border:"2px solid #4d9fff",padding:18,marginBottom:14,animation:"slideIn 0.3s ease"}}>
    <div style={{fontSize:15,fontWeight:800,color:"#4d9fff",marginBottom:14}}>📋 Новая задача</div>
    {clients.length>0 && <>
      <div style={{fontSize:10,fontWeight:700,color:"#8892b0",letterSpacing:.5,marginBottom:6}}>КЛИЕНТ</div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10,maxHeight:150,overflowY:"auto"}}>
        {clients.map(c=><button key={c.id} onClick={()=>setClient(c.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,border:`1px solid ${client===c.id?"#4d9fff":"#1e2a4a"}`,background:client===c.id?"#4d9fff12":"#090d1a",cursor:"pointer",fontFamily:"inherit",textAlign:"left",color:"#d0d8f0",fontSize:12}}>{c.name} — {c.phone}</button>)}
      </div>
    </>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
      <Input label="ДАТА" value={date} onChange={setDate} placeholder="15.03"/>
      <Input label="НАЧАЛО" value={time} onChange={setTime} placeholder="10:00"/>
      <Input label="КОНЕЦ" value={end} onChange={setEnd} placeholder="11:30"/>
    </div>
    <Input label="ПРОБЛЕМА" value={problem} onChange={setProblem} placeholder="Описание" big/>
    <div style={{display:"flex",gap:8,marginTop:10}}>
      <Btn outline onClick={onCancel}>Отмена</Btn>
      <Btn full color="#4d9fff" disabled={!time} onClick={()=>{
        const cl=clients.find(c=>c.id===client);
        onSave({id:`t${Date.now()}`,date:date||"Сегодня",time,end:end||"—",clientName:cl?.name||"Новый клиент",phone:cl?.phone||"",address:cl?.address||"",device:cl?.devices?.[0]?.name||"",cat:cl?.devices?.[0]?.cat||"wash",problem:problem||cl?.problem||"",status:"scheduled",recPrice:0,cost:null,expenses:null});
      }}>✅ Добавить</Btn>
    </div>
  </div>;
};

/* ═══════════════════════ MAIN APP ═══════════════════════ */

export default function Fixiki() {
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("tasks");
  const [data,setData]=useState(DEFAULT_DATA);
  const [showAdmin,setShowAdmin]=useState(false);

  // Login state
  const [loginName,setLoginName]=useState("");
  const [loginPass,setLoginPass]=useState("");
  const [loginErr,setLoginErr]=useState("");
  const [pinMode,setPinMode]=useState(false);
  const [pinDigits,setPinDigits]=useState([]);

  // Forms
  const [showAddClient,setShowAddClient]=useState(false);
  const [showAddTask,setShowAddTask]=useState(false);

  // Load session
  useEffect(()=>{
    try {
      const s=localStorage.getItem("fixiki-session");
      if(s){const u=JSON.parse(s);const f=FAMILY.find(x=>x.id===u.id);if(f)setUser(f);}
      const d=loadData();
      if(d)setData(d);
    }catch(e){}
    setLoading(false);
  },[]);

  const login=(u)=>{setUser(u);try{localStorage.setItem("fixiki-session",JSON.stringify({id:u.id}));}catch(e){}};
  const logout=()=>{setUser(null);setShowAdmin(false);try{localStorage.removeItem("fixiki-session");}catch(e){}};

  const myClients = data.clients[user?.id] || [];
  const myTasks = data.tasks[user?.id] || [];
  const myWallet = data.wallet[user?.id] || [];

  const updateData = (key, masterId, items) => {
    const next = {...data, [key]: {...data[key], [masterId]: items}};
    setData(next);
    saveData(next);
  };

  // ── Loading ──
  if(loading) return <div style={{minHeight:"100vh",background:"#080c1a",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <div style={{width:70,height:70,borderRadius:20,background:"linear-gradient(135deg,#ff6b35,#ff8c42,#ffd93d)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>🔧</div>
    <div style={{fontSize:22,fontWeight:900,color:"#f0e6ff"}}>Фиксики</div>
    <div style={{width:24,height:24,border:"3px solid #1e2a4a",borderTopColor:"#ff8c42",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
  </div>;

  // ── Login ──
  if(!user) return <div style={{minHeight:"100vh",background:"#080c1a",fontFamily:"'Segoe UI',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
      @keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
      @keyframes pop{0%{transform:scale(.5)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
      *{box-sizing:border-box}
    `}</style>
    <div style={{width:"100%",maxWidth:360,animation:"slideIn 0.5s ease"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{width:80,height:80,borderRadius:24,background:"linear-gradient(135deg,#ff6b35,#ff8c42,#ffd93d)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:42,marginBottom:16}}>🔧</div>
        <div style={{fontSize:32,fontWeight:900,color:"#f0e6ff"}}>Фиксики</div>
        <div style={{fontSize:13,color:"#8892b0",marginTop:4}}>{pinMode?"Быстрый вход по PIN":"Вход"}</div>
      </div>

      {loginErr&&<div style={{background:"#ff6b6b12",border:"1px solid #ff6b6b30",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#ff6b6b",animation:pinMode?"shake 0.4s":"slideIn 0.3s"}}>⚠️ {loginErr}</div>}

      {pinMode ? <div style={{background:"#0e1222",borderRadius:20,padding:28,border:"1px solid #1e2a4a"}}>
        <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:28,animation:loginErr?"shake 0.4s":"none"}}>
          {[0,1,2,3].map(i=><div key={i} style={{width:20,height:20,borderRadius:"50%",background:pinDigits[i]!==undefined?"#ff8c42":"transparent",border:`2px solid ${pinDigits[i]!==undefined?"#ff8c42":"#2e3a5f"}`,animation:pinDigits[i]!==undefined?"pop 0.2s":"none"}}/>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[1,2,3,4,5,6,7,8,9,"C",0,"⌫"].map(d=><button key={d} onClick={()=>{
            if(d==="C"){setPinDigits([]);return;}
            if(d==="⌫"){setPinDigits(p=>p.slice(0,-1));return;}
            const next=[...pinDigits,String(d)];
            setPinDigits(next);
            if(next.length===4){
              const pin=next.join("");
              const u=FAMILY.find(f=>f.pin===pin);
              if(u){setTimeout(()=>login(u),200);}
              else{setLoginErr("Неверный PIN");setTimeout(()=>{setPinDigits([]);setLoginErr("");},800);}
            }
          }} style={{height:54,borderRadius:14,border:"1px solid #1e2a4a",background:d==="C"||d==="⌫"?"#090d1a":"#0e1222",color:d==="C"?"#ff6b6b":d==="⌫"?"#8892b0":"#f0e6ff",fontSize:typeof d==="number"?22:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{d}</button>)}
        </div>
        <button onClick={()=>{setPinMode(false);setPinDigits([]);setLoginErr("");}} style={{width:"100%",marginTop:14,padding:12,borderRadius:10,border:"1px solid #1e2a4a",background:"transparent",color:"#8892b0",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Войти по имени</button>
      </div> :
      <div style={{background:"#0e1222",borderRadius:20,padding:28,border:"1px solid #1e2a4a"}}>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"#8892b0",marginBottom:6}}>ИМЯ</div>
          <input value={loginName} onChange={e=>{setLoginName(e.target.value);setLoginErr("");}} placeholder="Например: Николай" onKeyDown={e=>e.key==="Enter"&&tryLogin()}
            style={{width:"100%",background:"#090d1a",border:"1px solid #1e2a4a",borderRadius:12,padding:"14px 16px",color:"#f0e6ff",fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:700,color:"#8892b0",marginBottom:6}}>ПАРОЛЬ</div>
          <input type="password" value={loginPass} onChange={e=>{setLoginPass(e.target.value);setLoginErr("");}} placeholder="4 цифры" onKeyDown={e=>e.key==="Enter"&&tryLogin()}
            style={{width:"100%",background:"#090d1a",border:"1px solid #1e2a4a",borderRadius:12,padding:"14px 16px",color:"#f0e6ff",fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <button onClick={tryLogin} style={{width:"100%",padding:15,borderRadius:12,border:"none",background:loginName&&loginPass?"linear-gradient(135deg,#ff6b35,#ff8c42)":"#1e2a4a",color:loginName&&loginPass?"#fff":"#555",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Войти</button>
        <button onClick={()=>{setPinMode(true);setPinDigits([]);setLoginErr("");}} style={{width:"100%",marginTop:12,padding:13,borderRadius:12,border:"1px solid #4d9fff25",background:"#4d9fff08",color:"#4d9fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>⚡ Быстрый вход по PIN</button>
        <div style={{marginTop:16,background:"#090d1a",borderRadius:10,padding:12,fontSize:11,color:"#555",lineHeight:1.6}}>
          Николай: 1111 (PIN 0001) | Иван: 2222 (PIN 0002)<br/>Василий: 3333 | Дмитрий: 4444 | Мастер 5: 5555
        </div>
      </div>}
    </div>
  </div>;

  function tryLogin(){
    const u=FAMILY.find(f=>f.name.toLowerCase()===loginName.toLowerCase()&&f.pass===loginPass);
    if(u){setLoginErr("");login(u);}else setLoginErr("Неверное имя или пароль");
  }

  // ── Admin Panel (for Николай) ──
  if(showAdmin) return <div style={{minHeight:"100vh",background:"#080c1a",fontFamily:"'Segoe UI',sans-serif",paddingBottom:80}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');@keyframes slideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box}`}</style>
    <div style={{padding:"20px 16px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:46,height:46,borderRadius:14,background:"linear-gradient(135deg,#e879f9,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>👑</div>
        <div><div style={{fontSize:20,fontWeight:900,color:"#f0e6ff"}}>Фиксики</div><div style={{fontSize:11,color:"#e879f9",fontWeight:700}}>АДМИНКА • Николай</div></div>
      </div>
      <button onClick={()=>setShowAdmin(false)} style={{background:"#ff8c4215",border:"1px solid #ff8c4230",borderRadius:10,padding:"6px 14px",color:"#ff8c42",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← К задачам</button>
    </div>
    <div style={{padding:"0 16px",animation:"slideIn 0.3s ease"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:18}}>
        {[{l:"Всего клиентов",v:Object.values(data.clients).reduce((s,c)=>s+c.length,0),c:"#ff8c42"},
          {l:"Всего задач",v:Object.values(data.tasks).reduce((s,t)=>s+t.length,0),c:"#4d9fff"},
          {l:"Мастеров",v:FAMILY.length,c:"#6bcb77"}
        ].map((s,i)=><div key={i} style={{background:"#0e1222",borderRadius:12,padding:"12px 6px",border:"1px solid #1e2a4a",textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:s.c,fontFamily:"'JetBrains Mono',monospace"}}>{s.v}</div><div style={{fontSize:9,color:"#8892b0"}}>{s.l}</div></div>)}
      </div>
      {FAMILY.map(m=>{
        const mc=data.clients[m.id]||[];
        const mt=data.tasks[m.id]||[];
        const mw=data.wallet[m.id]||[];
        const income=mw.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0);
        const expense=mw.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0);
        return <div key={m.id} style={{background:"#0e1222",borderRadius:14,padding:16,border:"1px solid #1e2a4a",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{m.avatar}</span><div>
              <div style={{fontSize:15,fontWeight:800,color:"#f0e6ff"}}>{m.name}</div>
              <div style={{fontSize:11,color:"#8892b0"}}>{m.role==="admin_master"?"Админ + мастер":"Мастер"}</div>
            </div></div>
            <span style={{width:8,height:8,borderRadius:"50%",background:m.online?"#6bcb77":"#555",boxShadow:m.online?"0 0 8px #6bcb7780":"none",display:"inline-block"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            <div style={{background:"#090d1a",borderRadius:8,padding:"6px 4px",textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,color:"#ff8c42"}}>{mc.length}</div><div style={{fontSize:8,color:"#8892b0"}}>клиентов</div></div>
            <div style={{background:"#090d1a",borderRadius:8,padding:"6px 4px",textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,color:"#4d9fff"}}>{mt.length}</div><div style={{fontSize:8,color:"#8892b0"}}>задач</div></div>
            <div style={{background:"#090d1a",borderRadius:8,padding:"6px 4px",textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,color:"#6bcb77"}}>{fmt(income)}</div><div style={{fontSize:8,color:"#8892b0"}}>доход</div></div>
            <div style={{background:"#090d1a",borderRadius:8,padding:"6px 4px",textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,color:"#ff6b6b"}}>{fmt(expense)}</div><div style={{fontSize:8,color:"#8892b0"}}>расход</div></div>
          </div>
          {mc.length>0&&<div style={{marginTop:8,fontSize:11,color:"#8892b0"}}>Клиенты: {mc.map(c=>c.name).join(", ")}</div>}
        </div>;
      })}
    </div>
  </div>;

  // ── Master Panel ──
  const tabs=[
    {key:"tasks",icon:"📋",label:"Задачи"},
    {key:"clients",icon:"👥",label:"Клиенты"},
    {key:"scanner",icon:"📸",label:"Сканер"},
    {key:"partners",icon:"🤝",label:"Партнёры"},
    {key:"wallet",icon:"💰",label:"Кошелёк"},
  ];

  const now=new Date();
  const timeStr=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  return <div style={{minHeight:"100vh",background:"#080c1a",fontFamily:"'Segoe UI',sans-serif",paddingBottom:80}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');
      @keyframes slideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      *{box-sizing:border-box}
      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-thumb{background:#2e3a5f;border-radius:4px}
      input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
    `}</style>

    {/* Header */}
    <div style={{padding:"20px 16px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:46,height:46,borderRadius:14,background:"linear-gradient(135deg,#ff6b35,#ff8c42,#ffd93d)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,boxShadow:"0 4px 20px #ff8c4240"}}>🔧</div>
        <div><div style={{fontSize:20,fontWeight:900,color:"#f0e6ff"}}>Фиксики</div><div style={{fontSize:11,color:"#ff8c42",fontWeight:700}}>{user.avatar} {user.name}</div></div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:800,color:"#f0e6ff",fontFamily:"'JetBrains Mono',monospace"}}>{timeStr}</div></div>
        {user.role==="admin_master"&&<button onClick={()=>setShowAdmin(true)} style={{background:"#e879f915",border:"1px solid #e879f930",borderRadius:8,padding:"4px 8px",fontSize:14,cursor:"pointer",color:"#e879f9"}} title="Админка">👑</button>}
        <button onClick={logout} style={{background:"#ff6b6b10",border:"1px solid #ff6b6b25",borderRadius:8,padding:"4px 8px",fontSize:14,cursor:"pointer",color:"#ff6b6b"}} title="Выйти">🚪</button>
      </div>
    </div>

    {/* Content */}
    <div style={{padding:"0 16px 20px"}}>

      {/* ── Tasks ── */}
      {tab==="tasks"&&<div style={{animation:"slideIn 0.3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800,color:"#f0e6ff"}}>📋 Мои задачи</div>
          <Btn color="#4d9fff" onClick={()=>setShowAddTask(true)}>＋ Задача</Btn>
        </div>
        {showAddTask&&<AddTaskForm clients={myClients} onCancel={()=>setShowAddTask(false)} onSave={t=>{updateData("tasks",user.id,[t,...myTasks]);setShowAddTask(false);}}/>}
        {myTasks.length===0&&!showAddTask&&<div style={{background:"#0e1222",borderRadius:16,padding:28,border:"1px solid #1e2a4a",textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:8}}>📭</div><div style={{fontSize:14,color:"#8892b0"}}>Задач пока нет</div>
          <div style={{fontSize:12,color:"#555",marginTop:4}}>Добавьте клиента, затем создайте задачу</div>
        </div>}
        {myTasks.map((t,i)=>{const s=SC[t.status]||SC.scheduled;return(
          <div key={t.id} style={{background:"#0e1222",borderRadius:14,padding:14,border:"1px solid #1e2a4a",marginBottom:10,animation:`slideIn 0.3s ease ${i*0.05}s both`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16,fontWeight:900,color:s.c,fontFamily:"'JetBrains Mono',monospace"}}>{t.time}</span><span style={{fontSize:11,color:"#8892b0"}}>— {t.end}</span></div>
              <Badge status={t.status}/>
            </div>
            <div style={{fontSize:15,fontWeight:800,color:"#f0e6ff",marginBottom:4}}>{t.clientName}</div>
            {t.address&&<Addr address={t.address}/>}
            <div style={{marginTop:6,display:"flex",alignItems:"center",gap:6}}><span>{CATS[t.cat]?.icon||"🔧"}</span><span style={{fontSize:12,fontWeight:700,color:"#ff8c42"}}>{t.device}</span></div>
            {t.problem&&<div style={{fontSize:12,color:"#b0b8d1",marginTop:2}}>{t.problem}</div>}
            <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
              {t.status==="scheduled"&&<Btn color="#ff8c42" onClick={()=>{const next=myTasks.map(x=>x.id===t.id?{...x,status:"en_route"}:x);updateData("tasks",user.id,next);}}>🚗 Выехал</Btn>}
              {t.status==="en_route"&&<><Btn color="#e879f9" onClick={()=>{const next=myTasks.map(x=>x.id===t.id?{...x,status:"in_progress"}:x);updateData("tasks",user.id,next);}}>🔧 Начал</Btn><Btn outline color="#ffd93d" onClick={()=>{}}>😅 Опаздываю</Btn></>}
              {t.status==="in_progress"&&<Btn color="#6bcb77" onClick={()=>{const next=myTasks.map(x=>x.id===t.id?{...x,status:"completed"}:x);updateData("tasks",user.id,next);}}>✅ Готово</Btn>}
            </div>
          </div>);})}
      </div>}

      {/* ── Clients ── */}
      {tab==="clients"&&<div style={{animation:"slideIn 0.3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:16,fontWeight:800,color:"#f0e6ff"}}>👥 Мои клиенты ({myClients.length})</div>
          <Btn color="#6bcb77" onClick={()=>setShowAddClient(true)}>＋ Клиент</Btn>
        </div>
        {showAddClient&&<AddClientForm onCancel={()=>setShowAddClient(false)} onSave={c=>{updateData("clients",user.id,[c,...myClients]);setShowAddClient(false);}}/>}
        {myClients.length===0&&!showAddClient&&<div style={{background:"#0e1222",borderRadius:16,padding:28,border:"1px solid #1e2a4a",textAlign:"center"}}><div style={{fontSize:36,marginBottom:8}}>👥</div><div style={{fontSize:14,color:"#8892b0"}}>Клиентов пока нет</div></div>}
        {myClients.map((c,i)=><div key={c.id} style={{background:"#0e1222",borderRadius:14,padding:16,border:"1px solid #1e2a4a",marginBottom:10,animation:`slideIn 0.3s ease ${i*0.05}s both`}}>
          <div style={{fontSize:16,fontWeight:800,color:"#f0e6ff"}}>{c.name}</div>
          <a href={`tel:${c.phone}`} style={{fontSize:12,color:"#4d9fff",textDecoration:"none"}}>📞 {c.phone}</a>
          {c.address&&<div style={{marginTop:6}}><Addr address={c.address}/></div>}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
            {c.devices?.map((d,j)=><span key={j} style={{background:"#ff8c4212",borderRadius:6,padding:"3px 8px",fontSize:10,color:"#ff8c42"}}>{CATS[d.cat]?.icon} {d.name}</span>)}
          </div>
          {c.notes&&<div style={{fontSize:11,color:"#8892b0",marginTop:6}}>📝 {c.notes}</div>}
          {c.problem&&<div style={{fontSize:12,color:"#ff6b6b",marginTop:4}}>⚠️ {c.problem}</div>}
          <div style={{display:"flex",gap:6,marginTop:10}}>
            {c.devices?.map(d=>(TIPS[d.cat]||[]).map(t=><button key={t.id} style={{padding:"5px 10px",borderRadius:8,border:"1px solid #1e2a4a",background:"#090d1a",color:"#b0b8d1",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>{t.icon} {t.title}</button>))}
          </div>
          <Sig name={user.name}/>
        </div>)}
      </div>}

      {/* ── Scanner ── */}
      {tab==="scanner"&&<ScannerTab masterName={user.name}/>}

      {/* ── Partners ── */}
      {tab==="partners"&&(()=>{
        const partners = data.partners || [];
        const referrals = data.referrals || [];
        const [showAdd,setShowAdd2]=useState(false);
        const [showRefer,setShowRefer2]=useState(null);
        const [refClient,setRefClient2]=useState("");
        const [refProblem,setRefProblem2]=useState("");
        const [expandedP,setExpandedP2]=useState(null);

        const totalReferred = referrals.length;
        const thisMonth = referrals.filter(r => r.date?.startsWith(new Date().toLocaleDateString("ru-RU",{month:"long"}))).length;

        const addPartner = () => {
          const name=prompt("Имя мастера:"); if(!name)return;
          const phone=prompt("Телефон:"); if(!phone)return;
          const notes=prompt("Специализация и заметки:");
          const newP = {id:`p${Date.now()}`,name,phone,spec:[],rating:0,notes:notes||"",referrals:[]};
          const next = {...data, partners:[...partners,newP]};
          setData(next); saveData(next);
        };

        const sendReferral = (partner) => {
          if(!refClient)return;
          const ref = {id:`r${Date.now()}`,partnerId:partner.id,partnerName:partner.name,clientName:refClient,problem:refProblem,date:new Date().toLocaleDateString("ru-RU"),sentBy:user.name};
          const next = {...data, referrals:[ref,...referrals]};
          setData(next); saveData(next);
          setShowRefer2(null); setRefClient2(""); setRefProblem2("");
        };

        return <div style={{animation:"slideIn 0.3s ease"}}>
          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            <div style={{background:"#e879f910",borderRadius:12,padding:"10px 6px",textAlign:"center",border:"1px solid #e879f920"}}><div style={{fontSize:20,fontWeight:800,color:"#e879f9",fontFamily:"'JetBrains Mono',monospace"}}>{partners.length}</div><div style={{fontSize:9,color:"#8892b0"}}>Партнёров</div></div>
            <div style={{background:"#4d9fff10",borderRadius:12,padding:"10px 6px",textAlign:"center",border:"1px solid #4d9fff20"}}><div style={{fontSize:20,fontWeight:800,color:"#4d9fff",fontFamily:"'JetBrains Mono',monospace"}}>{totalReferred}</div><div style={{fontSize:9,color:"#8892b0"}}>Передано всего</div></div>
            <div style={{background:"#6bcb7710",borderRadius:12,padding:"10px 6px",textAlign:"center",border:"1px solid #6bcb7720"}}><div style={{fontSize:20,fontWeight:800,color:"#6bcb77",fontFamily:"'JetBrains Mono',monospace"}}>{thisMonth}</div><div style={{fontSize:9,color:"#8892b0"}}>В этом месяце</div></div>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontSize:16,fontWeight:800,color:"#f0e6ff"}}>🤝 Доверенные мастера</div>
            <Btn color="#e879f9" onClick={addPartner}>＋ Партнёр</Btn>
          </div>

          {/* Refer modal */}
          {showRefer2 && (()=>{
            const p = partners.find(x=>x.id===showRefer2);
            return <div style={{background:"#0e1222",borderRadius:16,border:"2px solid #e879f9",padding:18,marginBottom:14,animation:"slideIn 0.3s ease"}}>
              <div style={{fontSize:14,fontWeight:800,color:"#e879f9",marginBottom:4}}>📤 Передать клиента → {p?.name}</div>
              <div style={{fontSize:11,color:"#8892b0",marginBottom:12}}>Клиент получит контакт мастера, мастер — информацию о заявке</div>
              <Input label="ИМЯ КЛИЕНТА" value={refClient} onChange={setRefClient2} placeholder="Кого передаёте"/>
              <Input label="ПРОБЛЕМА" value={refProblem} onChange={setRefProblem2} placeholder="Что нужно сделать" big/>
              <div style={{background:"#090d1a",borderRadius:10,padding:12,marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,color:"#8892b0",letterSpacing:1,marginBottom:6}}>КЛИЕНТ ПОЛУЧИТ:</div>
                <div style={{fontSize:13,color:"#d0d8f0",lineHeight:1.6}}>
                  «{refClient||"___"}, рекомендую вам проверенного мастера по {p?.notes?.split(".")[0]?.toLowerCase()||"технике"} — <b style={{color:"#e879f9"}}>{p?.name}</b>, тел. <b>{p?.phone}</b>. Обратитесь от Фиксиков — он в курсе!»
                </div>
                <Sig name={user.name}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn outline onClick={()=>setShowRefer2(null)}>Отмена</Btn>
                <Btn full color="#e879f9" disabled={!refClient} onClick={()=>sendReferral(p)}>📤 Передать</Btn>
              </div>
            </div>;
          })()}

          {/* Partner cards */}
          {partners.map((p,i) => {
            const pRefs = referrals.filter(r=>r.partnerId===p.id);
            const isExpanded = expandedP === p.id;
            return <div key={p.id} style={{background:"#0e1222",borderRadius:14,border:"1px solid #1e2a4a",overflow:"hidden",marginBottom:10,animation:`slideIn 0.3s ease ${i*0.05}s both`}}>
              <div style={{padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:800,color:"#f0e6ff"}}>{p.name}</div>
                    <a href={`tel:${p.phone}`} style={{fontSize:12,color:"#4d9fff",textDecoration:"none"}}>📞 {p.phone}</a>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {pRefs.length > 0 && <span style={{background:"#e879f915",borderRadius:8,padding:"3px 8px",fontSize:11,color:"#e879f9",fontWeight:700}}>📤 {pRefs.length}</span>}
                    {p.rating > 0 && <span style={{fontSize:13,color:"#ffd93d"}}>{"⭐".repeat(Math.min(p.rating,5))}</span>}
                  </div>
                </div>

                {/* Specializations */}
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                  {(p.spec||[]).map(s => CATS[s]).filter(Boolean).map((c,j) => <span key={j} style={{background:`${c.icon?'#ff8c42':'#555'}12`,borderRadius:6,padding:"3px 8px",fontSize:10,color:"#ff8c42"}}>{c.icon} {c.label}</span>)}
                  {(!p.spec||p.spec.length===0)&&p.notes&&<span style={{fontSize:11,color:"#8892b0"}}>{p.notes}</span>}
                </div>

                {p.notes && p.spec?.length > 0 && <div style={{fontSize:11,color:"#8892b0",marginBottom:8}}>📝 {p.notes}</div>}

                <div style={{display:"flex",gap:8}}>
                  <Btn color="#e879f9" onClick={()=>{setShowRefer2(p.id);setRefClient2("");setRefProblem2("");}}>📤 Передать клиента</Btn>
                  <Btn outline onClick={()=>setExpandedP2(isExpanded?null:p.id)}>{isExpanded?"Скрыть":"История"} ({pRefs.length})</Btn>
                </div>
              </div>

              {/* Referral history */}
              {isExpanded && <div style={{background:"#090d1a",padding:14,borderTop:"1px solid #1e2a4a",animation:"slideIn 0.2s ease"}}>
                {pRefs.length === 0 ? <div style={{fontSize:12,color:"#8892b0",textAlign:"center",padding:10}}>Ещё не было передач</div> :
                pRefs.map((r,j) => <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:j<pRefs.length-1?"1px solid #1a1a3e":"none"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#f0e6ff"}}>{r.clientName}</div>
                    <div style={{fontSize:11,color:"#8892b0"}}>{r.problem||"—"}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:11,color:"#e879f9"}}>{r.date}</div>
                    <div style={{fontSize:10,color:"#8892b0"}}>от {r.sentBy}</div>
                  </div>
                </div>)}
              </div>}
            </div>;
          })}

          {partners.length===0 && <div style={{background:"#0e1222",borderRadius:16,padding:28,border:"1px solid #1e2a4a",textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:8}}>🤝</div>
            <div style={{fontSize:14,color:"#8892b0"}}>Добавьте доверенных мастеров</div>
            <div style={{fontSize:12,color:"#555",marginTop:4}}>По холодильникам, кондиционерам, телевизорам — кому доверяете клиентов</div>
          </div>}

          {/* All referrals log */}
          {referrals.length > 0 && <div style={{marginTop:18}}>
            <div style={{fontSize:14,fontWeight:800,color:"#f0e6ff",marginBottom:10}}>📊 Все переданные заявки ({referrals.length})</div>
            {referrals.map((r,i) => <div key={r.id} style={{background:"#0e1222",borderRadius:10,padding:12,border:"1px solid #1e2a4a",borderLeft:"3px solid #e879f9",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"#f0e6ff"}}>{r.clientName} → <span style={{color:"#e879f9"}}>{r.partnerName}</span></div>
                {r.problem && <div style={{fontSize:11,color:"#8892b0"}}>{r.problem}</div>}
              </div>
              <div style={{textAlign:"right",fontSize:10,color:"#8892b0"}}>{r.date}<br/>от {r.sentBy}</div>
            </div>)}
          </div>}
        </div>;
      })()}

      {/* ── Wallet ── */}
      {tab==="wallet"&&<div style={{animation:"slideIn 0.3s ease"}}>
        {(()=>{const totI=myWallet.filter(e=>e.type==="income").reduce((s,e)=>s+e.amount,0);const totE=myWallet.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0);return<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            <div style={{background:"#6bcb7710",borderRadius:12,padding:"10px 6px",textAlign:"center",border:"1px solid #6bcb7720"}}><div style={{fontSize:17,fontWeight:800,color:"#6bcb77",fontFamily:"'JetBrains Mono',monospace"}}>+{fmt(totI)}</div><div style={{fontSize:9,color:"#8892b0"}}>Доходы</div></div>
            <div style={{background:"#ff6b6b10",borderRadius:12,padding:"10px 6px",textAlign:"center",border:"1px solid #ff6b6b20"}}><div style={{fontSize:17,fontWeight:800,color:"#ff6b6b",fontFamily:"'JetBrains Mono',monospace"}}>−{fmt(totE)}</div><div style={{fontSize:9,color:"#8892b0"}}>Расходы</div></div>
            <div style={{background:"#4d9fff10",borderRadius:12,padding:"10px 6px",textAlign:"center",border:"1px solid #4d9fff20"}}><div style={{fontSize:17,fontWeight:800,color:"#4d9fff",fontFamily:"'JetBrains Mono',monospace"}}>{fmt(totI-totE)}</div><div style={{fontSize:9,color:"#8892b0"}}>Итого</div></div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <Btn full color="#6bcb77" onClick={()=>{const a=prompt("Сумма дохода:");const d=prompt("Описание:");if(a&&d)updateData("wallet",user.id,[{id:`w${Date.now()}`,type:"income",desc:d,amount:+a,date:new Date().toLocaleDateString("ru-RU")},...myWallet]);}}>＋ Доход</Btn>
            <Btn full color="#ff6b6b" onClick={()=>{const a=prompt("Сумма расхода:");const d=prompt("Описание:");if(a&&d)updateData("wallet",user.id,[{id:`w${Date.now()}`,type:"expense",desc:d,amount:+a,date:new Date().toLocaleDateString("ru-RU")},...myWallet]);}}>＋ Расход</Btn>
          </div>
          {myWallet.map((e,i)=><div key={e.id} style={{background:"#0e1222",borderRadius:10,padding:12,border:"1px solid #1e2a4a",borderLeft:`3px solid ${e.type==="income"?"#6bcb77":"#ff6b6b"}`,marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontSize:12,fontWeight:700,color:"#f0e6ff"}}>{e.desc}</div><div style={{fontSize:10,color:"#8892b0"}}>{e.date}</div></div>
            <span style={{fontSize:14,fontWeight:800,color:e.type==="income"?"#6bcb77":"#ff6b6b",fontFamily:"'JetBrains Mono',monospace"}}>{e.type==="income"?"+":"−"}{fmt(e.amount)}</span>
          </div>)}
        </>;})()}
      </div>}
    </div>

    {/* Bottom nav */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0a0f1f",borderTop:"1px solid #1e2a4a",display:"flex",justifyContent:"center",padding:"6px 0 10px",zIndex:100}}>
      <div style={{display:"flex",maxWidth:500,width:"100%"}}>
        {tabs.map(t=><button key={t.key} onClick={()=>setTab(t.key)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:"6px 0",color:tab===t.key?"#ff8c42":"#8892b0"}}>
          <span style={{fontSize:20,filter:tab===t.key?"drop-shadow(0 0 6px #ff8c4280)":"none"}}>{t.icon}</span>
          <span style={{fontSize:10,fontWeight:tab===t.key?800:600}}>{t.label}</span>
          {tab===t.key&&<div style={{width:20,height:3,borderRadius:2,background:"#ff8c42",marginTop:1}}/>}
        </button>)}
      </div>
    </div>
  </div>;
}
