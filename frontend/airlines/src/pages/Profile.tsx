import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { User, BookOpen, HeadphonesIcon, Edit2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { bookingsApi, authApi } from '../api'
import { Booking } from '../types'

const AUTH_APP_URL = import.meta.env.VITE_AUTH_APP_URL ?? 'http://localhost:8003'

export default function Profile() {
  const [sp]     = useSearchParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore()
  const defaultTab = (sp.get('tab') as 'profile' | 'bookings' | 'support') ?? 'profile'
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'support'>(defaultTab)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ first_name: user?.first_name ?? '', last_name: user?.last_name ?? '', phone: user?.phone ?? '' })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = `${AUTH_APP_URL}?redirect=${encodeURIComponent(window.location.origin)}`
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (activeTab === 'bookings') {
      setLoadingBookings(true)
      bookingsApi.myBookings()
        .then(setBookings)
        .catch(() => setBookings([]))
        .finally(() => setLoadingBookings(false))
    }
  }, [activeTab])

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await authApi.updateProfile(form)
      const token   = localStorage.getItem('luxe_token') ?? ''
      setAuth(updated, token)
      setSaved(true); setEditMode(false)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    finally { setSaving(false) }
  }

  const TABS = [
    { id: 'profile',  label: 'My Profile',  icon: User },
    { id: 'bookings', label: 'My Bookings', icon: BookOpen },
    { id: 'support',  label: 'Support',     icon: HeadphonesIcon },
  ] as const

  const statusIcon = (status: string) => {
    if (status === 'confirmed' || status === 'completed') return <CheckCircle size={14} color="#16a34a" />
    if (status === 'cancelled') return <XCircle size={14} color="#ef4444" />
    return <Clock size={14} color="#f59e0b" />
  }
  const statusColor = (status: string) => {
    if (status === 'confirmed' || status === 'completed') return { bg: '#f0fdf4', color: '#16a34a' }
    if (status === 'cancelled') return { bg: '#fef2f2', color: '#ef4444' }
    return { bg: '#fffbeb', color: '#d97706' }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb', padding: '32px 16px' }}>
      <div className="max-w-5xl mx-auto" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Sidebar ───────────────── */}
        <div>
          {/* Avatar */}
          <div style={{ background: 'white', borderRadius: 16, padding: '24px 20px', textAlign: 'center',
                         boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 12 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--navy)',
                           display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '1.4rem' }}>
                {user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : '?'}
              </span>
            </div>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--navy)' }}>{user?.first_name} {user?.last_name}</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>{user?.email}</p>
          </div>

          {/* Nav tabs */}
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden',
                         boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                      style={{
                        width: '100%', padding: '13px 18px', border: 'none', cursor: 'pointer',
                        textAlign: 'left', fontSize: '0.875rem', fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: activeTab === id ? 'rgba(200,169,81,0.08)' : 'white',
                        color:      activeTab === id ? 'var(--gold)'            : '#4b5563',
                        borderLeft: activeTab === id ? '3px solid var(--gold)' : '3px solid transparent',
                        transition: 'all 0.15s',
                      }}>
                <Icon size={16} />
                {label}
              </button>
            ))}
            <div style={{ borderTop: '1px solid #f3f4f6' }}>
              <button onClick={() => { clearAuth(); navigate('/') }}
                      style={{ width: '100%', padding: '13px 18px', border: 'none', cursor: 'pointer',
                                textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, background: 'white',
                                color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10 }}>
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* ── Main content ─────────── */}
        <div style={{ background: 'white', borderRadius: 16, padding: '28px',
                       boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>

          {/* ── Profile tab ── */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)' }}>My Profile</h2>
                {!editMode ? (
                  <button onClick={() => setEditMode(true)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
                                    border: '1.5px solid var(--gold)', borderRadius: 8, background: 'none',
                                    cursor: 'pointer', color: 'var(--gold)', fontWeight: 600, fontSize: '0.82rem' }}>
                    <Edit2 size={13} /> Edit
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditMode(false)}
                            style={{ padding: '7px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8,
                                      background: 'none', cursor: 'pointer', fontSize: '0.82rem' }}>
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                            style={{ padding: '7px 16px', border: 'none', borderRadius: 8, background: 'var(--gold)',
                                      color: 'var(--navy)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {saved && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
                               padding: '10px 14px', marginBottom: 16, color: '#16a34a', fontSize: '0.875rem',
                               display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} /> Profile updated successfully
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'First Name', key: 'first_name', value: form.first_name },
                  { label: 'Last Name',  key: 'last_name',  value: form.last_name },
                  { label: 'Email',      key: 'email',      value: user?.email ?? '', disabled: true, span: true },
                  { label: 'Phone',      key: 'phone',      value: form.phone ?? '' },
                ].map(({ label, key, value, disabled, span }) => (
                  <div key={key} style={{ gridColumn: span ? '1 / -1' : undefined }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600,
                                     color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      {label}
                    </label>
                    <input
                      value={value}
                      disabled={!editMode || disabled}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
                                borderRadius: 10, fontSize: '0.9rem', background: (!editMode || disabled) ? '#f9fafb' : 'white',
                                color: 'var(--navy)', boxSizing: 'border-box' as const, outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Bookings tab ── */}
          {activeTab === 'bookings' && (
            <div>
              <h2 style={{ margin: '0 0 24px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)' }}>
                My Bookings
              </h2>
              {loadingBookings ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 12 }} />)}
                </div>
              ) : bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✈️</div>
                  <p style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>No bookings yet</p>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Your confirmed bookings will appear here</p>
                  <button onClick={() => navigate('/')}
                          style={{ marginTop: 16, padding: '9px 22px', background: 'var(--gold)', border: 'none',
                                    borderRadius: 8, fontWeight: 700, cursor: 'pointer', color: 'var(--navy)' }}>
                    Book a Flight
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {bookings.map(b => {
                    const sc = statusColor(b.status)
                    return (
                      <div key={b.id} style={{ padding: '16px 18px', border: '1.5px solid #f0f0f0', borderRadius: 14,
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy)' }}>
                              {b.flight_number}
                            </span>
                            <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                                           background: sc.bg, color: sc.color, display: 'flex', alignItems: 'center', gap: 3 }}>
                              {statusIcon(b.status)} {b.status}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                            Ref: <strong style={{ color: 'var(--navy)' }}>{b.booking_reference}</strong>
                            {' · '}{b.passenger_name}{' · '}{b.num_passengers} pax
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'var(--navy)' }}>
                            ₹{b.total_price.toLocaleString('en-IN')}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>
                            {new Date(b.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Support tab ── */}
          {activeTab === 'support' && (
            <div>
              <h2 style={{ margin: '0 0 24px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)' }}>
                Support
              </h2>
              {[
                { icon: '📞', title: 'Call Us',        sub: '1800-LUXE-FLY (24/7 Toll-Free)' },
                { icon: '✉️', title: 'Email Support',  sub: 'support@luxeairlines.com · Reply in 2h' },
                { icon: '💬', title: 'Live Chat',      sub: 'Available Mon–Sat 6AM–10PM IST' },
                { icon: '📋', title: 'FAQs',           sub: 'Answers to common questions' },
              ].map(({ icon, title, sub }) => (
                <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
                                          borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                     onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                     onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--navy)', fontSize: '0.9rem' }}>{title}</p>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
