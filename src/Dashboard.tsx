import { useState, useMemo, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface Membro { id: string; nome: string; cor: string; avatar: string; foto?: string }
interface Cartao { id: string; nome: string; bandeira: string; numero: string; limite: number; vencimento: string; cor: string; membroId: string }
interface Gasto { id: string; descricao: string; valor: number; categoria: string; data: string; pgto: string; cartaoId?: string; parcelas: number; parcelaAtual?: number; membroId: string }
interface GastoFixo { id: string; descricao: string; valor: number; categoria: string; pgto: string; cartaoId?: string; membroId: string; pago: boolean; dia: number }
interface Entrada { id: string; descricao: string; valor: number; tipo: string; membroId: string; recorrente: boolean; mes?: string }
interface Meta { id: string; descricao: string; valor: number; prazo: string; cor: string; tipo: 'meta' | 'investimento' }
interface Reserva { id: string; descricao: string; valor: number; metaId?: string; data: string; membroId: string }
interface Orcamento { id: string; nome: string; categoria: string; limite: number; mes: string; cor: string }
interface Config { tema: string; accentColor: string }
interface Dados { membros: Membro[]; cartoes: Cartao[]; gastos_var: Gasto[]; gastos_fix: GastoFixo[]; entradas: Entrada[]; metas: Meta[]; reservas: Reserva[]; orcamentos: Orcamento[]; config: Config }
interface Props { userId: string; userEmail: string }

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const CATEGORIAS = ['Alimentação','Transporte','Moradia','Saúde','Educação','Lazer','Vestuário','Tecnologia','Viagem','Investimento','Outros']
const BANDEIRAS = ['Nubank','Itaú','Bradesco','Santander','Banco do Brasil','Inter','C6 Bank','XP','BTG','Visa','Mastercard','Elo','Amex','Hipercard','Outros']
const FORMAS_PGTO = ['Crédito','Débito','PIX','Dinheiro','Transferência']
const CAT_EMOJI: Record<string,string> = { 'Alimentação':'🍔','Transporte':'🚗','Moradia':'🏠','Saúde':'❤️','Educação':'📚','Lazer':'🎮','Vestuário':'👕','Tecnologia':'💻','Viagem':'✈️','Investimento':'📈','Outros':'📦' }

// Cores reais das bandeiras de cartão
const BANDEIRA_CORES: Record<string, {bg: string; logo: string; text: string}> = {
  'Nubank':        { bg: 'linear-gradient(135deg,#820AD1,#6000A3)', logo: '💜', text: '#fff' },
  'Itaú':          { bg: 'linear-gradient(135deg,#F4820A,#E06600)', logo: '🟠', text: '#fff' },
  'Bradesco':      { bg: 'linear-gradient(135deg,#CC092F,#8B0020)', logo: '🔴', text: '#fff' },
  'Santander':     { bg: 'linear-gradient(135deg,#EC0000,#A00000)', logo: '🔴', text: '#fff' },
  'Banco do Brasil':{ bg: 'linear-gradient(135deg,#FFCB00,#E6A800)', logo: '🟡', text: '#333' },
  'Inter':         { bg: 'linear-gradient(135deg,#FF6B2C,#E04A00)', logo: '🟧', text: '#fff' },
  'C6 Bank':       { bg: 'linear-gradient(135deg,#242424,#111)', logo: '⬛', text: '#fff' },
  'XP':            { bg: 'linear-gradient(135deg,#111,#2d2d2d)', logo: '⬛', text: '#fff' },
  'BTG':           { bg: 'linear-gradient(135deg,#0033A0,#001F6B)', logo: '🔵', text: '#fff' },
  'Visa':          { bg: 'linear-gradient(135deg,#1A1F71,#0D1145)', logo: '💳', text: '#fff' },
  'Mastercard':    { bg: 'linear-gradient(135deg,#252525,#111)', logo: '🔴', text: '#fff' },
  'Elo':           { bg: 'linear-gradient(135deg,#FFE01B,#E6C200)', logo: '🟡', text: '#333' },
  'Amex':          { bg: 'linear-gradient(135deg,#007BC1,#005A91)', logo: '🔵', text: '#fff' },
  'Hipercard':     { bg: 'linear-gradient(135deg,#B22222,#8B0000)', logo: '❤️', text: '#fff' },
  'Outros':        { bg: 'linear-gradient(135deg,#667eea,#764ba2)', logo: '💳', text: '#fff' },
}

// ─── TEMAS CLAROS E ESCUROS ──────────────────────────────────────────────────
const TEMAS: Record<string, any> = {
  dark:    { lb:'Dark',   bg:'#07090f', bg2:'#0d1117', bg3:'#161b27', border:'rgba(255,255,255,0.07)', text:'#fff', text2:'rgba(255,255,255,0.55)', text3:'rgba(255,255,255,0.25)', isLight:false },
  darker:  { lb:'Abyss',  bg:'#000', bg2:'#0a0a0a', bg3:'#111', border:'rgba(255,255,255,0.06)', text:'#fff', text2:'rgba(255,255,255,0.5)', text3:'rgba(255,255,255,0.2)', isLight:false },
  purple:  { lb:'Nebula', bg:'#0d0a1a', bg2:'#13102a', bg3:'#1a1638', border:'rgba(139,92,246,0.15)', text:'#fff', text2:'rgba(255,255,255,0.55)', text3:'rgba(255,255,255,0.25)', isLight:false },
  navy:    { lb:'Ocean',  bg:'#070d1a', bg2:'#0d1529', bg3:'#132038', border:'rgba(99,130,246,0.15)', text:'#fff', text2:'rgba(255,255,255,0.55)', text3:'rgba(255,255,255,0.25)', isLight:false },
  light:   { lb:'Snow',   bg:'#f8fafc', bg2:'#ffffff', bg3:'#f1f5f9', border:'rgba(0,0,0,0.08)', text:'#0f172a', text2:'#475569', text3:'#94a3b8', isLight:true },
  cream:   { lb:'Cream',  bg:'#faf8f5', bg2:'#ffffff', bg3:'#f5f0ea', border:'rgba(0,0,0,0.07)', text:'#1a1108', text2:'#6b5b45', text3:'#a89070', isLight:true },
  mint:    { lb:'Mint',   bg:'#f0fdf8', bg2:'#ffffff', bg3:'#dcfce7', border:'rgba(0,0,0,0.07)', text:'#052e16', text2:'#166534', text3:'#4ade80', isLight:true },
  rose:    { lb:'Rose',   bg:'#fff1f2', bg2:'#ffffff', bg3:'#ffe4e6', border:'rgba(0,0,0,0.07)', text:'#4c0519', text2:'#9f1239', text3:'#fda4af', isLight:true },
  slate:   { lb:'Slate',  bg:'#f1f5f9', bg2:'#ffffff', bg3:'#e2e8f0', border:'rgba(0,0,0,0.08)', text:'#0f172a', text2:'#334155', text3:'#94a3b8', isLight:true },
}

const ACCENTS: Record<string, string> = {
  purple: '#8b5cf6', indigo: '#6366f1', cyan: '#06b6d4',
  green: '#10b981', orange: '#f59e0b', pink: '#ec4899', red: '#ef4444',
}

// Fonte única — Syne (títulos) + DM Sans (corpo)
const FONTE_TITULO = "'Syne','Space Grotesk',sans-serif"
const FONTE_CORPO  = "'DM Sans',system-ui,sans-serif"

const CORES = ['#8b5cf6','#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316','#14b8a6','#a855f7']

const DADOS_INICIAIS: Dados = {
  membros:[{id:'default',nome:'Eu',cor:'#6366f1',avatar:'E',foto:''}],
  cartoes:[],gastos_var:[],gastos_fix:[],entradas:[],metas:[],reservas:[],orcamentos:[],
  config:{ tema:'dark', accentColor:'indigo' }
}

const uuid = () => Math.random().toString(36).slice(2)+Date.now().toString(36)

// Formata moeda permitindo ponto e vírgula
const parseMoeda = (v: string): number => {
  const clean = v.replace(/[^0-9.,]/g,'').replace(',','.')
  return parseFloat(clean) || 0
}
const fmt = (v: number) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
const fmtK = (v: number) => {
  const abs = Math.abs(v)
  if(abs >= 1000000) return `R$${(v/1000000).toFixed(1)}M`
  if(abs >= 1000) return `R$${(v/1000).toFixed(1)}k`
  return fmt(v)
}
const mesAtual = () => new Date().toISOString().slice(0,7)
const hoje = () => new Date().toISOString().slice(0,10)
const nomeMes = (m: string) => {
  if(!m) return ''
  const [y,mo] = m.split('-')
  return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][+mo-1]+'/'+y.slice(2)
}
const nomeMesFull = (m: string) => {
  if(!m) return ''
  const [y,mo] = m.split('-')
  return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][+mo-1]+' '+y
}

// ─── CSS GLOBAL ──────────────────────────────────────────────────────────────
const makeCSS = (T: any, accent: string) => `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  body { background:${T.bg}; font-family:'DM Sans',system-ui,sans-serif; }
  h1,h2,h3,h4,h5,.syne { font-family:'Syne',sans-serif; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:${T.isLight?'rgba(0,0,0,0.12)':'rgba(255,255,255,0.1)'}; border-radius:4px; }
  input::placeholder { color:${T.text3} !important; }
  input:focus, select:focus, textarea:focus { outline:none!important; border-color:${accent}88!important; box-shadow:0 0 0 3px ${accent}20!important; }
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
  select option { background:${T.bg2}; color:${T.text}; }
  input[type="month"], input[type="date"] {
    appearance:none; -webkit-appearance:none;
    background:${T.bg3}; border:1px solid ${T.border};
    border-radius:10px; color:${T.text};
    padding:10px 14px; font-family:'DM Sans',sans-serif; font-size:14px; cursor:pointer;
    color-scheme:${T.isLight?'light':'dark'};
  }
  input[type="month"]::-webkit-calendar-picker-indicator,
  input[type="date"]::-webkit-calendar-picker-indicator {
    ${T.isLight?'':'filter:invert(1);'} opacity:0.5; cursor:pointer;
  }
  .nav-btn { transition:all 0.18s; }
  .nav-btn:hover { background:${T.isLight?'rgba(0,0,0,0.04)':'rgba(255,255,255,0.05)'}!important; color:${T.text}!important; }
  .nav-btn.ativo { background:${accent}22!important; color:${accent}!important; border-left:3px solid ${accent}!important; }
  .card-hover { transition:transform 0.25s, box-shadow 0.25s; }
  .card-hover:hover { transform:translateY(-3px); box-shadow:0 16px 48px rgba(0,0,0,${T.isLight?'0.12':'0.5'})!important; }
  .btn-primary { background:linear-gradient(135deg,${accent},${accent}cc)!important; box-shadow:0 4px 16px ${accent}44!important; }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px ${accent}55!important; }
  .row-hover:hover { background:${accent}08!important; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes countUp { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
  .fade-up { animation:fadeUp 0.3s ease both; }
  .stagger-1 { animation-delay:0.05s; }
  .stagger-2 { animation-delay:0.1s; }
  .stagger-3 { animation-delay:0.15s; }
  .stagger-4 { animation-delay:0.2s; }
  .count-up { animation:countUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
  @media (max-width:768px) {
    .sidebar-desktop{display:none!important}
    .mobile-nav{display:flex!important}
    .page-grid-2{grid-template-columns:1fr!important}
    .kpi-grid{grid-template-columns:1fr 1fr!important}
    .hide-mobile{display:none!important}
    .table-scroll{overflow-x:auto}
  }
  @media (min-width:769px) { .mobile-nav{display:none!important} .mobile-header{display:none!important} }
  @media (max-width:480px) { .kpi-grid{grid-template-columns:1fr 1fr!important} .page-content{padding:14px!important} }
  .glass { background:rgba(255,255,255,0.04); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }
  .glow { box-shadow:0 0 30px ${accent}30; }
  .gradient-text { background:linear-gradient(135deg,${accent},${accent}88); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
`

