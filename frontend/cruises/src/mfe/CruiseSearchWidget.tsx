/**
 * CruiseSearchWidget — MFE exposed by LUXE Cruises (port 8002)
 * Imported by LUXE Airlines at: import('cruises/CruiseSearchWidget')
 *
 * - Shows a compact search form
 * - Results are ONLY shown after the user explicitly presses Search
 * - "Book" redirects to Cruises booking page
 */
import { useState, useEffect } from 'react'
import { Ship, Moon, Search, AlertCircle, ChevronRight } from 'lucide-react'
import axios from 'axios'

const CRUISES_API = 'http://localhost:9002'
const CRUISES_APP = 'http://localhost:8002'

interface Port {
  id: number; city: string; name: string; country: string
}
interface Cruise {
  id: string; name: string
  departure_date: string; arrival_date: string
  duration_nights: number; price_per_person: number
  available_cabins: number; cabin_type: string; status: string
  departure_port: Port; arrival_port: Port
  ship: { name: string }
}

export default function CruiseSearchWidget() {
  const [ports,   setPorts]   = useState<Port[]>([])
  const [depPort, setDepPort] = useState('')
  const [dest,    setDest]    = useState('')
  const [date,    setDate]    = useState('')
  const [guests,  setGuests]  = useState(2)
  const [cruises, setCruises] = useState<Cruise[]>([])
  const [loading, setLoading] = useState(false)
  const [searched,setSearched]= useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    axios.get<Port[]>(`${CRUISES_API}/ports`)
      .then(r => setPorts(r.data))
      .catch(() => {})
  }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSearched(false); setCruises([])
    try {
      const params: Record<string, string | number> = { guests }
      if (depPort) params.departure_port = depPort
      if (dest)    params.destination    = dest
      if (date)    params.date           = date
      const res = await axios.get(`${CRUISES_API}/cruises/search`, { params })
      setCruises(res.data.cruises ?? [])
      setSearched(true)
    } catch {
      setError('Unable to reach LUXE Cruises. Make sure it is running on port 9002.')
    } finally {
      setLoading(false)
    }
  }

  function handleBook(cruiseId: string) {
    window.location.href = `${CRUISES_APP}/booking?cruise_id=${cruiseId}&guests=${guests}`
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
          <Ship size={15} color="#C8A951" />
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>LUXE Cruises</p>
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
            Search and book cruises
          </p>
        </div>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 120px' }}>
            <label style={lbl}>Departure Port</label>
            <select value={depPort} onChange={e => setDepPort(e.target.value)} style={sel}>
              <option value="">Any port</option>
              {ports.map(p => (
                <option key={p.id} value={p.city}>{p.city}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={lbl}>Destination</label>
            <select value={dest} onChange={e => setDest(e.target.value)} style={sel}>
              <option value="">Any destination</option>
              {ports
                .filter(p => p.city !== depPort)
                .map(p => (
                  <option key={p.id} value={p.city}>{p.city}</option>
                ))}
            </select>
          </div>
          <div style={{ flex: '1 1 110px' }}>
            <label style={lbl}>From date</label>
            <input type="date" min={today} value={date}
                   onChange={e => setDate(e.target.value)}
                   style={{ ...sel, cursor: 'text', colorScheme: 'dark' }} />
          </div>
          <div style={{ flex: '0 1 80px' }}>
            <label style={lbl}>Guests</label>
            <select value={guests} onChange={e => setGuests(Number(e.target.value))} style={sel}>
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
            {loading ? 'Searching…' : 'Search Cruises'}
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
          {cruises.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)',
                           borderRadius: 12, color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
              No cruises found for these ports and date. Try removing filters.
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 10px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)',
                           fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {cruises.length} cruise{cruises.length !== 1 ? 's' : ''} found
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
                             maxHeight: 340, overflowY: 'auto', paddingRight: 2 }}>
                {cruises.slice(0, 6).map(c => (
                  <div key={c.id} style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12, padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                  }}>
                    {/* Cruise info */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: 'white', fontSize: '0.85rem',
                                   whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                   maxWidth: 240 }}>
                        {c.name}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: '0.7rem',
                                   color: 'rgba(255,255,255,0.5)', display: 'flex',
                                   alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        <Ship size={10} />
                        {c.departure_port.city} → {c.arrival_port.city}
                        <span style={{ marginLeft: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Moon size={10} /> {c.duration_nights}n
                        </span>
                        <span>· {c.cabin_type}</span>
                        <span>· {c.available_cabins} cabins</span>
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                        Departs {new Date(c.departure_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Price + Book */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: 800, color: '#C8A951', fontSize: '0.95rem' }}>
                          ₹{(c.price_per_person * guests).toLocaleString('en-IN')}
                        </p>
                        {guests > 1 && (
                          <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                            ×{guests} guests
                          </p>
                        )}
                      </div>
                      <button onClick={() => handleBook(c.id)} style={{
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

              {cruises.length > 6 && (
                <a href={`${CRUISES_APP}/search?departure_port=${depPort}&destination=${dest}&date=${date}&guests=${guests}`}
                   target="_top" style={{
                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                     marginTop: 10, color: '#C8A951', fontSize: '0.78rem', fontWeight: 600,
                     textDecoration: 'none',
                   }}>
                  View all {cruises.length} cruises on LUXE Cruises <ChevronRight size={13} />
                </a>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
