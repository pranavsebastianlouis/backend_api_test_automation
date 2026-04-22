import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Star, ArrowRight } from 'lucide-react'
import SearchBar           from '../components/SearchBar'
import { destinationsApi } from '../api'
import { TopDestination }  from '../types'

export default function Home() {
  const [destinations, setDestinations] = useState<TopDestination[]>([])
  const [loading,      setLoading]      = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    destinationsApi.top()
      .then(setDestinations)
      .catch(() => setDestinations([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(160deg, var(--navy-dark) 0%, var(--navy) 55%, #1a2a4a 100%)',
        padding: '56px 24px 80px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320,
                       borderRadius: '50%', background: 'rgba(200,169,81,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 240, height: 240,
                       borderRadius: '50%', background: 'rgba(200,169,81,0.05)', pointerEvents: 'none' }} />

        <div className="max-w-5xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.8rem',
                       letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            ✦ Premium Travel Experience
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'white',
                        fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700, lineHeight: 1.2,
                        marginBottom: 8, maxWidth: 600 }}>
            Fly Across India<br />
            <span className="text-gold-gradient">in Pure Luxury</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', marginBottom: 36, maxWidth: 480 }}>
            Discover world-class destinations with LUXE Airlines. Unparalleled comfort, every journey.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)',
                         border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '24px 28px' }}>
            <SearchBar />
          </div>

          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
              Planning a cruise too?
            </span>
            <a href="http://localhost:8002" style={{
              color: 'var(--gold)', fontSize: '0.82rem', fontWeight: 600,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              Explore LUXE Cruises <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'var(--gold)', padding: '20px 24px' }}>
        <div className="max-w-5xl mx-auto" style={{
          display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16,
        }}>
          {[
            { value: '50+',  label: 'Destinations' },
            { value: '98%',  label: 'On-Time Rate' },
            { value: '4.9★', label: 'Rating' },
            { value: '2M+',  label: 'Happy Travellers' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem', color: 'var(--navy)' }}>{value}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'rgba(15,23,42,0.6)' }}>{label}</p>
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
              Top Destinations
            </h2>
          </div>
          <button onClick={() => navigate('/search')} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none',
            border: 'none', cursor: 'pointer', color: 'var(--gold)', fontWeight: 600, fontSize: '0.875rem',
          }}>
            View all <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 240, borderRadius: 16 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {destinations.map((dest, i) => (
              <DestinationCard key={dest.iata_code} dest={dest} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── WHY LUXE ── */}
      <section style={{ background: 'var(--navy)', padding: '56px 24px' }}>
        <div className="max-w-5xl mx-auto" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: 'white',
                        fontSize: 'clamp(1.5rem,3vw,2rem)', marginBottom: 40 }}>
            The <span className="text-gold-gradient">LUXE</span> Difference
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { icon: '🛋️', title: 'Premium Seating',  desc: 'Extra legroom on every class' },
              { icon: '🍽️', title: 'Fine Dining',      desc: 'Curated menus by top chefs' },
              { icon: '🎯', title: 'Precision Timing', desc: '98% on-time performance' },
              { icon: '🛡️', title: 'Safe & Secure',    desc: 'Best-in-class safety record' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(200,169,81,0.2)',
                borderRadius: 16, padding: '28px 20px',
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{icon}</div>
                <h3 style={{ color: 'var(--gold)', fontWeight: 700, margin: '0 0 8px', fontSize: '1rem' }}>{title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--navy-dark)', padding: '24px', textAlign: 'center',
                        borderTop: '1px solid rgba(200,169,81,0.15)' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: 0 }}>
          © 2024 LUXE Airlines · All rights reserved ·{' '}
          <a href="http://localhost:8002" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
            Explore LUXE Cruises →
          </a>
        </p>
      </footer>
    </div>
  )
}

// ── Extracted component — useState is valid here ──────────────────────────────
function DestinationCard({ dest, index }: { dest: TopDestination; index: number }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  function handleClick() {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    const date = d.toISOString().split('T')[0]
    navigate(`/search?destination=${dest.iata_code}&date=${date}&passengers=1`)
  }

  return (
    <div className="fade-in" onClick={handleClick}
         onMouseEnter={() => setHovered(true)}
         onMouseLeave={() => setHovered(false)}
         style={{
           borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
           transform: hovered ? 'translateY(-4px) scale(1.01)' : 'none',
           transition: 'transform 0.25s, box-shadow 0.25s',
           boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.18)' : '0 2px 12px rgba(0,0,0,0.08)',
           animationDelay: `${index * 60}ms`,
         }}>
      <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
        <img src={dest.image_url ?? 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400'}
             alt={dest.city}
             style={{ width: '100%', height: '100%', objectFit: 'cover',
                       transform: hovered ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.4s' }} />
        <div style={{ position: 'absolute', inset: 0,
                       background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: 12, left: 14 }}>
          <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '1rem' }}>{dest.city}</p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem',
                       display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={11} /> {dest.country}
          </p>
        </div>
      </div>
      <div style={{ background: 'white', padding: '12px 14px',
                     display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>From</p>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'var(--navy)' }}>
            ₹{dest.starting_price.toLocaleString('en-IN')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 1 }}>
          {[...Array(5)].map((_, i) => <Star key={i} size={12} color="var(--gold)" fill="var(--gold)" />)}
        </div>
      </div>
    </div>
  )
}
