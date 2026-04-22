import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, Search, Calendar, Users, ChevronDown } from 'lucide-react'
import { airportsApi } from '../api'
import { Airport } from '../types'

interface Props {
  compact?: boolean
  initialValues?: {
    origin?: string; destination?: string
    date?: string; passengers?: number; cabin_class?: string
  }
}

export default function SearchBar({ compact = false, initialValues }: Props) {
  const navigate = useNavigate()

  const [tripType,    setTripType]    = useState<'one-way' | 'round-trip'>('one-way')
  const [origin,      setOrigin]      = useState(initialValues?.origin ?? '')
  const [destination, setDestination] = useState(initialValues?.destination ?? '')
  const [date,        setDate]        = useState(initialValues?.date ?? '')
  const [returnDate,  setReturnDate]  = useState('')
  const [passengers,  setPassengers]  = useState(initialValues?.passengers ?? 1)
  const [cabinClass,  setCabinClass]  = useState(initialValues?.cabin_class ?? 'Economy')
  const [originLabel,      setOriginLabel]      = useState('')
  const [destinationLabel, setDestinationLabel] = useState('')

  const [airports,       setAirports]       = useState<Airport[]>([])
  const [originResults,  setOriginResults]  = useState<Airport[]>([])
  const [destResults,    setDestResults]    = useState<Airport[]>([])
  const [showOriginDD,   setShowOriginDD]   = useState(false)
  const [showDestDD,     setShowDestDD]     = useState(false)

  const originRef = useRef<HTMLDivElement>(null)
  const destRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    airportsApi.list().then(setAirports).catch(console.error)
  }, [])

  // Outside click hides dropdowns
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (originRef.current && !originRef.current.contains(e.target as Node)) setShowOriginDD(false)
      if (destRef.current   && !destRef.current.contains(e.target as Node))   setShowDestDD(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function filterAirports(q: string): Airport[] {
    const lq = q.toLowerCase()
    return airports.filter(a =>
      a.city.toLowerCase().includes(lq) ||
      a.iata_code.toLowerCase().includes(lq) ||
      a.name.toLowerCase().includes(lq)
    ).slice(0, 6)
  }

  function swap() {
    setOrigin(destination); setOriginLabel(destinationLabel)
    setDestination(origin); setDestinationLabel(originLabel)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!origin || !destination || !date) {
      alert('Please fill all required fields.')
      return
    }
    const params = new URLSearchParams({
      origin, destination, date, passengers: String(passengers), cabin_class: cabinClass
    })
    navigate(`/search?${params.toString()}`)
  }

  const today = new Date().toISOString().split('T')[0]

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'none', border: 'none', outline: 'none',
    color: compact ? 'var(--navy)' : 'white', fontSize: compact ? '0.875rem' : '0.9rem', fontWeight: 500,
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.7rem', fontWeight: 600,
    color: compact ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px',
  }
  const fieldBox: React.CSSProperties = {
    background: compact ? 'white' : 'rgba(255,255,255,0.12)',
    border: compact ? '1.5px solid #e5e7eb' : '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px', padding: '10px 14px', flex: 1, minWidth: 120,
    backdropFilter: compact ? 'none' : 'blur(8px)',
  }
  const ddStyle: React.CSSProperties = {
    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
    background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    border: '1px solid #f0f0f0', zIndex: 200, overflow: 'hidden',
  }

  return (
    <form onSubmit={handleSearch}>
      {/* Trip type toggle */}
      {!compact && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['one-way', 'round-trip'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTripType(t)}
                    style={{
                      padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      fontWeight: 600, fontSize: '0.8rem',
                      background: tripType === t ? 'var(--gold)' : 'rgba(255,255,255,0.15)',
                      color:      tripType === t ? 'var(--navy)' : 'rgba(255,255,255,0.8)',
                    }}>
              {t === 'one-way' ? 'One Way' : 'Round Trip'}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'stretch' }}>
        {/* Origin */}
        <div ref={originRef} style={{ ...fieldBox, position: 'relative', flex: '2 1 160px' }}>
          <label style={labelStyle}>From</label>
          <input
            style={inputStyle}
            placeholder="City or airport"
            value={originLabel || origin}
            onChange={e => {
              const v = e.target.value
              setOriginLabel(v); setOrigin('')
              setOriginResults(filterAirports(v))
              setShowOriginDD(true)
            }}
            onFocus={() => { setOriginResults(filterAirports(originLabel || '')); setShowOriginDD(true) }}
            required
          />
          {showOriginDD && originResults.length > 0 && (
            <div style={ddStyle}>
              {originResults.map(a => (
                <button key={a.id} type="button"
                        onClick={() => { setOrigin(a.iata_code); setOriginLabel(`${a.city} (${a.iata_code})`); setShowOriginDD(false) }}
                        style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none',
                                 background: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{a.iata_code}</span>
                  <span style={{ color: '#6b7280', marginLeft: 8 }}>{a.city}, {a.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap button */}
        <button type="button" onClick={swap}
                style={{ background: compact ? '#f3f4f6' : 'rgba(255,255,255,0.15)', border: 'none',
                         borderRadius: 10, padding: '0 12px', cursor: 'pointer', alignSelf: 'center' }}>
          <ArrowLeftRight size={16} color={compact ? 'var(--navy)' : 'white'} />
        </button>

        {/* Destination */}
        <div ref={destRef} style={{ ...fieldBox, position: 'relative', flex: '2 1 160px' }}>
          <label style={labelStyle}>To</label>
          <input
            style={inputStyle}
            placeholder="City or airport"
            value={destinationLabel || destination}
            onChange={e => {
              const v = e.target.value
              setDestinationLabel(v); setDestination('')
              setDestResults(filterAirports(v))
              setShowDestDD(true)
            }}
            onFocus={() => { setDestResults(filterAirports(destinationLabel || '')); setShowDestDD(true) }}
            required
          />
          {showDestDD && destResults.length > 0 && (
            <div style={ddStyle}>
              {destResults.map(a => (
                <button key={a.id} type="button"
                        onClick={() => { setDestination(a.iata_code); setDestinationLabel(`${a.city} (${a.iata_code})`); setShowDestDD(false) }}
                        style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none',
                                 background: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{a.iata_code}</span>
                  <span style={{ color: '#6b7280', marginLeft: 8 }}>{a.city}, {a.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date */}
        <div style={{ ...fieldBox, flex: '1 1 130px' }}>
          <label style={labelStyle}>
            <Calendar size={10} style={{ display: 'inline', marginRight: 3 }} />
            Depart
          </label>
          <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)}
                 style={{ ...inputStyle, colorScheme: compact ? 'light' : 'dark' }} required />
        </div>

        {tripType === 'round-trip' && (
          <div style={{ ...fieldBox, flex: '1 1 130px' }}>
            <label style={labelStyle}>Return</label>
            <input type="date" min={date || today} value={returnDate}
                   onChange={e => setReturnDate(e.target.value)}
                   style={{ ...inputStyle, colorScheme: compact ? 'light' : 'dark' }} />
          </div>
        )}

        {/* Passengers */}
        <div style={{ ...fieldBox, flex: '1 1 110px' }}>
          <label style={labelStyle}>
            <Users size={10} style={{ display: 'inline', marginRight: 3 }} />
            Passengers
          </label>
          <select value={passengers} onChange={e => setPassengers(Number(e.target.value))}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Adult' : 'Adults'}</option>)}
          </select>
        </div>

        {/* Cabin */}
        <div style={{ ...fieldBox, flex: '1 1 120px' }}>
          <label style={labelStyle}>Class</label>
          <select value={cabinClass} onChange={e => setCabinClass(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
            {['Economy','Business','First'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Search button */}
        <button type="submit"
                style={{ background: 'var(--gold)', color: 'var(--navy)', border: 'none',
                         borderRadius: 12, padding: compact ? '0 24px' : '14px 28px',
                         fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                         display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          <Search size={18} />
          {!compact && 'Search Flights'}
        </button>
      </div>
    </form>
  )
}
