import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ship, Calendar, Users, Moon, AlertCircle } from 'lucide-react'
import { Cruise } from '../api'

interface Props { cruise: Cruise; guests: number }

export default function CruiseCard({ cruise, guests }: Props) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const isLow = cruise.available_cabins <= 5

  return (
    <div className="fade-in"
         onMouseEnter={() => setHovered(true)}
         onMouseLeave={() => setHovered(false)}
         style={{
           background: 'white', borderRadius: 18, overflow: 'hidden',
           border: `1.5px solid ${isLow ? 'rgba(239,68,68,0.25)' : '#f0f0f0'}`,
           boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.13)' : '0 2px 12px rgba(0,0,0,0.06)',
           transform: hovered ? 'translateY(-3px)' : 'none',
           transition: 'all 0.25s',
         }}>

      {/* Image */}
      <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
        <img src={cruise.image_url ?? 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600'}
             alt={cruise.name}
             style={{ width: '100%', height: '100%', objectFit: 'cover',
                       transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.4s' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />

        {/* Cabin badge */}
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(200,169,81,0.95)',
                       color: 'var(--navy)', padding: '4px 12px', borderRadius: 20, fontWeight: 700,
                       fontSize: '0.72rem', backdropFilter: 'blur(8px)' }}>
          {cruise.cabin_type}
        </div>
        {/* Duration */}
        <div style={{ position: 'absolute', bottom: 12, left: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Moon size={13} color="white" />
          <span style={{ color: 'white', fontWeight: 700, fontSize: '0.82rem' }}>
            {cruise.duration_nights} nights
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 20px 20px' }}>
        <h3 style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1rem', color: 'var(--navy)' }}>
          {cruise.name}
        </h3>
        <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: '#6b7280' }}>
          <Ship size={11} style={{ display: 'inline', marginRight: 4 }} />
          {cruise.ship.name}
        </p>

        {/* Route */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
                       padding: '8px 12px', background: '#f8f9fb', borderRadius: 10 }}>
          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--navy)' }}>
            {cruise.departure_port.city}
          </span>
          <div style={{ flex: 1, height: 1.5, background: 'var(--gold)', borderRadius: 2 }} />
          <Ship size={13} color="var(--gold)" />
          <div style={{ flex: 1, height: 1.5, background: 'var(--gold)', borderRadius: 2 }} />
          <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--navy)' }}>
            {cruise.arrival_port.city}
          </span>
        </div>

        {/* Dates */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Departs', value: new Date(cruise.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
            { label: 'Returns', value: new Date(cruise.arrival_date).toLocaleDateString('en-IN',   { day: 'numeric', month: 'short', year: 'numeric' }) },
          ].map(({ label, value }) => (
            <div key={label} style={{ flex: 1, padding: '8px 10px', background: '#f8f9fb', borderRadius: 8 }}>
              <p style={{ margin: 0, fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.78rem', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} color="var(--gold)" /> {value}
              </p>
            </div>
          ))}
        </div>

        {/* Price + Book */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>From</p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: 'var(--navy)' }}>
              ₹{(cruise.price_per_person * guests).toLocaleString('en-IN')}
            </p>
            {guests > 1 && (
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>
                ₹{cruise.price_per_person.toLocaleString('en-IN')} × {guests}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end',
                           marginBottom: 8, fontSize: '0.72rem',
                           color: isLow ? '#ef4444' : '#16a34a', fontWeight: 600 }}>
              {isLow && <AlertCircle size={11} />}
              <Users size={11} />
              {cruise.available_cabins} cabins left
            </div>
            <button
              onClick={() => navigate(`/booking?cruise_id=${cruise.id}&guests=${guests}`)}
              style={{ background: 'var(--gold)', color: 'var(--navy)', border: 'none',
                        borderRadius: 10, padding: '10px 22px', fontWeight: 700, cursor: 'pointer',
                        fontSize: '0.875rem', transition: 'background 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-dark)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--gold)')}>
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
