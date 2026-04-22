import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Moon, ArrowRight, Ship } from 'lucide-react'
import { portsApi, destinationsApi, cruisesApi, Cruise } from '../api'

export default function Home() {
  const navigate = useNavigate()
  const [ports,           setPorts]           = useState<{ id: number; city: string; name: string }[]>([])
  const [destinations,    setDestinations]    = useState<{ city: string; country: string; image_url?: string; starting_price: number }[]>([])
  const [featuredCruises, setFeaturedCruises] = useState<Cruise[]>([])
  const [depPort, setDepPort] = useState('')
  const [dest,    setDest]    = useState('')
  const [date,    setDate]    = useState('')
  const [guests,  setGuests]  = useState(2)

  useEffect(() => {
    portsApi.list().then(setPorts).catch(() => {})
    destinationsApi.top().then(setDestinations).catch(() => {})
    cruisesApi.search({}).then(r => setFeaturedCruises(r.cruises.slice(0, 4))).catch(() => {})
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const p = new URLSearchParams({ guests: String(guests) })
    if (depPort) p.set('departure_port', depPort)
    if (dest)    p.set('destination', dest)
    if (date)    p.set('date', date)
    navigate(`/search?${p.toString()}`)
  }

  const today = new Date().toISOString().split('T')[0]
  const inStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1.5px solid rgba(255,255,255,0.2)',
    borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: 'white',
    fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
  }
  const lbStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.65rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(160deg, #0a1628 0%, var(--navy) 50%, #0d2340 100%)',
        padding: '56px 24px 80px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 380, height: 380,
                       borderRadius: '50%', background: 'rgba(200,169,81,0.06)', pointerEvents: 'none' }} />
        <div className="max-w-5xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.8rem',
                       letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            ✦ Premium Cruise Experience
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'white',
                        fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 700, lineHeight: 1.2,
                        marginBottom: 8, maxWidth: 600 }}>
            Sail India's<br />
            <span className="text-gold-gradient">Majestic Waters</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 36, maxWidth: 440 }}>
            From the Arabian Sea to the Andamans — world-class cruises, unparalleled luxury.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)',
                         border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '24px 28px' }}>
            <form onSubmit={handleSearch}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 130px' }}>
                  <label style={lbStyle}>Departure Port</label>
                  <select value={depPort} onChange={e => setDepPort(e.target.value)}
                          style={{ ...inStyle, cursor: 'pointer' }}>
                    <option value="">Any port</option>
                    {ports.map(p => <option key={p.id} value={p.city}>{p.city}</option>)}
                  </select>
                </div>
                <div style={{ flex: '1 1 130px' }}>
                  <label style={lbStyle}>Destination</label>
                  <select value={dest} onChange={e => setDest(e.target.value)}
                          style={{ ...inStyle, cursor: 'pointer' }}>
                    <option value="">Any destination</option>
                    {ports.filter(p => p.city !== depPort).map(p =>
                      <option key={p.id} value={p.city}>{p.city}</option>)}
                  </select>
                </div>
                <div style={{ flex: '1 1 120px' }}>
                  <label style={lbStyle}>From date</label>
                  <input type="date" min={today} value={date}
                         onChange={e => setDate(e.target.value)}
                         style={{ ...inStyle, colorScheme: 'dark' }} />
                </div>
                <div style={{ flex: '0 1 90px' }}>
                  <label style={lbStyle}>Guests</label>
                  <select value={guests} onChange={e => setGuests(Number(e.target.value))}
                          style={{ ...inStyle, cursor: 'pointer' }}>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button type="submit" style={{
                  alignSelf: 'flex-end', padding: '9px 22px', background: 'var(--gold)',
                  color: 'var(--navy)', border: 'none', borderRadius: 10, fontWeight: 700,
                  cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Search size={16} /> Search Cruises
                </button>
              </div>
            </form>
          </div>

          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
              Also need a flight?
            </span>
            <a href="http://localhost:8001" style={{
              color: 'var(--gold)', fontSize: '0.82rem', fontWeight: 600,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Search LUXE Airlines <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'var(--gold)', padding: '20px 24px' }}>
        <div className="max-w-5xl mx-auto" style={{
          display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16,
        }}>
          {[{ v: '8+', l: 'Cruise Routes' }, { v: '3', l: 'Luxury Ships' },
            { v: '4.9★', l: 'Rating' }, { v: '50K+', l: 'Voyagers' }].map(({ v, l }) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem', color: 'var(--navy)' }}>{v}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'rgba(15,23,42,0.6)' }}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TOP DESTINATIONS ── */}
      <section style={{ padding: '56px 24px' }} className="max-w-6xl mx-auto">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <p style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.75rem',
                         letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
              Popular Routes
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif",
                          fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
              Top Cruise Destinations
            </h2>
          </div>
          <button onClick={() => navigate('/search')} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none',
            border: 'none', cursor: 'pointer', color: 'var(--gold)', fontWeight: 600, fontSize: '0.875rem',
          }}>
            View all <ArrowRight size={16} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {destinations.map(d => (
            <DestCard key={d.city} d={d} onClick={() => navigate(`/search?destination=${d.city}`)} />
          ))}
        </div>
      </section>

      {/* ── FEATURED CRUISES ── */}
      {featuredCruises.length > 0 && (
        <section style={{ padding: '0 24px 56px' }} className="max-w-6xl mx-auto">
          <h2 style={{ fontFamily: "'Playfair Display', serif",
                        fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, color: 'var(--navy)', marginBottom: 28 }}>
            Featured Voyages
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {featuredCruises.map(c => (
              <FeaturedCruiseCard key={c.id} cruise={c}
                onClick={() => navigate(`/booking?cruise_id=${c.id}&guests=2`)} />
            ))}
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--navy-dark)', padding: '24px', textAlign: 'center',
                        borderTop: '1px solid rgba(200,169,81,0.15)' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: 0 }}>
          © 2024 LUXE Cruises · All rights reserved ·{' '}
          <a href="http://localhost:8001" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
            Fly with LUXE Airlines →
          </a>
        </p>
      </footer>
    </div>
  )
}

