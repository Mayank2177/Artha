import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AuthPage from './pages/AuthPage.jsx'
import MoneyHealth from './features/MoneyHealth.jsx'
import FirePlanner from './features/FirePlanner.jsx'
import TaxWizard from './features/TaxWizard.jsx'
import PortfolioXRay from './features/PortfolioXRay.jsx'
import CouplePlanner from './features/CouplePlanner.jsx'
import Overview from './features/Overview.jsx'
import Profile from './features/Profile.jsx'

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// Protected route wrapper — redirects to /auth if not logged in
function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* ── Dashboard shell + nested feature routes (protected) ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }>
          <Route index element={<Overview />} />
          <Route path="health" element={<MoneyHealth />} />
          <Route path="fire" element={<FirePlanner />} />
          <Route path="tax" element={<TaxWizard />} />
          <Route path="portfolio" element={<PortfolioXRay />} />
          <Route path="couple" element={<CouplePlanner />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </>
  )
}