// ─── UI ATOMS ────────────────────────────────────────────────────────────────
const Modal = ({open,onClose,titulo,children,T,accent}:any) => {
  if(!open) return null
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',backdropFilter:'blur(10px)'}}>
      <div onClick={(e:any)=>e.stopPropagation()} className="fade-up" style={{background:T.bg2,borderRadius:'24px',padding:'28px',width:'100%',maxWidth:'480px',maxHeight:'90vh',overflowY:'auto',border:`1px solid ${T.border}`,boxShadow:`0 32px 64px rgba(0,0,0,0.8),0 0 0 1px ${accent}20`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
          <h3 style={{color:T.text,fontSize:'17px',fontWeight:700}}>{titulo}</h3>
          <button onClick={onClose} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:'10px',color:T.text2,width:'34px',height:'34px',cursor:'pointer',fontSize:'18px',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const Inp = ({label,T,accent,helper,...p}:any) => (
  <div style={{marginBottom:'14px'}}>
    {label&&<label style={{display:'block',color:T.text2,fontSize:'11px',marginBottom:'6px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>{label}</label>}
    <input {...p} style={{width:'100%',padding:'11px 14px',background:T.bg3,border:`1px solid ${T.border}`,borderRadius:'12px',color:T.text,fontSize:'14px',fontFamily:'inherit',transition:'all 0.2s',...p.style}}/>
    {helper&&<p style={{fontSize:'11px',color:T.text3,marginTop:'4px'}}>{helper}</p>}
  </div>
)

const Sel = ({label,children,T,...p}:any) => (
  <div style={{marginBottom:'14px'}}>
    {label&&<label style={{display:'block',color:T.text2,fontSize:'11px',marginBottom:'6px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>{label}</label>}
    <select {...p} style={{width:'100%',padding:'11px 14px',background:T.bg3,border:`1px solid ${T.border}`,borderRadius:'12px',color:T.text,fontSize:'14px',fontFamily:'inherit',transition:'all 0.2s',...p.style}}>{children}</select>
  </div>
)

const Btn = ({children,variant='primary',size='md',T,accent,style:s,...p}:any) => {
  const base = {border:'none',borderRadius:'12px',fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'6px',transition:'all 0.2s',fontFamily:'inherit'}
  const sizes:any = {sm:{padding:'7px 14px',fontSize:'12px'},md:{padding:'11px 20px',fontSize:'14px'},lg:{padding:'14px 28px',fontSize:'15px'}}
  const getStyle = () => {
    if(variant==='primary') return {background:`linear-gradient(135deg,${accent},${accent}bb)`,color:'#fff',boxShadow:`0 4px 16px ${accent}40`}
    if(variant==='danger') return {background:'rgba(239,68,68,0.12)',color:'#f87171',border:'1px solid rgba(239,68,68,0.25)'}
    if(variant==='success') return {background:'rgba(16,185,129,0.12)',color:'#34d399',border:'1px solid rgba(16,185,129,0.25)'}
    return {background:T.bg3,color:T.text2,border:`1px solid ${T.border}`}
  }
  return <button {...p} style={{...base,...sizes[size],...getStyle(),...s}}>{children}</button>
}

const Card = ({children,T,style:s,className='',onClick,accent}:any) => (
  <div onClick={onClick} className={`card-hover ${className}`} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:'20px',padding:'20px',transition:'all 0.25s',cursor:onClick?'pointer':'default',...s}}>{children}</div>
)

const Badge = ({cor,children}:{cor:string,children:any}) => (
  <span style={{background:`${cor}18`,color:cor,padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:700,border:`1px solid ${cor}30`,letterSpacing:'0.3px',whiteSpace:'nowrap'}}>{children}</span>
)

const Prog = ({val,total,cor,T}:any) => {
  const p = total>0?Math.min(100,(val/total)*100):0
  const c = p>=90?'#ef4444':p>=70?'#f59e0b':cor
  return (
    <div>
      <div style={{height:'7px',background:T.bg3,borderRadius:'4px',overflow:'hidden',border:`1px solid ${T.border}`}}>
        <div style={{width:`${p}%`,height:'100%',background:`linear-gradient(90deg,${c},${c}bb)`,borderRadius:'4px',transition:'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:`0 0 8px ${c}60`}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:'5px'}}>
        <span style={{fontSize:'11px',color:T.text3}}>{fmt(val)}</span>
        <span style={{fontSize:'11px',fontWeight:700,color:c}}>{p.toFixed(0)}%</span>
      </div>
    </div>
  )
}

const Avatar = ({nome,cor,foto,size=32}:{nome:string,cor:string,foto?:string,size?:number}) => (
  foto ? <img src={foto} alt={nome} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',border:'2px solid rgba(255,255,255,0.15)',flexShrink:0}}/>
  : <div style={{width:size,height:size,borderRadius:'50%',background:cor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.38,fontWeight:800,color:'#fff',flexShrink:0,border:'2px solid rgba(255,255,255,0.12)',letterSpacing:'-0.5px'}}>{nome[0]?.toUpperCase()}</div>
)

// Mini gráfico de linha SVG
const MiniLine = ({data,cor,height=40}:{data:number[],cor:string,height?:number}) => {
  if(!data.length) return null
  const max = Math.max(...data,1), w = 100, h = height
  const pts = data.map((v,i)=>`${(i/(data.length-1||1))*w},${h-(v/max)*h*0.85}`)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%',height:h}} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g${cor.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={cor} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`M${pts.join(' L')} L${w},${h} L0,${h} Z`} fill={`url(#g${cor.replace('#','')})`}/>
      <path d={`M${pts.join(' L')}`} stroke={cor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {data.length>0&&<circle cx={pts[pts.length-1].split(',')[0]} cy={pts[pts.length-1].split(',')[1]} r="3" fill={cor} style={{filter:`drop-shadow(0 0 4px ${cor})`}}/>}
    </svg>
  )
}

// Donut chart SVG
const Donut = ({pct,cor,size=80,stroke=8}:{pct:number,cor:string,size?:number,stroke?:number}) => {
  const r = (size-stroke*2)/2, circ = 2*Math.PI*r
  const dash = (pct/100)*circ
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cor} strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{filter:`drop-shadow(0 0 6px ${cor})`,transition:'stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)'}}/>
    </svg>
  )
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function Dashboard({userId,userEmail}:Props) {
  const chave = `fhub_${userId}`
  const [D,setD] = useState<Dados>(()=>{try{const s=localStorage.getItem(chave);const parsed=s?JSON.parse(s):DADOS_INICIAIS;return{...DADOS_INICIAIS,...parsed,config:{...DADOS_INICIAIS.config,...parsed?.config}}}catch{return DADOS_INICIAIS}})
  const [aba,setAba] = useState('dashboard')
  const [mes,setMes] = useState(mesAtual)
  const [menuMobile,setMenuMobile] = useState(false)
  const [sidebarOpen,setSidebarOpen] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  const T = TEMAS[D.config.tema] || TEMAS.dark
  const accent = ACCENTS[D.config.accentColor] || ACCENTS.indigo
  const fCfgBase = {tema:'dark',accentColor:'indigo'}

  // Modais
  const [mCartao,setMCartao]=useState(false)
  const [mGasto,setMGasto]=useState(false)
  const [mFixo,setMFixo]=useState(false)
  const [mEntrada,setMEntrada]=useState(false)
  const [mMeta,setMMeta]=useState(false)
  const [mReserva,setMReserva]=useState(false)
  const [mMembro,setMMembro]=useState(false)
  const [mOrc,setMOrc]=useState(false)
  const [mConfig,setMConfig]=useState(false)
  const [editItem,setEditItem]=useState<any>(null)
  const [editMembro,setEditMembro]=useState<any>(null)

  // Forms base
  const fCBase = {nome:'',bandeira:'Nubank',numero:'',limite:'',vencimento:'',membroId:'default'}
  const fGBase = {descricao:'',valor:'',categoria:'Alimentação',data:hoje(),pgto:'Débito',cartaoId:'',parcelas:'1',membroId:'default'}
  const fFxBase = {descricao:'',valor:'',categoria:'Moradia',pgto:'Débito',membroId:'default',pago:false,dia:'5'}
  const fEBase = {descricao:'',valor:'',tipo:'Salário',membroId:'default',recorrente:false,mes:mesAtual()}
  const fMBase = {descricao:'',valor:'',prazo:'',cor:CORES[0],tipo:'meta' as 'meta'|'investimento'}
  const fRBase = {descricao:'',valor:'',metaId:'',data:hoje(),membroId:'default'}
  const fMbBase = {nome:'',cor:CORES[1],foto:''}
  const fOBase = {nome:'',categoria:'Alimentação',limite:'',mes:mesAtual(),cor:CORES[0]}
  // config base

  const [fC,setFC]=useState(fCBase)
  const [fG,setFG]=useState(fGBase)
  const [fFx,setFFx]=useState(fFxBase)
  const [fE,setFE]=useState(fEBase)
  const [fM,setFM]=useState(fMBase)
  const [fR,setFR]=useState(fRBase)
  const [fMb,setFMb]=useState(fMbBase)
  const [fO,setFO]=useState(fOBase)
  const [fCfg,setFCfg]=useState({...D.config})

  const salvar = useCallback((d:Dados)=>{setD(d);localStorage.setItem(chave,JSON.stringify(d))},[chave])

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const gastosMes = useMemo(()=>D.gastos_var.filter(g=>g.data?.startsWith(mes)),[D.gastos_var,mes])
  const totG = useMemo(()=>gastosMes.reduce((s,g)=>s+g.valor,0),[gastosMes])
  const totFx = useMemo(()=>D.gastos_fix.reduce((s,g)=>s+g.valor,0),[D.gastos_fix])
  const entradasMes = useMemo(()=>D.entradas.filter(e=>e.recorrente||(e.mes&&e.mes===mes)),[D.entradas,mes])
  const totE = useMemo(()=>entradasMes.reduce((s,e)=>s+e.valor,0),[entradasMes])
  const totR = useMemo(()=>D.reservas.reduce((s,r)=>s+r.valor,0),[D.reservas])
  const disp = totE - totG - totFx - totR
  const taxaSaude = totE>0?Math.max(0,Math.min(100,(disp/totE)*100)):0

  const porCat = useMemo(()=>{
    const m:Record<string,number>={}
    gastosMes.forEach(g=>{m[g.categoria]=(m[g.categoria]||0)+g.valor})
    D.gastos_fix.forEach(g=>{m[g.categoria]=(m[g.categoria]||0)+g.valor})
    return Object.entries(m).sort((a,b)=>b[1]-a[1])
  },[gastosMes,D.gastos_fix])

  const porCartao = useMemo(()=>{
    const m:Record<string,number>={}
    gastosMes.filter(g=>g.pgto==='Crédito'&&g.cartaoId).forEach(g=>{m[g.cartaoId!]=(m[g.cartaoId!]||0)+g.valor})
    return m
  },[gastosMes])

  // Fluxo 6 meses para sparklines
  const fluxo6 = useMemo(()=>{
    const r=[];const [y,mo]=mes.split('-').map(Number)
    for(let i=5;i>=0;i--){
      const d=new Date(y,mo-1-i,1);const m2=d.toISOString().slice(0,7)
      const e=D.entradas.filter(en=>en.recorrente||(en.mes&&en.mes===m2)).reduce((s,en)=>s+en.valor,0)
      const g=D.gastos_var.filter(g=>g.data?.startsWith(m2)).reduce((s,g)=>s+g.valor,0)+D.gastos_fix.reduce((s,g)=>s+g.valor,0)
      r.push({mes:nomeMes(m2),e,g,s:e-g})
    }
    return r
  },[D,mes])

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const addC=()=>{if(!fC.nome)return;const info=BANDEIRA_CORES[fC.bandeira]||BANDEIRA_CORES['Outros'];salvar({...D,cartoes:[...D.cartoes,{...fC,id:uuid(),limite:parseMoeda(fC.limite),cor:info.bg}]});setMCartao(false);setFC(fCBase)}
  const editC=(item:any)=>{setEditItem(item);setFC({nome:item.nome,bandeira:item.bandeira,numero:item.numero,limite:String(item.limite),vencimento:item.vencimento,membroId:item.membroId});setMCartao(true)}
  const saveC=()=>{if(!fC.nome)return;const info=BANDEIRA_CORES[fC.bandeira]||BANDEIRA_CORES['Outros'];if(editItem){salvar({...D,cartoes:D.cartoes.map(c=>c.id===editItem.id?{...c,...fC,limite:parseMoeda(fC.limite),cor:info.bg}:c)});setEditItem(null)}else addC();setMCartao(false);setFC(fCBase)}
  const delC=(id:string)=>salvar({...D,cartoes:D.cartoes.filter(c=>c.id!==id)})

  const addG=()=>{
    if(!fG.descricao||!fG.valor)return
    const p=+fG.parcelas||1;const arr:Gasto[]=[]
    for(let i=0;i<p;i++){
      const d=new Date(fG.data+'T12:00:00');d.setMonth(d.getMonth()+i)
      arr.push({id:uuid(),descricao:p>1?`${fG.descricao} (${i+1}/${p})`:fG.descricao,valor:parseMoeda(fG.valor)/p,categoria:fG.categoria,data:d.toISOString().slice(0,10),pgto:fG.pgto,cartaoId:fG.cartaoId||undefined,parcelas:p,parcelaAtual:i+1,membroId:fG.membroId})
    }
    salvar({...D,gastos_var:[...D.gastos_var,...arr]});setMGasto(false);setFG(fGBase)
  }
  const delG=(id:string)=>salvar({...D,gastos_var:D.gastos_var.filter(g=>g.id!==id)})

  const addFx=()=>{if(!fFx.descricao||!fFx.valor)return;salvar({...D,gastos_fix:[...D.gastos_fix,{...fFx,id:uuid(),valor:parseMoeda(fFx.valor),dia:+fFx.dia||5}]});setMFixo(false);setFFx(fFxBase)}
  const togFx=(id:string)=>salvar({...D,gastos_fix:D.gastos_fix.map(g=>g.id===id?{...g,pago:!g.pago}:g)})
  const delFx=(id:string)=>salvar({...D,gastos_fix:D.gastos_fix.filter(g=>g.id!==id)})

  // ENTRADA: recorrente só se marcado explicitamente
  const addE=()=>{if(!fE.descricao||!fE.valor)return;const nova={...fE,id:uuid(),valor:parseMoeda(fE.valor),recorrente:!!fE.recorrente,mes:fE.recorrente?undefined:fE.mes};salvar({...D,entradas:[...D.entradas,nova]});setMEntrada(false);setFE(fEBase)}
  const editE=(item:any)=>{setEditItem(item);setFE({descricao:item.descricao,valor:String(item.valor),tipo:item.tipo,membroId:item.membroId,recorrente:!!item.recorrente,mes:item.mes||mesAtual()});setMEntrada(true)}
  const saveE=()=>{if(!fE.descricao||!fE.valor)return;const upd={...fE,valor:parseMoeda(fE.valor),recorrente:!!fE.recorrente,mes:fE.recorrente?undefined:fE.mes};if(editItem){salvar({...D,entradas:D.entradas.map(e=>e.id===editItem.id?{...e,...upd}:e)});setEditItem(null)}else{salvar({...D,entradas:[...D.entradas,{...upd,id:uuid()}]});}setMEntrada(false);setFE(fEBase)}
  const delE=(id:string)=>salvar({...D,entradas:D.entradas.filter(e=>e.id!==id)})

  const addM=()=>{if(!fM.descricao||!fM.valor)return;salvar({...D,metas:[...D.metas,{...fM,id:uuid(),valor:parseMoeda(fM.valor)}]});setMMeta(false);setFM(fMBase)}
  const editM=(item:any)=>{setEditItem(item);setFM({descricao:item.descricao,valor:String(item.valor),prazo:item.prazo,cor:item.cor,tipo:item.tipo||'meta'});setMMeta(true)}
  const saveM=()=>{if(!fM.descricao||!fM.valor)return;if(editItem){salvar({...D,metas:D.metas.map(m=>m.id===editItem.id?{...m,...fM,valor:parseMoeda(fM.valor)}:m)});setEditItem(null)}else addM();setMMeta(false);setFM(fMBase)}
  const delM=(id:string)=>salvar({...D,metas:D.metas.filter(m=>m.id!==id)})

  // RESERVA: vinculada a meta, abate no valor correspondente
  const addR=()=>{if(!fR.valor)return;salvar({...D,reservas:[...D.reservas,{...fR,id:uuid(),valor:parseMoeda(fR.valor),descricao:fR.descricao||'Reserva'}]});setMReserva(false);setFR(fRBase)}
  const editR=(item:any)=>{setEditItem(item);setFR({descricao:item.descricao,valor:String(item.valor),metaId:item.metaId||'',data:item.data,membroId:item.membroId});setMReserva(true)}
  const saveR=()=>{if(!fR.valor)return;if(editItem){salvar({...D,reservas:D.reservas.map(r=>r.id===editItem.id?{...r,...fR,valor:parseMoeda(fR.valor)}:r)});setEditItem(null)}else addR();setMReserva(false);setFR(fRBase)}
  const delR=(id:string)=>salvar({...D,reservas:D.reservas.filter(r=>r.id!==id)})

  const addMb=()=>{if(!fMb.nome)return;salvar({...D,membros:[...D.membros,{...fMb,id:uuid(),avatar:fMb.nome[0].toUpperCase()}]});setMMembro(false);setFMb(fMbBase)}
  const editMb=(item:any)=>{setEditMembro(item);setFMb({nome:item.nome,cor:item.cor,foto:item.foto||''});setMMembro(true)}
  const saveMb=()=>{
    if(!fMb.nome)return
    if(editMembro){salvar({...D,membros:D.membros.map(m=>m.id===editMembro.id?{...m,...fMb,avatar:fMb.nome[0].toUpperCase()}:m)});setEditMembro(null)}
    else{salvar({...D,membros:[...D.membros,{...fMb,id:uuid(),avatar:fMb.nome[0].toUpperCase()}]})}
    setMMembro(false);setFMb(fMbBase)
  }
  const delMb=(id:string)=>{if(id==='default')return;salvar({...D,membros:D.membros.filter(m=>m.id!==id)})}

  // Foto de perfil
  const fotoRef = useRef<HTMLInputElement>(null)
  const uploadFoto = (id: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const foto = e.target?.result as string
      salvar({...D,membros:D.membros.map(m=>m.id===id?{...m,foto}:m)})
    }
    reader.readAsDataURL(file)
  }

  const addO=()=>{
    if(!fO.limite||!fO.nome)return
    const ex=D.orcamentos.find(o=>o.nome===fO.nome&&o.mes===fO.mes)
    const arr=ex?D.orcamentos.map(o=>o.id===ex.id?{...o,...fO,limite:parseMoeda(fO.limite)}:o):[...D.orcamentos,{...fO,id:uuid(),limite:parseMoeda(fO.limite)}]
    salvar({...D,orcamentos:arr});setMOrc(false);setFO(fOBase)
  }
  const delO=(id:string)=>salvar({...D,orcamentos:D.orcamentos.filter(o=>o.id!==id)})

  const salvarConfig=()=>{ salvar({...D,config:fCfg}); setMConfig(false) }
  const sair=async()=>{await supabase.auth.signOut();window.location.reload()}
  const exportCSV=()=>{let c='Tipo,Descrição,Valor,Categoria,Data,Pgto\n';D.gastos_var.forEach(g=>{c+=`Variável,"${g.descricao}",${g.valor},${g.categoria},${g.data},${g.pgto}\n`});D.gastos_fix.forEach(g=>{c+=`Fixo,"${g.descricao}",${g.valor},${g.categoria},,${g.pgto}\n`});D.entradas.forEach(e=>{c+=`Entrada,"${e.descricao}",${e.valor},${e.tipo},,\n`});const b=new Blob([c],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`fhub_${mes}.csv`;a.click()}
  const backup=()=>{const b=new Blob([JSON.stringify(D,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`fhub_backup.json`;a.click()}
  const restaurar=(e:any)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target?.result as string);salvar(d)}catch{alert('Arquivo inválido')}};r.readAsText(f)}

  const navs=[
    {id:'dashboard',ic:'⬡',lb:'Dashboard'},
    {id:'membros',ic:'◉',lb:'Membros'},
    {id:'entradas',ic:'↙',lb:'Entradas'},
    {id:'gastos',ic:'↗',lb:'Gastos'},
    {id:'fixos',ic:'◫',lb:'Fixos'},
    {id:'cartoes',ic:'◧',lb:'Cartões'},
    {id:'reservas',ic:'◎',lb:'Reservas'},
    {id:'metas',ic:'◐',lb:'Metas'},
    {id:'orcamentos',ic:'≡',lb:'Orçamentos'},
    {id:'relatorios',ic:'▦',lb:'Relatórios'},
  ]
  const irPara=(id:string)=>{setAba(id);setMenuMobile(false)}
  const mb=(id:string)=>D.membros.find(m=>m.id===id)

  // ── PÁGINAS ────────────────────────────────────────────────────────────────

  const PageDashboard = () => {
    const spkE = fluxo6.map(f=>f.e)
    const spkG = fluxo6.map(f=>f.g)
    const spkS = fluxo6.map(f=>f.s)
    const totalSaidas = totG + totFx
    const pctEconomy = totE>0 ? Math.max(0,Math.min(100,(disp/totE)*100)) : 0

    return (
      <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:'20px'}}>

        {/* Boas-vindas */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
          <div>
            <h2 style={{fontSize:'26px',fontWeight:800,color:T.text,letterSpacing:'-0.5px'}}>
              Olá, <span className="gradient-text">{D.membros[0]?.nome || 'usuário'}</span> 👋
            </h2>
            <p style={{fontSize:'13px',color:T.text3,marginTop:'2px'}}>{nomeMesFull(mes)} — Visão financeira completa</p>
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <Btn size="sm" variant="secondary" T={T} accent={accent} onClick={()=>setMGasto(true)}>+ Gasto</Btn>
            <Btn size="sm" T={T} accent={accent} onClick={()=>setMEntrada(true)}>+ Entrada</Btn>
          </div>
        </div>

        {/* KPIs com sparkline */}
        <div className="kpi-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px'}}>
          {[
            {lb:'Renda',val:totE,cor:'#10b981',spk:spkE,sub:`${entradasMes.length} fonte(s) no mês`,ic:'↙'},
            {lb:'Saídas',val:totalSaidas,cor:'#ef4444',spk:spkG,sub:`${gastosMes.length + D.gastos_fix.length} lanç.`,ic:'↗'},
            {lb:'Reservas',val:totR,cor:accent,spk:D.reservas.map(_=>totR/D.reservas.length||0),sub:`${D.reservas.length} aporte(s)`,ic:'◎'},
            {lb:'Disponível',val:disp,cor:disp>=0?'#10b981':'#ef4444',spk:spkS,sub:disp>=0?'✓ Saldo positivo':'⚠ Atenção',ic:'◈'},
          ].map((k,i)=>(
            <Card key={k.lb} T={T} style={{padding:'18px',position:'relative',overflow:'hidden'}} className={`stagger-${i+1}`}>
              <div style={{position:'absolute',top:0,right:0,left:0,bottom:0,opacity:0.04,background:`radial-gradient(circle at top right,${k.cor},transparent 60%)`}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                <div>
                  <p style={{fontSize:'11px',color:T.text3,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.6px'}}>{k.ic} {k.lb}</p>
                  <p className="count-up" style={{fontSize:'22px',fontWeight:800,color:k.cor,letterSpacing:'-0.5px',marginTop:'4px',lineHeight:1}}>{fmtK(k.val)}</p>
                  <p style={{fontSize:'11px',color:T.text3,marginTop:'4px'}}>{k.sub}</p>
                </div>
              </div>
              <div style={{height:'40px',marginTop:'4px'}}>
                <MiniLine data={k.spk} cor={k.cor}/>
              </div>
            </Card>
          ))}
        </div>

        {/* Saúde financeira + Fluxo */}
        <div className="page-grid-2" style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'16px'}}>

          {/* Score de saúde */}
          <Card T={T} style={{padding:'20px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,background:`radial-gradient(circle at center,${accent}10,transparent 70%)`}}/>
            <p style={{fontSize:'12px',color:T.text3,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'16px'}}>Saúde Financeira</p>
            <div style={{position:'relative',display:'inline-block'}}>
              <Donut pct={pctEconomy} cor={pctEconomy>=50?'#10b981':pctEconomy>=20?'#f59e0b':'#ef4444'} size={110} stroke={10}/>
              <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:'24px',fontWeight:900,color:pctEconomy>=50?'#10b981':pctEconomy>=20?'#f59e0b':'#ef4444'}}>{pctEconomy.toFixed(0)}%</span>
              </div>
            </div>
            <p style={{fontSize:'14px',fontWeight:700,color:T.text,marginTop:'12px'}}>{pctEconomy>=60?'Excelente! 🎉':pctEconomy>=40?'Muito bom 👍':pctEconomy>=20?'Regular 😐':'Atenção! ⚠️'}</p>
            <p style={{fontSize:'11px',color:T.text3,marginTop:'4px'}}>{pctEconomy.toFixed(1)}% da renda disponível</p>
          </Card>

          {/* Fluxo de Caixa — Área SVG com hover tooltip interativo */}
          {(()=>{
            const FluxoChart = () => {
              const [hoverIdx,setHoverIdx] = useState<number|null>(null)
              const [mouseX,setMouseX] = useState(0)
              const W=600,H=130,PAD=20,PADX=8
              const maxV=Math.max(...fluxo6.map(f=>Math.max(f.e,f.g)),1)
              const xOf=(i:number)=>PADX+(i/(fluxo6.length-1||1))*(W-PADX*2)
              const yOf=(v:number)=>PAD+(1-(Math.max(0,v)/maxV))*(H-PAD*2)+4
              const curveE=()=>{
                return fluxo6.map((f,i)=>{
                  const x=xOf(i),y=yOf(f.e)
                  if(i===0) return `M${x},${y}`
                  const px=xOf(i-1),py=yOf(fluxo6[i-1].e)
                  const cpx=(px+x)/2
                  return `C${cpx},${py} ${cpx},${y} ${x},${y}`
                }).join(' ')
              }
              const curveG=()=>{
                return fluxo6.map((f,i)=>{
                  const x=xOf(i),y=yOf(f.g)
                  if(i===0) return `M${x},${y}`
                  const px=xOf(i-1),py=yOf(fluxo6[i-1].g)
                  const cpx=(px+x)/2
                  return `C${cpx},${py} ${cpx},${y} ${x},${y}`
                }).join(' ')
              }
              const areaE=`${curveE()} L${xOf(5)},${H-4} L${xOf(0)},${H-4} Z`
              const areaG=`${curveG()} L${xOf(5)},${H-4} L${xOf(0)},${H-4} Z`
              const hov=hoverIdx!==null?fluxo6[hoverIdx]:null
              const hovX=hoverIdx!==null?xOf(hoverIdx):0
              const tooltipLeft=hoverIdx!==null&&hoverIdx>3
              return (
                <Card T={T} style={{padding:'20px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
                    <div>
                      <p style={{fontSize:'14px',fontWeight:700,color:T.text}}>Fluxo de Caixa</p>
                      <p style={{fontSize:'11px',color:T.text3}}>Últimos 6 meses</p>
                    </div>
                    <div style={{display:'flex',gap:'14px'}}>
                      {[{lb:'Entradas',cor:'#10b981'},{lb:'Saídas',cor:'#ef4444'}].map(l=>(
                        <div key={l.lb} style={{display:'flex',alignItems:'center',gap:'5px'}}>
                          <div style={{width:12,height:3,borderRadius:'2px',background:l.cor,boxShadow:`0 0 4px ${l.cor}`}}/>
                          <span style={{fontSize:'10px',color:T.text3}}>{l.lb}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{position:'relative',cursor:'crosshair'}}>
                    <svg
                      viewBox={`0 0 ${W} ${H}`}
                      style={{width:'100%',height:'auto',display:'block',overflow:'visible'}}
                      preserveAspectRatio="none"
                      onMouseMove={(e)=>{
                        const rect=e.currentTarget.getBoundingClientRect()
                        const ratio=(e.clientX-rect.left)/rect.width
                        const svgX=ratio*W
                        let closest=0,minDist=Infinity
                        fluxo6.forEach((_,i)=>{const d=Math.abs(xOf(i)-svgX);if(d<minDist){minDist=d;closest=i}})
                        setHoverIdx(closest)
                        setMouseX(e.clientX-rect.left)
                      }}
                      onMouseLeave={()=>setHoverIdx(null)}
                    >
                      <defs>
                        <linearGradient id="gfe" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={T.isLight?"0.3":"0.4"}/>
                          <stop offset="80%" stopColor="#10b981" stopOpacity="0.04"/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                        </linearGradient>
                        <linearGradient id="gfg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={T.isLight?"0.25":"0.35"}/>
                          <stop offset="80%" stopColor="#ef4444" stopOpacity="0.03"/>
                          <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
                        </linearGradient>
                        <filter id="glow-e"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        <filter id="glow-g"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                      </defs>
                      {/* Grid lines */}
                      {[0.25,0.5,0.75].map(p=>(
                        <line key={p} x1={PADX} y1={PAD+(1-p)*(H-PAD*2)+4} x2={W-PADX} y2={PAD+(1-p)*(H-PAD*2)+4}
                          stroke={T.isLight?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.05)'} strokeDasharray="3,4"/>
                      ))}
                      {/* Área entradas */}
                      <path d={areaE} fill="url(#gfe)"/>
                      {/* Área saídas */}
                      <path d={areaG} fill="url(#gfg)"/>
                      {/* Linha entradas */}
                      <path d={curveE()} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow-e)"/>
                      {/* Linha saídas */}
                      <path d={curveG()} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" filter="url(#glow-g)"/>
                      {/* Labels X */}
                      {fluxo6.map((f,i)=>(
                        <text key={i} x={xOf(i)} y={H-1} textAnchor="middle" fontSize="9"
                          fill={hoverIdx===i?accent:(i===fluxo6.length-1?accent:T.text3)}
                          fontWeight={hoverIdx===i||i===fluxo6.length-1?700:400}
                          fontFamily="Syne,sans-serif">{f.mes}</text>
                      ))}
                      {/* Linha vertical hover */}
                      {hoverIdx!==null&&(
                        <line x1={hovX} y1={PAD/2} x2={hovX} y2={H-14}
                          stroke={accent} strokeWidth="1" strokeDasharray="4,3" opacity="0.6"/>
                      )}
                      {/* Pontos hover */}
                      {hoverIdx!==null&&hov&&(
                        <>
                          <circle cx={hovX} cy={yOf(hov.e)} r="6" fill={T.bg2} stroke="#10b981" strokeWidth="2.5" style={{filter:'drop-shadow(0 0 6px #10b981)'}}/>
                          <circle cx={hovX} cy={yOf(hov.g)} r="6" fill={T.bg2} stroke="#ef4444" strokeWidth="2.5" style={{filter:'drop-shadow(0 0 6px #ef4444)'}}/>
                        </>
                      )}
                      {/* Pontos padrão nos extremos */}
                      {hoverIdx===null&&(
                        <>
                          <circle cx={xOf(5)} cy={yOf(fluxo6[5].e)} r="4" fill="#10b981" style={{filter:'drop-shadow(0 0 5px #10b981)'}}/>
                          <circle cx={xOf(5)} cy={yOf(fluxo6[5].g)} r="4" fill="#ef4444" style={{filter:'drop-shadow(0 0 5px #ef4444)'}}/>
                        </>
                      )}
                    </svg>
                    {/* Tooltip flutuante */}
                    {hoverIdx!==null&&hov&&(
                      <div style={{
                        position:'absolute',
                        top:'4px',
                        left:tooltipLeft?'auto':'calc('+((hoverIdx/(fluxo6.length-1))*100)+'% + 12px)',
                        right:tooltipLeft?'calc('+(100-(hoverIdx/(fluxo6.length-1))*100)+'% + 12px)':'auto',
                        background:T.bg2,
                        border:`1px solid ${accent}40`,
                        borderRadius:'12px',
                        padding:'10px 14px',
                        pointerEvents:'none',
                        boxShadow:`0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${accent}20`,
                        zIndex:10,
                        minWidth:'130px',
                      }}>
                        <p style={{fontSize:'11px',fontWeight:700,color:accent,marginBottom:'6px',fontFamily:"'Syne',sans-serif"}}>{hov.mes}</p>
                        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                              <div style={{width:8,height:8,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 4px #10b981'}}/>
                              <span style={{fontSize:'10px',color:T.text2}}>Entrada</span>
                            </div>
                            <span style={{fontSize:'12px',fontWeight:700,color:'#10b981'}}>{fmt(hov.e)}</span>
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                              <div style={{width:8,height:8,borderRadius:'50%',background:'#ef4444',boxShadow:'0 0 4px #ef4444'}}/>
                              <span style={{fontSize:'10px',color:T.text2}}>Saída</span>
                            </div>
                            <span style={{fontSize:'12px',fontWeight:700,color:'#ef4444'}}>{fmt(hov.g)}</span>
                          </div>
                          <div style={{height:'1px',background:T.border,margin:'2px 0'}}/>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px'}}>
                            <span style={{fontSize:'10px',color:T.text2}}>Saldo</span>
                            <span style={{fontSize:'12px',fontWeight:800,color:hov.s>=0?'#10b981':'#ef4444'}}>{fmt(hov.s)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            }
            return <FluxoChart/>
          })()}
        </div>

        {/* Categorias + Cartões */}
        <div className="page-grid-2" style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:'16px'}}>

          {/* Top categorias com donut */}
          <Card T={T} style={{padding:'20px'}}>
            <p style={{fontSize:'14px',fontWeight:700,color:T.text,marginBottom:'4px'}}>Gastos por Categoria</p>
            <p style={{fontSize:'11px',color:T.text3,marginBottom:'16px'}}>{nomeMesFull(mes)}</p>
            {porCat.length===0?(
              <div style={{textAlign:'center',padding:'24px',color:T.text3,fontSize:'13px'}}>Nenhum gasto esse mês 🎉</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {porCat.slice(0,6).map(([cat,val],i)=>{
                  const total=totG+totFx;const pct=total>0?(val/total)*100:0
                  const cor=CORES[i%CORES.length]
                  return (
                    <div key={cat} style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{width:28,height:28,borderRadius:'8px',background:`${cor}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',flexShrink:0,border:`1px solid ${cor}30`}}>
                        {CAT_EMOJI[cat]||'📦'}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                          <span style={{fontSize:'12px',color:T.text,fontWeight:500}}>{cat}</span>
                          <span style={{fontSize:'12px',fontWeight:700,color:cor}}>{fmt(val)}</span>
                        </div>
                        <div style={{height:'4px',background:T.bg3,borderRadius:'2px',overflow:'hidden'}}>
                          <div style={{width:`${pct}%`,height:'100%',background:`linear-gradient(90deg,${cor},${cor}88)`,borderRadius:'2px',boxShadow:`0 0 6px ${cor}60`}}/>
                        </div>
                      </div>
                      <span style={{fontSize:'10px',color:T.text3,minWidth:'30px',textAlign:'right'}}>{pct.toFixed(0)}%</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Cartões visual */}
          <Card T={T} style={{padding:'20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:T.text}}>Cartões</p>
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                <button onClick={()=>irPara('cartoes')} style={{background:'none',border:'none',color:accent,cursor:'pointer',fontSize:'12px',fontWeight:600}}>Ver todos →</button>
                <Btn size="sm" T={T} accent={accent} onClick={()=>{setEditItem(null);setFC(fCBase);setMCartao(true)}}>+ Novo</Btn>
              </div>
            </div>
            {D.cartoes.length===0?(
              <div style={{textAlign:'center',padding:'24px',color:T.text3,fontSize:'13px'}}>Nenhum cartão cadastrado</div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {D.cartoes.slice(0,3).map(c=>{
                  const usado=porCartao[c.id]||0;const pct=c.limite>0?(usado/c.limite)*100:0
                  const info=BANDEIRA_CORES[c.bandeira]||BANDEIRA_CORES['Outros']
                  return (
                    <div key={c.id} style={{background:c.cor,borderRadius:'14px',padding:'14px',position:'relative',overflow:'hidden'}}>
                      <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,background:'rgba(255,255,255,0.08)',borderRadius:'50%'}}/>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                        <div>
                          <p style={{fontSize:'13px',fontWeight:700,color:info.text,letterSpacing:'0.3px'}}>{c.nome}</p>
                          <p style={{fontSize:'10px',color:`${info.text}99`,marginTop:'2px'}}>{c.bandeira} •••• {c.numero}</p>
                        </div>
                        <div style={{display:'flex',gap:'4px'}}>
                          <button onClick={(e)=>{e.stopPropagation();setEditItem(c);setFC({nome:c.nome,bandeira:c.bandeira,numero:c.numero,limite:String(c.limite),vencimento:c.vencimento,membroId:c.membroId});setMCartao(true)}} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'6px',cursor:'pointer',color:'#fff',padding:'5px 8px',fontSize:'12px',fontWeight:600}}>✎</button>
                          <button onClick={(e)=>{e.stopPropagation();delC(c.id)}} style={{background:'rgba(0,0,0,0.3)',border:'none',borderRadius:'6px',cursor:'pointer',color:'#ffaaaa',padding:'5px 8px',fontSize:'12px'}}>🗑</button>
                        </div>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                        <span style={{fontSize:'11px',color:`${info.text}bb`}}>Usado: {fmt(usado)}</span>
                        <span style={{fontSize:'11px',color:`${info.text}bb`}}>Limite: {fmt(c.limite)}</span>
                      </div>
                      <div style={{height:'4px',background:'rgba(255,255,255,0.15)',borderRadius:'2px'}}>
                        <div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:pct>=90?'#ef4444':'rgba(255,255,255,0.7)',borderRadius:'2px'}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Metas resumo */}
        {D.metas.length>0&&(
          <Card T={T} style={{padding:'20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <p style={{fontSize:'14px',fontWeight:700,color:T.text}}>Metas & Investimentos</p>
              <button onClick={()=>irPara('metas')} style={{background:'none',border:'none',color:accent,cursor:'pointer',fontSize:'12px',fontWeight:600}}>Ver todas →</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'12px'}}>
              {D.metas.slice(0,4).map(m=>{
                const reservado=D.reservas.filter(r=>r.metaId===m.id).reduce((s,r)=>s+r.valor,0)
                const pct=m.valor>0?(reservado/m.valor)*100:0
                return (
                  <div key={m.id} style={{background:T.bg3,borderRadius:'14px',padding:'14px',border:`1px solid ${m.cor}25`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                      <Badge cor={m.tipo==='investimento'?'#10b981':m.cor}>{m.tipo==='investimento'?'📈 Invest.':'🎯 Meta'}</Badge>
                      <span style={{fontSize:'11px',color:m.cor,fontWeight:700}}>{pct.toFixed(0)}%</span>
                    </div>
                    <p style={{fontSize:'13px',fontWeight:600,color:T.text,marginBottom:'6px'}}>{m.descricao}</p>
                    <Prog val={reservado} total={m.valor} cor={m.cor} T={T}/>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    )
  }

  const PageMembros = () => (
    <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <Btn T={T} accent={accent} onClick={()=>{setEditMembro(null);setFMb(fMbBase);setMMembro(true)}}>+ Membro</Btn>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px'}}>
        {D.membros.map(m=>{
          const gastoM=gastosMes.filter(g=>g.membroId===m.id).reduce((s,g)=>s+g.valor,0)+D.gastos_fix.filter(g=>g.membroId===m.id).reduce((s,g)=>s+g.valor,0)
          const entM=D.entradas.filter(e=>e.membroId===m.id).reduce((s,e)=>s+e.valor,0)
          return (
            <Card key={m.id} T={T} style={{padding:'20px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
                <div style={{position:'relative'}}>
                  <Avatar nome={m.nome} cor={m.cor} foto={m.foto} size={52}/>
                  <label htmlFor={`foto-${m.id}`} style={{position:'absolute',bottom:-2,right:-2,background:accent,borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'10px',border:`2px solid ${T.bg2}`}}>
                    📷
                    <input id={`foto-${m.id}`} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)uploadFoto(m.id,f)}}/>
                  </label>
                </div>
                <div style={{flex:1}}>
                  <p style={{fontSize:'16px',fontWeight:700,color:T.text}}>{m.nome}</p>
                  <p style={{fontSize:'12px',color:T.text3}}>{D.entradas.filter(e=>e.membroId===m.id).length} entrada(s)</p>
                </div>
                <div style={{display:'flex',gap:'4px'}}>
                  <button onClick={()=>editMb(m)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:'8px',cursor:'pointer',color:T.text2,padding:'6px',fontSize:'13px'}}>✎</button>
                  {m.id!=='default'&&<button onClick={()=>delMb(m.id)} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'8px',cursor:'pointer',color:'#f87171',padding:'6px',fontSize:'13px'}}>🗑</button>}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <div style={{background:T.bg3,borderRadius:'10px',padding:'10px',border:`1px solid ${T.border}`}}>
                  <p style={{fontSize:'10px',color:T.text3,marginBottom:'2px'}}>RECEBEU</p>
                  <p style={{fontSize:'16px',fontWeight:700,color:'#10b981'}}>{fmtK(entM)}</p>
                </div>
                <div style={{background:T.bg3,borderRadius:'10px',padding:'10px',border:`1px solid ${T.border}`}}>
                  <p style={{fontSize:'10px',color:T.text3,marginBottom:'2px'}}>GASTOU</p>
                  <p style={{fontSize:'16px',fontWeight:700,color:'#ef4444'}}>{fmtK(gastoM)}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )

  const PageEntradas = () => (
    <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      <Card T={T} style={{padding:'0',overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'16px',color:'#10b981'}}>↙</span>
            <p style={{fontSize:'14px',fontWeight:700,color:T.text}}>Entradas — {nomeMesFull(mes)}</p>
            <Badge cor="#10b981">{D.entradas.filter(e=>e.recorrente).length} fixo(s)</Badge><Badge cor="#06b6d4">{entradasMes.length} no mês</Badge>
          </div>
          <Btn size="sm" T={T} accent={accent} onClick={()=>{setEditItem(null);setFE(fEBase);setMEntrada(true)}}>+ Adicionar</Btn>
        </div>
        {entradasMes.length===0?(
          <p style={{textAlign:'center',color:T.text3,padding:'40px',fontSize:'13px'}}>Nenhuma entrada cadastrada.</p>
        ):(
          <div className="table-scroll">
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:T.bg3}}>
                {['Quem','Nome','Tipo','Valor','%',''].map(h=><th key={h} style={{padding:'10px 20px',textAlign:'left',fontSize:'11px',fontWeight:600,color:T.text3,textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {entradasMes.map(e=>{
                const m2=mb(e.membroId);const pct=totE>0?(e.valor/totE)*100:0
                return (
                  <tr key={e.id} className="row-hover" style={{borderTop:`1px solid ${T.border}`,transition:'background 0.15s'}}>
                    <td style={{padding:'12px 20px'}}>{m2&&<div style={{display:'flex',alignItems:'center',gap:'6px'}}><Avatar nome={m2.nome} cor={m2.cor} foto={m2.foto} size={24}/><span style={{fontSize:'11px',color:T.text2,fontWeight:600}}>{m2.nome.toUpperCase()}</span></div>}</td>
                    <td style={{padding:'12px 20px'}}><div style={{display:'flex',alignItems:'center',gap:'6px'}}>{e.recorrente&&<span title="Recorrente" style={{color:accent,fontSize:'12px'}}>↻</span>}<span style={{fontSize:'13px',color:T.text,fontWeight:500}}>{e.descricao}</span>{e.recorrente&&<Badge cor={accent}>fixo</Badge>}</div></td>
                    <td style={{padding:'12px 20px'}}><Badge cor="#06b6d4">{e.tipo}</Badge></td>
                    <td style={{padding:'12px 20px',fontSize:'14px',fontWeight:700,color:'#10b981'}}>{fmt(e.valor)}</td>
                    <td style={{padding:'12px 20px',fontSize:'12px',color:T.text3}}>{pct.toFixed(1)}%</td>
                    <td style={{padding:'12px 20px'}}>
                      <div style={{display:'flex',gap:'4px',justifyContent:'flex-end'}}>
                        <button onClick={()=>editE(e)} style={{background:'none',border:'none',cursor:'pointer',color:T.text3,padding:'4px',borderRadius:'6px',fontSize:'14px'}}>✎</button>
                        <button onClick={()=>delE(e.id)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(239,68,68,0.5)',padding:'4px',borderRadius:'6px',fontSize:'14px'}}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{borderTop:`2px solid ${T.border}`,background:T.bg3}}>
                <td colSpan={3} style={{padding:'12px 20px',fontSize:'13px',fontWeight:600,color:T.text3}}>Total</td>
                <td style={{padding:'12px 20px',fontSize:'15px',fontWeight:800,color:'#10b981'}}>{fmt(totE)}</td>
                <td colSpan={2}/>
              </tr>
            </tfoot>
          </table>
          </div>
        )}
      </Card>
    </div>
  )

  const PageGastos = () => (
    <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      <Card T={T} style={{padding:'0',overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'16px',color:'#ef4444'}}>↗</span>
            <p style={{fontSize:'14px',fontWeight:700,color:T.text}}>Gastos Variáveis — {nomeMesFull(mes)}</p>
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <Btn size="sm" variant="secondary" T={T} accent={accent} onClick={()=>setMOrc(true)}>⊕ Orçamento</Btn>
            <Btn size="sm" T={T} accent={accent} onClick={()=>{setFG(fGBase);setMGasto(true)}}>+ Adicionar</Btn>
          </div>
        </div>
        {gastosMes.length===0?(
          <p style={{textAlign:'center',color:T.text3,padding:'40px',fontSize:'13px'}}>Nenhum gasto. 🎉</p>
        ):(
          <div className="table-scroll">
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:T.bg3}}>
                {['Quem','Categoria','Forma','Valor','Descrição',''].map(h=><th key={h} style={{padding:'10px 20px',textAlign:'left',fontSize:'11px',fontWeight:600,color:T.text3,textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {gastosMes.sort((a,b)=>new Date(b.data).getTime()-new Date(a.data).getTime()).map(g=>{
                const m2=mb(g.membroId)
                const pgtoColor:Record<string,string>={Crédito:accent,Débito:'#06b6d4',PIX:'#10b981',Dinheiro:'#f59e0b',Transferência:'#8b5cf6'}
                return (
                  <tr key={g.id} className="row-hover" style={{borderTop:`1px solid ${T.border}`}}>
                    <td style={{padding:'12px 20px'}}>{m2&&<div style={{display:'flex',alignItems:'center',gap:'6px'}}><Avatar nome={m2.nome} cor={m2.cor} foto={m2.foto} size={22}/><span style={{fontSize:'10px',color:T.text3,fontWeight:600}}>{m2.nome}</span></div>}</td>
                    <td style={{padding:'12px 20px'}}><span style={{fontSize:'13px',color:T.text}}>{CAT_EMOJI[g.categoria]} {g.categoria}</span></td>
                    <td style={{padding:'12px 20px'}}><Badge cor={pgtoColor[g.pgto]||accent}>{g.pgto}</Badge></td>
                    <td style={{padding:'12px 20px',fontSize:'14px',fontWeight:700,color:'#ef4444',whiteSpace:'nowrap'}}>{fmt(g.valor)}</td>
                    <td style={{padding:'12px 20px',fontSize:'12px',color:T.text2}}>{g.descricao}{g.parcelas>1&&<Badge cor="#8b5cf6">{g.parcelaAtual}/{g.parcelas}x</Badge>}</td>
                    <td style={{padding:'12px 20px'}}><button onClick={()=>delG(g.id)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(239,68,68,0.4)',fontSize:'14px',padding:'4px'}}>🗑</button></td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{borderTop:`2px solid ${T.border}`,background:T.bg3}}>
                <td colSpan={3} style={{padding:'12px 20px',fontSize:'13px',fontWeight:600,color:T.text3}}>Total</td>
                <td style={{padding:'12px 20px',fontSize:'15px',fontWeight:800,color:'#ef4444'}}>{fmt(totG)}</td>
                <td colSpan={2}/>
              </tr>
            </tfoot>
          </table>
          </div>
        )}
      </Card>
    </div>
  )

  const PageFixos = () => (
    <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      <Card T={T} style={{padding:'0',overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'16px',color:'#f59e0b'}}>◫</span>
            <p style={{fontSize:'14px',fontWeight:700,color:T.text}}>Gastos Fixos — {nomeMesFull(mes)}</p>
          </div>
          <Btn size="sm" T={T} accent={accent} onClick={()=>{setFFx(fFxBase);setMFixo(true)}}>+ Adicionar</Btn>
        </div>
        {D.gastos_fix.length===0?(
          <p style={{textAlign:'center',color:T.text3,padding:'40px',fontSize:'13px'}}>Nenhum gasto fixo.</p>
        ):(
          <div className="table-scroll">
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:T.bg3}}>
                {['Quem','Nome','Pgto','Planejado','Pago','Status',''].map(h=><th key={h} style={{padding:'10px 20px',textAlign:'left',fontSize:'11px',fontWeight:600,color:T.text3,textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {D.gastos_fix.map(g=>{
                const m2=mb(g.membroId)
                return (
                  <tr key={g.id} className="row-hover" style={{borderTop:`1px solid ${T.border}`}}>
                    <td style={{padding:'13px 20px'}}>{m2&&<Avatar nome={m2.nome} cor={m2.cor} foto={m2.foto} size={26}/>}</td>
                    <td style={{padding:'13px 20px',fontSize:'13px',color:T.text,fontWeight:500}}>{g.descricao}</td>
                    <td style={{padding:'13px 20px'}}><Badge cor="#f59e0b">{g.pgto}</Badge></td>
                    <td style={{padding:'13px 20px',fontSize:'14px',fontWeight:700,color:'#ef4444',whiteSpace:'nowrap'}}>{fmt(g.valor)}</td>
                    <td style={{padding:'13px 20px',fontSize:'14px',fontWeight:700,color:g.pago?'#10b981':T.text3,whiteSpace:'nowrap'}}>{g.pago?fmt(g.valor):'—'}</td>
                    <td style={{padding:'13px 20px'}}>
                      <button onClick={()=>togFx(g.id)} style={{background:g.pago?'rgba(16,185,129,0.12)':T.bg3,border:`1px solid ${g.pago?'rgba(16,185,129,0.3)':T.border}`,borderRadius:'8px',color:g.pago?'#34d399':T.text3,padding:'5px 12px',cursor:'pointer',fontSize:'12px',fontWeight:700,whiteSpace:'nowrap'}}>
                        {g.pago?'✓ Pago':'Pendente'}
                      </button>
                    </td>
                    <td style={{padding:'13px 20px'}}><button onClick={()=>delFx(g.id)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(239,68,68,0.4)',fontSize:'14px',padding:'4px'}}>🗑</button></td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{borderTop:`2px solid ${T.border}`,background:T.bg3}}>
                <td colSpan={3} style={{padding:'12px 20px',fontSize:'13px',fontWeight:600,color:T.text3}}>Total</td>
                <td style={{padding:'12px 20px',fontSize:'15px',fontWeight:800,color:'#ef4444'}}>{fmt(totFx)}</td>
                <td style={{padding:'12px 20px',fontSize:'15px',fontWeight:800,color:'#10b981'}}>{fmt(D.gastos_fix.filter(g=>g.pago).reduce((s,g)=>s+g.valor,0))}</td>
                <td colSpan={2}/>
              </tr>
            </tfoot>
          </table>
          </div>
        )}
      </Card>
    </div>
  )

  const PageReservas = () => (
    <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:'16px'}}>

      {/* Cards de metas com progresso de reservas */}
      {D.metas.length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'12px'}}>
          {D.metas.map(m=>{
            const reservado=D.reservas.filter(r=>r.metaId===m.id).reduce((s,r)=>s+r.valor,0)
            const pct=m.valor>0?(reservado/m.valor)*100:0
            return (
              <div key={m.id} style={{background:T.bg2,border:`1px solid ${m.cor}30`,borderRadius:'16px',padding:'16px',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,right:0,bottom:0,left:0,background:`radial-gradient(circle at top right,${m.cor}12,transparent 60%)`}}/>
                <Badge cor={m.tipo==='investimento'?'#10b981':m.cor}>{m.tipo==='investimento'?'📈':'🎯'} {m.tipo}</Badge>
                <p style={{fontSize:'14px',fontWeight:700,color:T.text,marginTop:'8px',marginBottom:'6px'}}>{m.descricao}</p>
                <Prog val={reservado} total={m.valor} cor={m.cor} T={T}/>
                <p style={{fontSize:'11px',color:T.text3,marginTop:'6px'}}>Faltam {fmt(Math.max(0,m.valor-reservado))}</p>
              </div>
            )
          })}
        </div>
      )}

      <Card T={T} style={{padding:'0',overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p style={{fontSize:'14px',fontWeight:700,color:T.text}}>Aportes — {nomeMesFull(mes)}</p>
          <Btn size="sm" T={T} accent={accent} onClick={()=>{setEditItem(null);setFR(fRBase);setMReserva(true)}}>+ Aporte</Btn>
        </div>
        {D.reservas.length===0?(
          <p style={{textAlign:'center',color:T.text3,padding:'40px',fontSize:'13px'}}>Nenhum aporte.</p>
        ):(
          <div className="table-scroll">
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:T.bg3}}>
                {['Quem','Nome','Meta/Invest.','Data','Valor',''].map(h=><th key={h} style={{padding:'10px 20px',textAlign:'left',fontSize:'11px',fontWeight:600,color:T.text3,textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {D.reservas.map(r=>{
                const m2=mb(r.membroId);const meta=r.metaId?D.metas.find(m=>m.id===r.metaId):null
                return (
                  <tr key={r.id} className="row-hover" style={{borderTop:`1px solid ${T.border}`}}>
                    <td style={{padding:'13px 20px'}}>{m2&&<Avatar nome={m2.nome} cor={m2.cor} foto={m2.foto} size={26}/>}</td>
                    <td style={{padding:'13px 20px',fontSize:'13px',color:T.text,fontWeight:500}}>{r.descricao}</td>
                    <td style={{padding:'13px 20px'}}>{meta?<Badge cor={meta.tipo==='investimento'?'#10b981':meta.cor}>{meta.descricao}</Badge>:<span style={{color:T.text3,fontSize:'12px'}}>—</span>}</td>
                    <td style={{padding:'13px 20px',fontSize:'12px',color:T.text3}}>{r.data}</td>
                    <td style={{padding:'13px 20px',fontSize:'14px',fontWeight:700,color:accent,whiteSpace:'nowrap'}}>{fmt(r.valor)}</td>
                    <td style={{padding:'13px 20px'}}>
                      <div style={{display:'flex',gap:'4px',justifyContent:'flex-end'}}>
                        <button onClick={()=>editR(r)} style={{background:'none',border:'none',cursor:'pointer',color:T.text3,padding:'4px',fontSize:'13px'}}>✎</button>
                        <button onClick={()=>delR(r.id)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(239,68,68,0.4)',padding:'4px',fontSize:'13px'}}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{borderTop:`2px solid ${T.border}`,background:T.bg3}}>
                <td colSpan={4} style={{padding:'12px 20px',fontSize:'13px',fontWeight:600,color:T.text3}}>Total</td>
                <td style={{padding:'12px 20px',fontSize:'15px',fontWeight:800,color:accent}}>{fmt(totR)}</td>
                <td/>
              </tr>
            </tfoot>
          </table>
          </div>
        )}
      </Card>
    </div>
  )

  const PageMetas = () => (
    <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
        <Btn size="sm" variant="secondary" T={T} accent={accent} onClick={()=>{setFM({...fMBase,tipo:'investimento'});setMMeta(true)}}>+ Investimento</Btn>
        <Btn size="sm" T={T} accent={accent} onClick={()=>{setFM({...fMBase,tipo:'meta'});setMMeta(true)}}>+ Meta</Btn>
      </div>
      {D.metas.length===0?(
        <Card T={T}><p style={{textAlign:'center',color:T.text3,padding:'32px',fontSize:'13px'}}>Nenhuma meta ou investimento.</p></Card>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px'}}>
          {D.metas.map(m=>{
            const reservado=D.reservas.filter(r=>r.metaId===m.id).reduce((s,r)=>s+r.valor,0)
            const pct=m.valor>0?(reservado/m.valor)*100:0
            return (
              <Card key={m.id} T={T} style={{padding:'20px',border:`1px solid ${m.cor}25`,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:0,right:0,width:100,height:100,background:`radial-gradient(circle,${m.cor}15,transparent 70%)`}}/>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                  <Badge cor={m.tipo==='investimento'?'#10b981':m.cor}>{m.tipo==='investimento'?'📈 Investimento':'🎯 Meta'}</Badge>
                  <div style={{display:'flex',gap:'4px'}}>
                    <button onClick={()=>editM(m)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:'8px',cursor:'pointer',color:T.text2,padding:'5px',fontSize:'12px'}}>✎</button>
                    <button onClick={()=>delM(m.id)} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'8px',cursor:'pointer',color:'#f87171',padding:'5px',fontSize:'12px'}}>🗑</button>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
                  <Donut pct={pct} cor={m.cor} size={64} stroke={6}/>
                  <div>
                    <p style={{fontSize:'15px',fontWeight:700,color:T.text}}>{m.descricao}</p>
                    {m.prazo&&<p style={{fontSize:'11px',color:T.text3,marginTop:'2px'}}>Prazo: {nomeMesFull(m.prazo)}</p>}
                    <p style={{fontSize:'18px',fontWeight:800,color:m.cor,marginTop:'4px'}}>{pct.toFixed(0)}%</p>
                  </div>
                </div>
                <Prog val={reservado} total={m.valor} cor={m.cor} T={T}/>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:'10px'}}>
                  <div><p style={{fontSize:'10px',color:T.text3}}>RESERVADO</p><p style={{fontSize:'13px',fontWeight:700,color:m.cor}}>{fmt(reservado)}</p></div>
                  <div style={{textAlign:'right'}}><p style={{fontSize:'10px',color:T.text3}}>OBJETIVO</p><p style={{fontSize:'13px',fontWeight:700,color:T.text}}>{fmt(m.valor)}</p></div>
                </div>
                {pct>=100&&<div style={{marginTop:'10px',padding:'6px',background:'rgba(16,185,129,0.12)',borderRadius:'8px',textAlign:'center',border:'1px solid rgba(16,185,129,0.2)'}}><span style={{fontSize:'12px',color:'#10b981',fontWeight:700}}>🎉 Objetivo atingido!</span></div>}
                <Btn size="sm" T={T} accent={accent} style={{width:'100%',marginTop:'10px',justifyContent:'center'}} onClick={()=>{setFR({...fRBase,metaId:m.id});setMReserva(true)}}>+ Aporte</Btn>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )

  const PageOrcamentos = () => (
    <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:'16px'}}>
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <Btn T={T} accent={accent} onClick={()=>{setFO(fOBase);setMOrc(true)}}>+ Novo Orçamento</Btn>
      </div>
      {/* Orçamentos personalizados */}
      {D.orcamentos.filter(o=>o.mes===mes).length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'14px'}}>
          {D.orcamentos.filter(o=>o.mes===mes).map(o=>{
            const gasto=gastosMes.filter(g=>g.categoria===o.categoria).reduce((s,g)=>s+g.valor,0)+D.gastos_fix.filter(g=>g.categoria===o.categoria).reduce((s,g)=>s+g.valor,0)
            return (
              <Card key={o.id} T={T} style={{padding:'16px',border:`1px solid ${o.cor}25`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                  <div>
                    <p style={{fontSize:'14px',fontWeight:700,color:T.text}}>{o.nome}</p>
                    <p style={{fontSize:'11px',color:T.text3}}>{CAT_EMOJI[o.categoria]} {o.categoria}</p>
                  </div>
                  <div style={{display:'flex',gap:'4px'}}>
                    <button onClick={()=>delO(o.id)} style={{background:'rgba(239,68,68,0.1)',border:'none',borderRadius:'7px',cursor:'pointer',color:'#f87171',padding:'4px 6px',fontSize:'11px'}}>🗑</button>
                  </div>
                </div>
                <Prog val={gasto} total={o.limite} cor={o.cor} T={T}/>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:'8px'}}>
                  <span style={{fontSize:'11px',color:T.text3}}>Limite: {fmt(o.limite)}</span>
                  <span style={{fontSize:'11px',fontWeight:600,color:gasto>o.limite?'#ef4444':T.text3}}>Gasto: {fmt(gasto)}</span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {/* Categorias sem orçamento */}
      <Card T={T} style={{padding:'20px'}}>
        <p style={{fontSize:'13px',fontWeight:600,color:T.text3,marginBottom:'14px'}}>CATEGORIAS</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'10px'}}>
          {CATEGORIAS.map(cat=>{
            const orc=D.orcamentos.find(o=>o.categoria===cat&&o.mes===mes)
            const gasto=gastosMes.filter(g=>g.categoria===cat).reduce((s,g)=>s+g.valor,0)+D.gastos_fix.filter(g=>g.categoria===cat).reduce((s,g)=>s+g.valor,0)
            const cor=CORES[CATEGORIAS.indexOf(cat)%CORES.length]
            return (
              <div key={cat} style={{background:T.bg3,borderRadius:'12px',padding:'12px',border:`1px solid ${T.border}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                  <span style={{fontSize:'13px',color:T.text}}>{CAT_EMOJI[cat]} {cat}</span>
                  {!orc&&<button onClick={()=>{setFO({...fOBase,categoria:cat});setMOrc(true)}} style={{background:'none',border:`1px dashed ${T.border}`,borderRadius:'6px',color:T.text3,padding:'2px 7px',cursor:'pointer',fontSize:'10px'}}>+ limite</button>}
                </div>
                {orc?<Prog val={gasto} total={orc.limite} cor={cor} T={T}/>:(
                  <p style={{fontSize:'13px',fontWeight:600,color:gasto>0?'#ef4444':T.text3}}>{fmt(gasto)}</p>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )

  const PageRelatorios = () => {
    const anoAtual=new Date().getFullYear()
    const MESES=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
    const dadosAnuais=useMemo(()=>MESES.map((m2,i)=>{
      const key=`${anoAtual}-${String(i+1).padStart(2,'0')}`
      const e=D.entradas.filter(en=>en.recorrente||(en.mes&&en.mes===key)).reduce((s,en)=>s+en.valor,0)
      const g=D.gastos_var.filter(g=>g.data?.startsWith(key)).reduce((s,g)=>s+g.valor,0)+D.gastos_fix.reduce((s,g)=>s+g.valor,0)
      const r=D.reservas.filter(r=>r.data?.startsWith(key)).reduce((s,r)=>s+r.valor,0)
      return {m:m2,e,g,r,s:e-g-r,key}
    }),[D,anoAtual])
    const maxV=Math.max(...dadosAnuais.map(d=>Math.max(d.e,d.g)),1)
    const totAnual={e:dadosAnuais.reduce((s,d)=>s+d.e,0),g:dadosAnuais.reduce((s,d)=>s+d.g,0),r:dadosAnuais.reduce((s,d)=>s+d.r,0),s:dadosAnuais.reduce((s,d)=>s+d.s,0)}

    return (
      <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:'20px'}}>

        {/* KPIs anuais */}
        <div className="kpi-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px'}}>
          {[
            {lb:'Total Entradas',val:totAnual.e,cor:'#10b981'},
            {lb:'Total Saídas',val:totAnual.g,cor:'#ef4444'},
            {lb:'Total Reservas',val:totAnual.r,cor:accent},
            {lb:'Saldo Líquido',val:totAnual.s,cor:totAnual.s>=0?'#6366f1':'#ef4444'},
          ].map(k=>(
            <Card key={k.lb} T={T} style={{padding:'16px',border:`1px solid ${k.cor}20`}}>
              <p style={{fontSize:'11px',color:T.text3,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px'}}>{k.lb}</p>
              <p style={{fontSize:'20px',fontWeight:800,color:k.cor}}>{fmtK(k.val)}</p>
            </Card>
          ))}
        </div>

        {/* Gráfico SVG de linha anual - ao estilo da imagem de referência */}
        <Card T={T} style={{padding:'24px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px',flexWrap:'wrap',gap:'8px'}}>
            <div>
              <p style={{fontSize:'16px',fontWeight:700,color:T.text}}>Resumo Anual {anoAtual}</p>
              <p style={{fontSize:'12px',color:T.text3}}>Entradas vs Saídas ao longo do ano</p>
            </div>
            <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
              {[{lb:'Entradas',cor:'#10b981'},{lb:'Saídas',cor:'#8b5cf6'}].map(l=>(
                <div key={l.lb} style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <div style={{width:14,height:3,borderRadius:'2px',background:l.cor,boxShadow:`0 0 4px ${l.cor}`}}/>
                  <span style={{fontSize:'11px',color:T.text3}}>{l.lb}</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'6px'}}>
              <Btn size="sm" variant="secondary" T={T} accent={accent} onClick={exportCSV}>⬇ CSV</Btn>
              <Btn size="sm" variant="secondary" T={T} accent={accent} onClick={backup}>⬇ Backup</Btn>
              <label style={{display:'inline-flex',alignItems:'center',gap:'5px',padding:'7px 12px',background:T.bg3,border:`1px solid ${T.border}`,borderRadius:'10px',cursor:'pointer',fontSize:'12px',fontWeight:600,color:T.text2}}>
                ⬆ Restaurar<input type="file" accept=".json" onChange={restaurar} style={{display:'none'}}/>
              </label>
            </div>
          </div>

          {/* Gráfico de área dupla anual — estilo curvas suaves com hover */}
          {(()=>{
            const AnualChart = () => {
              const [hIdx,setHIdx] = useState<number|null>(null)
              const W=800,H=180,PAD=24,PADX=10
              const maxA=Math.max(...dadosAnuais.map(d=>Math.max(d.e,d.g)),1)
              const xA=(i:number)=>PADX+(i/(dadosAnuais.length-1||1))*(W-PADX*2)
              const yA=(v:number)=>PAD+(1-(Math.max(0,v)/maxA))*(H-PAD*1.5)
              const bezierPath=(pts:{x:number,y:number}[])=>{
                return pts.map((p,i)=>{
                  if(i===0) return `M${p.x},${p.y}`
                  const prev=pts[i-1]
                  const cpx=(prev.x+p.x)/2
                  return `C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`
                }).join(' ')
              }
              const ptsEObj=dadosAnuais.map((d,i)=>({x:xA(i),y:yA(d.e)}))
              const ptsGObj=dadosAnuais.map((d,i)=>({x:xA(i),y:yA(d.g)}))
              const lineE=bezierPath(ptsEObj)
              const lineG=bezierPath(ptsGObj)
              const areaE=`${lineE} L${xA(11)},${H} L${xA(0)},${H} Z`
              const areaG=`${lineG} L${xA(11)},${H} L${xA(0)},${H} Z`
              const hov=hIdx!==null?dadosAnuais[hIdx]:null
              return (
                <div style={{position:'relative',cursor:'crosshair'}}>
                  <svg
                    viewBox={`0 0 ${W} ${H+18}`}
                    style={{width:'100%',height:'auto',display:'block',overflow:'visible'}}
                    preserveAspectRatio="none"
                    onMouseMove={(e)=>{
                      const rect=e.currentTarget.getBoundingClientRect()
                      const ratio=(e.clientX-rect.left)/rect.width
                      const svgX=ratio*W
                      let closest=0,minDist=Infinity
                      dadosAnuais.forEach((_,i)=>{const d=Math.abs(xA(i)-svgX);if(d<minDist){minDist=d;closest=i}})
                      setHIdx(closest)
                    }}
                    onMouseLeave={()=>setHIdx(null)}
                  >
                    <defs>
                      <linearGradient id="gaE" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.5"/>
                        <stop offset="60%" stopColor="#10b981" stopOpacity="0.15"/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.02"/>
                      </linearGradient>
                      <linearGradient id="gaG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45"/>
                        <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.12"/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02"/>
                      </linearGradient>
                      <filter id="glowA"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>
                    {/* Linhas de grid horizontais */}
                    {[0,25,50,75,100].map(p=>{
                      const y=PAD+(1-p/100)*(H-PAD*1.5)
                      return (
                        <g key={p}>
                          <line x1={PADX} y1={y} x2={W-PADX} y2={y} stroke={T.isLight?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.05)'} strokeDasharray={p===0?"none":"3,5"}/>
                          <text x={PADX-2} y={y+3} textAnchor="end" fontSize="7.5" fill={T.text3} fontFamily="Syne,sans-serif">{p>0?fmtK((p/100)*maxA):''}</text>
                        </g>
                      )
                    })}
                    {/* Área saídas (embaixo) */}
                    <path d={areaG} fill="url(#gaG)"/>
                    {/* Área entradas (em cima) */}
                    <path d={areaE} fill="url(#gaE)"/>
                    {/* Linha saídas */}
                    <path d={lineG} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" filter="url(#glowA)" opacity="0.9"/>
                    {/* Linha entradas */}
                    <path d={lineE} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" filter="url(#glowA)"/>
                    {/* Linha vertical hover */}
                    {hIdx!==null&&(
                      <line x1={xA(hIdx)} y1={PAD/2} x2={xA(hIdx)} y2={H}
                        stroke={accent} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.7"/>
                    )}
                    {/* Labels X */}
                    {dadosAnuais.map((d,i)=>(
                      <text key={i} x={xA(i)} y={H+12} textAnchor="middle" fontSize="9"
                        fill={hIdx===i?accent:(d.key===mes?accent:T.text3)}
                        fontWeight={hIdx===i||d.key===mes?700:400}
                        fontFamily="Syne,sans-serif">{d.m}</text>
                    ))}
                    {/* Pontos hover */}
                    {hIdx!==null&&hov&&(
                      <>
                        <circle cx={xA(hIdx)} cy={yA(hov.e)} r="6" fill={T.bg2} stroke="#10b981" strokeWidth="2.5" style={{filter:'drop-shadow(0 0 8px #10b981)'}}/>
                        <circle cx={xA(hIdx)} cy={yA(hov.g)} r="6" fill={T.bg2} stroke="#8b5cf6" strokeWidth="2.5" style={{filter:'drop-shadow(0 0 8px #8b5cf6)'}}/>
                      </>
                    )}
                    {/* Destaque mês atual (sem hover) */}
                    {hIdx===null&&dadosAnuais.map((d,i)=>d.key===mes?(
                      <g key={i}>
                        <circle cx={xA(i)} cy={yA(d.e)} r="5" fill="#10b981" style={{filter:'drop-shadow(0 0 6px #10b981)'}}/>
                        <circle cx={xA(i)} cy={yA(d.g)} r="5" fill="#8b5cf6" style={{filter:'drop-shadow(0 0 6px #8b5cf6)'}}/>
                      </g>
                    ):null)}
                  </svg>
                  {/* Tooltip hover */}
                  {hIdx!==null&&hov&&(
                    <div style={{
                      position:'absolute',
                      top:'8px',
                      left:hIdx>7?'auto':`calc(${(hIdx/(dadosAnuais.length-1))*100}% + 16px)`,
                      right:hIdx>7?`calc(${100-(hIdx/(dadosAnuais.length-1))*100}% + 16px)`:'auto',
                      background:T.bg2,
                      border:`1px solid ${accent}35`,
                      borderRadius:'14px',
                      padding:'12px 16px',
                      pointerEvents:'none',
                      boxShadow:`0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px ${accent}15`,
                      zIndex:10,
                      minWidth:'150px',
                    }}>
                      <p style={{fontSize:'12px',fontWeight:800,color:accent,marginBottom:'8px',fontFamily:"'Syne',sans-serif",letterSpacing:'-0.3px'}}>{hov.m} {anoAtual}</p>
                      <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'16px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                            <div style={{width:8,height:8,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 5px #10b981'}}/>
                            <span style={{fontSize:'11px',color:T.text2}}>Entradas</span>
                          </div>
                          <span style={{fontSize:'12px',fontWeight:700,color:'#10b981'}}>{hov.e>0?fmt(hov.e):'—'}</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'16px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                            <div style={{width:8,height:8,borderRadius:'50%',background:'#8b5cf6',boxShadow:'0 0 5px #8b5cf6'}}/>
                            <span style={{fontSize:'11px',color:T.text2}}>Saídas</span>
                          </div>
                          <span style={{fontSize:'12px',fontWeight:700,color:'#8b5cf6'}}>{hov.g>0?fmt(hov.g):'—'}</span>
                        </div>
                        <div style={{height:'1px',background:T.border,margin:'2px 0'}}/>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'16px'}}>
                          <span style={{fontSize:'11px',color:T.text2}}>Reservas</span>
                          <span style={{fontSize:'12px',fontWeight:700,color:accent}}>{hov.r>0?fmt(hov.r):'—'}</span>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'16px'}}>
                          <span style={{fontSize:'11px',fontWeight:700,color:T.text}}>Saldo</span>
                          <span style={{fontSize:'13px',fontWeight:800,color:hov.s>=0?'#10b981':'#ef4444'}}>{fmt(hov.s)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            }
            return <AnualChart/>
          })()}
        </Card>

        {/* Tabela detalhamento */}
        <Card T={T} style={{padding:'0',overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:`1px solid ${T.border}`}}>
            <p style={{fontSize:'14px',fontWeight:700,color:T.text}}>Detalhamento Mensal</p>
          </div>
          <div className="table-scroll">
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:T.bg3}}>
                {['Mês','Entradas','Saídas','Reservas','Saldo'].map(h=><th key={h} style={{padding:'10px 20px',textAlign:'left',fontSize:'11px',fontWeight:600,color:T.text3,textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {dadosAnuais.map((d,i)=>{
                const isAtual=d.key===mes
                return (
                  <tr key={d.m} className="row-hover" style={{borderTop:`1px solid ${T.border}`,background:isAtual?`${accent}10`:''}}>
                    <td style={{padding:'13px 20px'}}><div style={{display:'flex',alignItems:'center',gap:'8px'}}><span style={{fontSize:'13px',color:isAtual?accent:T.text,fontWeight:isAtual?700:500}}>{MESES[i]}</span>{isAtual&&<Badge cor={accent}>atual</Badge>}</div></td>
                    <td style={{padding:'13px 20px',fontSize:'13px',fontWeight:600,color:'#10b981',whiteSpace:'nowrap'}}>{d.e>0?fmt(d.e):<span style={{color:T.text3,fontSize:'16px',fontWeight:900}}>—</span>}</td>
                    <td style={{padding:'13px 20px',fontSize:'13px',fontWeight:600,color:'#ef4444',whiteSpace:'nowrap'}}>{d.g>0?fmt(d.g):<span style={{color:T.text3,fontSize:'16px',fontWeight:900}}>—</span>}</td>
                    <td style={{padding:'13px 20px',fontSize:'13px',fontWeight:600,color:accent,whiteSpace:'nowrap'}}>{d.r>0?fmt(d.r):<span style={{color:T.text3,fontSize:'16px',fontWeight:900}}>—</span>}</td>
                    <td style={{padding:'13px 20px',fontSize:'13px',fontWeight:700,color:d.s>=0?'#6366f1':'#ef4444',whiteSpace:'nowrap'}}>{fmt(d.s)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{borderTop:`2px solid ${T.border}`,background:T.bg3}}>
                <td style={{padding:'12px 20px',fontSize:'13px',fontWeight:700,color:T.text3}}>TOTAL</td>
                <td style={{padding:'12px 20px',fontSize:'14px',fontWeight:800,color:'#10b981',whiteSpace:'nowrap'}}>{fmt(totAnual.e)}</td>
                <td style={{padding:'12px 20px',fontSize:'14px',fontWeight:800,color:'#ef4444',whiteSpace:'nowrap'}}>{fmt(totAnual.g)}</td>
                <td style={{padding:'12px 20px',fontSize:'14px',fontWeight:800,color:accent,whiteSpace:'nowrap'}}>{fmt(totAnual.r)}</td>
                <td style={{padding:'12px 20px',fontSize:'14px',fontWeight:800,color:totAnual.s>=0?'#6366f1':'#ef4444',whiteSpace:'nowrap'}}>{fmt(totAnual.s)}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        </Card>
      </div>
    )
  }

  const PageCartoes = () => {
    const [confirmarDel, setConfirmarDel] = useState<string|null>(null)
    return (
      <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:'16px'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <p style={{fontSize:'13px',color:T.text3}}>{D.cartoes.length} cartão(ões) cadastrado(s)</p>
          </div>
          <Btn T={T} accent={accent} onClick={()=>{setEditItem(null);setFC(fCBase);setMCartao(true)}}>+ Novo Cartão</Btn>
        </div>

        {D.cartoes.length===0?(
          <Card T={T} style={{padding:'48px',textAlign:'center'}}>
            <p style={{fontSize:'32px',marginBottom:'12px'}}>◧</p>
            <p style={{fontSize:'15px',fontWeight:600,color:T.text,marginBottom:'6px'}}>Nenhum cartão cadastrado</p>
            <p style={{fontSize:'13px',color:T.text3,marginBottom:'20px'}}>Adicione seus cartões de crédito e débito para rastrear os gastos.</p>
            <Btn T={T} accent={accent} onClick={()=>{setEditItem(null);setFC(fCBase);setMCartao(true)}}>+ Adicionar primeiro cartão</Btn>
          </Card>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'16px'}}>
            {D.cartoes.map(c=>{
              const usado=porCartao[c.id]||0
              const pct=c.limite>0?(usado/c.limite)*100:0
              const info=BANDEIRA_CORES[c.bandeira]||BANDEIRA_CORES['Outros']
              const dispCartao=c.limite-usado
              const emDel=confirmarDel===c.id
              return (
                <div key={c.id} style={{display:'flex',flexDirection:'column',gap:'0'}}>
                  {/* Cartão visual */}
                  <div style={{background:c.cor,borderRadius:'18px 18px 0 0',padding:'20px',position:'relative',overflow:'hidden',minHeight:'130px'}}>
                    <div style={{position:'absolute',top:-25,right:-25,width:110,height:110,background:'rgba(255,255,255,0.07)',borderRadius:'50%'}}/>
                    <div style={{position:'absolute',bottom:-30,left:40,width:130,height:130,background:'rgba(0,0,0,0.1)',borderRadius:'50%'}}/>
                    <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div>
                        <p style={{fontSize:'15px',fontWeight:800,color:info.text,letterSpacing:'0.5px',fontFamily:"'Syne',sans-serif"}}>{c.nome}</p>
                        <p style={{fontSize:'11px',color:`${info.text}aa`,marginTop:'3px'}}>{c.bandeira}</p>
                      </div>
                      <div style={{fontSize:'24px',opacity:0.9}}>{info.logo}</div>
                    </div>
                    <div style={{position:'relative',marginTop:'16px'}}>
                      <p style={{fontSize:'13px',color:`${info.text}88`,letterSpacing:'2px',fontFamily:'monospace'}}>•••• •••• •••• {c.numero||'????'}</p>
                    </div>
                    <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginTop:'10px'}}>
                      <div>
                        <p style={{fontSize:'9px',color:`${info.text}66`,textTransform:'uppercase',letterSpacing:'1px'}}>Vencimento</p>
                        <p style={{fontSize:'12px',fontWeight:600,color:info.text}}>Dia {c.vencimento||'?'}</p>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <p style={{fontSize:'9px',color:`${info.text}66`,textTransform:'uppercase',letterSpacing:'1px'}}>Limite</p>
                        <p style={{fontSize:'13px',fontWeight:700,color:info.text}}>{fmt(c.limite)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Painel abaixo do cartão */}
                  <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderTop:'none',borderRadius:'0 0 18px 18px',padding:'14px 18px'}}>
                    {/* Barra de uso */}
                    <div style={{marginBottom:'10px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                        <span style={{fontSize:'11px',color:T.text3}}>Usado no mês</span>
                        <span style={{fontSize:'11px',fontWeight:700,color:pct>=90?'#ef4444':pct>=70?'#f59e0b':T.text2}}>{pct.toFixed(0)}%</span>
                      </div>
                      <div style={{height:'6px',background:T.bg3,borderRadius:'3px',overflow:'hidden',border:`1px solid ${T.border}`}}>
                        <div style={{
                          width:`${Math.min(pct,100)}%`,height:'100%',borderRadius:'3px',
                          background:pct>=90?'linear-gradient(90deg,#ef4444,#dc2626)':pct>=70?'linear-gradient(90deg,#f59e0b,#d97706)':`linear-gradient(90deg,${accent},${accent}bb)`,
                          boxShadow:pct>=70?`0 0 8px ${pct>=90?'#ef444460':'#f59e0b60'}`:`0 0 6px ${accent}40`,
                          transition:'width 0.5s ease'
                        }}/>
                      </div>
                    </div>

                    {/* Valores */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'12px'}}>
                      {[
                        {lb:'Gasto',val:usado,cor:'#ef4444'},
                        {lb:'Disponível',val:dispCartao,cor:dispCartao<0?'#ef4444':'#10b981'},
                        {lb:'Limite',val:c.limite,cor:T.text2},
                      ].map(k=>(
                        <div key={k.lb} style={{background:T.bg3,borderRadius:'10px',padding:'8px 10px',border:`1px solid ${T.border}`}}>
                          <p style={{fontSize:'9px',color:T.text3,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'3px'}}>{k.lb}</p>
                          <p style={{fontSize:'12px',fontWeight:700,color:k.cor}}>{fmtK(k.val)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Membro */}
                    {(()=>{const m2=mb(c.membroId);return m2?(<div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'12px'}}><Avatar nome={m2.nome} cor={m2.cor} foto={m2.foto} size={20}/><span style={{fontSize:'11px',color:T.text3}}>Titular: {m2.nome}</span></div>):null})()}

                    {/* Botões de ação */}
                    {!emDel?(
                      <div style={{display:'flex',gap:'8px'}}>
                        <button
                          onClick={()=>{setEditItem(c);setFC({nome:c.nome,bandeira:c.bandeira,numero:c.numero,limite:String(c.limite),vencimento:c.vencimento,membroId:c.membroId});setMCartao(true)}}
                          style={{flex:1,padding:'9px',background:T.bg3,border:`1px solid ${T.border}`,borderRadius:'10px',cursor:'pointer',color:T.text2,fontSize:'13px',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',transition:'all 0.2s',fontFamily:'inherit'}}
                        >✎ Editar</button>
                        <button
                          onClick={()=>setConfirmarDel(c.id)}
                          style={{flex:1,padding:'9px',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'10px',cursor:'pointer',color:'#f87171',fontSize:'13px',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',transition:'all 0.2s',fontFamily:'inherit'}}
                        >🗑 Excluir</button>
                      </div>
                    ):(
                      <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:'12px',padding:'12px',textAlign:'center'}}>
                        <p style={{fontSize:'12px',color:'#f87171',fontWeight:600,marginBottom:'10px'}}>⚠ Confirmar exclusão de <strong>{c.nome}</strong>?</p>
                        <div style={{display:'flex',gap:'8px'}}>
                          <button onClick={()=>setConfirmarDel(null)} style={{flex:1,padding:'8px',background:T.bg3,border:`1px solid ${T.border}`,borderRadius:'8px',cursor:'pointer',color:T.text2,fontSize:'12px',fontWeight:600,fontFamily:'inherit'}}>Cancelar</button>
                          <button onClick={()=>{delC(c.id);setConfirmarDel(null)}} style={{flex:1,padding:'8px',background:'rgba(239,68,68,0.18)',border:'1px solid rgba(239,68,68,0.4)',borderRadius:'8px',cursor:'pointer',color:'#f87171',fontSize:'12px',fontWeight:700,fontFamily:'inherit'}}>Sim, excluir</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const pages: Record<string,JSX.Element> = {
    dashboard: <PageDashboard/>, membros: <PageMembros/>, entradas: <PageEntradas/>,
    gastos: <PageGastos/>, fixos: <PageFixos/>, cartoes: <PageCartoes/>, reservas: <PageReservas/>,
    metas: <PageMetas/>, orcamentos: <PageOrcamentos/>, relatorios: <PageRelatorios/>,
  }

  // ── LAYOUT ────────────────────────────────────────────────────────────────
  return (
    <div style={{display:'flex',minHeight:'100vh',background:T.bg,color:T.text,fontFamily:"'DM Sans',system-ui,sans-serif",fontSize:'14px'}}>
      <style>{makeCSS(T,accent)}</style>

      {/* SIDEBAR */}
      <aside className="sidebar-desktop" style={{width:sidebarOpen?240:64,background:T.bg2,borderRight:`1px solid ${T.border}`,display:'flex',flexDirection:'column',transition:'width 0.25s cubic-bezier(0.4,0,0.2,1)',overflow:'hidden',flexShrink:0,position:'sticky',top:0,height:'100vh',zIndex:100}}>
        {/* Logo */}
        <div style={{padding:'16px 12px',borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',gap:'12px',minHeight:60}}>
          <div style={{width:36,height:36,background:`linear-gradient(135deg,${accent},${accent}88)`,borderRadius:'10px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:900,color:'#fff',boxShadow:`0 4px 12px ${accent}50`,letterSpacing:'-1px'}}>F</div>
          {sidebarOpen&&<div><p style={{fontWeight:800,fontSize:'15px',color:T.text,lineHeight:1,letterSpacing:'-0.3px'}}>FinanceHub</p><p style={{fontSize:'10px',color:T.text3,marginTop:2}}>{new Date().getFullYear()}</p></div>}
        </div>

        {/* Membros mini */}
        {sidebarOpen&&(
          <div style={{padding:'10px 12px',borderBottom:`1px solid ${T.border}`}}>
            <p style={{fontSize:'9px',fontWeight:700,color:T.text3,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'8px'}}>Membros</p>
            <div style={{display:'flex',alignItems:'center',gap:'5px',flexWrap:'wrap'}}>
              {D.membros.slice(0,5).map(m=><Avatar key={m.id} nome={m.nome} cor={m.cor} foto={m.foto} size={22}/>)}
              {D.membros.length>5&&<span style={{fontSize:'10px',color:T.text3}}>+{D.membros.length-5}</span>}
            </div>
          </div>
        )}

        {sidebarOpen&&<p style={{fontSize:'9px',fontWeight:700,color:T.text3,textTransform:'uppercase',letterSpacing:'0.8px',padding:'12px 12px 4px'}}>Menu</p>}
        <nav style={{flex:1,padding:'4px 8px',overflowY:'auto'}}>
          {navs.map(n=>(
            <button key={n.id} onClick={()=>irPara(n.id)} className={`nav-btn${aba===n.id?' ativo':''}`} style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'9px 10px',marginBottom:'1px',border:'none',borderRadius:'10px',cursor:'pointer',textAlign:'left',borderLeft:'3px solid transparent',color:T.text2,background:'transparent',fontFamily:'inherit',fontSize:'13px'}}>
              <span style={{fontSize:'14px',flexShrink:0,width:'18px',textAlign:'center'}}>{n.ic}</span>
              {sidebarOpen&&<span style={{fontWeight:aba===n.id?700:400,whiteSpace:'nowrap'}}>{n.lb}</span>}
              {sidebarOpen&&aba===n.id&&<div style={{width:5,height:5,borderRadius:'50%',background:accent,marginLeft:'auto'}}/>}
            </button>
          ))}
        </nav>

        <div style={{padding:'8px 8px 12px',borderTop:`1px solid ${T.border}`}}>
          <button onClick={()=>setSidebarOpen(v=>!v)} style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',border:'none',borderRadius:'10px',cursor:'pointer',background:'transparent',color:T.text3,fontFamily:'inherit',marginBottom:'3px',fontSize:'13px'}}>
            <span>{sidebarOpen?'←':'→'}</span>{sidebarOpen&&<span>Recolher</span>}
          </button>
          <button onClick={()=>{setFCfg({...D.config});setMConfig(true)}} style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',border:'none',borderRadius:'10px',cursor:'pointer',background:'transparent',color:T.text3,fontFamily:'inherit',marginBottom:'3px',fontSize:'13px'}}>
            <span>⚙</span>{sidebarOpen&&<span>Configurações</span>}
          </button>
          {sidebarOpen&&<p style={{fontSize:'10px',color:T.text3,padding:'2px 10px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:'3px'}}>{userEmail}</p>}
          <button onClick={sair} style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',border:`1px solid rgba(239,68,68,0.2)`,borderRadius:'10px',cursor:'pointer',background:'rgba(239,68,68,0.06)',color:'#f87171',fontFamily:'inherit',fontSize:'13px'}}>
            <span>⏻</span>{sidebarOpen&&<span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'auto',minWidth:0}}>
        {/* Header */}
        <header style={{padding:'0 24px',height:54,borderBottom:`1px solid ${T.border}`,display:'flex',alignItems:'center',gap:'12px',background:T.bg2,position:'sticky',top:0,zIndex:50,backdropFilter:'blur(12px)',flexShrink:0}}>
          <button className="mobile-header" onClick={()=>setMenuMobile(v=>!v)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:'9px',color:T.text,width:'34px',height:'34px',cursor:'pointer',fontSize:'16px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>☰</button>
          <div style={{flex:1,minWidth:0}}>
            <h1 style={{fontSize:'15px',fontWeight:700,color:T.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{navs.find(n=>n.id===aba)?.lb}</h1>
          </div>
          {/* Navegação mês */}
          <div style={{display:'flex',alignItems:'center',gap:'2px',background:T.bg3,borderRadius:'10px',padding:'3px',border:`1px solid ${T.border}`}}>
            <button onClick={()=>{const[y,m2]=mes.split('-').map(Number);const d=new Date(y,m2-2,1);setMes(d.toISOString().slice(0,7))}} style={{background:'none',border:'none',cursor:'pointer',color:T.text2,padding:'4px 8px',borderRadius:'7px',fontSize:'13px'}}>‹</button>
            <span style={{fontSize:'12px',fontWeight:700,color:T.text,minWidth:50,textAlign:'center'}}>{nomeMes(mes)}</span>
            <button onClick={()=>{const[y,m2]=mes.split('-').map(Number);const d=new Date(y,m2,1);setMes(d.toISOString().slice(0,7))}} style={{background:'none',border:'none',cursor:'pointer',color:T.text2,padding:'4px 8px',borderRadius:'7px',fontSize:'13px'}}>›</button>
          </div>
          <div className="hide-mobile" style={{display:'flex',gap:'5px'}}>
            <button onClick={exportCSV} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text2,padding:'5px 10px',fontSize:'11px',cursor:'pointer',fontWeight:600}}>⬇ CSV</button>
            <button onClick={backup} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text2,padding:'5px 10px',fontSize:'11px',cursor:'pointer',fontWeight:600}}>⬇ BKP</button>
            <label style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:'8px',color:T.text2,padding:'5px 10px',fontSize:'11px',cursor:'pointer',fontWeight:600}}>⬆ Rest.<input type="file" accept=".json" onChange={restaurar} style={{display:'none'}}/></label>
          </div>
        </header>

        <main className="page-content" style={{flex:1,padding:'22px',maxWidth:1400,width:'100%',margin:'0 auto',alignSelf:'stretch',boxSizing:'border-box'}}>
          {pages[aba]||pages.dashboard}
        </main>

        {/* Nav mobile bottom */}
        <nav className="mobile-nav" style={{display:'none',position:'fixed',bottom:0,left:0,right:0,background:T.bg2,borderTop:`1px solid ${T.border}`,padding:'6px 4px 10px',zIndex:200,gap:'2px',backdropFilter:'blur(16px)'}}>
          {navs.slice(0,5).map(n=>(
            <button key={n.id} onClick={()=>irPara(n.id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',background:'none',border:'none',cursor:'pointer',padding:'5px 2px',borderRadius:'8px',color:aba===n.id?accent:T.text3,transition:'color 0.15s'}}>
              <span style={{fontSize:'17px'}}>{n.ic}</span>
              <span style={{fontSize:'8px',fontWeight:600}}>{n.lb}</span>
            </button>
          ))}
          <button onClick={()=>setMenuMobile(v=>!v)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',background:'none',border:'none',cursor:'pointer',padding:'5px',borderRadius:'8px',color:T.text3}}>
            <span style={{fontSize:'17px'}}>⋯</span><span style={{fontSize:'8px',fontWeight:600}}>Mais</span>
          </button>
        </nav>
      </div>

      {/* Menu mobile fullscreen */}
      {menuMobile&&(
        <div style={{position:'fixed',inset:0,background:T.bg,zIndex:300,display:'flex',flexDirection:'column',padding:'20px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{width:32,height:32,background:`linear-gradient(135deg,${accent},${accent}88)`,borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',fontWeight:900,color:'#fff'}}>F</div>
              <span style={{fontWeight:800,fontSize:'15px'}}>FinanceHub</span>
            </div>
            <button onClick={()=>setMenuMobile(false)} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:'9px',color:T.text,width:'36px',height:'36px',cursor:'pointer',fontSize:'20px'}}>×</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',flex:1,overflowY:'auto'}}>
            {navs.map(n=>(
              <button key={n.id} onClick={()=>irPara(n.id)} style={{display:'flex',alignItems:'center',gap:'10px',padding:'14px 16px',background:aba===n.id?`${accent}18`:T.bg2,border:`1px solid ${aba===n.id?`${accent}40`:T.border}`,borderRadius:'14px',cursor:'pointer',color:aba===n.id?accent:T.text2,fontFamily:'inherit',fontSize:'13px'}}>
                <span style={{fontSize:'18px'}}>{n.ic}</span>
                <span style={{fontWeight:500}}>{n.lb}</span>
              </button>
            ))}
          </div>
          <div style={{marginTop:'14px',paddingTop:'14px',borderTop:`1px solid ${T.border}`}}>
            <p style={{fontSize:'11px',color:T.text3,marginBottom:'8px'}}>{userEmail}</p>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>{setFCfg({...D.config});setMConfig(true);setMenuMobile(false)}} style={{flex:1,padding:'10px',background:T.bg2,border:`1px solid ${T.border}`,borderRadius:'10px',color:T.text2,cursor:'pointer',fontSize:'13px',fontWeight:600}}>⚙ Config</button>
              <button onClick={sair} style={{flex:1,padding:'10px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'10px',color:'#f87171',cursor:'pointer',fontSize:'13px',fontWeight:600}}>⏻ Sair</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAIS ── */}

      {/* Configurações */}
      <Modal open={mConfig} onClose={()=>setMConfig(false)} titulo="⚙ Configurações" T={T} accent={accent}>
        <div style={{marginBottom:'14px'}}>
          <label style={{display:'block',color:T.text2,fontSize:'11px',marginBottom:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>Tema</label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:'8px'}}>
            {[
              {key:'dark',    label:'Dark',       bg:'#07090f', accent2:'#6366f1'},
              {key:'darker',  label:'Black',      bg:'#000',    accent2:'#8b5cf6'},
              {key:'purple',  label:'Dark Purple',bg:'#0d0a1a', accent2:'#a855f7'},
              {key:'navy',    label:'Dark Navy',  bg:'#070d1a', accent2:'#3b82f6'},
              {key:'light',   label:'Light',      bg:'#f8fafc', accent2:'#6366f1'},
              {key:'cream',   label:'Cream',      bg:'#faf8f5', accent2:'#b45309'},
              {key:'mint',    label:'Mint',       bg:'#f0fdf8', accent2:'#10b981'},
            ].map(t=>(
              <button key={t.key} onClick={()=>setFCfg({...fCfg,tema:t.key})} style={{padding:'10px 8px',border:`2px solid ${fCfg.tema===t.key?accent:'transparent'}`,borderRadius:'12px',background:t.bg,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',transition:'all 0.2s',boxShadow:fCfg.tema===t.key?`0 0 14px ${accent}40`:'none'}}>
                <div style={{width:20,height:20,borderRadius:'50%',background:t.accent2}}/>
                <span style={{fontSize:'10px',color:t.bg==='#f8fafc'||t.bg==='#faf8f5'||t.bg==='#f0fdf8'?'#333':'#fff',fontWeight:700,fontFamily:"'Syne',sans-serif"}}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:'14px'}}>
          <label style={{display:'block',color:T.text2,fontSize:'11px',marginBottom:'8px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>Cor de destaque</label>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            {Object.entries(ACCENTS).map(([k,v])=>(
              <button key={k} onClick={()=>setFCfg({...fCfg,accentColor:k})} title={k} style={{width:28,height:28,borderRadius:'50%',background:v,border:fCfg.accentColor===k?'3px solid #fff':'3px solid transparent',cursor:'pointer',transition:'border 0.15s',boxShadow:`0 2px 8px ${v}60`}}/>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
          <Btn variant="secondary" T={T} accent={accent} onClick={()=>setMConfig(false)} style={{flex:1}}>Cancelar</Btn>
          <Btn T={T} accent={accent} onClick={salvarConfig} style={{flex:1}}>Aplicar</Btn>
        </div>
      </Modal>

      {/* Cartão */}
      <Modal open={mCartao} onClose={()=>{setMCartao(false);setEditItem(null);setFC(fCBase)}} titulo={editItem?'✎ Editar Cartão':'+ Novo Cartão'} T={T} accent={accent}>
        <Inp label="Nome do cartão" value={fC.nome} onChange={(e:any)=>setFC({...fC,nome:e.target.value})} placeholder="Ex: Nubank Black" T={T} accent={accent}/>
        <Sel label="Banco / Bandeira" value={fC.bandeira} onChange={(e:any)=>setFC({...fC,bandeira:e.target.value})} T={T}>
          {BANDEIRAS.map(b=><option key={b}>{b}</option>)}
        </Sel>
        {fC.bandeira&&BANDEIRA_CORES[fC.bandeira]&&(
          <div style={{marginBottom:'14px',padding:'12px',background:BANDEIRA_CORES[fC.bandeira].bg,borderRadius:'12px',display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'20px'}}>{BANDEIRA_CORES[fC.bandeira].logo}</span>
            <span style={{color:BANDEIRA_CORES[fC.bandeira].text,fontSize:'13px',fontWeight:600}}>{fC.bandeira} — cor real do banco</span>
          </div>
        )}
        <Inp label="Últimos 4 dígitos" value={fC.numero} onChange={(e:any)=>setFC({...fC,numero:e.target.value})} placeholder="1234" maxLength={4} T={T} accent={accent}/>
        <Inp label="Limite (ex: 5.000,00)" value={fC.limite} onChange={(e:any)=>setFC({...fC,limite:e.target.value})} placeholder="5.000,00" T={T} accent={accent} helper="Use ponto ou vírgula como separador decimal"/>
        <Inp label="Dia de vencimento" type="number" value={fC.vencimento} onChange={(e:any)=>setFC({...fC,vencimento:e.target.value})} min="1" max="31" T={T} accent={accent}/>
        <Sel label="Titular" value={fC.membroId} onChange={(e:any)=>setFC({...fC,membroId:e.target.value})} T={T}>
          {D.membros.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
        </Sel>
        <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
          <Btn variant="secondary" T={T} accent={accent} onClick={()=>{setMCartao(false);setEditItem(null)}} style={{flex:1}}>Cancelar</Btn>
          <Btn T={T} accent={accent} onClick={saveC} style={{flex:1}}>Salvar</Btn>
        </div>
      </Modal>

      {/* Gasto */}
      <Modal open={mGasto} onClose={()=>setMGasto(false)} titulo="+ Novo Gasto" T={T} accent={accent}>
        <Inp label="Descrição" value={fG.descricao} onChange={(e:any)=>setFG({...fG,descricao:e.target.value})} placeholder="Ex: Supermercado" T={T} accent={accent}/>
        <Inp label="Valor (ex: 150,00)" value={fG.valor} onChange={(e:any)=>setFG({...fG,valor:e.target.value})} placeholder="150,00" T={T} accent={accent} helper="Use ponto ou vírgula"/>
        <Sel label="Categoria" value={fG.categoria} onChange={(e:any)=>setFG({...fG,categoria:e.target.value})} T={T}>
          {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
        </Sel>
        <Inp label="Data" type="date" value={fG.data} onChange={(e:any)=>setFG({...fG,data:e.target.value})} T={T} accent={accent}/>
        <Sel label="Forma de pagamento" value={fG.pgto} onChange={(e:any)=>setFG({...fG,pgto:e.target.value})} T={T}>
          {FORMAS_PGTO.map(f=><option key={f}>{f}</option>)}
        </Sel>
        {fG.pgto==='Crédito'&&<Sel label="Cartão" value={fG.cartaoId} onChange={(e:any)=>setFG({...fG,cartaoId:e.target.value})} T={T}><option value="">Selecione...</option>{D.cartoes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</Sel>}
        <Inp label="Parcelas" type="number" value={fG.parcelas} onChange={(e:any)=>setFG({...fG,parcelas:e.target.value})} min="1" max="48" T={T} accent={accent}/>
        <Sel label="Membro" value={fG.membroId} onChange={(e:any)=>setFG({...fG,membroId:e.target.value})} T={T}>
          {D.membros.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
        </Sel>
        <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
          <Btn variant="secondary" T={T} accent={accent} onClick={()=>setMGasto(false)} style={{flex:1}}>Cancelar</Btn>
          <Btn T={T} accent={accent} onClick={addG} style={{flex:1}}>Salvar</Btn>
        </div>
      </Modal>

      {/* Fixo */}
      <Modal open={mFixo} onClose={()=>setMFixo(false)} titulo="+ Gasto Fixo" T={T} accent={accent}>
        <Inp label="Descrição" value={fFx.descricao} onChange={(e:any)=>setFFx({...fFx,descricao:e.target.value})} placeholder="Ex: Aluguel" T={T} accent={accent}/>
        <Inp label="Valor (ex: 1.200,00)" value={fFx.valor} onChange={(e:any)=>setFFx({...fFx,valor:e.target.value})} placeholder="1.200,00" T={T} accent={accent} helper="Use ponto ou vírgula"/>
        <Sel label="Categoria" value={fFx.categoria} onChange={(e:any)=>setFFx({...fFx,categoria:e.target.value})} T={T}>
          {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
        </Sel>
        <Sel label="Forma de pagamento" value={fFx.pgto} onChange={(e:any)=>setFFx({...fFx,pgto:e.target.value})} T={T}>
          {FORMAS_PGTO.map(f=><option key={f}>{f}</option>)}
        </Sel>
        <Inp label="Dia de vencimento" type="number" value={fFx.dia} onChange={(e:any)=>setFFx({...fFx,dia:e.target.value})} min="1" max="31" T={T} accent={accent}/>
        <Sel label="Membro" value={fFx.membroId} onChange={(e:any)=>setFFx({...fFx,membroId:e.target.value})} T={T}>
          {D.membros.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
        </Sel>
        <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
          <Btn variant="secondary" T={T} accent={accent} onClick={()=>setMFixo(false)} style={{flex:1}}>Cancelar</Btn>
          <Btn T={T} accent={accent} onClick={addFx} style={{flex:1}}>Salvar</Btn>
        </div>
      </Modal>

      {/* Entrada — recorrente SOMENTE se marcado */}
      <Modal open={mEntrada} onClose={()=>{setMEntrada(false);setEditItem(null)}} titulo={editItem?'✎ Editar Entrada':'+ Nova Entrada'} T={T} accent={accent}>
        <Inp label="Descrição" value={fE.descricao} onChange={(e:any)=>setFE({...fE,descricao:e.target.value})} placeholder="Ex: Salário, Projeto X" T={T} accent={accent}/>
        <Inp label="Valor (ex: 4.862,00)" value={fE.valor} onChange={(e:any)=>setFE({...fE,valor:e.target.value})} placeholder="4.862,00" T={T} accent={accent} helper="Use ponto ou vírgula"/>
        <Sel label="Tipo" value={fE.tipo} onChange={(e:any)=>setFE({...fE,tipo:e.target.value})} T={T}>
          {['Salário','Freelance','Investimento','Aluguel','Projeto','Bônus','Outros'].map(t=><option key={t}>{t}</option>)}
        </Sel>
        <Sel label="Membro" value={fE.membroId} onChange={(e:any)=>setFE({...fE,membroId:e.target.value})} T={T}>
          {D.membros.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
        </Sel>
        <div style={{marginBottom:'10px',padding:'12px',background:T.bg3,borderRadius:'10px',border:`1px solid ${fE.recorrente?accent+'40':T.border}`,display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',transition:'border 0.2s'}} onClick={()=>setFE({...fE,recorrente:!fE.recorrente})}>
          <input type="checkbox" checked={!!fE.recorrente} onChange={()=>{}} style={{width:16,height:16,cursor:'pointer',accentColor:accent,pointerEvents:'none'}}/>
          <div>
            <span style={{fontWeight:700,color:T.text,fontSize:'13px'}}>↻ Recorrente — aparece todo mês</span>
            <p style={{fontSize:'11px',color:T.text3,marginTop:'2px'}}>Marque só para salário fixo. Projetos, freelances e bônus: deixe desmarcado.</p>
          </div>
        </div>
        {!fE.recorrente&&(
          <div style={{marginBottom:'14px'}}>
            <label style={{display:'block',color:T.text2,fontSize:'11px',marginBottom:'6px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>Mês desta entrada</label>
            <input type="month" value={fE.mes||mesAtual()} onChange={e=>setFE({...fE,mes:e.target.value})} style={{width:'100%'}}/>
            <p style={{fontSize:'11px',color:T.text3,marginTop:'4px'}}>Essa entrada só aparecerá no mês selecionado.</p>
          </div>
        )}
        <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
          <Btn variant="secondary" T={T} accent={accent} onClick={()=>{setMEntrada(false);setEditItem(null)}} style={{flex:1}}>Cancelar</Btn>
          <Btn T={T} accent={accent} onClick={saveE} style={{flex:1}}>Salvar</Btn>
        </div>
      </Modal>

      {/* Meta / Investimento */}
      <Modal open={mMeta} onClose={()=>{setMMeta(false);setEditItem(null)}} titulo={editItem?'✎ Editar':'+ Nova Meta / Investimento'} T={T} accent={accent}>
        <Sel label="Tipo" value={fM.tipo} onChange={(e:any)=>setFM({...fM,tipo:e.target.value as 'meta'|'investimento'})} T={T}>
          <option value="meta">🎯 Meta (ex: Comprar terreno)</option>
          <option value="investimento">📈 Investimento (ex: Tesouro, CDB)</option>
        </Sel>
        <Inp label="Descrição" value={fM.descricao} onChange={(e:any)=>setFM({...fM,descricao:e.target.value})} placeholder="Ex: Terreno, Reserva de emergência" T={T} accent={accent}/>
        <Inp label="Valor objetivo (ex: 20.000,00)" value={fM.valor} onChange={(e:any)=>setFM({...fM,valor:e.target.value})} placeholder="20.000,00" T={T} accent={accent} helper="Use ponto ou vírgula"/>
        <Inp label="Prazo (opcional)" type="month" value={fM.prazo} onChange={(e:any)=>setFM({...fM,prazo:e.target.value})} T={T} accent={accent}/>
        <div style={{marginBottom:'14px'}}>
          <label style={{display:'block',color:T.text2,fontSize:'11px',marginBottom:'8px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>Cor</label>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>{CORES.map(c=><div key={c} onClick={()=>setFM({...fM,cor:c})} style={{width:28,height:28,background:c,borderRadius:'50%',cursor:'pointer',border:fM.cor===c?'3px solid #fff':'3px solid transparent',boxShadow:fM.cor===c?`0 0 10px ${c}`:undefined}}/>)}</div>
        </div>
        <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
          <Btn variant="secondary" T={T} accent={accent} onClick={()=>{setMMeta(false);setEditItem(null)}} style={{flex:1}}>Cancelar</Btn>
          <Btn T={T} accent={accent} onClick={saveM} style={{flex:1}}>Salvar</Btn>
        </div>
      </Modal>

      {/* Reserva / Aporte */}
      <Modal open={mReserva} onClose={()=>{setMReserva(false);setEditItem(null)}} titulo={editItem?'✎ Editar Aporte':'+ Novo Aporte'} T={T} accent={accent}>
        <Inp label="Descrição" value={fR.descricao} onChange={(e:any)=>setFR({...fR,descricao:e.target.value})} placeholder="Ex: Aporte mensal" T={T} accent={accent}/>
        <Inp label="Valor (ex: 500,00)" value={fR.valor} onChange={(e:any)=>setFR({...fR,valor:e.target.value})} placeholder="500,00" T={T} accent={accent} helper="Use ponto ou vírgula"/>
        <Inp label="Data" type="date" value={fR.data} onChange={(e:any)=>setFR({...fR,data:e.target.value})} T={T} accent={accent}/>
        <Sel label="Destinar para Meta / Investimento" value={fR.metaId} onChange={(e:any)=>setFR({...fR,metaId:e.target.value})} T={T}>
          <option value="">— Sem vínculo</option>
          {D.metas.map(m=><option key={m.id} value={m.id}>{m.tipo==='investimento'?'📈':'🎯'} {m.descricao}</option>)}
        </Sel>
        {fR.metaId&&(()=>{
          const meta=D.metas.find(m=>m.id===fR.metaId)
          if(!meta)return null
          const reservado=D.reservas.filter(r=>r.metaId===fR.metaId&&r.id!==(editItem?.id)).reduce((s,r)=>s+r.valor,0)
          const novoValor=reservado+parseMoeda(fR.valor)
          const pct=meta.valor>0?(novoValor/meta.valor)*100:0
          return (
            <div style={{padding:'12px',background:T.bg3,borderRadius:'10px',border:`1px solid ${meta.cor}30`,marginBottom:'14px'}}>
              <p style={{fontSize:'12px',color:T.text2,marginBottom:'4px',fontWeight:600}}>{meta.descricao}</p>
              <div style={{height:'5px',background:'rgba(255,255,255,0.06)',borderRadius:'3px',overflow:'hidden',marginBottom:'4px'}}>
                <div style={{width:`${Math.min(pct,100)}%`,height:'100%',background:meta.cor,borderRadius:'3px'}}/>
              </div>
              <p style={{fontSize:'11px',color:T.text3}}>Ficará em: {fmt(novoValor)} de {fmt(meta.valor)} ({pct.toFixed(0)}%)</p>
            </div>
          )
        })()}
        <Sel label="Membro" value={fR.membroId} onChange={(e:any)=>setFR({...fR,membroId:e.target.value})} T={T}>
          {D.membros.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
        </Sel>
        <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
          <Btn variant="secondary" T={T} accent={accent} onClick={()=>{setMReserva(false);setEditItem(null)}} style={{flex:1}}>Cancelar</Btn>
          <Btn T={T} accent={accent} onClick={saveR} style={{flex:1}}>Salvar</Btn>
        </div>
      </Modal>

      {/* Membro */}
      <Modal open={mMembro} onClose={()=>{setMMembro(false);setEditMembro(null)}} titulo={editMembro?'✎ Editar Membro':'+ Novo Membro'} T={T} accent={accent}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px',padding:'12px',background:T.bg3,borderRadius:'12px',border:`1px solid ${T.border}`}}>
          <Avatar nome={fMb.nome||'?'} cor={fMb.cor} foto={fMb.foto} size={48}/>
          <div>
            <p style={{fontSize:'13px',color:T.text,fontWeight:600}}>{fMb.nome||'Pré-visualização'}</p>
            <label style={{fontSize:'11px',color:accent,cursor:'pointer',fontWeight:600}}>
              📷 {fMb.foto?'Trocar foto':'Adicionar foto'}
              <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
                const f=e.target.files?.[0];if(!f)return
                const r=new FileReader();r.onload=ev=>setFMb({...fMb,foto:ev.target?.result as string});r.readAsDataURL(f)
              }}/>
            </label>
          </div>
        </div>
        <Inp label="Nome" value={fMb.nome} onChange={(e:any)=>setFMb({...fMb,nome:e.target.value})} placeholder="Ex: Maria" T={T} accent={accent}/>
        <div style={{marginBottom:'14px'}}>
          <label style={{display:'block',color:T.text2,fontSize:'11px',marginBottom:'8px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>Cor do avatar</label>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            {CORES.map(c=><div key={c} onClick={()=>setFMb({...fMb,cor:c})} style={{width:28,height:28,background:c,borderRadius:'50%',cursor:'pointer',border:fMb.cor===c?'3px solid #fff':'3px solid transparent',boxShadow:fMb.cor===c?`0 0 10px ${c}`:undefined}}/>)}
          </div>
        </div>
        <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
          <Btn variant="secondary" T={T} accent={accent} onClick={()=>{setMMembro(false);setEditMembro(null)}} style={{flex:1}}>Cancelar</Btn>
          <Btn T={T} accent={accent} onClick={saveMb} style={{flex:1}}>Salvar</Btn>
        </div>
      </Modal>

      {/* Orçamento — com nome livre */}
      <Modal open={mOrc} onClose={()=>setMOrc(false)} titulo="+ Definir Orçamento" T={T} accent={accent}>
        <Inp label="Nome do orçamento" value={fO.nome} onChange={(e:any)=>setFO({...fO,nome:e.target.value})} placeholder="Ex: Alimentação Família, Lazer Pessoal" T={T} accent={accent}/>
        <Sel label="Categoria" value={fO.categoria} onChange={(e:any)=>setFO({...fO,categoria:e.target.value})} T={T}>
          {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
        </Sel>
        <Inp label="Limite (ex: 1.000,00)" value={fO.limite} onChange={(e:any)=>setFO({...fO,limite:e.target.value})} placeholder="1.000,00" T={T} accent={accent} helper="Use ponto ou vírgula"/>
        <Inp label="Mês" type="month" value={fO.mes} onChange={(e:any)=>setFO({...fO,mes:e.target.value})} T={T} accent={accent}/>
        <div style={{marginBottom:'14px'}}>
          <label style={{display:'block',color:T.text2,fontSize:'11px',marginBottom:'8px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.8px'}}>Cor</label>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>{CORES.map(c=><div key={c} onClick={()=>setFO({...fO,cor:c})} style={{width:28,height:28,background:c,borderRadius:'50%',cursor:'pointer',border:fO.cor===c?'3px solid #fff':'3px solid transparent'}}/>)}</div>
        </div>
        <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
          <Btn variant="secondary" T={T} accent={accent} onClick={()=>setMOrc(false)} style={{flex:1}}>Cancelar</Btn>
          <Btn T={T} accent={accent} onClick={addO} style={{flex:1}}>Salvar</Btn>
        </div>
      </Modal>

    </div>
  )
}