// ── Sub-components (hooks are valid here — proper React components) ────────────

function DestCard({ d, onClick }: {
  d: { city: string; country: string; image_url?: string; starting_price: number }
  onClick: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
         style={{
           borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
           boxShadow: hov ? '0 16px 40px rgba(0,0,0,0.18)' : '0 2px 12px rgba(0,0,0,0.08)',
           transform: hov ? 'translateY(-4px)' : 'none', transition: 'all 0.25s',
         }}>
      <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
        <img src={d.image_url} alt={d.city} style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: hov ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.4s',
        }} />
        <div style={{ position: 'absolute', inset: 0,
                       background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: 12, left: 14 }}>
          <p style={{ margin: 0, color: 'white', fontWeight: 700 }}>{d.city}</p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem',
                       display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={11} /> {d.country}
          </p>
        </div>
      </div>
      <div style={{ background: 'white', padding: '10px 14px',
                     display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>From</p>
          <p style={{ margin: 0, fontWeight: 800, color: 'var(--navy)' }}>
            ₹{d.starting_price.toLocaleString('en-IN')}
          </p>
        </div>
        <Ship size={16} color="var(--gold)" />
      </div>
    </div>
  )
}

function FeaturedCruiseCard({ cruise, onClick }: { cruise: Cruise; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
         style={{
           background: 'white', borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
           boxShadow: hov ? '0 12px 40px rgba(0,0,0,0.13)' : '0 2px 12px rgba(0,0,0,0.06)',
           transform: hov ? 'translateY(-3px)' : 'none', transition: 'all 0.25s',
         }}>
      <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
        <img src={cruise.image_url} alt={cruise.name} style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: hov ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.4s',
        }} />
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(200,169,81,0.95)',
                       color: 'var(--navy)', padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.7rem' }}>
          {cruise.cabin_type}
        </div>
        <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Moon size={12} color="white" />
          <span style={{ color: 'white', fontSize: '0.78rem', fontWeight: 600 }}>{cruise.duration_nights} nights</span>
        </div>
      </div>
      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy)' }}>
          {cruise.name}
        </h3>
        <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: '#6b7280' }}>
          {cruise.departure_port.city} → {cruise.arrival_port.city}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>From</p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: 'var(--navy)' }}>
              ₹{cruise.price_per_person.toLocaleString('en-IN')}
            </p>
          </div>
          <span style={{ padding: '6px 14px', background: 'var(--gold)', color: 'var(--navy)',
                          borderRadius: 8, fontWeight: 700, fontSize: '0.78rem' }}>
            Book Now
          </span>
        </div>
      </div>
    </div>
  )
}
