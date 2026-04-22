import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ship, User, BookOpen, HeadphonesIcon, LogOut, ChevronDown, Menu, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const AUTH_APP_URL = import.meta.env.VITE_AUTH_APP_URL ?? 'http://localhost:8003'

export default function Navbar() {
  const { isAuthenticated, user, clearAuth } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate    = useNavigate()

  useEffect(() => {
    function h(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function handleSignIn() {
    window.location.href = `${AUTH_APP_URL}?redirect=${encodeURIComponent(window.location.origin)}`
  }

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : ''

  return (
    <nav style={{ background: 'var(--navy)', borderBottom: '1px solid rgba(200,169,81,0.2)' }}
         className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--gold)', borderRadius: 8, padding: '6px 8px' }}>
              <Ship size={20} color="var(--navy)" strokeWidth={2.5} />
            </div>
            <div>
              <span style={{ color: 'var(--gold)', fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.05em' }}>LUXE</span>
              <span style={{ color: 'white', fontWeight: 300, fontSize: '1rem', marginLeft: 4 }}>Cruises</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[['/', 'Home'], ['/search', 'Cruises']].map(([to, l]) => (
              <Link key={l} to={to} style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none' }}>{l}</Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(v => !v)}
                        className="flex items-center gap-2 rounded-full py-1 px-3"
                        style={{ background: 'rgba(200,169,81,0.15)', border: '1px solid rgba(200,169,81,0.4)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold)',
                                 display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '0.75rem' }}>{initials}</span>
                  </div>
                  <span style={{ color: 'white', fontSize: '0.875rem' }}>{user.first_name}</span>
                  <ChevronDown size={14} color="rgba(255,255,255,0.7)"
                               style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl shadow-2xl overflow-hidden fade-in"
                       style={{ background: 'white', border: '1px solid #e5e7eb', zIndex: 100 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--navy)' }}>{user.first_name} {user.last_name}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>{user.email}</p>
                    </div>
                    {[
                      { icon: User,           label: 'My Profile',  action: () => { navigate('/profile'); setDropdownOpen(false) } },
                      { icon: BookOpen,       label: 'My Bookings', action: () => { navigate('/profile?tab=bookings'); setDropdownOpen(false) } },
                      { icon: HeadphonesIcon, label: 'Support',     action: () => { window.open('mailto:support@luxecruises.com'); setDropdownOpen(false) } },
                    ].map(({ icon: Icon, label, action }) => (
                      <button key={label} onClick={action}
                              className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--navy)' }}>
                        <Icon size={16} color="var(--gold)" /> {label}
                      </button>
                    ))}
                    <div style={{ borderTop: '1px solid #f3f4f6' }}>
                      <button onClick={() => { clearAuth(); setDropdownOpen(false); navigate('/') }}
                              className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-red-50"
                              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#ef4444' }}>
                        <LogOut size={16} color="#ef4444" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={handleSignIn}
                      style={{ background: 'var(--gold)', color: 'var(--navy)', border: 'none',
                                borderRadius: 8, padding: '8px 20px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                Sign In
              </button>
            )}
            <button className="md:hidden p-2" style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => setMobileOpen(v => !v)}>
              {mobileOpen ? <X size={22} color="white" /> : <Menu size={22} color="white" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
