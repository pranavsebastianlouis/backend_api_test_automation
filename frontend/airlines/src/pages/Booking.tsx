import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { User, Calendar, CreditCard, Shield, ChevronRight, Plane, Clock } from 'lucide-react'
import { flightsApi, bookingsApi } from '../api'
import { useAuthStore } from '../store/authStore'
import { Flight } from '../types'

const AUTH_APP_URL = import.meta.env.VITE_AUTH_APP_URL ?? 'http://localhost:8003'

export default function Booking() {
  const [sp]      = useSearchParams()
  const navigate  = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  const flightId   = sp.get('flight_id')   ?? ''
  const passengers = Number(sp.get('passengers') ?? '1')
  const authTokenInUrl = sp.get('auth_token')

  const [flight,   setFlight]   = useState<Flight | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,    setError]    = useState('')

  const [form, setForm] = useState({
    passenger_name:      user ? `${user.first_name} ${user.last_name}` : '',
    passenger_id_number: '',
    date_of_birth:       '',
  })

  useEffect(() => {
    useAuthStore.getState().initAuth()
    const q = new URLSearchParams(window.location.search)
    const fid = flightId || q.get('flight_id') || ''
    // Never send the user to the auth app until we know flight_id — otherwise redirect=… drops the query
    // and strand them on /booking with no flight (see AuthPage redirect build).
    if (!fid) {
      return
    }
    const authTok = authTokenInUrl ?? q.get('auth_token')
    const authed = useAuthStore.getState().isAuthenticated
    if (!authed && !authTok) {
      window.location.href = `${AUTH_APP_URL}?redirect=${encodeURIComponent(window.location.href)}`
      return
    }
    if (!authed) {
      return
    }
    flightsApi.getById(fid)
      .then(setFlight)
      .catch(() => setError('Flight not found'))
      .finally(() => setLoading(false))
  }, [flightId, isAuthenticated, authTokenInUrl, navigate])

  useEffect(() => {
    if (flightId || authTokenInUrl) return
    const id = window.setTimeout(() => {
      const q = new URLSearchParams(window.location.search)
      if (!q.get('flight_id')) {
        setLoading(false)
        navigate('/')
      }
    }, 150)
    return () => window.clearTimeout(id)
  }, [flightId, authTokenInUrl, navigate])

  // Pre-fill name from auth
  useEffect(() => {
    if (user && !form.passenger_name) {
      setForm(f => ({ ...f, passenger_name: `${user.first_name} ${user.last_name}` }))
    }
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!flight) return
    setSubmitting(true); setError('')
    try {
      const booking = await bookingsApi.create({
        flight_id:           flight.id,
        passenger_name:      form.passenger_name,
        passenger_id_number: form.passenger_id_number,
        date_of_birth:       form.date_of_birth,
        num_passengers:      passengers,
      })
      navigate(`/booking/success?ref=${booking.booking_reference}&total=${booking.total_price}`)
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function formatTime(iso: string) {
    try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) }
    catch { return iso.slice(11, 16) }
  }
  function formatDate(iso: string) {
    try { return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }
    catch { return iso }
  }

  const totalPrice = flight ? flight.price_per_person * passengers : 0
  const tax        = Math.round(totalPrice * 0.18)
  const grandTotal = totalPrice + tax

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Plane size={40} color="var(--gold)" style={{ animation: 'spin 2s linear infinite' }} />
        <p style={{ color: '#6b7280', marginTop: 12 }}>Loading flight details…</p>
      </div>
    </div>
  )

  if (error && !flight) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <p style={{ color: '#ef4444', fontWeight: 600 }}>{error}</p>
      <button onClick={() => navigate(-1)} style={{ padding: '8px 20px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Go Back</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: '32px 16px' }}>
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, fontSize: '0.82rem', color: '#9ca3af' }}>
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: 'var(--gold)' }}>Home</span>
          <ChevronRight size={14} />
          <span onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: 'var(--gold)' }}>Results</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--navy)', fontWeight: 600 }}>Book Flight</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT: Passenger form ───────────────────────── */}
          <div>
            {/* Flight summary card */}
            {flight && (
              <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', marginBottom: 20,
                             border: '1.5px solid rgba(200,169,81,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Plane size={18} color="var(--gold)" />
                  <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '1rem' }}>
                    Your Flight · {flight.flight_number}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy)' }}>
                      {formatTime(flight.departure_time)}
                    </p>
                    <p style={{ margin: 0, fontWeight: 600, color: '#4b5563' }}>{flight.origin.iata_code}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{flight.origin.city}</p>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      <Clock size={11} /> {Math.floor(flight.duration_minutes / 60)}h {flight.duration_minutes % 60}m
                    </p>
                    <div style={{ height: 1.5, background: 'var(--gold)', margin: '4px 0' }} />
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>Non-stop</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy)' }}>
                      {formatTime(flight.arrival_time)}
                    </p>
                    <p style={{ margin: 0, fontWeight: 600, color: '#4b5563' }}>{flight.destination.iata_code}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{flight.destination.city}</p>
                  </div>
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f3f4f6',
                               display: 'flex', gap: 16, fontSize: '0.78rem', color: '#6b7280' }}>
                  <span>{flight.aircraft_model}</span>
                  <span>·</span>
                  <span>{flight.cabin_class}</span>
                  <span>·</span>
                  <span>{formatDate(flight.departure_time)}</span>
                </div>
              </div>
            )}

            {/* Passenger details form */}
            <div style={{ background: 'white', borderRadius: 16, padding: '24px',
                           boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <h2 style={{ margin: '0 0 20px', fontWeight: 700, fontSize: '1.05rem', color: 'var(--navy)',
                            display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} color="var(--gold)" /> Passenger Details
              </h2>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      style={inputStyle}
                      placeholder="As on government ID"
                      value={form.passenger_name}
                      onChange={e => setForm(f => ({ ...f, passenger_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      ID / Passport Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      style={inputStyle}
                      placeholder="Aadhaar / Passport / PAN"
                      value={form.passenger_id_number}
                      onChange={e => setForm(f => ({ ...f, passenger_id_number: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Date of Birth <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="date"
                      style={inputStyle}
                      max={new Date().toISOString().split('T')[0]}
                      value={form.date_of_birth}
                      onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                                 padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
                               color: '#6b7280', fontSize: '0.78rem' }}>
                  <Shield size={14} color="var(--gold)" />
                  Your data is encrypted and secure. We never share personal information.
                </div>

                {/* Pay button — visible on mobile, hidden on desktop (shown in sidebar) */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="lg:hidden"
                  style={{
                    width: '100%', background: submitting ? '#9ca3af' : 'var(--gold)',
                    color: 'var(--navy)', border: 'none', borderRadius: 12,
                    padding: '14px', fontWeight: 700, fontSize: '1rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}>
                  {submitting ? 'Processing…' : `Pay Now  ₹${grandTotal.toLocaleString('en-IN')}`}
                </button>
              </form>
            </div>
          </div>

          {/* ── RIGHT: Price sidebar ───────────────────────── */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: '24px',
                           boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1.5px solid #f0f0f0' }}>
              <h3 style={{ margin: '0 0 18px', fontWeight: 700, color: 'var(--navy)', fontSize: '1rem',
                            display: 'flex', alignItems: 'center', gap: 6 }}>
                <CreditCard size={16} color="var(--gold)" /> Price Summary
              </h3>

              {flight && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Row label={`Fare (₹${flight.price_per_person.toLocaleString('en-IN')} × ${passengers})`}
                       value={totalPrice} />
                  <Row label="GST & Taxes (18%)" value={tax} />
                  <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy)' }}>Total</span>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--navy)' }}>
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              <button
                form="booking-form"
                onClick={handleSubmit as any}
                disabled={submitting}
                style={{
                  width: '100%', marginTop: 20,
                  background: submitting ? '#9ca3af' : 'var(--gold)',
                  color: 'var(--navy)', border: 'none', borderRadius: 12,
                  padding: '14px', fontWeight: 700, fontSize: '1rem',
                  cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (!submitting) (e.currentTarget.style.background = 'var(--gold-dark)') }}
                onMouseLeave={e => { if (!submitting) (e.currentTarget.style.background = 'var(--gold)') }}
              >
                {submitting ? '⏳ Processing…' : '💳 Pay Now'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#9ca3af', marginTop: 12 }}>
                🔒 256-bit encrypted · Free cancellation within 24h
              </p>

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--navy)' }}>
                  Accepted Payments
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Visa', 'Mastercard', 'UPI', 'Netbanking'].map(p => (
                    <span key={p} style={{ padding: '3px 10px', background: '#f8f9fb', borderRadius: 6,
                                           fontSize: '0.7rem', fontWeight: 600, color: '#4b5563',
                                           border: '1px solid #e5e7eb' }}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: 6, fontSize: '0.78rem', fontWeight: 600,
  color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
  borderRadius: 10, fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
  boxSizing: 'border-box',
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--navy)' }}>₹{value.toLocaleString('en-IN')}</span>
    </div>
  )
}
