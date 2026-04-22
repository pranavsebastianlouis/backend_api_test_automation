import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Navbar          from './components/Navbar'
import Home            from './pages/Home'
import SearchResults   from './pages/SearchResults'
import Booking         from './pages/Booking'
import PaymentSuccess  from './pages/PaymentSuccess'
import Profile         from './pages/Profile'

// ── Reads ?auth_token=...&user_data=... injected by the Auth app after sign-in
function AuthCallbackHandler() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token  = params.get('auth_token')
    const raw    = params.get('user_data')
    if (token && raw) {
      try {
        // URLSearchParams.get already percent-decodes; Auth app uses encodeURIComponent on JSON.
        let user: unknown = undefined
        try {
          user = JSON.parse(raw)
        } catch {
          user = JSON.parse(decodeURIComponent(raw))
        }
        setAuth(user as Parameters<typeof setAuth>[0], token)
        const next = new URLSearchParams(location.search)
        next.delete('auth_token')
        next.delete('user_data')
        const qs = next.toString()
        navigate(qs ? `${location.pathname}?${qs}` : location.pathname, { replace: true })
      } catch {
        /* leave URL unchanged so user can retry or Booking can surface an error */
      }
    }
  }, [location.pathname, location.search, navigate, setAuth])

  return null
}

function AppInner() {
  const { initAuth } = useAuthStore()
  useEffect(() => { initAuth() }, [])

  return (
    <>
      <AuthCallbackHandler />
      <Navbar />
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/search"  element={<SearchResults />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking/success" element={<PaymentSuccess />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
