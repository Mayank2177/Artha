import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MoneyHealth from './features/MoneyHealth.jsx'
import FirePlanner from './features/FirePlanner.jsx'
import TaxWizard from './features/TaxWizard.jsx'
import PortfolioXRay from './features/PortfolioXRay.jsx'
import CouplePlanner from './features/CouplePlanner.jsx'
import Overview from './features/Overview.jsx'

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── Landing page ── */}
        <Route path="/" element={<LandingPage />} />

        {/* ── Dashboard shell + nested feature routes ──
              /dashboard             → Overview
              /dashboard/health      → Money Health Score
              /dashboard/fire        → FIRE Path Planner
              /dashboard/tax         → Tax Wizard
              /dashboard/portfolio   → MF Portfolio X-Ray
              /dashboard/couple      → Couple's Money Planner
        ── */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Overview />} />
          <Route path="health" element={<MoneyHealth />} />
          <Route path="fire" element={<FirePlanner />} />
          <Route path="tax" element={<TaxWizard />} />
          <Route path="portfolio" element={<PortfolioXRay />} />
          <Route path="couple" element={<CouplePlanner />} />
        </Route>
      </Routes>
    </>
  )
}
