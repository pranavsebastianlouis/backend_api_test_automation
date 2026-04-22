import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Download, Home, Plane } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function PaymentSuccess() {
  const [sp]     = useSearchParams()
  const navigate = useNavigate()
  const ref      = sp.get('ref')   ?? 'XXXXXXXX'
  const total    = sp.get('total') ?? '0'
  const [confetti, setConfetti] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setConfetti(false), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)',
                   display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Floating confetti */}
      {confetti && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          {[...Array(24)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left:     `${Math.random() * 100}%`,
              top:      `-${Math.random() * 20}%`,
              width:    8, height: 8, borderRadius: 2,
              background: ['var(--gold)', '#fff', '#C8A951', '#E2C97A', '#9C7C2C'][i % 5],
              animation: `fall ${2 + Math.random() * 2}s linear ${Math.random() * 2}s forwards`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }} />
          ))}
          <style>{`@keyframes fall { to { top: 110%; opacity: 0; transform: rotate(360deg) translateX(30px); } }`}</style>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, width: '100%', textAlign: 'center' }}>

        {/* Success icon */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%',
                         background: 'rgba(200,169,81,0.15)', border: '2px solid var(--gold)',
                         display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <CheckCircle size={48} color="var(--gold)" />
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
                       border: '1px solid rgba(200,169,81,0.25)', borderRadius: 24,
                       padding: '36px 32px' }}>
          <p style={{ color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 600,
                       letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
            Booking Confirmed
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'white',
                        fontSize: 'clamp(1.5rem,3vw,2rem)', margin: '0 0 6px' }}>
            Thank You for Choosing
          </h1>
          <h1 style={{ fontFamily: "'Playfair Display', serif", margin: '0 0 28px' }}
              className="text-gold-gradient" >
            LUXE Airlines
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 28, lineHeight: 1.6, fontSize: '0.9rem' }}>
            Your booking is confirmed. A confirmation email will be sent to your registered address shortly.
          </p>

          {/* Booking reference box */}
          <div style={{ background: 'rgba(200,169,81,0.12)', border: '1.5px solid rgba(200,169,81,0.4)',
                         borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
            <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem',
                         textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Booking Reference
            </p>
            <p style={{ margin: 0, color: 'var(--gold)', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.08em' }}>
              {ref}
            </p>
          </div>

          {/* Amount paid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                         padding: '14px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: 12,
                         marginBottom: 28 }}>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.875rem' }}>Amount Paid</span>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>
              ₹{Number(total).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/profile?tab=bookings')}
              style={{ flex: 1, padding: '12px 20px', background: 'var(--gold)', border: 'none',
                        borderRadius: 12, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                        color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Download size={16} /> View Booking
            </button>
            <button
              onClick={() => navigate('/')}
              style={{ flex: 1, padding: '12px 20px',
                        background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.2)',
                        borderRadius: 12, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Home size={16} /> Back to Home
            </button>
          </div>
        </div>

        {/* Travel tip */}
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <Plane size={14} color="rgba(255,255,255,0.3)" />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', margin: 0 }}>
            Check-in opens 48 hours before departure · Arrive 2 hours early at airport
          </p>
        </div>
      </div>
    </div>
  )
}
