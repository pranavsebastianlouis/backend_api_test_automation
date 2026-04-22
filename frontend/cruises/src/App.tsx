import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Navbar         from './components/Navbar'
import Home           from './pages/Home'
import SearchResults  from './pages/SearchResults'
import Booking        from './pages/Booking'
import PaymentSuccess from './pages/PaymentSuccess'
import Profile        from './pages/Profile'

function AuthCallbackHandler() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth } = useAuthStore()
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token  = params.get('auth_token')
    const raw    = params.get('user_data')
    if (token && raw) {
      try { const user = JSON.parse(decodeURIComponent(raw)); setAuth(user, token) } catch {}
      navigate(location.pathname, { replace: true })
    }
  }, [])
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
