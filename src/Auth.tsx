import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modo, setModo] = useState<'login' | 'cadastro' | 'reset'>('login')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)
  const [okMsg, setOkMsg] = useState('')

  // Detecta link de confirmação / reset de senha
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) window.location.replace('/')
      })
      return
    }
    const params = new URLSearchParams(window.location.search)
    const tokenHash = params.get('token_hash')
    const type = params.get('type') as any
    if (tokenHash && type) {
      setLoading(true)
      supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        .then(({ error }) => {
          if (!error) {
            window.history.replaceState({}, '', '/')
            window.location.reload()
          } else {
            setErro('Link expirado ou inválido. Tente novamente.')
            setLoading(false)
          }
        })
    }
  }, [])

  const entrar = async () => {
    if (!email || !senha) { setErro('Preencha todos os campos'); return }
    setLoading(true); setErro('')
    const { error } = modo === 'login'
      ? await supabase.auth.signInWithPassword({ email, password: senha })
      : await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.origin } })
    if (error) setErro(error.message)
    else if (modo === 'cadastro') { setOk(true); setOkMsg('cadastro') }
    setLoading(false)
  }

  const recuperarSenha = async () => {
    if (!email) { setErro('Digite seu e-mail acima'); return }
    setLoading(true); setErro('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    if (error) setErro(error.message)
    else { setOk(true); setOkMsg('reset') }
    setLoading(false)
  }

  if (loading && !email) return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#6366f1,#10b981)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:'bold', color:'#fff', animation:'pulse 1.5s infinite' }}>F</div>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:14, margin:0 }}>Verificando...</p>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#0a0e1a', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',-apple-system,sans-serif", padding:16 }}>
      <div style={{ width:'100%', maxWidth:400, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:24, padding:40 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:56, height:56, borderRadius:16, margin:'0 auto 16px', background:'linear-gradient(135deg,#6366f1,#10b981)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:'bold', color:'#fff' }}>F</div>
          <h1 style={{ margin:'0 0 6px', fontSize:24, fontWeight:700, color:'#fff' }}>FinanceHub</h1>
          <p style={{ margin:0, fontSize:14, color:'rgba(255,255,255,0.4)' }}>Controle financeiro pessoal</p>
        </div>

        {ok ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>{okMsg==='reset' ? '📩' : '📧'}</div>
            <p style={{ margin:'0 0 8px', fontSize:16, fontWeight:700, color:'#fff' }}>
              {okMsg==='reset' ? 'E-mail de recuperação enviado!' : 'Confirme seu e-mail!'}
            </p>
            <p style={{ margin:'0 0 20px', fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.5 }}>
              {okMsg==='reset'
                ? <>Enviamos um link para <strong style={{color:'#6366f1'}}>{email}</strong>. Clique nele para redefinir sua senha.</>
                : <>Enviamos um link para <strong style={{color:'#6366f1'}}>{email}</strong>. Clique nele para entrar automaticamente.</>
              }
            </p>
            <button onClick={()=>{ setOk(false); setModo('login'); setErro('') }} style={{ padding:'10px 24px', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, cursor:'pointer', background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:600 }}>
              Voltar ao login
            </button>
          </div>
        ) : (
          <>
            {/* Tabs — só login e cadastro */}
            {modo !== 'reset' && (
              <div style={{ display:'flex', marginBottom:28, background:'rgba(255,255,255,0.05)', borderRadius:12, padding:4 }}>
                {(['login','cadastro'] as const).map(m=>(
                  <button key={m} onClick={()=>{ setModo(m); setErro('') }} style={{ flex:1, padding:'8px 0', border:'none', borderRadius:9, cursor:'pointer', fontSize:14, fontWeight:600, background: modo===m ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'transparent', color: modo===m ? '#fff' : 'rgba(255,255,255,0.4)', transition:'all 0.2s' }}>
                    {m==='login' ? 'Entrar' : 'Cadastrar'}
                  </button>
                ))}
              </div>
            )}

            {/* Título recuperar senha */}
            {modo==='reset' && (
              <div style={{ marginBottom:24 }}>
                <button onClick={()=>{ setModo('login'); setErro('') }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:13, marginBottom:12, padding:0 }}>
                  ← Voltar
                </button>
                <p style={{ margin:0, fontSize:16, fontWeight:700, color:'#fff' }}>Recuperar senha</p>
                <p style={{ margin:'4px 0 0', fontSize:13, color:'rgba(255,255,255,0.4)' }}>Enviaremos um link para redefinir sua senha</p>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Email */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.8px' }}>E-mail</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(modo==='reset'?recuperarSenha():entrar())} placeholder="seu@email.com"
                  style={{ width:'100%', boxSizing:'border-box', padding:'12px 16px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, color:'#fff', fontSize:15, outline:'none' }}/>
              </div>

              {/* Senha — só no login e cadastro */}
              {modo !== 'reset' && (
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.8px' }}>Senha</label>
                  <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} onKeyDown={e=>e.key==='Enter'&&entrar()} placeholder="••••••••"
                    style={{ width:'100%', boxSizing:'border-box', padding:'12px 16px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, color:'#fff', fontSize:15, outline:'none' }}/>
                  {/* Link "Esqueci a senha" — só no login */}
                  {modo==='login' && (
                    <button onClick={()=>{ setModo('reset'); setErro('') }} style={{ background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontSize:12, marginTop:6, padding:0, float:'right' }}>
                      Esqueci a senha
                    </button>
                  )}
                </div>
              )}

              {erro && <p style={{ margin:0, fontSize:13, color:'#f87171', background:'rgba(239,68,68,0.1)', padding:'8px 12px', borderRadius:8 }}>{erro}</p>}

              <button onClick={modo==='reset' ? recuperarSenha : entrar} disabled={loading} style={{ padding:'13px', border:'none', borderRadius:12, cursor: loading ? 'not-allowed' : 'pointer', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', fontSize:15, fontWeight:700, boxShadow:'0 4px 16px rgba(99,102,241,0.4)', opacity: loading ? 0.7 : 1, transition:'all 0.2s', marginTop:4, clear:'both' }}>
                {loading ? 'Aguarde...' : modo==='login' ? 'Entrar' : modo==='cadastro' ? 'Criar conta' : 'Enviar link de recuperação'}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`input::placeholder{color:rgba(255,255,255,0.2)!important}input:focus{border-color:rgba(99,102,241,0.6)!important;box-shadow:0 0 0 3px rgba(99,102,241,0.15)!important}`}</style>
    </div>
  )
}