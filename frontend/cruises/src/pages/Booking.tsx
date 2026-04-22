import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { User, Calendar, CreditCard, Shield, ChevronRight, Ship } from 'lucide-react'
import { cruisesApi, cruiseBookingsApi } from '../api'
import { useAuthStore } from '../store/authStore'
import { Cruise } from '../api'

const AUTH_APP_URL = import.meta.env.VITE_AUTH_APP_URL ?? 'http://localhost:8003'

export default function Booking() {
  const [sp]     = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  const cruiseId = sp.get('cruise_id') ?? ''
  const guests   = Number(sp.get('guests') ?? '2')

  const [cruise,     setCruise]     = useState<Cruise | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [form, setForm] = useState({
    passenger_name: user ? `${user.first_name} ${user.last_name}` : '',
    passenger_id_number: '',
    date_of_birth: '',
  })

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search)
    if (qs.has('auth_token')) return

    const tid = window.setTimeout(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        window.location.href = `${AUTH_APP_URL}?redirect=${encodeURIComponent(window.location.href)}`
      }
    }, 50)

    return () => clearTimeout(tid)
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    if (!cruiseId) {
      navigate('/')
      return
    }
    cruisesApi.getById(cruiseId)
      .then(setCruise)
      .catch(() => setError('Cruise not found'))
      .finally(() => setLoading(false))
  }, [cruiseId, isAuthenticated, navigate])

  useEffect(() => {
    if (user && !form.passenger_name) {
      setForm(f => ({ ...f, passenger_name: `${user.first_name} ${user.last_name}` }))
    }
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cruise) return
    setSubmitting(true); setError('')
    try {
      const booking = await cruiseBookingsApi.create({
        cruise_id: cruise.id,
        passenger_name: form.passenger_name,
        passenger_id_number: form.passenger_id_number,
        date_of_birth: form.date_of_birth,
        num_guests: guests,
      })
      navigate(`/booking/success?ref=${booking.booking_reference}&total=${booking.total_price}`)
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPrice = cruise ? cruise.price_per_person * guests : 0
  const tax        = Math.round(totalPrice * 0.05)
  const grandTotal = totalPrice + tax

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Ship size={40} color="var(--gold)" style={{ animation: 'spin 3s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: '32px 16px' }}>
      <div className="max-w-5xl mx-auto">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, fontSize: '0.82rem', color: '#9ca3af' }}>
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: 'var(--gold)' }}>Home</span>
          <ChevronRight size={14} />
          <span onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--gold)' }}>Results</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--navy)', fontWeight: 600 }}>Book Cruise</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          <div>
            {/* Cruise summary */}
            {cruise && (
              <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', marginBottom: 20,
                             border: '1.5px solid rgba(200,169,81,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  {cruise.image_url && (
                    <img src={cruise.image_url} alt={cruise.name}
                         style={{ width: 100, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div>
                    <h2 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1rem', color: 'var(--navy)' }}>
                      {cruise.name}
                    </h2>
                    <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#6b7280' }}>
                      <Ship size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {cruise.ship.name} · {cruise.cabin_type}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#4b5563' }}>
                      <strong>{cruise.departure_port.city}</strong> → <strong>{cruise.arrival_port.city}</strong>
                      {' · '}{cruise.duration_nights} nights
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                      {new Date(cruise.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' – '}
                      {new Date(cruise.arrival_date).toLocaleDateString('en-IN',   { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Passenger form */}
            <div style={{ background: 'white', borderRadius: 16, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <h2 style={{ margin: '0 0 20px', fontWeight: 700, fontSize: '1.05rem', color: 'var(--navy)',
                            display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} color="var(--gold)" /> Primary Guest Details
              </h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={lbl}>Full Name *</label>
                    <input style={inp} placeholder="As on ID" value={form.passenger_name}
                           onChange={e => setForm(f => ({ ...f, passenger_name: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={lbl}>ID / Passport Number *</label>
                    <input style={inp} placeholder="Aadhaar / Passport" value={form.passenger_id_number}
                           onChange={e => setForm(f => ({ ...f, passenger_id_number: e.target.value }))} required />
                  </div>
                  <div>
                    <label style={lbl}><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />Date of Birth *</label>
                    <input type="date" style={inp} max={new Date().toISOString().split('T')[0]}
                           value={form.date_of_birth}
                           onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} required />
                  </div>
                </div>

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                                 padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: '0.78rem' }}>
                  <Shield size={14} color="var(--gold)" />
                  Your data is encrypted and secure.
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1.5px solid #f0f0f0' }}>
              <h3 style={{ margin: '0 0 18px', fontWeight: 700, color: 'var(--navy)', fontSize: '1rem',
                            display: 'flex', alignItems: 'center', gap: 6 }}>
                <CreditCard size={16} color="var(--gold)" /> Price Summary
              </h3>
              {cruise && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Row label={`Cabin (₹${cruise.price_per_person.toLocaleString('en-IN')} × ${guests})`} value={totalPrice} />
                  <Row label="Port Tax (5%)" value={tax} />
                  <div style={{ height: 1, background: '#f3f4f6' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)' }}>Total</span>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--navy)' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
              <button onClick={handleSubmit as any} disabled={submitting}
                      style={{ width: '100%', marginTop: 20,
                                background: submitting ? '#9ca3af' : 'var(--gold)',
                                color: 'var(--navy)', border: 'none', borderRadius: 12,
                                padding: '14px', fontWeight: 700, fontSize: '1rem',
                                cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? '⏳ Processing…' : '💳 Pay Now'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#9ca3af', marginTop: 12 }}>
                🔒 Secure payment · Free cancellation within 24h
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: '0.78rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em' }
const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }
function Row({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--navy)' }}>₹{value.toLocaleString('en-IN')}</span>
    </div>
  )
}
