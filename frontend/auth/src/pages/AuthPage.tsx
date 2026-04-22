import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Eye, EyeOff, Plane, Ship, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import axios from 'axios'

const AUTH_API = import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:9000'

export default function AuthPage() {
  const location = useLocation()
  const params   = new URLSearchParams(location.search)
  const redirect = params.get('redirect') ?? 'http://localhost:8001'

  const [mode,    setMode]    = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [showPw,  setShowPw]  = useState(false)

  const [form, setForm] = useState({
    email: '', password: '', first_name: '', last_name: '', phone: '',
  })

  function update(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const endpoint = mode === 'signin' ? '/auth/login' : '/auth/register'
      const payload  = mode === 'signin'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, first_name: form.first_name,
            last_name: form.last_name, phone: form.phone || undefined }

      const res  = await axios.post(`${AUTH_API}${endpoint}`, payload)
      const data = res.data
      setSuccess(mode === 'signin' ? 'Welcome back! Redirecting…' : 'Account created! Redirecting…')

      // Build redirect URL with token + user data (navigate immediately — delayed redirect can race unmount)
      const userEncoded = encodeURIComponent(JSON.stringify(data.user))
      const separator   = redirect.includes('?') ? '&' : '?'
      const target      = `${redirect}${separator}auth_token=${encodeURIComponent(data.access_token)}&user_data=${userEncoded}`

      window.location.href = target
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: '1.5px solid rgba(255,255,255,0.2)',
    borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: 'white',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: 6, fontSize: '0.75rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, var(--navy-dark) 0%, var(--navy) 55%, #1a2a4a 100%)',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      {[
        { top: '-80px', right: '-80px', size: 350, opacity: 0.06 },
        { bottom: '-60px', left: '-60px', size: 280, opacity: 0.04 },
      ].map((s, i) => (
        <div key={i} style={{
          position: 'absolute', width: s.size, height: s.size, borderRadius: '50%',
          background: `rgba(200,169,81,${s.opacity})`, pointerEvents: 'none',
          ...( 'top' in s ? { top: s.top, right: s.right } : { bottom: s.bottom, left: s.left }),
        }} />
      ))}

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: 'rgba(200,169,81,0.15)', border: '1.5px solid rgba(200,169,81,0.4)',
                           borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plane size={18} color="#C8A951" />
              <Ship size={18} color="#C8A951" />
            </div>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", margin: 0, fontSize: '1.8rem', color: 'white' }}>
            LUXE <span style={{ color: '#C8A951' }}>Travel</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', margin: '6px 0 0' }}>
            Your gateway to premium travel
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '32px 28px',
        }}>
          {/* Tab switch */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: 12,
                         padding: 4, marginBottom: 28 }}>
            {(['signin', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                      style={{
                        flex: 1, padding: '9px', border: 'none', cursor: 'pointer',
                        borderRadius: 9, fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                        background: mode === m ? 'rgba(200,169,81,0.9)' : 'transparent',
                        color:      mode === m ? '#0F172A'              : 'rgba(255,255,255,0.6)',
                      }}>
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                           borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#fca5a5',
                           fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {success && (
            <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)',
                           borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#86efac',
                           fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={14} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Sign-up only fields */}
              {mode === 'signup' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>First Name</label>
                    <input style={inputStyle} placeholder="Arjun" value={form.first_name}
                           onChange={e => update('first_name', e.target.value)} required
                           onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,169,81,0.6)')}
                           onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')} />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name</label>
                    <input style={inputStyle} placeholder="Mehta" value={form.last_name}
                           onChange={e => update('last_name', e.target.value)} required
                           onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,169,81,0.6)')}
                           onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')} />
                  </div>
                </div>
              )}

              <div>
                <label style={labelStyle}>Email Address</label>
                <input type="email" style={inputStyle} placeholder="you@example.com" value={form.email}
                       onChange={e => update('email', e.target.value)} required
                       onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,169,81,0.6)')}
                       onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')} />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 44 }}
                         placeholder="Min. 8 characters" value={form.password}
                         onChange={e => update('password', e.target.value)}
                         minLength={8} required
                         onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,169,81,0.6)')}
                         onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showPw ? <EyeOff size={17} color="rgba(255,255,255,0.4)" />
                             : <Eye    size={17} color="rgba(255,255,255,0.4)" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label style={labelStyle}>Phone (optional)</label>
                  <input type="tel" style={inputStyle} placeholder="+91 98765 43210" value={form.phone}
                         onChange={e => update('phone', e.target.value)}
                         onFocus={e => (e.currentTarget.style.borderColor = 'rgba(200,169,81,0.6)')}
                         onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')} />
                </div>
              )}

              <button type="submit" disabled={loading || !!success}
                      style={{
                        width: '100%', padding: '13px', border: 'none', borderRadius: 12,
                        fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                        background: (loading || success) ? 'rgba(200,169,81,0.5)' : '#C8A951',
                        color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => { if (!loading) (e.currentTarget.style.background = '#9C7C2C') }}
                      onMouseLeave={e => { if (!loading) (e.currentTarget.style.background = '#C8A951') }}>
                {loading ? '⏳ Please wait…' : (
                  <>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {mode === 'signin' && (
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 16 }}>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')}
                      style={{ background: 'none', border: 'none', color: '#C8A951', cursor: 'pointer', fontWeight: 600 }}>
                Create one
              </button>
            </p>
          )}
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: 20 }}>
          Shared auth for LUXE Airlines &amp; LUXE Cruises
        </p>
      </div>
    </div>
  )
}
