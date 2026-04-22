import { useNavigate } from 'react-router-dom'
import { Plane, Clock, Users, AlertCircle } from 'lucide-react'
import { Flight } from '../types'

interface Props {
  flight:     Flight
  passengers: number
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return iso.slice(11, 16) }
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

export default function FlightCard({ flight, passengers }: Props) {
  const navigate = useNavigate()
  const seatsLeft = flight.available_seats
  const isLow     = seatsLeft <= 10

  function handleBook() {
    navigate(`/booking?flight_id=${flight.id}&passengers=${passengers}`)
  }

  return (
    <div
      className="fade-in"
      style={{
        background: 'white',
        border: `1.5px solid ${isLow ? 'rgba(239,68,68,0.3)' : '#f0f0f0'}`,
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        {/* LEFT: Airline + Flight No */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--navy)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plane size={20} color="var(--gold)" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy)' }}>LUXE Airlines</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>{flight.flight_number}</p>
          </div>
        </div>

        {/* CENTER: Route timeline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'center', minWidth: 240 }}>
          {/* Departure */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1 }}>
              {formatTime(flight.departure_time)}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>
              {flight.origin.iata_code}
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{formatDate(flight.departure_time)}</p>
          </div>

          {/* Duration line */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9ca3af', fontSize: '0.72rem' }}>
              <Clock size={11} />
              {formatDuration(flight.duration_minutes)}
            </div>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid var(--gold)', background: 'white', flexShrink: 0 }} />
              <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg, var(--gold), var(--gold-light))' }} />
              <Plane size={14} color="var(--gold)" style={{ flexShrink: 0 }} />
            </div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>Non-stop</p>
          </div>

          {/* Arrival */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1 }}>
              {formatTime(flight.arrival_time)}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>
              {flight.destination.iata_code}
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{formatDate(flight.arrival_time)}</p>
          </div>
        </div>

        {/* RIGHT: Price + Book */}
        <div style={{ textAlign: 'right', minWidth: 140 }}>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}>
            ₹{(flight.price_per_person * passengers).toLocaleString('en-IN')}
          </p>
          <p style={{ margin: '1px 0 12px', fontSize: '0.72rem', color: '#9ca3af' }}>
            {passengers > 1 ? `₹${flight.price_per_person.toLocaleString('en-IN')} × ${passengers}` : 'per person'}
          </p>
          <button
            onClick={handleBook}
            style={{
              background: 'var(--gold)', color: 'var(--navy)', border: 'none',
              borderRadius: 10, padding: '10px 22px', fontWeight: 700,
              fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-dark)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--gold)')}
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Footer row */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6',
                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
          ✈ {flight.aircraft_model}
        </span>
        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>• {flight.cabin_class}</span>
        <span style={{
          fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: 20,
          background: isLow ? '#fef2f2' : '#f0fdf4',
          color:      isLow ? '#ef4444'  : '#16a34a',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {isLow && <AlertCircle size={11} />}
          <Users size={11} />
          {seatsLeft} seats left
        </span>
        <span style={{ fontSize: '0.78rem', color: '#6b7280', marginLeft: 'auto' }}>
          {flight.origin.city} → {flight.destination.city}
        </span>
      </div>
    </div>
  )
}
