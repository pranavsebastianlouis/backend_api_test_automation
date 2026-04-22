/**
 * FlightSearchWidget — MFE exposed by LUXE Airlines (port 8001)
 * Imported by LUXE Cruises at: import('airlines/FlightSearchWidget')
 *
 * - Shows a compact search form
 * - Results are ONLY shown after the user explicitly presses Search
 * - "Book" redirects to Airlines booking page
 */
import { useState, useEffect } from 'react'
import { Plane, Clock, Search, AlertCircle, ChevronRight } from 'lucide-react'
import axios from 'axios'

const AIRLINES_API = 'http://localhost:9001'
const AIRLINES_APP = 'http://localhost:8001'

interface Airport {
  id: number; iata_code: string; city: string; name: string
}
interface Flight {
  id: string; flight_number: string
  departure_time: string; arrival_time: string
  duration_minutes: number; aircraft_model: string
  cabin_class: string; available_seats: number
  price_per_person: number; status: string
  origin: Airport; destination: Airport
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch { return iso.slice(11, 16) }
}

export default function FlightSearchWidget() {
  const [airports, setAirports] = useState<Airport[]>([])
  const [origin,   setOrigin]   = useState('')
  const [dest,     setDest]     = useState('')
  const [date,     setDate]     = useState('')
  const [pax,      setPax]      = useState(1)
  const [flights,  setFlights]  = useState<Flight[]>([])
  const [loading,  setLoading]  = useState(false)
  const [searched, setSearched] = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    axios.get<Airport[]>(`${AIRLINES_API}/airports`)
      .then(r => setAirports(r.data))
      .catch(() => {})
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!origin || !dest || !date) return
    setLoading(true); setError(''); setSearched(false); setFlights([])
    try {
      const res = await axios.get(`${AIRLINES_API}/flights/search`, {
        params: { origin, destination: dest, date, passengers: pax, cabin_class: 'Economy' },
      })
      setFlights(res.data.flights ?? [])
      setSearched(true)
    } catch {
      setError('Unable to reach LUXE Airlines. Make sure it is running on port 9001.')
    } finally {
      setLoading(false)
    }
  }

  function handleBook(flightId: string) {
    window.location.href = `${AIRLINES_APP}/booking?flight_id=${flightId}&passengers=${pax}`
  }

  const today = new Date().toISOString().split('T')[0]

  const sel: React.CSSProperties = {
    width: '100%', padding: '9px 10px', border: '1.5px solid rgba(255,255,255,0.2)',
    borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: 'white',
    fontSize: '0.82rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '0.65rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4,
  }

  return (
    <div>
      {/* Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(200,169,81,0.2)',
                       border: '1.5px solid rgba(200,169,81,0.4)',
                       display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Plane size={15} color="#C8A951" />
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>LUXE Airlines</p>
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
            Search and book flights
          </p>
        </div>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 120px' }}>
            <label style={lbl}>From</label>
            <select value={origin} onChange={e => setOrigin(e.target.value)} style={sel} required>
              <option value="">Select origin</option>
              {airports.map(a => (
                <option key={a.id} value={a.iata_code}>{a.city} ({a.iata_code})</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={lbl}>To</label>
            <select value={dest} onChange={e => setDest(e.target.value)} style={sel} required>
              <option value="">Select destination</option>
              {airports
                .filter(a => a.iata_code !== origin)
                .map(a => (
                  <option key={a.id} value={a.iata_code}>{a.city} ({a.iata_code})</option>
                ))}
            </select>
          </div>
          <div style={{ flex: '1 1 110px' }}>
            <label style={lbl}>Date</label>
            <input type="date" min={today} value={date}
                   onChange={e => setDate(e.target.value)}
                   style={{ ...sel, cursor: 'text', colorScheme: 'dark' }}
                   required />
          </div>
          <div style={{ flex: '0 1 80px' }}>
            <label style={lbl}>Pax</label>
            <select value={pax} onChange={e => setPax(Number(e.target.value))} style={sel}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading} style={{
            padding: '9px 18px', background: loading ? 'rgba(200,169,81,0.5)' : '#C8A951',
            color: '#0F172A', border: 'none', borderRadius: 10, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}>
            <Search size={14} />
            {loading ? 'Searching…' : 'Search Flights'}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
                       border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
                       color: '#fca5a5', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Results — only shown after search */}
      {searched && !loading && (
        <div style={{ marginTop: 16 }}>
          {flights.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)',
                           borderRadius: 12, color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
              No flights found for this route and date. Try a different date.
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)',
                           fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {flights.length} flight{flights.length !== 1 ? 's' : ''} found
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
                             maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}>
                {flights.slice(0, 6).map(f => (
                  <div key={f.id} style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12, padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                  }}>
                    {/* Flight info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 180 }}>
                      <Plane size={14} color="#C8A951" style={{ flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: 'white', fontSize: '0.82rem' }}>
                          {f.flight_number} · {f.cabin_class}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.7rem',
                                     color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={10} />
                          {Math.floor(f.duration_minutes/60)}h {f.duration_minutes%60}m
                          {' · '}{f.available_seats} seats left
                        </p>
                      </div>
                    </div>

                    {/* Times */}
                    <div style={{ fontSize: '0.85rem', color: 'white', textAlign: 'center' }}>
                      <strong>{fmtTime(f.departure_time)}</strong>
                      <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 6px' }}>→</span>
                      <strong>{fmtTime(f.arrival_time)}</strong>
                    </div>

                    {/* Price + Book */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: 800, color: '#C8A951', fontSize: '0.95rem' }}>
                          ₹{(f.price_per_person * pax).toLocaleString('en-IN')}
                        </p>
                        {pax > 1 && (
                          <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                            ×{pax} pax
                          </p>
                        )}
                      </div>
                      <button onClick={() => handleBook(f.id)} style={{
                        padding: '7px 14px', background: '#C8A951', color: '#0F172A',
                        border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer',
                        fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4,
                        whiteSpace: 'nowrap',
                      }}>
                        Book <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {flights.length > 6 && (
                <a href={`${AIRLINES_APP}/search?origin=${origin}&destination=${dest}&date=${date}&passengers=${pax}`}
                   target="_top" style={{
                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                     marginTop: 10, color: '#C8A951', fontSize: '0.78rem', fontWeight: 600,
                     textDecoration: 'none',
                   }}>
                  View all {flights.length} flights on LUXE Airlines <ChevronRight size={13} />
                </a>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
