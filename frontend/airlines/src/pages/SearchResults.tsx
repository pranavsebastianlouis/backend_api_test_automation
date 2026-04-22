import { useEffect, useState, lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, Ship, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import SearchBar  from '../components/SearchBar'
import FlightCard from '../components/FlightCard'
import { flightsApi } from '../api'
import { Flight }     from '../types'

// Lazy import Cruises MFE — gracefully fails if Cruises app is offline
const CruiseSearchWidget = lazy(() =>
  import('cruises/CruiseSearchWidget').catch(() => ({
    default: () => (
      <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
        🚢 Cruise search unavailable — make sure LUXE Cruises is running on port 8002
      </div>
    ),
  }))
)

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const origin      = searchParams.get('origin')      ?? ''
  const destination = searchParams.get('destination') ?? ''
  const date        = searchParams.get('date')        ?? ''
  const passengers  = Number(searchParams.get('passengers') ?? '1')
  const cabinClass  = searchParams.get('cabin_class') ?? 'Economy'

  const [flights,     setFlights]     = useState<Flight[]>([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [sortBy,      setSortBy]      = useState<'price' | 'duration' | 'departure'>('price')
  const [filterClass, setFilterClass] = useState('Any')

  // MFE panel — collapsed by default
  const [cruisePanelOpen, setCruisePanelOpen] = useState(false)

  useEffect(() => {
    if (!origin || !destination || !date) return
    setLoading(true); setError('')
    flightsApi.search({ origin, destination, date, passengers, cabin_class: cabinClass })
      .then(res => setFlights(res.flights))
      .catch(() => setError('Failed to load flights. Please check your search or try again.'))
      .finally(() => setLoading(false))
  }, [origin, destination, date, passengers, cabinClass])

  const displayed = [...flights]
    .filter(f => filterClass === 'Any' || f.cabin_class === filterClass)
    .sort((a, b) => {
      if (sortBy === 'price')    return a.price_per_person - b.price_per_person
      if (sortBy === 'duration') return a.duration_minutes - b.duration_minutes
      return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime()
    })

  // Map IATA destination to city name for cruise pre-fill
  const destCity = flights[0]?.destination?.city ?? destination

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>

      {/* ── Sticky search bar ── */}
      <div style={{ background: 'var(--navy)', padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <div className="max-w-6xl mx-auto">
          <SearchBar compact initialValues={{ origin, destination, date, passengers, cabin_class: cabinClass }} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto" style={{ padding: '24px 16px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                       flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 700, fontSize: '1.15rem', color: 'var(--navy)' }}>
              {origin} → {destination}
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>
              {date} · {passengers} passenger{passengers > 1 ? 's' : ''} · {cabinClass}
            </p>
          </div>
          {!loading && !error && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>
              {displayed.length} flight{displayed.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <SlidersHorizontal size={16} color="#6b7280" />
          {(['Any', 'Economy', 'Business', 'First'] as const).map(cls => (
            <button key={cls} onClick={() => setFilterClass(cls)} style={{
              padding: '5px 14px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: 600,
              borderColor: filterClass === cls ? 'var(--gold)' : '#e5e7eb',
              background:  filterClass === cls ? 'var(--gold)' : 'white',
              color:       filterClass === cls ? 'var(--navy)' : '#6b7280',
            }}>{cls}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={{
              padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb',
              fontSize: '0.82rem', background: 'white', cursor: 'pointer',
            }}>
              <option value="price">Price (Low→High)</option>
              <option value="duration">Duration (Short→Long)</option>
              <option value="departure">Departure Time</option>
            </select>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: '#ef4444', fontWeight: 600, margin: '0 0 8px' }}>Something went wrong</p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{error}</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>✈️</div>
            <h2 style={{ color: 'var(--navy)', marginBottom: 8 }}>No flights found</h2>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', maxWidth: 380, margin: '0 auto' }}>
              No flights match your search. Try a different date or route.
            </p>
          </div>
        )}

        {/* ── Flight results ── */}
        {!loading && !error && displayed.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {displayed.map(f => <FlightCard key={f.id} flight={f} passengers={passengers} />)}
          </div>
        )}

        {/* ── 🚢 CRUISE MFE PANEL ─────────────────────────────────────────── */}
        <div style={{
          marginTop: 48, border: '1.5px solid rgba(200,169,81,0.4)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          {/* Collapsible header */}
          <button
            onClick={() => setCruisePanelOpen(v => !v)}
            style={{
              width: '100%', padding: '18px 24px', background: 'var(--navy)',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(200,169,81,0.2)',
                             border: '1.5px solid rgba(200,169,81,0.4)', display: 'flex',
                             alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ship size={17} color="#C8A951" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                  Continue your journey by sea?
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  Search LUXE Cruises departing from {destCity || destination}
                  {' '}— powered by LUXE Cruises (port 8002)
                </p>
              </div>
            </div>
            {cruisePanelOpen
              ? <ChevronUp size={20} color="rgba(255,255,255,0.6)" />
              : <ChevronDown size={20} color="rgba(255,255,255,0.6)" />}
          </button>

          {/* MFE content — only mounted when open */}
          {cruisePanelOpen && (
            <div style={{ background: 'var(--navy-light)', padding: '24px' }}>
              <Suspense fallback={
                <div style={{ display: 'flex', gap: 10 }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 60, flex: 1, borderRadius: 10 }} />
                  ))}
                </div>
              }>
                <CruiseSearchWidget />
              </Suspense>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
