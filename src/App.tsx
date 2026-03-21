import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './Auth'
import Dashboard from './Dashboard'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0a0e1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px',
          background: 'linear-gradient(135deg,#6366f1,#10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 'bold', color: '#fff'
        }}>F</div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>Carregando...</p>
      </div>
    </div>
  )

  if (!session) return <Auth />

  return (
    <Dashboard
      userId={session.user.id}
      userEmail={session.user.email}
    />
  )
}