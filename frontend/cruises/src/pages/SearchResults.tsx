import { useEffect, useState, lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, Plane, ChevronDown, ChevronUp } from 'lucide-react'
import CruiseCard from '../components/CruiseCard'
import { cruisesApi, portsApi, Cruise } from '../api'

// Lazy import Airlines MFE widget — gracefully fails if Airlines app is offline
const FlightSearchWidget = lazy(() =>
  import('airlines/FlightSearchWidget').catch(() => ({
    default: () => (
      <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
        ✈ Flight search unavailable — make sure LUXE Airlines is running on port 8001
      </div>
    ),
  }))
)

export default function SearchResults() {
  const [sp] = useSearchParams()
  const depPort   = sp.get('departure_port') ?? ''
  const dest      = sp.get('destination')    ?? ''
  const date      = sp.get('date')           ?? ''
  const guests    = Number(sp.get('guests')  ?? '2')
  const cabinType = sp.get('cabin_type')     ?? ''

  const [cruises,     setCruises]     = useState<Cruise[]>([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [sortBy,      setSortBy]      = useState<'price' | 'duration' | 'date'>('price')
  const [filterCabin, setFilterCabin] = useState(cabinType || 'Any')
  const [ports,       setPorts]       = useState<{ id: number; city: string }[]>([])
  const [depSel,      setDepSel]      = useState(depPort)
  const [destSel,     setDestSel]     = useState(dest)

  // MFE panel state — collapsed by default, opens when user clicks
  const [flightPanelOpen, setFlightPanelOpen] = useState(false)

  useEffect(() => {
    portsApi.list().then(setPorts).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true); setError('')
    cruisesApi.search({
      departure_port: depSel   || undefined,
      destination:    destSel  || undefined,
      date:           date     || undefined,
      guests,
      cabin_type:     filterCabin === 'Any' ? undefined : filterCabin,
    })
      .then(r => setCruises(r.cruises))
      .catch(() => setError('Failed to load cruises. Check the Cruises API is running.'))
      .finally(() => setLoading(false))
  }, [depSel, destSel, date, guests, filterCabin])

  const displayed = [...cruises].sort((a, b) => {
    if (sortBy === 'price')    return a.price_per_person - b.price_per_person
    if (sortBy === 'duration') return a.duration_nights  - b.duration_nights
    return new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime()
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fb' }}>

      {/* ── Top search bar ── */}
      <div style={{ background: 'var(--navy)', padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <div className="max-w-6xl mx-auto" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[
            { label: 'From Port', value: depSel,  set: setDepSel },
            { label: 'To Port',   value: destSel, set: setDestSel },
          ].map(({ label, value, set }) => (
            <div key={label} style={{ flex: '1 1 140px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '0.65rem', fontWeight: 600,
                           color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {label}
              </p>
              <select value={value} onChange={e => set(e.target.value)} style={{
                width: '100%', padding: '9px 12px', border: '1.5px solid rgba(255,255,255,0.2)',
                borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: 'white',
                fontSize: '0.85rem', outline: 'none', cursor: 'pointer',
              }}>
                <option value="">Any</option>
                {ports.map(p => <option key={p.id} value={p.city}>{p.city}</option>)}
              </select>
            </div>
          ))}
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', alignSelf: 'center' }}>
            {guests} guest{guests > 1 ? 's' : ''}{date ? ` · from ${date}` : ''}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto" style={{ padding: '24px 16px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                       flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 700, fontSize: '1.15rem', color: 'var(--navy)' }}>
              {depSel || 'All Ports'} → {destSel || 'All Destinations'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>
              {guests} guest{guests > 1 ? 's' : ''}
            </p>
          </div>
          {!loading && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
              {displayed.length} cruise{displayed.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <SlidersHorizontal size={16} color="#6b7280" />
          {(['Any', 'Standard', 'Deluxe', 'Suite', 'Penthouse'] as const).map(c => (
            <button key={c} onClick={() => setFilterCabin(c)} style={{
              padding: '5px 14px', borderRadius: 20, border: '1.5px solid', cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: 600,
              borderColor: filterCabin === c ? 'var(--gold)' : '#e5e7eb',
              background:  filterCabin === c ? 'var(--gold)' : 'white',
              color:       filterCabin === c ? 'var(--navy)' : '#6b7280',
            }}>{c}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={{
              padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e5e7eb',
              fontSize: '0.82rem', background: 'white', cursor: 'pointer',
            }}>
              <option value="price">Price</option>
              <option value="duration">Duration</option>
              <option value="date">Date</option>
            </select>
          </div>
        </div>

        {/* ── Cruise Results ── */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 360, borderRadius: 18 }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444' }}>{error}</div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚢</div>
            <h2 style={{ color: 'var(--navy)' }}>No cruises found</h2>
            <p style={{ color: '#9ca3af' }}>Try removing filters or choosing different ports.</p>
          </div>
        )}

        {!loading && !error && displayed.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {displayed.map(c => <CruiseCard key={c.id} cruise={c} guests={guests} />)}
          </div>
        )}

        {/* ── ✈ FLIGHT MFE PANEL ─────────────────────────────────────────── */}
        <div style={{
          marginTop: 48, border: '1.5px solid rgba(200,169,81,0.4)',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          {/* Collapsible header */}
          <button
            onClick={() => setFlightPanelOpen(v => !v)}
            style={{
              width: '100%', padding: '18px 24px', background: 'var(--navy)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(200,169,81,0.2)',
                             border: '1.5px solid rgba(200,169,81,0.4)', display: 'flex',
                             alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plane size={17} color="#C8A951" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                  Also need a flight?
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  Search LUXE Airlines flights
                  {destSel ? ` to ${destSel}` : ''}
                  {' '}— powered by LUXE Airlines (port 8001)
                </p>
              </div>
            </div>
            {flightPanelOpen
              ? <ChevronUp size={20} color="rgba(255,255,255,0.6)" />
              : <ChevronDown size={20} color="rgba(255,255,255,0.6)" />}
          </button>

          {/* MFE content — only mounted when open */}
          {flightPanelOpen && (
            <div style={{ background: 'var(--navy-light)', padding: '24px' }}>
              <Suspense fallback={
                <div style={{ display: 'flex', gap: 10 }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 60, flex: 1, borderRadius: 10 }} />
                  ))}
                </div>
              }>
                {/* Pass destination city as a hint via URL param — the widget reads window location */}
                <FlightSearchWidget />
              </Suspense>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
