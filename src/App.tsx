import { useState, useEffect, useCallback, useRef } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Sun, Moon, TrendingUp, TrendingDown, PiggyBank, CreditCard, Wallet,
  Plus, Pencil, Trash2, LayoutDashboard, ArrowDownCircle, ShoppingCart,
  Pin, BookMarked, Target, ChevronRight, AlertTriangle, X, Save,
  Utensils, HeartPulse, Car, Fuel, Bike, Home, Smartphone, Shirt,
  BookOpen, MoreHorizontal, User, ArrowUpRight, ArrowDownRight, Zap,
  Settings, Download, Upload, Copy, BarChart2, Bell, Calendar,
  Users, RefreshCw, Layers, CheckCircle
} from "lucide-react";

// ── localStorage helpers (substitui window.storage) ──────────────────────
const storage = {
  get: (key: string) => {
    try { const v = localStorage.getItem(key); return v ? { value: v } : null; } catch { return null; }
  },
  set: (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch {}
  },
  delete: (key: string) => {
    try { localStorage.removeItem(key); } catch {}
  }
};

// ── Constants ──────────────────────────────────────────────────────────────
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MESES_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const CATEGORIAS = ["🍗 Alimentação","🔋 Saúde e Bem-estar","🚗 Transporte","⛽ Gasolina","🚴 Lazer","🏠 Casa","📱 Tecnologia","👕 Vestuário","📚 Educação","Outros"];
const PAGAMENTOS = ["Pix / Dinheiro","Débito","Crédito","Crédito Passado","TED/DOC"];
const TIPOS_RESERVA = ["Meta","Renda Fixa","Renda Variável","Reserva de emergência","Tesouro Direto","CDB","Outros"];
const MEMBRO_CORES = ["#6366f1","#ec4899","#10b981","#f59e0b","#0891b2","#8b5cf6","#ef4444","#14b8a6"];
const HOJE = new Date();
const MES_ATUAL = HOJE.getMonth();
const ANO_ATUAL = HOJE.getFullYear();
const uid = () => Math.random().toString(36).slice(2,9);
const fmt = (v: any) => (+(v||0)).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtS = (v: any) => { const n=+(v||0); return n>=1000?"R$"+(n/1000).toFixed(1)+"k":fmt(n); };
const pct = (v: number,t: number) => t>0?((v/t)*100).toFixed(1)+"%":"0%";
const EMPTY_DATA = () => ({entradas:[] as any[],gastos_var:[] as any[],gastos_fix:[] as any[],reservas:[] as any[]});
const META_DEFAULT: any = { emergencia:{meta:270000,total:2300,nome:"Reserva de Emergência"}, carro:{meta:65000,total:500,nome:"Carro"} };
const CARD_DEFAULT = [{id:"c1",nome:"Cartão Principal",bandeira:"Mastercard",numero:"4291",limite:5000,vencimento:"10",cor:"linear-gradient(135deg,#1e1b4b,#4f46e5)",membroId:null}];
const CARD_GRADIENTS = ["linear-gradient(135deg,#1e1b4b,#4f46e5)","linear-gradient(135deg,#064e3b,#059669)","linear-gradient(135deg,#4a1942,#be185d)","linear-gradient(135deg,#1c1917,#44403c)","linear-gradient(135deg,#0c1a3a,#1e40af)","linear-gradient(135deg,#431407,#c2410c)"];
const CAT_COLORS = ["#6366f1","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444","#ec4899","#14b8a6","#f97316","#64748b"];
const CAT_ICONS: any = {"🍗 Alimentação":<Utensils size={13}/>,"🔋 Saúde e Bem-estar":<HeartPulse size={13}/>,"🚗 Transporte":<Car size={13}/>,"⛽ Gasolina":<Fuel size={13}/>,"🚴 Lazer":<Bike size={13}/>,"🏠 Casa":<Home size={13}/>,"📱 Tecnologia":<Smartphone size={13}/>,"👕 Vestuário":<Shirt size={13}/>,"📚 Educação":<BookOpen size={13}/>,"Outros":<MoreHorizontal size={13}/>};

const LIGHT: any = {dark:false,bg:"#f0f4ff",sidebar:"#fff",card:"#fff",text:"#0f172a",sub:"#64748b",border:"#e2e8f0",rowAlt:"#f8fafc",inputBg:"#f8fafc",shadowCard:"0 2px 16px rgba(0,0,0,0.06)",navItemActive:"#f0f4ff",navText:"#64748b",navTextActive:"#6366f1",accent:"#6366f1"};
const DARK: any  = {dark:true,bg:"#0d1117",sidebar:"#161b27",card:"#1a2236",text:"#f1f5f9",sub:"#8892a4",border:"#243044",rowAlt:"#1e2a40",inputBg:"#0d1117",shadowCard:"0 2px 16px rgba(0,0,0,0.3)",navItemActive:"rgba(99,102,241,0.15)",navText:"#8892a4",navTextActive:"#818cf8",accent:"#6366f1"};

