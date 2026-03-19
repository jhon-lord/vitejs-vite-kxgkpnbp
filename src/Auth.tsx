import { useState } from 'react'
import { supabase } from './lib/supabase'
import { Zap, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

type Screen = 'login' | 'register' | 'forgot' | 'check-email'

const DARK = {
  bg: "#0d1117", card: "#1a2236", text: "#f1f5f9",
  sub: "#8892a4", border: "#243044", inputBg: "#0d1117",
}

export default function Auth() {
  const [screen, setScreen] = useState<Screen>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const T = DARK

  const handleLogin = async () => {
    if (!email || !password) { setError('Preencha e-mail e senha.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)
    setLoading(false)
  }

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Preencha todos os campos.'); return }
    if (password.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) setError(error.message)
    else setScreen('check-email')
    setLoading(false)
  }

  const handleForgot = async () => {
    if (!email) { setError('Digite seu e-mail.'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/?reset=true'
    })
    if (error) setError(error.message)
    else { setSuccess('E-mail enviado! Verifique sua caixa de entrada.') }
    setLoading(false)
  }

  const inp = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: `1.5px solid ${T.border}`, fontSize: 14, outline: 'none',
    fontFamily: 'inherit', background: T.inputBg, color: T.text,
    boxSizing: 'border-box' as any,
  }

  return (
    <div style={{
      minHeight: '100vh', background: T.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16,
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Zap size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: 0 }}>FinanceHub</h1>
          <p style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Seu controle financeiro inteligente</p>
        </div>

        {/* Card */}
        <div style={{
          background: T.card, borderRadius: 24, padding: 28,
          border: `1px solid ${T.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
        }}>

          {/* CHECK EMAIL */}
          {screen === 'check-email' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#10b98120', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={28} color="#10b981" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>Verifique seu e-mail</h2>
              <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.6, marginBottom: 20 }}>
                Enviamos um link de confirmação para <strong style={{ color: T.text }}>{email}</strong>. Clique nele para ativar sua conta.
              </p>
              <button onClick={() => setScreen('login')} style={{
                width: '100%', padding: '12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 700
              }}>Ir para o login</button>
            </div>
          )}

          {/* LOGIN */}
          {screen === 'login' && (<>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 6 }}>Bem-vindo de volta!</h2>
            <p style={{ fontSize: 13, color: T.sub, marginBottom: 24 }}>Entre na sua conta para continuar</p>

            {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#ef444420', border: '1px solid #ef444440', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#ef4444' }}><AlertCircle size={14} />{error}</div>}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color={T.sub} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" type="email" style={{ ...inp, paddingLeft: 42 }} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={T.sub} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type={showPass ? 'text' : 'password'} style={{ ...inp, paddingLeft: 42, paddingRight: 42 }} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.sub, display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <button onClick={() => { setScreen('forgot'); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: 13, fontWeight: 600 }}>Esqueci a senha</button>
            </div>

            <button onClick={handleLogin} disabled={loading} style={{
              width: '100%', padding: '13px', background: loading ? '#4f46e5' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700, marginBottom: 16, opacity: loading ? .7 : 1
            }}>{loading ? 'Entrando...' : 'Entrar'}</button>

            <div style={{ textAlign: 'center', fontSize: 13, color: T.sub }}>
              Não tem conta?{' '}
              <button onClick={() => { setScreen('register'); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 700, fontSize: 13 }}>Criar conta grátis</button>
            </div>
          </>)}

          {/* REGISTER */}
          {screen === 'register' && (<>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <button onClick={() => { setScreen('login'); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub, display: 'flex' }}><ArrowLeft size={18} /></button>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>Criar conta</h2>
            </div>
            <p style={{ fontSize: 13, color: T.sub, marginBottom: 24, marginLeft: 28 }}>Comece gratuitamente hoje</p>

            {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#ef444420', border: '1px solid #ef444440', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#ef4444' }}><AlertCircle size={14} />{error}</div>}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>Seu nome</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="João Silva" style={inp} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color={T.sub} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" type="email" style={{ ...inp, paddingLeft: 42 }} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>Senha (mín. 6 caracteres)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={T.sub} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type={showPass ? 'text' : 'password'} style={{ ...inp, paddingLeft: 42, paddingRight: 42 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.sub, display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button onClick={handleRegister} disabled={loading} style={{
              width: '100%', padding: '13px', background: loading ? '#4f46e5' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700, marginBottom: 16, opacity: loading ? .7 : 1
            }}>{loading ? 'Criando conta...' : 'Criar conta grátis'}</button>

            <div style={{ textAlign: 'center', fontSize: 13, color: T.sub }}>
              Já tem conta?{' '}
              <button onClick={() => { setScreen('login'); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 700, fontSize: 13 }}>Entrar</button>
            </div>
          </>)}

          {/* FORGOT */}
          {screen === 'forgot' && (<>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <button onClick={() => { setScreen('login'); setError(''); setSuccess('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sub, display: 'flex' }}><ArrowLeft size={18} /></button>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>Recuperar senha</h2>
            </div>
            <p style={{ fontSize: 13, color: T.sub, marginBottom: 24, marginLeft: 28 }}>Enviaremos um link para redefinir sua senha</p>

            {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#ef444420', border: '1px solid #ef444440', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#ef4444' }}><AlertCircle size={14} />{error}</div>}
            {success && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#10b98120', border: '1px solid #10b98140', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#10b981' }}><CheckCircle size={14} />{success}</div>}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .5 }}>E-mail cadastrado</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color={T.sub} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" type="email" style={{ ...inp, paddingLeft: 42 }} />
              </div>
            </div>

            <button onClick={handleForgot} disabled={loading || !!success} style={{
              width: '100%', padding: '13px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer',
              fontSize: 14, fontWeight: 700, opacity: loading || !!success ? .7 : 1
            }}>{loading ? 'Enviando...' : 'Enviar link de recuperação'}</button>
          </>)}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: T.sub, marginTop: 20 }}>
          🔒 Seus dados são privados e protegidos
        </p>
      </div>
    </div>
  )
}