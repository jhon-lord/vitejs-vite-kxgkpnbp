import { useState } from 'react'
import { supabase } from './lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)

  const entrar = async () => {
    if (!email || !senha) { setErro('Preencha todos os campos'); return }
    setLoading(true); setErro('')
    const { error } = modo === 'login'
      ? await supabase.auth.signInWithPassword({ email, password: senha })
      : await supabase.auth.signUp({ email, password: senha })
    if (error) setErro(error.message)
    else if (modo === 'cadastro') setOk(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0e1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter',-apple-system,sans-serif", padding: 16
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24, padding: 40
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg,#6366f1,#10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 'bold', color: '#fff'
          }}>F</div>
          <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#fff' }}>FinanceHub</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Controle financeiro pessoal</p>
        </div>

        {ok ? (
          <div style={{ textAlign: 'center', color: '#10b981' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <p style={{ margin: 0, fontSize: 15 }}>Verifique seu e-mail para confirmar o cadastro.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', marginBottom: 28, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
              {(['login', 'cadastro'] as const).map(m => (
                <button key={m} onClick={() => { setModo(m); setErro('') }} style={{
                  flex: 1, padding: '8px 0', border: 'none', borderRadius: 9, cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                  background: modo === m ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'transparent',
                  color: modo === m ? '#fff' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.2s'
                }}>{m === 'login' ? 'Entrar' : 'Cadastrar'}</button>
              ))}
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>E-mail</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && entrar()}
                  placeholder="seu@email.com"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Senha</label>
                <input
                  type="password" value={senha} onChange={e => setSenha(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && entrar()}
                  placeholder="••••••••"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none' }}
                />
              </div>

              {erro && <p style={{ margin: 0, fontSize: 13, color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{erro}</p>}

              <button onClick={entrar} disabled={loading} style={{
                padding: '13px', border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                color: '#fff', fontSize: 15, fontWeight: 700,
                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                opacity: loading ? 0.7 : 1, transition: 'all 0.2s', marginTop: 4
              }}>
                {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`input::placeholder{color:rgba(255,255,255,0.2)!important}input:focus{border-color:rgba(99,102,241,0.6)!important;box-shadow:0 0 0 3px rgba(99,102,241,0.15)!important}`}</style>
    </div>
  )
}