const useIsMobile = () => {
  const [m,setM]=useState(window.innerWidth<768);
  useEffect(()=>{const h=()=>setM(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return m;
};

// ── Primitives ─────────────────────────────────────────────────────────────
const SI = ({value,onChange,placeholder,type="text",T,style={}}: any) => (
  <input value={value} onChange={(e:any)=>onChange(e.target.value)} placeholder={placeholder} type={type}
    style={{padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box" as any,background:T.inputBg,color:T.text,...style}}/>
);
const SS = ({value,onChange,options,T}: any) => (
  <select value={value} onChange={(e:any)=>onChange(e.target.value)}
    style={{padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box" as any,background:T.inputBg,color:T.text}}>
    {options.map((o: string)=><option key={o} value={o}>{o}</option>)}
  </select>
);
const FL = ({label,children,T}: any) => (
  <div style={{marginBottom:14}}>
    <label style={{fontSize:11,fontWeight:700,color:T.sub,display:"block",marginBottom:6,textTransform:"uppercase" as any,letterSpacing:.5}}>{label}</label>
    {children}
  </div>
);
const GC = ({children,style={},T}: any) => (
  <div style={{background:T.card,borderRadius:20,padding:20,boxShadow:T.shadowCard,border:`1px solid ${T.border}`,...style}}>{children}</div>
);
const AB = ({onClick,children,small,color,style={}}: any) => (
  <button onClick={onClick} style={{background:color||"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",border:"none",borderRadius:small?8:10,padding:small?"6px 12px":"10px 16px",cursor:"pointer",fontSize:small?12:13,fontWeight:700,display:"flex",alignItems:"center",gap:6,...style}}>{children}</button>
);
const GhostBtn = ({onClick,children,T,color,style={}}: any) => (
  <button onClick={onClick} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:9,padding:"6px 12px",cursor:"pointer",color:color||T.sub,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5,...style}}>{children}</button>
);
const Toggle = ({value,onChange,T}: any) => (
  <div onClick={()=>onChange(!value)} style={{width:40,height:22,borderRadius:99,background:value?"#6366f1":T.border,cursor:"pointer",transition:"background .2s",position:"relative",flexShrink:0}}>
    <div style={{position:"absolute",top:3,left:value?20:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
  </div>
);

const Avatar = ({membro,size=28,style={}}: any) => {
  if(!membro) return <div style={{width:size,height:size,borderRadius:"50%",background:"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",...style}}><User size={size*.5} color="#94a3b8"/></div>;
  return <div style={{width:size,height:size,borderRadius:"50%",background:membro.cor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.38,fontWeight:800,color:"#fff",flexShrink:0,...style}}>{membro.nome.charAt(0).toUpperCase()}</div>;
};
const MembroTag = ({membroId,membros,T}: any) => {
  const m=membros?.find((x: any)=>x.id===membroId);
  if(!m) return <span style={{color:T.sub,fontSize:10}}>—</span>;
  return <div style={{display:"flex",alignItems:"center",gap:4}}><Avatar membro={m} size={16}/><span style={{fontSize:11,fontWeight:600,color:m.cor}}>{m.nome}</span></div>;
};
const MembroSelect = ({value,onChange,membros,T,label,allowAll=false}: any) => (
  <FL label={label||"Quem?"} T={T}>
    <div style={{display:"flex",gap:8,flexWrap:"wrap" as any}}>
      {allowAll&&<button onClick={()=>onChange(null)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:99,border:`1.5px solid ${value===null?"#6366f1":T.border}`,background:value===null?"#6366f118":"transparent",color:value===null?"#6366f1":T.sub,cursor:"pointer",fontSize:12,fontWeight:600}}><Users size={12}/>Todos</button>}
      {membros.map((m: any)=>(
        <button key={m.id} onClick={()=>onChange(m.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:99,border:`1.5px solid ${value===m.id?m.cor:T.border}`,background:value===m.id?m.cor+"18":"transparent",color:value===m.id?m.cor:T.sub,cursor:"pointer",fontSize:12,fontWeight:600}}>
          <Avatar membro={m} size={16}/>{m.nome}
        </button>
      ))}
    </div>
  </FL>
);

function MembrosModal({membros,onChange,onClose,T}: any) {
  const [list,setList]=useState(membros.map((m: any)=>({...m})));
  const add=()=>setList((p: any)=>[...p,{id:uid(),nome:"",cor:MEMBRO_CORES[p.length%MEMBRO_CORES.length]}]);
  const upd=(id: string,k: string,v: any)=>setList((p: any)=>p.map((m: any)=>m.id===id?{...m,[k]:v}:m));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:3000,backdropFilter:"blur(4px)"}}>
      <div style={{background:T.card,borderRadius:"24px 24px 0 0",padding:24,width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto" as any,boxShadow:"0 -8px 40px rgba(0,0,0,0.3)",border:`1px solid ${T.border}`}}>
        <div style={{width:40,height:4,borderRadius:99,background:T.border,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{margin:0,fontSize:15,fontWeight:800,color:T.text}}>Membros</h3>
          <button onClick={onClose} style={{background:T.border,border:"none",cursor:"pointer",borderRadius:10,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",color:T.sub}}><X size={14}/></button>
        </div>
        <p style={{fontSize:12,color:T.sub,marginBottom:14}}>Funciona solo ou em grupo.</p>
        {list.map((m: any)=>(
          <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:12,background:T.bg,borderRadius:12,border:`1px solid ${T.border}`}}>
            <Avatar membro={m.nome?m:{...m,nome:"?"}} size={34}/>
            <div style={{flex:1}}><SI value={m.nome} onChange={(v: string)=>upd(m.id,"nome",v)} placeholder="Nome" T={T} style={{padding:"7px 10px",fontSize:12}}/></div>
            <div style={{display:"flex",gap:4}}>
              {MEMBRO_CORES.slice(0,5).map((c: string)=><div key={c} onClick={()=>upd(m.id,"cor",c)} style={{width:18,height:18,borderRadius:"50%",background:c,cursor:"pointer",border:m.cor===c?"3px solid #fff":"2px solid transparent",boxShadow:m.cor===c?"0 0 0 2px "+c:"none",transition:"all .15s"}}/>)}
            </div>
            {list.length>1&&<button onClick={()=>setList((p: any)=>p.filter((x: any)=>x.id!==m.id))} style={{background:"#fee2e2",border:"none",cursor:"pointer",borderRadius:7,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",color:"#ef4444"}}><Trash2 size={11}/></button>}
          </div>
        ))}
        {list.length<6&&<button onClick={add} style={{width:"100%",padding:"9px",background:"none",border:`1.5px dashed ${T.border}`,borderRadius:12,cursor:"pointer",color:T.sub,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:14}}><Plus size={13}/>Adicionar membro</button>}
        <div style={{display:"flex",gap:10}}>
          <AB onClick={()=>{onChange(list.filter((m: any)=>m.nome.trim()));onClose();}} style={{flex:1,justifyContent:"center"}}><Save size={13}/>Salvar</AB>
          <button onClick={onClose} style={{flex:1,background:T.border,color:T.sub,border:"none",borderRadius:10,padding:"10px",cursor:"pointer",fontSize:13,fontWeight:700}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function Modal({tipo,form,setForm,onSave,onClose,editId,T,cartoes,getGastoCartao,membros,metas}: any) {
  if(!tipo) return null;
  const f=(k: string)=>(v: any)=>setForm((p: any)=>({...p,[k]:v}));
  const titles: any={entrada:"Nova Entrada",gasto_var:"Gasto Variável",gasto_fix:"Gasto Fixo",reserva:"Reserva / Investimento",meta:"Nova Meta"};
  const colors: any={entrada:"#10b981",gasto_var:"#ef4444",gasto_fix:"#f59e0b",reserva:"#6366f1",meta:"#8b5cf6"};
  const isCredit=["Crédito","Crédito Passado"].includes(form.pgto);
  const showCartao=(tipo==="gasto_var"||tipo==="gasto_fix")&&isCredit;
  const selCard=cartoes.find((c: any)=>c.id===(form.cartaoId||cartoes[0]?.id));
  const gastoCard=selCard?getGastoCartao(selCard.id):0;
  const limCard=+(selCard?.limite||0);
  const usoCard=limCard>0?Math.min((gastoCard/limCard)*100,100):0;
  const barCard=usoCard>85?"#ef4444":usoCard>60?"#f59e0b":"#10b981";
  const metasList=Object.entries(metas||{});
  const mesInicio=+(form.mesInicio??MES_ATUAL);
  const numParcelas=+(form.numParcelas||2);
  const mesFim=(mesInicio+numParcelas-1)%12;
  const anoFim=ANO_ATUAL+Math.floor((mesInicio+numParcelas-1)/12);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:2000,backdropFilter:"blur(4px)"}}>
      <div style={{background:T.card,borderRadius:"24px 24px 0 0",padding:24,width:"100%",maxWidth:480,maxHeight:"93vh",overflowY:"auto" as any,boxShadow:"0 -8px 40px rgba(0,0,0,0.3)",border:`1px solid ${T.border}`}}>
        <div style={{width:40,height:4,borderRadius:99,background:T.border,margin:"0 auto 18px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:10,background:colors[tipo]+"22",display:"flex",alignItems:"center",justifyContent:"center"}}><Zap size={14} color={colors[tipo]}/></div>
            <h3 style={{margin:0,fontSize:16,fontWeight:800,color:T.text}}>{editId?"Editar":titles[tipo]}</h3>
          </div>
          <button onClick={onClose} style={{background:T.border,border:"none",cursor:"pointer",borderRadius:10,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",color:T.sub}}><X size={14}/></button>
        </div>
        {tipo==="entrada"&&<>
          {membros.length>0&&<MembroSelect value={form.membroId||null} onChange={f("membroId")} membros={membros} T={T} label="Quem recebeu?"/>}
          <FL label="Nome" T={T}><SI value={form.nome} onChange={f("nome")} placeholder="Ex: Salário" T={T}/></FL>
          <FL label="Valor (R$)" T={T}><SI value={form.valor} onChange={f("valor")} type="number" T={T}/></FL>
          <div style={{padding:"12px 14px",background:T.bg,borderRadius:12,border:`1px solid ${T.border}`,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:13,fontWeight:700,color:T.text,display:"flex",alignItems:"center",gap:6}}><RefreshCw size={13} color="#6366f1"/>Salário fixo (recorrente)</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>Aparece automaticamente todo mês</div></div>
              <Toggle value={!!form.recorrente} onChange={(v: boolean)=>f("recorrente")(v)} T={T}/>
            </div>
            {form.recorrente&&<div style={{marginTop:10,fontSize:12,padding:"7px 10px",background:"#6366f118",borderRadius:8,color:"#6366f1",fontWeight:600,display:"flex",alignItems:"center",gap:6}}><CheckCircle size={12}/>Esta entrada aparecerá em todos os meses.</div>}
          </div>
        </>}
        {tipo==="gasto_var"&&<>
          {membros.length>0&&<MembroSelect value={form.membroId||null} onChange={f("membroId")} membros={membros} T={T} label="Quem pagou?"/>}
          <FL label="Categoria" T={T}><SS value={form.categoria} onChange={f("categoria")} options={CATEGORIAS} T={T}/></FL>
          <FL label="Pagamento" T={T}><SS value={form.pgto} onChange={f("pgto")} options={PAGAMENTOS} T={T}/></FL>
          {showCartao&&cartoes.length>0&&<FL label="Cartão" T={T}><select value={form.cartaoId||cartoes[0].id} onChange={(e: any)=>f("cartaoId")(e.target.value)} style={{padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box" as any,background:T.inputBg,color:T.text}}>{cartoes.map((c: any)=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></FL>}
          {showCartao&&selCard&&limCard>0&&<div style={{borderRadius:12,padding:"10px 14px",background:selCard.cor||CARD_GRADIENTS[0],marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.6)"}}>{selCard.nome}</span><span style={{fontSize:10,color:"rgba(255,255,255,0.7)"}}>{usoCard.toFixed(0)}% usado</span></div>
            <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,height:4,marginBottom:6}}><div style={{background:barCard,width:usoCard+"%",height:"100%",borderRadius:99}}/></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}><span style={{color:"rgba(255,255,255,0.55)"}}>Gasto: <strong style={{color:"#fca5a5"}}>{fmt(gastoCard)}</strong></span><span style={{color:"rgba(255,255,255,0.55)"}}>Disponível: <strong style={{color:"#6ee7b7"}}>{fmt(Math.max(limCard-gastoCard,0))}</strong></span></div>
          </div>}
          <FL label="Valor da parcela (R$)" T={T}><SI value={form.valor} onChange={f("valor")} type="number" T={T}/></FL>
          <FL label="Data" T={T}><SI value={form.data} onChange={f("data")} type="date" T={T}/></FL>
          <FL label="Essencial?" T={T}><SS value={form.essencial} onChange={f("essencial")} options={["Sim","Não"]} T={T}/></FL>
          {!editId&&<div style={{padding:"12px 14px",background:T.bg,borderRadius:12,border:`1px solid ${T.border}`,marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:form.parcelado?12:0}}>
              <div><div style={{fontSize:13,fontWeight:700,color:T.text,display:"flex",alignItems:"center",gap:6}}><Layers size={13} color="#ef4444"/>Compra parcelada</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>Lança automaticamente em cada mês</div></div>
              <Toggle value={!!form.parcelado} onChange={(v: boolean)=>f("parcelado")(v)} T={T}/>
            </div>
            {form.parcelado&&<>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:10}}>
                <FL label="Nº de parcelas" T={T}><SI value={form.numParcelas||""} onChange={f("numParcelas")} type="number" placeholder="Ex: 10" T={T} style={{padding:"7px 10px",fontSize:12}}/></FL>
                <FL label="Mês inicial" T={T}><select value={form.mesInicio??MES_ATUAL} onChange={(e: any)=>f("mesInicio")(+e.target.value)} style={{padding:"7px 10px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:12,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box" as any,background:T.inputBg,color:T.text}}>{MESES.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></FL>
              </div>
              {numParcelas>0&&<div style={{padding:"8px 12px",background:"#ef444412",borderRadius:8,fontSize:11,color:"#ef4444",fontWeight:600,display:"flex",alignItems:"center",gap:6}}><Layers size={11}/>{numParcelas}x de {fmt(+form.valor||0)} · De {MESES[mesInicio]} até {MESES[mesFim]}{anoFim>ANO_ATUAL?` ${anoFim}`:""}</div>}
            </>}
          </div>}
        </>}
        {tipo==="gasto_fix"&&<>
          {membros.length>0&&<MembroSelect value={form.membroId||null} onChange={f("membroId")} membros={membros} T={T} label="Quem pagou?"/>}
          <FL label="Nome" T={T}><SI value={form.nome} onChange={f("nome")} placeholder="Ex: Aluguel" T={T}/></FL>
          <FL label="Pagamento" T={T}><SS value={form.pgto||"Débito"} onChange={f("pgto")} options={PAGAMENTOS} T={T}/></FL>
          {showCartao&&cartoes.length>0&&<FL label="Cartão" T={T}><select value={form.cartaoId||cartoes[0].id} onChange={(e: any)=>f("cartaoId")(e.target.value)} style={{padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box" as any,background:T.inputBg,color:T.text}}>{cartoes.map((c: any)=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></FL>}
          <FL label="Valor Planejado" T={T}><SI value={form.planejado} onChange={f("planejado")} type="number" T={T}/></FL>
          <div style={{padding:"12px 14px",background:T.bg,borderRadius:12,border:`1px solid ${T.border}`,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:13,fontWeight:700,color:T.text,display:"flex",alignItems:"center",gap:6}}><CheckCircle size={13} color={form.pago?"#10b981":"#94a3b8"}/>{form.pago?"✅ Já foi pago":"⏳ Ainda não pago"}</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>{form.pago?"Valor e data registrados":"Marque quando pagar"}</div></div>
              <Toggle value={!!form.pago} onChange={(v: boolean)=>setForm((p: any)=>({...p,pago:v,valor:v?p.planejado:p.valor}))} T={T}/>
            </div>
          </div>
          {form.pago&&<>
            <FL label="Valor Pago (R$)" T={T}><SI value={form.valor} onChange={f("valor")} type="number" T={T}/></FL>
            <FL label="Data do Pagamento" T={T}><SI value={form.data_pago} onChange={f("data_pago")} type="date" T={T}/></FL>
          </>}
        </>}
        {tipo==="reserva"&&<>
          {membros.length>0&&<MembroSelect value={form.membroId||null} onChange={f("membroId")} membros={membros} T={T} label="Quem reservou?" allowAll/>}
          <FL label="Tipo" T={T}><SS value={form.tipo} onChange={f("tipo")} options={TIPOS_RESERVA} T={T}/></FL>
          {form.tipo==="Meta"&&metasList.length>0&&<FL label="Qual meta?" T={T}>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {metasList.map(([k,m]: any)=>{const p=Math.min((m.total/m.meta)*100,100);return(
                <div key={k} onClick={()=>f("metaId")(k)} style={{padding:"10px 14px",borderRadius:12,border:`2px solid ${form.metaId===k?"#6366f1":T.border}`,background:form.metaId===k?"#6366f108":T.bg,cursor:"pointer",transition:"all .15s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>{form.metaId===k&&<CheckCircle size={13} color="#6366f1"/>}<span style={{fontSize:13,fontWeight:700,color:form.metaId===k?"#6366f1":T.text}}>{m.nome}</span></div>
                    <span style={{fontSize:11,color:T.sub}}>{p.toFixed(0)}% · {fmt(m.total)} / {fmt(m.meta)}</span>
                  </div>
                  <div style={{background:T.border,borderRadius:99,height:5}}><div style={{background:"linear-gradient(90deg,#6366f1,#8b5cf6)",width:p+"%",height:"100%",borderRadius:99}}/></div>
                  {form.metaId===k&&form.valor>0&&<div style={{marginTop:8,fontSize:11,color:"#10b981",fontWeight:600,display:"flex",alignItems:"center",gap:4}}><ArrowUpRight size={11}/>+{fmt(+form.valor)} → novo total: {fmt(m.total+(+form.valor||0))}</div>}
                </div>
              );})}
            </div>
          </FL>}
          <FL label="Nome" T={T}><SI value={form.nome} onChange={f("nome")} placeholder="Ex: Tesouro Direto" T={T}/></FL>
          <FL label="Valor" T={T}><SI value={form.valor} onChange={f("valor")} type="number" T={T}/></FL>
          <FL label="Data" T={T}><SI value={form.data} onChange={f("data")} type="date" T={T}/></FL>
        </>}
        {tipo==="meta"&&<>
          <FL label="Nome da Meta" T={T}><SI value={form.nome} onChange={f("nome")} placeholder="Ex: Viagem" T={T}/></FL>
          <FL label="Valor da Meta (R$)" T={T}><SI value={form.meta} onChange={f("meta")} type="number" T={T}/></FL>
          <FL label="Já reservado (R$)" T={T}><SI value={form.total} onChange={f("total")} type="number" T={T}/></FL>
        </>}
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <AB onClick={onSave} style={{flex:1,justifyContent:"center"}}><Save size={13}/>Salvar</AB>
          <button onClick={onClose} style={{flex:1,background:T.border,color:T.sub,border:"none",borderRadius:10,padding:"10px",cursor:"pointer",fontSize:13,fontWeight:700}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function CreditCardVisual({card,gastoTotal,T,onEdit,membro}: any) {
  const limite=+(card.limite||0);
  const usoPct=limite>0?Math.min((gastoTotal/limite)*100,100):0;
  const barColor=usoPct>85?"#ef4444":usoPct>60?"#f59e0b":"#10b981";
  return (
    <div>
      <div style={{borderRadius:22,padding:"20px 24px",background:card.cor||CARD_GRADIENTS[0],position:"relative",overflow:"hidden",minHeight:178,boxShadow:"0 12px 40px rgba(99,102,241,0.3)",userSelect:"none" as any}}>
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,position:"relative",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:36,height:26,borderRadius:5,background:"linear-gradient(135deg,#fbbf24,#f59e0b)",display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,padding:3}}>{[0,1,2,3].map(i=><div key={i} style={{background:"rgba(0,0,0,0.15)",borderRadius:2}}/>)}</div>
            {membro&&<Avatar membro={membro} size={22} style={{border:"2px solid rgba(255,255,255,0.3)"}}/>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            {card.vencimento&&<span style={{fontSize:9,color:"rgba(255,255,255,0.45)"}}>Vence dia {card.vencimento}</span>}
            <div style={{display:"flex"}}><div style={{width:20,height:20,borderRadius:"50%",background:"#ef4444",opacity:.9}}/><div style={{width:20,height:20,borderRadius:"50%",background:"#f59e0b",opacity:.9,marginLeft:-7}}/></div>
          </div>
        </div>
        <div style={{position:"relative",zIndex:1,marginBottom:10}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",letterSpacing:1,textTransform:"uppercase" as any,marginBottom:2}}>Gasto no crédito</div>
          <div style={{fontSize:22,fontWeight:800,color:"#fff"}}>{fmt(gastoTotal)}</div>
          {limite>0&&<div style={{fontSize:9,color:"rgba(255,255,255,0.45)",marginTop:1}}>Limite: {fmt(limite)}</div>}
        </div>
        {limite>0&&<div style={{position:"relative",zIndex:1,marginBottom:10}}><div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,height:4}}><div style={{background:barColor,width:usoPct+"%",height:"100%",borderRadius:99}}/></div></div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",position:"relative",zIndex:1}}>
          <div><div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:2,marginBottom:2}}>•••• •••• •••• {card.numero||"0000"}</div><div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.7)"}}>{card.nome.toUpperCase()}</div></div>
          <button onClick={onEdit} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:7,padding:"4px 9px",cursor:"pointer",color:"#fff",display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600}}><Settings size={10}/>Editar</button>
        </div>
      </div>
      {limite>0&&<div style={{display:"flex",gap:8,marginTop:8}}>
        <div style={{flex:1,background:T.card,borderRadius:10,padding:"8px 12px",border:`1px solid ${T.border}`}}><div style={{fontSize:9,color:T.sub,marginBottom:2,textTransform:"uppercase" as any,letterSpacing:.5}}>Usado</div><div style={{fontSize:13,fontWeight:800,color:"#ef4444"}}>{fmt(gastoTotal)}</div></div>
        <div style={{flex:1,background:T.card,borderRadius:10,padding:"8px 12px",border:`1px solid ${T.border}`}}><div style={{fontSize:9,color:T.sub,marginBottom:2,textTransform:"uppercase" as any,letterSpacing:.5}}>Disponível</div><div style={{fontSize:13,fontWeight:800,color:"#10b981"}}>{fmt(Math.max(+(card.limite||0)-gastoTotal,0))}</div></div>
      </div>}
    </div>
  );
}

function CardModal({card,onChange,onClose,T,membros}: any) {
  const [f,setF]=useState({...card});
  const upd=(k: string)=>(v: any)=>setF((p: any)=>({...p,[k]:v}));
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:2500,backdropFilter:"blur(4px)"}}>
      <div style={{background:T.card,borderRadius:"24px 24px 0 0",padding:24,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto" as any,boxShadow:"0 -8px 40px rgba(0,0,0,0.3)",border:`1px solid ${T.border}`}}>
        <div style={{width:40,height:4,borderRadius:99,background:T.border,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <h3 style={{margin:0,fontSize:15,fontWeight:800,color:T.text}}>Configurar Cartão</h3>
          <button onClick={onClose} style={{background:T.border,border:"none",cursor:"pointer",borderRadius:10,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",color:T.sub}}><X size={14}/></button>
        </div>
        <div style={{borderRadius:14,padding:"14px 18px",background:f.cor||CARD_GRADIENTS[0],marginBottom:18,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,0.07)"}}/>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginBottom:3}}>•••• •••• •••• {f.numero||"0000"}</div>
          <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{f.nome||"Cartão"}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:2}}>Limite: {fmt(+f.limite||0)} · Vence dia {f.vencimento||"—"}</div>
        </div>
        <FL label="Nome" T={T}><SI value={f.nome} onChange={upd("nome")} placeholder="Ex: Nubank" T={T}/></FL>
        <FL label="Últimos 4 dígitos" T={T}><SI value={f.numero} onChange={(v: string)=>upd("numero")(v.slice(0,4))} placeholder="1234" T={T}/></FL>
        <FL label="Bandeira" T={T}><SS value={f.bandeira} onChange={upd("bandeira")} options={["Mastercard","Visa","Elo","American Express","Hipercard"]} T={T}/></FL>
        <FL label="Limite (R$)" T={T}><SI value={f.limite} onChange={upd("limite")} type="number" T={T}/></FL>
        <FL label="Dia de vencimento" T={T}><SI value={f.vencimento} onChange={(v: string)=>upd("vencimento")(v.slice(0,2))} placeholder="Ex: 10" T={T}/></FL>
        {membros.length>0&&<MembroSelect value={f.membroId||null} onChange={(v: any)=>upd("membroId")(v)} membros={membros} T={T} label="Pertence a quem?" allowAll/>}
        <FL label="Cor" T={T}><div style={{display:"flex",gap:8,flexWrap:"wrap" as any}}>{CARD_GRADIENTS.map((g,i)=><div key={i} onClick={()=>upd("cor")(g)} style={{width:34,height:22,borderRadius:5,background:g,cursor:"pointer",border:f.cor===g?"3px solid #fff":"3px solid transparent",boxShadow:f.cor===g?"0 0 0 2px #6366f1":"none",transition:"all .15s"}}/>)}</div></FL>
        <div style={{display:"flex",gap:10}}>
          <AB onClick={()=>{onChange(f);onClose();}} style={{flex:1,justifyContent:"center"}}><Save size={13}/>Salvar</AB>
          <button onClick={onClose} style={{flex:1,background:T.border,color:T.sub,border:"none",borderRadius:10,padding:"10px",cursor:"pointer",fontSize:13,fontWeight:700}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

const NAVITEMS: any[]=[
  ["dashboard",<LayoutDashboard size={18}/>,"Dashboard"],
  ["membros",<Users size={18}/>,"Membros"],
  ["entradas",<TrendingUp size={18}/>,"Entradas"],
  ["gastos",<ShoppingCart size={18}/>,"Gastos"],
  ["fixos",<Pin size={18}/>,"Fixos"],
  ["reservas",<PiggyBank size={18}/>,"Reservas"],
  ["metas",<Target size={18}/>,"Metas"],
  ["relatorios",<BarChart2 size={18}/>,"Relatórios"],
];

function Sidebar({tab,setTab,T,dark,toggleDark,membros,setShowMembros}: any) {
  const [col,setCol]=useState(false);
  const W=col?66:220;
  const C=(active: boolean)=>({width:"100%",display:"flex",alignItems:"center",gap:col?0:10,justifyContent:col?"center":"flex-start" as any,padding:col?"10px 0":"10px 12px",borderRadius:12,border:"none",cursor:"pointer",marginBottom:2,background:active?T.navItemActive:"transparent",color:active?T.navTextActive:T.navText,fontWeight:active?700:500,fontSize:13,transition:"all .15s",position:"relative" as any});
  return (
    <div style={{width:W,minHeight:"100vh",background:T.sidebar,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column" as any,padding:"22px 0",flexShrink:0,position:"sticky" as any,top:0,height:"100vh",boxSizing:"border-box" as any,transition:"width .25s cubic-bezier(.4,0,.2,1)",overflow:"hidden"}}>
      <div style={{padding:"0 14px 20px",display:"flex",alignItems:"center",justifyContent:col?"center":"space-between"}}>
        {!col&&<div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Zap size={15} color="#fff"/></div>
          <div><div style={{fontSize:14,fontWeight:800,color:T.text,whiteSpace:"nowrap" as any}}>FinanceHub</div><div style={{fontSize:9,color:T.sub}}>2026</div></div>
        </div>}
        {col&&<div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center"}}><Zap size={15} color="#fff"/></div>}
        {!col&&<button onClick={()=>setCol(true)} style={{background:T.border,border:"none",cursor:"pointer",borderRadius:7,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",color:T.sub,flexShrink:0}}><ChevronRight size={12} style={{transform:"rotate(180deg)"}}/></button>}
      </div>
      {col&&<div style={{display:"flex",justifyContent:"center",marginBottom:14}}><button onClick={()=>setCol(false)} style={{background:T.border,border:"none",cursor:"pointer",borderRadius:7,width:32,height:24,display:"flex",alignItems:"center",justifyContent:"center",color:T.sub}}><ChevronRight size={12}/></button></div>}
      {!col&&membros.length>0&&<div style={{margin:"0 10px 14px",padding:"10px 12px",borderRadius:12,background:T.navItemActive,cursor:"pointer"}} onClick={()=>setShowMembros(true)}>
        <div style={{fontSize:9,color:T.sub,marginBottom:5,textTransform:"uppercase" as any,letterSpacing:.5,fontWeight:700}}>Membros</div>
        <div style={{display:"flex",alignItems:"center",gap:2}}>
          {membros.slice(0,4).map((m: any,i: number)=><Avatar key={m.id} membro={m} size={22} style={{marginLeft:i===0?0:-5,border:`2px solid ${T.sidebar}`}}/>)}
          <span style={{fontSize:11,color:T.sub,marginLeft:7}}>{membros.length} {membros.length===1?"membro":"membros"}</span>
        </div>
      </div>}
      <div style={{flex:1,padding:"0 8px",overflowY:"auto" as any}}>
        {!col&&<div style={{fontSize:9,fontWeight:700,color:T.sub,padding:"0 10px",marginBottom:6,letterSpacing:1,textTransform:"uppercase" as any}}>Menu</div>}
        {NAVITEMS.map(([k,ic,l]: any)=>(
          <button key={k} onClick={()=>setTab(k)} title={col?l:undefined} style={C(tab===k)}>
            <span style={{opacity:tab===k?1:.65,flexShrink:0}}>{ic}</span>
            {!col&&<><span>{l}</span>{tab===k&&<div style={{width:4,height:4,borderRadius:"50%",background:T.accent,marginLeft:"auto"}}/>}</>}
            {col&&tab===k&&<div style={{position:"absolute",right:3,width:3,height:3,borderRadius:"50%",background:T.accent}}/>}
          </button>
        ))}
      </div>
      <div style={{padding:"12px 8px 0",borderTop:`1px solid ${T.border}`}}>
        <button onClick={toggleDark} style={{...C(false),marginBottom:0}}>
          {dark?<Sun size={16}/>:<Moon size={16}/>}{!col&&(dark?"Modo Claro":"Modo Escuro")}
        </button>
      </div>
    </div>
  );
}

function BottomNav({tab,setTab,T}: any) {
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:T.sidebar,borderTop:`1px solid ${T.border}`,display:"flex",zIndex:200}}>
      {NAVITEMS.slice(0,5).map(([k,ic,l]: any)=>(
        <button key={k} onClick={()=>setTab(k)} style={{flex:1,display:"flex",flexDirection:"column" as any,alignItems:"center",gap:2,padding:"9px 0 7px",border:"none",cursor:"pointer",background:"transparent",color:tab===k?T.accent:T.navText,position:"relative" as any}}>
          <span style={{opacity:tab===k?1:.6}}>{ic}</span>
          <span style={{fontSize:9,fontWeight:tab===k?700:500}}>{l}</span>
          {tab===k&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:18,height:2,borderRadius:99,background:T.accent}}/>}
        </button>
      ))}
    </div>
  );
}

function MobileHeader({T,dark,toggleDark,mes,setMes,tab,membros,setShowMembros}: any) {
  const label=NAVITEMS.find((n: any)=>n[0]===tab)?.[2]||"Dashboard";
  return (
    <div style={{background:T.sidebar,borderBottom:`1px solid ${T.border}`,padding:"11px 14px",position:"sticky" as any,top:0,zIndex:100}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center"}}><Zap size={12} color="#fff"/></div>
          <span style={{fontSize:14,fontWeight:800,color:T.text}}>{label}</span>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {membros.length>0&&<div onClick={()=>setShowMembros(true)} style={{display:"flex",alignItems:"center",cursor:"pointer"}}>{membros.slice(0,3).map((m: any,i: number)=><Avatar key={m.id} membro={m} size={22} style={{marginLeft:i===0?0:-5,border:`2px solid ${T.sidebar}`}}/>)}</div>}
          <button onClick={toggleDark} style={{background:T.navItemActive,border:"none",cursor:"pointer",borderRadius:7,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",color:T.sub}}>{dark?<Sun size={13}/>:<Moon size={13}/>}</button>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.inputBg,borderRadius:10,padding:"5px 12px",border:`1px solid ${T.border}`}}>
        <button onClick={()=>setMes((m: number)=>(m-1+12)%12)} style={{background:"none",border:"none",cursor:"pointer",color:T.sub,display:"flex",padding:3}}><ChevronRight size={14} style={{transform:"rotate(180deg)"}}/></button>
        <span style={{fontSize:13,fontWeight:700,color:T.text}}>{MESES[mes]}</span>
        <button onClick={()=>setMes((m: number)=>(m+1)%12)} style={{background:"none",border:"none",cursor:"pointer",color:T.sub,display:"flex",padding:3}}><ChevronRight size={14}/></button>
      </div>
    </div>
  );
}

function KpiCard({label,value,prev,color,gradient,icon,T}: any) {
  const diff=prev!==undefined?value-prev:null;
  const up=diff===null||diff>=0;
  return (
    <div style={{background:gradient||T.card,borderRadius:16,padding:14,flex:1,minWidth:120,boxShadow:T.shadowCard,border:`1px solid ${gradient?"transparent":T.border}`,position:"relative",overflow:"hidden"}}>
      {gradient&&<div style={{position:"absolute",top:-20,right:-20,width:70,height:70,borderRadius:"50%",background:"rgba(255,255,255,0.1)"}}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div style={{fontSize:9,fontWeight:700,color:gradient?"rgba(255,255,255,0.65)":T.sub,textTransform:"uppercase" as any,letterSpacing:.5}}>{label}</div>
        <div style={{width:26,height:26,borderRadius:7,background:gradient?"rgba(255,255,255,0.2)":color+"18",display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</div>
      </div>
      <div style={{fontSize:17,fontWeight:800,color:gradient?"#fff":T.text,marginBottom:3}}>{fmtS(value)}</div>
      {diff!==null&&<div style={{display:"flex",alignItems:"center",gap:3,fontSize:10,fontWeight:600,color:gradient?"rgba(255,255,255,0.75)":up?"#10b981":"#ef4444"}}>
        {up?<ArrowUpRight size={10}/>:<ArrowDownRight size={10}/>}{fmt(Math.abs(diff))} vs ant.
      </div>}
    </div>
  );
}

export default function App() {
  const isMob=useIsMobile();
  const [dark,setDark]=useState(false);
  const T=dark?DARK:LIGHT;
  const [mes,setMes]=useState(MES_ATUAL);
  const [membros,setMembros]=useState([{id:"m1",nome:"Eu",cor:"#6366f1"}]);
  const [showMembros,setShowMembros]=useState(false);
  const [allData,setAllData]=useState(()=>{const d: any={};MESES.forEach((_,i)=>d[i]=EMPTY_DATA());return d;});
  const [metas,setMetas]=useState(META_DEFAULT);
  const [cartoes,setCartoes]=useState(CARD_DEFAULT);
  const [orcamentos,setOrcamentos]=useState<any>({});
  const [entradasFixas,setEntradasFixas]=useState<any[]>([]);
  const [editCard,setEditCard]=useState<any>(null);
  const [tab,setTab]=useState("dashboard");
  const [modal,setModal]=useState<any>(null);
  const [form,setForm]=useState<any>({});
  const [showOrcModal,setShowOrcModal]=useState(false);
  const restoreRef=useRef<any>(null);

  // ── Load from localStorage ────────────────────────────────────────────
  useEffect(()=>{
    try {
      const r1=storage.get("fin_data3");  if(r1)setAllData(JSON.parse(r1.value));
      const r2=storage.get("fin_metas3"); if(r2)setMetas(JSON.parse(r2.value));
      const r4=storage.get("fin_dark");   if(r4)setDark(r4.value==="1");
      const r5=storage.get("fin_cards3"); if(r5)setCartoes(JSON.parse(r5.value));
      const r6=storage.get("fin_orc3");   if(r6)setOrcamentos(JSON.parse(r6.value));
      const r7=storage.get("fin_mbr3");   if(r7)setMembros(JSON.parse(r7.value));
      const r8=storage.get("fin_efixas"); if(r8)setEntradasFixas(JSON.parse(r8.value));
    } catch {}
  },[]);

  const persist=useCallback((data: any,m: any,c: any,o: any,mb: any,ef: any)=>{
    storage.set("fin_data3",JSON.stringify(data));
    storage.set("fin_metas3",JSON.stringify(m));
    storage.set("fin_cards3",JSON.stringify(c));
    storage.set("fin_orc3",JSON.stringify(o));
    storage.set("fin_mbr3",JSON.stringify(mb));
    storage.set("fin_efixas",JSON.stringify(ef));
  },[]);
  const toggleDark=()=>setDark(d=>{storage.set("fin_dark",d?"0":"1");return !d;});

  const D=allData[mes];
  const setD=(fn: any)=>setAllData((prev: any)=>{const next={...prev,[mes]:fn(prev[mes])};persist(next,metas,cartoes,orcamentos,membros,entradasFixas);return next;});

  const entradasComFixas=[...D.entradas,...entradasFixas.filter((ef: any)=>!D.entradas.find((e: any)=>e.fixaId===ef.id)).map((ef: any)=>({...ef,fixaId:ef.id,id:`fixa_${ef.id}_${mes}`,isFixa:true}))];

  const totE=entradasComFixas.reduce((s: number,e: any)=>s+(+e.valor||0),0);
  const totV=D.gastos_var.reduce((s: number,e: any)=>s+(+e.valor||0),0);
  const totF=D.gastos_fix.reduce((s: number,e: any)=>s+(+e.valor||0),0);
  const totR=D.reservas.reduce((s: number,e: any)=>s+(+e.valor||0),0);
  const totCre=D.gastos_var.filter((e: any)=>e.pgto==="Crédito").reduce((s: number,e: any)=>s+(+e.valor||0),0);
  const totDeb=[...D.gastos_var,...D.gastos_fix].filter((e: any)=>e.pgto==="Débito").reduce((s: number,e: any)=>s+(+e.valor||0),0);
  const restante=totE-totV-totF-totR;
  const pD=allData[mes-1];
  const pE=(pD?.entradas.reduce((s: number,e: any)=>s+(+e.valor||0),0)??0)+entradasFixas.reduce((s: number,e: any)=>s+(+e.valor||0),0);
  const pS=(pD?.gastos_var.reduce((s: number,e: any)=>s+(+e.valor||0),0)??0)+(pD?.gastos_fix.reduce((s: number,e: any)=>s+(+e.valor||0),0)??0);

  const gastosPorCartao=(id: string)=>[...D.gastos_var,...D.gastos_fix].filter((e: any)=>["Crédito","Crédito Passado"].includes(e.pgto)&&(e.cartaoId===id||(id===cartoes[0]?.id&&!e.cartaoId))).reduce((s: number,e: any)=>s+(+e.valor||0),0);
  const cardName=(id: string)=>cartoes.find((c: any)=>c.id===id)?.nome||cartoes[0]?.nome||"—";
  const getMembro=(id: string)=>membros.find((m: any)=>m.id===id)||null;
  const catSpend: any={};D.gastos_var.forEach((g: any)=>catSpend[g.categoria]=(catSpend[g.categoria]||0)+(+g.valor||0));
  const alerts=Object.entries(orcamentos).filter(([cat,lim]: any)=>catSpend[cat]>0&&(catSpend[cat]/lim)>=0.8);
  const chartData=Array.from({length:6},(_,i)=>{const idx=(mes-5+i+12)%12;const dI=allData[idx];const ef=entradasFixas.reduce((s: number,e: any)=>s+(+e.valor||0),0);return{name:MESES_SHORT[idx],Entradas:dI.entradas.reduce((s: number,e: any)=>s+(+e.valor||0),0)+ef,Saídas:dI.gastos_var.reduce((s: number,e: any)=>s+(+e.valor||0),0)+dI.gastos_fix.reduce((s: number,e: any)=>s+(+e.valor||0),0),Reservas:dI.reservas.reduce((s: number,e: any)=>s+(+e.valor||0),0)};});
  const cats: any={};D.gastos_var.forEach((g: any)=>cats[g.categoria]=(cats[g.categoria]||0)+(+g.valor||0));
  const pieData=Object.entries(cats).sort((a: any,b: any)=>b[1]-a[1]).slice(0,5).map(([n,v]: any)=>({name:n,value:v}));
  const annualData=MESES.map((m,i)=>{const dI=allData[i];const ef=entradasFixas.reduce((s: number,e: any)=>s+(+e.valor||0),0);const e=dI.entradas.reduce((s: number,x: any)=>s+(+x.valor||0),0)+ef;const s2=dI.gastos_var.reduce((s: number,x: any)=>s+(+x.valor||0),0)+dI.gastos_fix.reduce((s: number,x: any)=>s+(+x.valor||0),0);const r=dI.reservas.reduce((s: number,x: any)=>s+(+x.valor||0),0);return{mes:m,mesIdx:i,entradas:e,saidas:s2,reservas:r,saldo:e-s2-r};});
  const annualTotal={entradas:annualData.reduce((s,d)=>s+d.entradas,0),saidas:annualData.reduce((s,d)=>s+d.saidas,0),reservas:annualData.reduce((s,d)=>s+d.reservas,0),saldo:annualData.reduce((s,d)=>s+d.saldo,0)};
  const metaProjection=(meta: any)=>{const avg=Array.from({length:3},(_,i)=>allData[(mes-i+12)%12].reservas.reduce((s: number,e: any)=>s+(+e.valor||0),0)).reduce((s: number,v: number)=>s+v,0)/3;if(avg<=0)return null;const meses=Math.ceil((meta.meta-meta.total)/avg);const dt=new Date(HOJE);dt.setMonth(dt.getMonth()+meses);return{meses,data:dt.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})};};

  const DEFS: any={
    entrada:{nome:"",valor:"",membroId:membros[0]?.id||null,recorrente:false},
    gasto_var:{categoria:CATEGORIAS[0],pgto:PAGAMENTOS[0],valor:"",data:"",essencial:"Não",cartaoId:cartoes[0]?.id||"",membroId:membros[0]?.id||null,parcelado:false,numParcelas:"",mesInicio:MES_ATUAL},
    gasto_fix:{nome:"",planejado:"",valor:"",data_pago:"",pgto:"Débito",cartaoId:cartoes[0]?.id||"",membroId:membros[0]?.id||null,pago:false},
    reserva:{nome:"",tipo:TIPOS_RESERVA[0],valor:"",data:"",membroId:null,metaId:null},
    meta:{nome:"",meta:"",total:""},
  };

  const openAdd=(tipo: string)=>{setForm(DEFS[tipo]||{});setModal({tipo});};
  const openEdit=(tipo: string,item: any)=>{setForm({...item});setModal({tipo,editId:item.id});};
  const closeModal=()=>setModal(null);

  const saveItem=()=>{
    const{tipo,editId}=modal;
    const upd=(list: any[])=>list.map(i=>i.id===editId?{...form,id:editId}:i);
    if(tipo==="entrada"){
      if(form.recorrente){const ef={...form,id:editId||uid()};const next=editId?entradasFixas.map((e: any)=>e.id===editId?ef:e):[...entradasFixas,ef];setEntradasFixas(next);persist(allData,metas,cartoes,orcamentos,membros,next);}
      else{setD((d: any)=>({...d,entradas:editId?upd(d.entradas):[...d.entradas,{...form,id:uid()}]}));}
    }
    if(tipo==="gasto_var"){
      if(!editId&&form.parcelado&&+form.numParcelas>0){
        const parcelaId=uid();const total=+form.numParcelas;const startMes=+(form.mesInicio??MES_ATUAL);
        setAllData((prev: any)=>{const next={...prev};for(let i=0;i<total;i++){const idx=(startMes+i)%12;if(!next[idx])next[idx]=EMPTY_DATA();next[idx]={...next[idx],gastos_var:[...next[idx].gastos_var,{...form,id:uid(),parcelaId,parcelaNum:i+1,parcelaTotal:total,parcelado:true}]};}persist(next,metas,cartoes,orcamentos,membros,entradasFixas);return next;});
      } else {setD((d: any)=>({...d,gastos_var:editId?upd(d.gastos_var):[...d.gastos_var,{...form,id:uid()}]}));}
    }
    if(tipo==="gasto_fix") setD((d: any)=>({...d,gastos_fix:editId?upd(d.gastos_fix):[...d.gastos_fix,{...form,id:uid()}]}));
    if(tipo==="reserva"){
      setD((d: any)=>({...d,reservas:editId?upd(d.reservas):[...d.reservas,{...form,id:uid()}]}));
      if(form.metaId&&form.valor){const oldVal=editId?D.reservas.find((r: any)=>r.id===editId)?.valor||0:0;const diff=(+form.valor)-(+oldVal);setMetas((prev: any)=>{const n={...prev,[form.metaId]:{...prev[form.metaId],total:Math.max(0,(prev[form.metaId]?.total||0)+diff)}};persist(allData,n,cartoes,orcamentos,membros,entradasFixas);return n;});}
    }
    if(tipo==="meta"){const k=editId||uid();setMetas((prev: any)=>{const n={...prev,[k]:{nome:form.nome,meta:+form.meta,total:+form.total}};persist(allData,n,cartoes,orcamentos,membros,entradasFixas);return n;});}
    closeModal();
  };

  const del=(tipo: string,id: string,item?: any)=>{
    if(tipo==="entrada_fixa"){const next=entradasFixas.filter((e: any)=>e.id!==id);setEntradasFixas(next);persist(allData,metas,cartoes,orcamentos,membros,next);return;}
    if(tipo==="entrada")setD((d: any)=>({...d,entradas:d.entradas.filter((e: any)=>e.id!==id)}));
    if(tipo==="gasto_var"){
      if(item?.parcelaId){setAllData((prev: any)=>{const next: any={};MESES.forEach((_,i)=>{next[i]={...prev[i],gastos_var:prev[i].gastos_var.filter((e: any)=>e.parcelaId!==item.parcelaId)};});persist(next,metas,cartoes,orcamentos,membros,entradasFixas);return next;});return;}
      setD((d: any)=>({...d,gastos_var:d.gastos_var.filter((e: any)=>e.id!==id)}));
    }
    if(tipo==="gasto_fix")setD((d: any)=>({...d,gastos_fix:d.gastos_fix.filter((e: any)=>e.id!==id)}));
    if(tipo==="reserva"){const reserva=D.reservas.find((r: any)=>r.id===id);if(reserva?.metaId&&reserva.valor){setMetas((prev: any)=>{const n={...prev,[reserva.metaId]:{...prev[reserva.metaId],total:Math.max(0,(prev[reserva.metaId]?.total||0)-(+reserva.valor))}};persist(allData,n,cartoes,orcamentos,membros,entradasFixas);return n;});}setD((d: any)=>({...d,reservas:d.reservas.filter((e: any)=>e.id!==id)}));}
  };

  const updateCard=(c: any)=>{const next=cartoes.map((x: any)=>x.id===c.id?c:x);setCartoes(next);persist(allData,metas,next,orcamentos,membros,entradasFixas);};
  const copyFixos=()=>{const nm=(mes+1)%12;setAllData((prev: any)=>{const next={...prev,[nm]:{...prev[nm],gastos_fix:[...prev[nm].gastos_fix,...D.gastos_fix.map((f: any)=>({...f,id:uid(),valor:"",data_pago:"",pago:false}))]}};persist(next,metas,cartoes,orcamentos,membros,entradasFixas);return next;});alert(`✅ Copiado para ${MESES[(mes+1)%12]}!`);};
  const exportCSV=()=>{const rows=[["Tipo","Membro","Nome","Valor","Data","Info"]];entradasComFixas.forEach((e: any)=>rows.push(["Entrada",getMembro(e.membroId)?.nome||"—",e.nome,e.valor,"",e.isFixa?"recorrente":""]));D.gastos_var.forEach((e: any)=>rows.push(["Gasto Var",getMembro(e.membroId)?.nome||"—",e.categoria,e.valor,e.data,e.parcelado?`parcela ${e.parcelaNum}/${e.parcelaTotal}`:""]));D.gastos_fix.forEach((e: any)=>rows.push(["Gasto Fix",getMembro(e.membroId)?.nome||"—",e.nome,e.valor,e.data_pago,e.pago?"pago":"pendente"]));D.reservas.forEach((e: any)=>rows.push(["Reserva",getMembro(e.membroId)?.nome||"—",e.nome,e.valor,e.data,e.metaId?`Meta: ${metas[e.metaId]?.nome}`:""]));const csv=rows.map(r=>r.join(";")).join("\n");const blob=new Blob([csv],{type:"text/csv"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`financehub_${MESES[mes]}.csv`;a.click();URL.revokeObjectURL(url);};
  const backup=()=>{const data={allData,metas,cartoes,orcamentos,membros,entradasFixas,version:3};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`financehub_backup.json`;a.click();URL.revokeObjectURL(url);};
  const restore=(e: any)=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=(ev: any)=>{try{const data=JSON.parse(ev.target.result);if(data.allData)setAllData(data.allData);if(data.metas)setMetas(data.metas);if(data.cartoes)setCartoes(data.cartoes);if(data.orcamentos)setOrcamentos(data.orcamentos);if(data.membros)setMembros(data.membros);if(data.entradasFixas)setEntradasFixas(data.entradasFixas);persist(data.allData||allData,data.metas||metas,data.cartoes||cartoes,data.orcamentos||orcamentos,data.membros||membros,data.entradasFixas||entradasFixas);alert("✅ Restaurado!");}catch{alert("❌ Arquivo inválido.");}};reader.readAsText(file);e.target.value="";};

  const th: any={textAlign:"left",fontSize:10,fontWeight:700,color:T.sub,padding:"7px 10px",borderBottom:`1px solid ${T.border}`,textTransform:"uppercase",letterSpacing:.5};
  const td: any={fontSize:12,padding:"8px 10px",borderBottom:`1px solid ${T.border}`,verticalAlign:"middle",color:T.text};
  const MTag=({membroId}: any)=><MembroTag membroId={membroId} membros={membros} T={T}/>;
  const actBtns=(tipo: string,item: any)=>(
    <td style={{...td,whiteSpace:"nowrap"}}>
      {!item?.isFixa&&!item?.parcelado&&<button onClick={()=>openEdit(tipo,item)} style={{background:T.border,border:"none",cursor:"pointer",borderRadius:7,padding:5,marginRight:4,display:"inline-flex",color:T.sub}}><Pencil size={11}/></button>}
      <button onClick={()=>del(tipo,item.id,item)} style={{background:"#fee2e2",border:"none",cursor:"pointer",borderRadius:7,padding:5,display:"inline-flex",color:"#ef4444"}}><Trash2 size={11}/></button>
    </td>
  );
  const SecHdr=({icon,label,btnLabel,btnAction,color="#6366f1",extra}: any)=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap" as any,gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:28,height:28,borderRadius:8,background:color+"18",display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</div>
        <h3 style={{margin:0,fontSize:14,fontWeight:800,color:T.text}}>{label}</h3>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap" as any}}>{extra}{btnAction&&<AB onClick={btnAction} small><Plus size={12}/>{btnLabel}</AB>}</div>
    </div>
  );

  const P=isMob?"12px":"22px 26px";

  return (
    <div style={{display:"flex",fontFamily:"'Inter',system-ui,sans-serif",background:T.bg,minHeight:"100vh",transition:"background .3s"}}>
      {!isMob&&<Sidebar tab={tab} setTab={setTab} T={T} dark={dark} toggleDark={toggleDark} membros={membros} setShowMembros={setShowMembros}/>}
      <div style={{flex:1,display:"flex",flexDirection:"column" as any,minHeight:"100vh",overflow:"auto"}}>
        {isMob&&<MobileHeader T={T} dark={dark} toggleDark={toggleDark} mes={mes} setMes={setMes} tab={tab} membros={membros} setShowMembros={setShowMembros}/>}

        <div style={{padding:P,flex:1,paddingBottom:isMob?"88px":P}}>
          {!isMob&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap" as any,gap:10}}>
            <div><h2 style={{margin:0,fontSize:18,fontWeight:800,color:T.text}}>{NAVITEMS.find((n: any)=>n[0]===tab)?.[2]}</h2><div style={{fontSize:11,color:T.sub,marginTop:2}}>{HOJE.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div></div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" as any}}>
              <div style={{display:"flex",alignItems:"center",gap:6,background:T.inputBg,border:`1px solid ${T.border}`,borderRadius:11,padding:"5px 12px"}}>
                <button onClick={()=>setMes((m: number)=>(m-1+12)%12)} style={{background:"none",border:"none",cursor:"pointer",color:T.sub,display:"flex",padding:0}}><ChevronRight size={13} style={{transform:"rotate(180deg)"}}/></button>
                <span style={{fontSize:13,fontWeight:700,color:T.text,minWidth:68,textAlign:"center"}}>{MESES[mes]}</span>
                <button onClick={()=>setMes((m: number)=>(m+1)%12)} style={{background:"none",border:"none",cursor:"pointer",color:T.sub,display:"flex",padding:0}}><ChevronRight size={13}/></button>
              </div>
              {alerts.length>0&&<div style={{display:"flex",alignItems:"center",gap:5,background:"#fee2e2",borderRadius:9,padding:"5px 10px",color:"#ef4444",fontSize:11,fontWeight:700}}><Bell size={12}/>{alerts.length} alerta(s)</div>}
              <GhostBtn onClick={exportCSV} T={T}><Download size={12}/>CSV</GhostBtn>
              <GhostBtn onClick={backup} T={T}><Download size={12}/>Backup</GhostBtn>
              <GhostBtn onClick={()=>restoreRef.current?.click()} T={T}><Upload size={12}/>Restaurar</GhostBtn>
              <input ref={restoreRef} type="file" accept=".json" onChange={restore} style={{display:"none"}}/>
            </div>
          </div>}

          {/* DASHBOARD */}
          {tab==="dashboard"&&(<>
            <div style={{display:"grid",gridTemplateColumns:isMob?"1fr 1fr":"repeat(5,1fr)",gap:10,marginBottom:16}}>
              <KpiCard label="Renda" value={totE} prev={pE} color="#10b981" gradient="linear-gradient(135deg,#059669,#10b981)" icon={<TrendingUp size={13} color="#fff"/>} T={T}/>
              <KpiCard label="Saídas" value={totV+totF} prev={pS} color="#ef4444" icon={<TrendingDown size={13} color="#ef4444"/>} T={T}/>
              <KpiCard label="Reservas" value={totR} color="#6366f1" icon={<PiggyBank size={13} color="#6366f1"/>} T={T}/>
              <KpiCard label="Disponível" value={restante} color={restante>=0?"#10b981":"#ef4444"} icon={<Wallet size={13} color={restante>=0?"#10b981":"#ef4444"}/>} T={T}/>
              <KpiCard label="Crédito" value={totCre} color="#f59e0b" icon={<CreditCard size={13} color="#f59e0b"/>} T={T}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
              <GC T={T}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div><h3 style={{margin:0,fontSize:13,fontWeight:800,color:T.text}}>Fluxo de Caixa</h3><div style={{fontSize:9,color:T.sub}}>Últimos 6 meses</div></div><div style={{display:"flex",gap:8,fontSize:9,color:T.sub}}>{[["#6366f1","Entradas"],["#ef4444","Saídas"],["#10b981","Reservas"]].map(([c,l])=><span key={l} style={{display:"flex",alignItems:"center",gap:3}}><span style={{width:6,height:6,borderRadius:2,background:c,display:"inline-block"}}/>{l}</span>)}</div></div>
                <ResponsiveContainer width="100%" height={150}><BarChart data={chartData} barSize={7} barGap={2}><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:9,fill:T.sub}}/><YAxis hide/><Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,fontSize:11,color:T.text}} formatter={(v: any)=>fmt(v)}/><Bar dataKey="Entradas" fill="#6366f1" radius={[4,4,0,0]}/><Bar dataKey="Saídas" fill="#ef4444" radius={[4,4,0,0]} opacity={.7}/><Bar dataKey="Reservas" fill="#10b981" radius={[4,4,0,0]} opacity={.8}/></BarChart></ResponsiveContainer>
              </GC>
              <GC T={T}>
                <div style={{marginBottom:12}}><h3 style={{margin:0,fontSize:13,fontWeight:800,color:T.text}}>Por Categoria</h3><div style={{fontSize:9,color:T.sub}}>{MESES[mes]}</div></div>
                {pieData.length>0?<div style={{display:"flex",alignItems:"center",gap:10}}><PieChart width={100} height={100}><Pie data={pieData} cx={48} cy={48} innerRadius={28} outerRadius={46} dataKey="value" paddingAngle={3}>{pieData.map((_: any,i: number)=><Cell key={i} fill={CAT_COLORS[i%CAT_COLORS.length]}/>)}</Pie></PieChart><div style={{flex:1}}>{pieData.map((d: any,i: number)=><div key={d.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}><div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:T.sub}}><span style={{width:6,height:6,borderRadius:2,background:CAT_COLORS[i%CAT_COLORS.length],display:"inline-block",flexShrink:0}}/><span style={{maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{d.name.replace(/^[^\s]+ /,"")}</span></div><span style={{fontSize:10,fontWeight:700,color:T.text}}>{fmt(d.value)}</span></div>)}</div></div>:<p style={{color:T.sub,textAlign:"center",fontSize:12}}>Sem gastos.</p>}
              </GC>
            </div>
            <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:14,marginBottom:14}}>
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><h3 style={{margin:0,fontSize:13,fontWeight:800,color:T.text}}>Cartões</h3><button onClick={()=>{const nc={id:uid(),nome:"Novo Cartão",bandeira:"Mastercard",numero:"0000",limite:0,vencimento:"",cor:CARD_GRADIENTS[cartoes.length%CARD_GRADIENTS.length],membroId:null};const next=[...cartoes,nc];setCartoes(next);persist(allData,metas,next,orcamentos,membros,entradasFixas);setEditCard(nc);}} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:7,padding:"4px 9px",cursor:"pointer",color:T.accent,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:3}}><Plus size={10}/>Novo</button></div>
                {cartoes.map((card: any)=><div key={card.id} style={{marginBottom:12}}><CreditCardVisual card={card} gastoTotal={gastosPorCartao(card.id)} T={T} onEdit={()=>setEditCard(card)} membro={getMembro(card.membroId)}/></div>)}
              </div>
              <GC T={T} style={{display:"flex",flexDirection:"column" as any}}>
                <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:800,color:T.text}}>Formas de Pagamento</h3>
                {(()=>{const pgtos: any={};[...D.gastos_var,...D.gastos_fix].forEach((g: any)=>{if(g.pgto)pgtos[g.pgto]=(pgtos[g.pgto]||0)+(+g.valor||0);});const total=Object.values(pgtos).reduce((s: any,v: any)=>s+v,0) as number||1;const clrs: any={"Crédito":"#6366f1","Débito":"#0891b2","Pix / Dinheiro":"#10b981","Crédito Passado":"#f59e0b","TED/DOC":"#8b5cf6"};return Object.entries(pgtos).sort((a: any,b: any)=>b[1]-a[1]).map(([p,v]: any)=>(<div key={p} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}><span style={{color:T.text,fontWeight:600,display:"flex",alignItems:"center",gap:4}}><span style={{width:6,height:6,borderRadius:2,background:clrs[p]||"#64748b",display:"inline-block"}}/>{p}</span><span style={{color:T.sub,fontWeight:700}}>{fmt(v)}</span></div><div style={{background:T.border,borderRadius:99,height:5}}><div style={{background:clrs[p]||"#64748b",width:((v/total)*100)+"%",height:"100%",borderRadius:99}}/></div></div>));})()}
                {[...D.gastos_var,...D.gastos_fix].length===0&&<p style={{color:T.sub,fontSize:11,textAlign:"center"}}>Sem gastos.</p>}
                <div style={{borderTop:`1px solid ${T.border}`,paddingTop:10,marginTop:"auto",display:"flex",justifyContent:"space-around"}}>
                  {[["Débito",totDeb,"#0891b2"],["Crédito",totCre,"#6366f1"],["Pix",[...D.gastos_var,...D.gastos_fix].filter((e: any)=>e.pgto==="Pix / Dinheiro").reduce((s: number,e: any)=>s+(+e.valor||0),0),"#10b981"]].map(([l,v,c]: any)=>(<div key={l} style={{textAlign:"center"}}><div style={{fontSize:9,color:T.sub,marginBottom:2,textTransform:"uppercase" as any,letterSpacing:.5}}>{l}</div><div style={{fontSize:13,fontWeight:800,color:c}}>{fmt(v)}</div></div>))}
                </div>
              </GC>
            </div>
            <GC T={T}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{margin:0,fontSize:13,fontWeight:800,color:T.text}}>Metas</h3><button onClick={()=>setTab("metas")} style={{background:"none",border:"none",cursor:"pointer",color:T.accent,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:3}}>Ver todas<ChevronRight size={11}/></button></div>
              <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 1fr",gap:10}}>
                {Object.entries(metas).slice(0,4).map(([k,m]: any)=>{const p=Math.min((m.total/m.meta)*100,100);const proj=metaProjection(m);return(<div key={k} style={{background:T.bg,borderRadius:12,padding:12,border:`1px solid ${T.border}`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:11,fontWeight:700,color:T.text}}>{m.nome}</span><span style={{fontSize:10,fontWeight:700,color:T.accent}}>{p.toFixed(0)}%</span></div><div style={{background:T.border,borderRadius:99,height:5,marginBottom:5}}><div style={{background:"linear-gradient(90deg,#6366f1,#8b5cf6)",width:p+"%",height:"100%",borderRadius:99}}/></div><div style={{fontSize:10,color:T.sub}}>{fmt(m.total)} / {fmt(m.meta)}</div>{proj&&<div style={{fontSize:9,color:"#10b981",marginTop:3,display:"flex",alignItems:"center",gap:3}}><Calendar size={9}/>Estimativa: {proj.data}</div>}</div>);})}
              </div>
            </GC>
          </>)}

          {/* MEMBROS */}
          {tab==="membros"&&(<>
            <GC T={T} style={{marginBottom:14,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap" as any}}>
                <div style={{display:"flex",alignItems:"center"}}>{membros.map((m: any,i: number)=><Avatar key={m.id} membro={m} size={46} style={{marginLeft:i===0?0:-10,border:"3px solid rgba(255,255,255,0.3)"}}/>)}</div>
                <div><div style={{fontSize:10,color:"rgba(255,255,255,0.6)",marginBottom:2}}>Renda total em {MESES[mes]}</div><div style={{fontSize:26,fontWeight:800,color:"#fff"}}>{fmt(totE)}</div></div>
                <button onClick={()=>setShowMembros(true)} style={{marginLeft:"auto",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:10,padding:"7px 13px",cursor:"pointer",color:"#fff",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:5}}><Users size={13}/>Gerenciar</button>
              </div>
            </GC>
            <GC T={T} style={{marginBottom:14}}>
              <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:800,color:T.text}}>Lançamentos em {MESES[mes]}</h3>
              {membros.map((m: any)=>{
                const entM=entradasComFixas.filter((e: any)=>e.membroId===m.id).reduce((s: number,e: any)=>s+(+e.valor||0),0);
                const gasM=[...D.gastos_var,...D.gastos_fix].filter((e: any)=>e.membroId===m.id).reduce((s: number,e: any)=>s+(+e.valor||0),0);
                const resM=D.reservas.filter((e: any)=>e.membroId===m.id).reduce((s: number,e: any)=>s+(+e.valor||0),0);
                return(<div key={m.id} style={{padding:"12px 14px",background:T.bg,borderRadius:12,border:`1.5px solid ${m.cor}22`,marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:entM>0||gasM>0?10:0}}><Avatar membro={m} size={34}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.text}}>{m.nome}</div><div style={{fontSize:10,color:T.sub}}>{entradasComFixas.filter((e: any)=>e.membroId===m.id).length} entrada(s)</div></div>{entM>0&&<div style={{textAlign:"right"}}><div style={{fontSize:9,color:T.sub,marginBottom:1}}>Recebeu</div><div style={{fontSize:15,fontWeight:800,color:"#10b981"}}>{fmt(entM)}</div></div>}</div>
                  {(gasM>0||resM>0)&&<div style={{display:"flex",gap:8,paddingTop:8,borderTop:`1px solid ${T.border}`}}>{gasM>0&&<div style={{flex:1,padding:"6px 10px",background:T.card,borderRadius:8,border:`1px solid ${T.border}`}}><div style={{fontSize:9,color:T.sub,marginBottom:1}}>Pagou</div><div style={{fontSize:13,fontWeight:700,color:"#ef4444"}}>{fmt(gasM)}</div></div>}{resM>0&&<div style={{flex:1,padding:"6px 10px",background:T.card,borderRadius:8,border:`1px solid ${T.border}`}}><div style={{fontSize:9,color:T.sub,marginBottom:1}}>Reservou</div><div style={{fontSize:13,fontWeight:700,color:"#6366f1"}}>{fmt(resM)}</div></div>}</div>}
                </div>);
              })}
              {entradasFixas.length>0&&<div style={{marginTop:14}}><h4 style={{margin:"0 0 10px",fontSize:12,fontWeight:700,color:T.sub,display:"flex",alignItems:"center",gap:5}}><RefreshCw size={12}/>Salários Fixos</h4>{entradasFixas.map((ef: any)=>(<div key={ef.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:T.bg,borderRadius:10,border:`1px solid ${T.border}`,marginBottom:6}}>{ef.membroId?<Avatar membro={getMembro(ef.membroId)} size={24}/>:<div style={{width:24,height:24,borderRadius:"50%",background:T.border,display:"flex",alignItems:"center",justifyContent:"center"}}><User size={11} color={T.sub}/></div>}<div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:T.text}}>{ef.nome}</div><div style={{fontSize:10,color:T.sub}}>todo mês</div></div><div style={{fontSize:13,fontWeight:800,color:"#10b981"}}>{fmt(+ef.valor)}</div><div style={{display:"flex",gap:4}}><button onClick={()=>openEdit("entrada",{...ef,recorrente:true})} style={{background:T.border,border:"none",cursor:"pointer",borderRadius:7,padding:5,display:"inline-flex",color:T.sub}}><Pencil size={11}/></button><button onClick={()=>del("entrada_fixa",ef.id)} style={{background:"#fee2e2",border:"none",cursor:"pointer",borderRadius:7,padding:5,display:"inline-flex",color:"#ef4444"}}><Trash2 size={11}/></button></div></div>))}</div>}
            </GC>
          </>)}

          {/* ENTRADAS */}
          {tab==="entradas"&&(
            <GC T={T}><SecHdr icon={<TrendingUp size={14} color="#10b981"/>} label={`Entradas — ${MESES[mes]}`} btnLabel="Adicionar" btnAction={()=>openAdd("entrada")} color="#10b981" extra={entradasFixas.length>0&&<div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:"#6366f118",borderRadius:8,fontSize:11,color:"#6366f1",fontWeight:600}}><RefreshCw size={11}/>{entradasFixas.length} fixo(s)</div>}/>
              <div style={{overflowX:"auto" as any}}>
                <table style={{width:"100%",borderCollapse:"collapse" as any,minWidth:320}}>
                  <thead><tr><th style={th}>Quem</th><th style={th}>Nome</th><th style={th}>Valor</th><th style={th}>%</th><th style={th}/></tr></thead>
                  <tbody>
                    {entradasComFixas.length===0&&<tr><td colSpan={5} style={{...td,textAlign:"center",padding:28,color:T.sub}}>Nenhuma entrada.</td></tr>}
                    {entradasComFixas.map((e: any)=><tr key={e.id} style={{background:e.isFixa?"#6366f106":""}}>
                      <td style={td}><MTag membroId={e.membroId}/></td>
                      <td style={td}><div style={{display:"flex",alignItems:"center",gap:6}}>{e.isFixa?<div style={{width:20,height:20,borderRadius:5,background:"#6366f118",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><RefreshCw size={10} color="#6366f1"/></div>:<div style={{width:20,height:20,borderRadius:5,background:"#10b98118",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><ArrowDownCircle size={10} color="#10b981"/></div>}<span>{e.nome}</span>{e.isFixa&&<span style={{fontSize:9,background:"#6366f1",color:"#fff",borderRadius:4,padding:"1px 5px"}}>fixo</span>}</div></td>
                      <td style={{...td,color:"#10b981",fontWeight:700}}>{fmt(+e.valor)}</td>
                      <td style={td}><span style={{background:T.bg,borderRadius:4,padding:"1px 5px",fontSize:9,fontWeight:700,color:T.sub}}>{pct(+e.valor,totE)}</span></td>
                      <td style={{...td,whiteSpace:"nowrap" as any}}>{e.isFixa?<><button onClick={()=>openEdit("entrada",{...entradasFixas.find((x: any)=>x.id===e.fixaId),recorrente:true})} style={{background:T.border,border:"none",cursor:"pointer",borderRadius:7,padding:5,marginRight:4,display:"inline-flex",color:T.sub}}><Pencil size={11}/></button><button onClick={()=>del("entrada_fixa",e.fixaId)} style={{background:"#fee2e2",border:"none",cursor:"pointer",borderRadius:7,padding:5,display:"inline-flex",color:"#ef4444"}}><Trash2 size={11}/></button></>:<>{actBtns("entrada",e)}</>}</td>
                    </tr>)}
                    {entradasComFixas.length>0&&<tr style={{background:T.rowAlt}}><td colSpan={2} style={{...td,fontWeight:800}}>Total</td><td style={{...td,fontWeight:800,color:"#10b981"}}>{fmt(totE)}</td><td colSpan={2}/></tr>}
                  </tbody>
                </table>
              </div>
            </GC>
          )}

          {/* GASTOS VAR */}
          {tab==="gastos"&&(
            <GC T={T}><SecHdr icon={<ShoppingCart size={14} color="#ef4444"/>} label={`Gastos Variáveis — ${MESES[mes]}`} btnLabel="Adicionar" btnAction={()=>openAdd("gasto_var")} color="#ef4444" extra={<GhostBtn onClick={()=>setShowOrcModal(true)} T={T} color={T.accent}><Bell size={12}/>Orçamentos</GhostBtn>}/>
              <div style={{overflowX:"auto" as any}}>
                <table style={{width:"100%",borderCollapse:"collapse" as any,minWidth:500}}>
                  <thead><tr><th style={th}>Quem</th><th style={th}>Categoria</th><th style={th}>Pgto</th><th style={th}>Valor</th><th style={th}>Info</th><th style={th}/></tr></thead>
                  <tbody>
                    {D.gastos_var.length===0&&<tr><td colSpan={6} style={{...td,textAlign:"center",padding:28,color:T.sub}}>Nenhum gasto.</td></tr>}
                    {D.gastos_var.map((e: any)=><tr key={e.id} style={{background:e.parcelado?"#ef444406":""}}>
                      <td style={td}><MTag membroId={e.membroId}/></td>
                      <td style={td}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:20,height:20,borderRadius:5,background:"#ef444418",display:"flex",alignItems:"center",justifyContent:"center",color:"#ef4444",flexShrink:0}}>{CAT_ICONS[e.categoria]||<MoreHorizontal size={10}/>}</div><span style={{fontSize:11}}>{e.categoria}</span></div></td>
                      <td style={td}><span style={{background:e.pgto==="Crédito"?"#ede9fe":e.pgto==="Débito"?"#dbeafe":"#f0fdf4",color:e.pgto==="Crédito"?"#6d28d9":e.pgto==="Débito"?"#2563eb":"#166534",borderRadius:99,padding:"2px 7px",fontSize:9,fontWeight:700,whiteSpace:"nowrap" as any}}>{e.pgto}</span></td>
                      <td style={{...td,color:"#ef4444",fontWeight:700}}>{fmt(+e.valor)}</td>
                      <td style={td}>{e.parcelado?<div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:9,background:"#ef4444",color:"#fff",borderRadius:4,padding:"1px 5px",fontWeight:700}}>{e.parcelaNum}/{e.parcelaTotal}</span></div>:e.data||"—"}</td>
                      {actBtns("gasto_var",e)}
                    </tr>)}
                    {D.gastos_var.length>0&&<tr style={{background:T.rowAlt}}><td colSpan={3} style={{...td,fontWeight:800}}>Total</td><td style={{...td,fontWeight:800,color:"#ef4444"}}>{fmt(totV)}</td><td colSpan={2}/></tr>}
                  </tbody>
                </table>
              </div>
            </GC>
          )}

          {/* GASTOS FIXOS */}
          {tab==="fixos"&&(
            <GC T={T}><SecHdr icon={<Pin size={14} color="#f59e0b"/>} label={`Gastos Fixos — ${MESES[mes]}`} btnLabel="Adicionar" btnAction={()=>openAdd("gasto_fix")} color="#f59e0b" extra={D.gastos_fix.length>0&&<GhostBtn onClick={copyFixos} T={T} color="#10b981"><Copy size={12}/>Copiar para {MESES[(mes+1)%12].slice(0,3)}</GhostBtn>}/>
              <div style={{overflowX:"auto" as any}}>
                <table style={{width:"100%",borderCollapse:"collapse" as any,minWidth:500}}>
                  <thead><tr><th style={th}>Quem</th><th style={th}>Nome</th><th style={th}>Pgto</th><th style={th}>Planejado</th><th style={th}>Pago</th><th style={th}>Dif.</th><th style={th}>Status</th><th style={th}/></tr></thead>
                  <tbody>
                    {D.gastos_fix.length===0&&<tr><td colSpan={8} style={{...td,textAlign:"center",padding:28,color:T.sub}}>Nenhum gasto fixo.</td></tr>}
                    {D.gastos_fix.map((e: any)=>{const diff=(+e.valor||0)-(+e.planejado||0);return(
                      <tr key={e.id} style={{background:e.pago?"#f0fdf4":T.rowAlt}}>
                        <td style={td}><MTag membroId={e.membroId}/></td>
                        <td style={td}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:20,height:20,borderRadius:5,background:"#f59e0b18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Pin size={10} color="#f59e0b"/></div>{e.nome}</div></td>
                        <td style={td}><span style={{background:e.pgto==="Crédito"?"#ede9fe":e.pgto==="Débito"?"#dbeafe":"#f0fdf4",color:e.pgto==="Crédito"?"#6d28d9":e.pgto==="Débito"?"#2563eb":"#166634",borderRadius:99,padding:"2px 7px",fontSize:9,fontWeight:700}}>{e.pgto||"Débito"}</span></td>
                        <td style={{...td,color:T.sub}}>{fmt(+e.planejado)}</td>
                        <td style={{...td,fontWeight:700}}>{e.pago?fmt(+e.valor):"—"}</td>
                        <td style={td}>{e.pago?(diff>0?<span style={{color:"#ef4444",fontSize:9,fontWeight:700}}>+{fmt(diff)}</span>:diff<0?<span style={{color:"#10b981",fontSize:9,fontWeight:700}}>{fmt(diff)}</span>:<span style={{color:"#10b981",fontSize:9,fontWeight:700}}>✓</span>):"—"}</td>
                        <td style={td}>{e.pago?<span style={{background:"#dcfce7",color:"#166534",borderRadius:99,padding:"2px 8px",fontSize:9,fontWeight:700,display:"inline-flex",alignItems:"center",gap:3}}><CheckCircle size={9}/>Pago</span>:<span style={{background:"#fef3c7",color:"#92400e",borderRadius:99,padding:"2px 8px",fontSize:9,fontWeight:700}}>⏳ Pendente</span>}</td>
                        {actBtns("gasto_fix",e)}
                      </tr>
                    );})}
                    {D.gastos_fix.length>0&&<tr style={{background:T.rowAlt}}><td colSpan={2} style={{...td,fontWeight:800}}>Total</td><td/><td style={{...td,color:T.sub}}>{fmt(D.gastos_fix.reduce((s: number,e: any)=>s+(+e.planejado||0),0))}</td><td style={{...td,fontWeight:800,color:"#ef4444"}}>{fmt(totF)}</td><td colSpan={3}/></tr>}
                  </tbody>
                </table>
              </div>
            </GC>
          )}

          {/* RESERVAS */}
          {tab==="reservas"&&(
            <GC T={T}><SecHdr icon={<PiggyBank size={14} color="#6366f1"/>} label={`Reservas — ${MESES[mes]}`} btnLabel="Adicionar" btnAction={()=>openAdd("reserva")} color="#6366f1"/>
              <div style={{overflowX:"auto" as any}}>
                <table style={{width:"100%",borderCollapse:"collapse" as any,minWidth:380}}>
                  <thead><tr><th style={th}>Quem</th><th style={th}>Nome</th><th style={th}>Tipo</th><th style={th}>Meta vinculada</th><th style={th}>Valor</th><th style={th}/></tr></thead>
                  <tbody>
                    {D.reservas.length===0&&<tr><td colSpan={6} style={{...td,textAlign:"center",padding:28,color:T.sub}}>Nenhuma reserva.</td></tr>}
                    {D.reservas.map((e: any)=><tr key={e.id}>
                      <td style={td}><MTag membroId={e.membroId}/></td>
                      <td style={td}>{e.nome}</td>
                      <td style={td}><span style={{background:"#ede9fe",color:"#6d28d9",borderRadius:99,padding:"2px 7px",fontSize:9,fontWeight:700}}>{e.tipo}</span></td>
                      <td style={td}>{e.metaId&&metas[e.metaId]?<div style={{display:"flex",alignItems:"center",gap:4}}><Target size={10} color="#8b5cf6"/><span style={{fontSize:11,color:"#8b5cf6",fontWeight:600}}>{metas[e.metaId].nome}</span></div>:"—"}</td>
                      <td style={{...td,color:"#6366f1",fontWeight:700}}>{fmt(+e.valor)}</td>
                      {actBtns("reserva",e)}
                    </tr>)}
                    {D.reservas.length>0&&<tr style={{background:T.rowAlt}}><td colSpan={4} style={{...td,fontWeight:800}}>Total</td><td style={{...td,fontWeight:800,color:"#6366f1"}}>{fmt(totR)}</td><td/></tr>}
                  </tbody>
                </table>
              </div>
            </GC>
          )}

          {/* METAS */}
          {tab==="metas"&&(
            <GC T={T}><SecHdr icon={<Target size={14} color="#8b5cf6"/>} label="Metas" btnLabel="Nova Meta" btnAction={()=>openAdd("meta")} color="#8b5cf6"/>
              <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
                {Object.entries(metas).map(([k,m]: any)=>{const p=Math.min((m.total/m.meta)*100,100);const proj=metaProjection(m);const resV=D.reservas.filter((r: any)=>r.metaId===k);return(
                  <div key={k} style={{background:T.bg,borderRadius:14,padding:16,border:`1px solid ${T.border}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center"}}><Target size={13} color="#fff"/></div><span style={{fontWeight:700,fontSize:13,color:T.text}}>{m.nome}</span></div>
                      <div style={{display:"flex",gap:4}}><button onClick={()=>{setForm({nome:m.nome,meta:m.meta,total:m.total});setModal({tipo:"meta",editId:k});}} style={{background:T.border,border:"none",cursor:"pointer",borderRadius:7,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",color:T.sub}}><Pencil size={11}/></button><button onClick={()=>{setMetas((prev: any)=>{const n={...prev};delete n[k];persist(allData,n,cartoes,orcamentos,membros,entradasFixas);return n;});}} style={{background:"#fee2e2",border:"none",cursor:"pointer",borderRadius:7,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",color:"#ef4444"}}><Trash2 size={11}/></button></div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.sub,marginBottom:5}}><span>Progresso</span><span style={{color:T.accent,fontWeight:700}}>{p.toFixed(1)}%</span></div>
                    <div style={{background:T.border,borderRadius:99,height:7,marginBottom:10}}><div style={{background:"linear-gradient(90deg,#6366f1,#8b5cf6)",width:p+"%",height:"100%",borderRadius:99}}/></div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:8}}><div><div style={{color:T.sub,fontSize:9,marginBottom:2}}>RESERVADO</div><div style={{fontWeight:700,color:"#10b981"}}>{fmt(m.total)}</div></div><div style={{textAlign:"right"}}><div style={{color:T.sub,fontSize:9,marginBottom:2}}>META</div><div style={{fontWeight:700,color:T.text}}>{fmt(m.meta)}</div></div></div>
                    <div style={{padding:"6px 10px",background:"#ef444412",borderRadius:7,display:"flex",alignItems:"center",gap:5,marginBottom:6}}><ChevronRight size={10} color="#ef4444"/><span style={{fontSize:10,color:"#ef4444",fontWeight:700}}>Faltam {fmt(m.meta-m.total)}</span></div>
                    {proj&&<div style={{padding:"5px 10px",background:"#10b98112",borderRadius:7,display:"flex",alignItems:"center",gap:5,marginBottom:6}}><Calendar size={10} color="#10b981"/><span style={{fontSize:10,color:"#10b981",fontWeight:600}}>~{proj.meses} {proj.meses===1?"mês":"meses"} ({proj.data})</span></div>}
                    {resV.length>0&&<div style={{padding:"6px 10px",background:"#8b5cf612",borderRadius:7}}><div style={{fontSize:9,color:"#8b5cf6",fontWeight:700,marginBottom:4}}>ESTE MÊS</div>{resV.map((r: any)=><div key={r.id} style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.sub,marginBottom:2}}><span>{r.nome}</span><span style={{fontWeight:700,color:"#6366f1"}}>+{fmt(+r.valor)}</span></div>)}</div>}
                  </div>
                );})}
              </div>
            </GC>
          )}

          {/* RELATÓRIOS */}
          {tab==="relatorios"&&(<>
            <GC T={T} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap" as any,gap:8}}><div><h3 style={{margin:0,fontSize:14,fontWeight:800,color:T.text}}>Resumo Anual {ANO_ATUAL}</h3></div><div style={{display:"flex",gap:6}}><GhostBtn onClick={exportCSV} T={T}><Download size={12}/>CSV</GhostBtn><GhostBtn onClick={backup} T={T}><Download size={12}/>Backup</GhostBtn></div></div>
              <ResponsiveContainer width="100%" height={180}><LineChart data={annualData.map(d=>({...d,mes:d.mes.slice(0,3)}))}>
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fontSize:9,fill:T.sub}}/><YAxis hide/><Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,fontSize:11,color:T.text}} formatter={(v: any)=>fmt(v)}/>
                <Line type="monotone" dataKey="entradas" stroke="#6366f1" strokeWidth={2} dot={{r:2}} name="Entradas"/><Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} dot={{r:2}} name="Saídas"/><Line type="monotone" dataKey="reservas" stroke="#10b981" strokeWidth={2} dot={{r:2}} name="Reservas"/>
              </LineChart></ResponsiveContainer>
            </GC>
            <GC T={T}>
              <h3 style={{margin:"0 0 12px",fontSize:13,fontWeight:800,color:T.text}}>Detalhamento Mensal</h3>
              <div style={{overflowX:"auto" as any}}>
                <table style={{width:"100%",borderCollapse:"collapse" as any,minWidth:400}}>
                  <thead><tr><th style={th}>Mês</th><th style={{...th,textAlign:"right" as any}}>Entradas</th><th style={{...th,textAlign:"right" as any}}>Saídas</th><th style={{...th,textAlign:"right" as any}}>Reservas</th><th style={{...th,textAlign:"right" as any}}>Saldo</th></tr></thead>
                  <tbody>
                    {annualData.map((d: any,i: number)=>(
                      <tr key={d.mes} style={{background:i===mes?T.navItemActive:i%2===0?T.rowAlt:""}}>
                        <td style={{...td,fontWeight:i===mes?700:400}}>{d.mes}{i===mes&&<span style={{marginLeft:6,fontSize:9,background:T.accent,color:"#fff",borderRadius:4,padding:"1px 5px"}}>atual</span>}</td>
                        <td style={{...td,textAlign:"right" as any,color:"#10b981",fontWeight:600}}>{d.entradas>0?fmt(d.entradas):"—"}</td>
                        <td style={{...td,textAlign:"right" as any,color:"#ef4444",fontWeight:600}}>{d.saidas>0?fmt(d.saidas):"—"}</td>
                        <td style={{...td,textAlign:"right" as any,color:"#6366f1",fontWeight:600}}>{d.reservas>0?fmt(d.reservas):"—"}</td>
                        <td style={{...td,textAlign:"right" as any,fontWeight:700,color:d.saldo>=0?"#10b981":"#ef4444"}}>{d.entradas>0||d.saidas>0?fmt(d.saldo):"—"}</td>
                      </tr>
                    ))}
                    <tr style={{background:T.rowAlt,borderTop:`2px solid ${T.border}`}}>
                      <td style={{...td,fontWeight:800}}>Total</td>
                      <td style={{...td,textAlign:"right" as any,fontWeight:800,color:"#10b981"}}>{fmt(annualTotal.entradas)}</td>
                      <td style={{...td,textAlign:"right" as any,fontWeight:800,color:"#ef4444"}}>{fmt(annualTotal.saidas)}</td>
                      <td style={{...td,textAlign:"right" as any,fontWeight:800,color:"#6366f1"}}>{fmt(annualTotal.reservas)}</td>
                      <td style={{...td,textAlign:"right" as any,fontWeight:800,color:annualTotal.saldo>=0?"#10b981":"#ef4444"}}>{fmt(annualTotal.saldo)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </GC>
          </>)}
        </div>
      </div>

      {isMob&&<BottomNav tab={tab} setTab={setTab} T={T}/>}
      {showMembros&&<MembrosModal membros={membros} onChange={(mb: any)=>{setMembros(mb);persist(allData,metas,cartoes,orcamentos,mb,entradasFixas);}} onClose={()=>setShowMembros(false)} T={T}/>}
      {editCard&&<CardModal card={editCard} onChange={updateCard} onClose={()=>setEditCard(null)} T={T} membros={membros}/>}
      <Modal tipo={modal?.tipo} form={form} setForm={setForm} onSave={saveItem} onClose={closeModal} editId={modal?.editId} T={T} cartoes={cartoes} getGastoCartao={gastosPorCartao} membros={membros} metas={metas}/>

      {showOrcModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:2000,backdropFilter:"blur(4px)"}}>
        <div style={{background:T.card,borderRadius:"24px 24px 0 0",padding:24,width:"100%",maxWidth:480,maxHeight:"80vh",overflowY:"auto" as any,boxShadow:"0 -8px 40px rgba(0,0,0,0.3)",border:`1px solid ${T.border}`}}>
          <div style={{width:40,height:4,borderRadius:99,background:T.border,margin:"0 auto 18px"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{margin:0,fontSize:15,fontWeight:800,color:T.text}}>Limite por Categoria</h3><button onClick={()=>setShowOrcModal(false)} style={{background:T.border,border:"none",cursor:"pointer",borderRadius:10,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",color:T.sub}}><X size={14}/></button></div>
          {CATEGORIAS.map((cat: string)=>{const atual=catSpend[cat]||0;const lim=orcamentos[cat]||0;const pctVal=lim>0?Math.min((atual/lim)*100,100):0;return(
            <div key={cat} style={{marginBottom:10,padding:"9px 12px",background:T.bg,borderRadius:10,border:`1px solid ${T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}><div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:T.text}}><span style={{color:T.sub}}>{CAT_ICONS[cat]||<MoreHorizontal size={12}/>}</span>{cat}</div><span style={{fontSize:10,color:T.sub}}>Atual: {fmt(atual)}</span></div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <SI value={orcamentos[cat]||""} onChange={(v: string)=>{const n={...orcamentos,[cat]:+v};setOrcamentos(n);persist(allData,metas,cartoes,n,membros,entradasFixas);}} placeholder="Sem limite" type="number" T={T} style={{flex:1,padding:"6px 10px",fontSize:12}}/>
                {lim>0&&<div style={{flex:2}}><div style={{background:T.border,borderRadius:99,height:5}}><div style={{background:pctVal>85?"#ef4444":pctVal>60?"#f59e0b":"#10b981",width:pctVal+"%",height:"100%",borderRadius:99}}/></div><div style={{fontSize:9,color:T.sub,marginTop:2}}>{pctVal.toFixed(0)}%</div></div>}
              </div>
            </div>
          );})}
        </div>
      </div>}
    </div>
  );
}