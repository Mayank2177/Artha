// ─────────────────────────────────────────────────────────────────────────────
//  ARTHA — Landing Page  (Upgraded)
//  Sections: Navbar → Hero → Features Grid → CTA → Footer
//  Removed: Stats Strip, How It Works, Tech Stack, Demo Strategy
//  CTA navigates to /dashboard
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  motion,
  useAnimation,
  useInView,
  AnimatePresence,
} from 'framer-motion'
import CountUp from 'react-countup'
import { useInView as useIOView } from 'react-intersection-observer'
import { ResponsiveContainer, RadarChart, PolarGrid, Radar } from 'recharts'
import {
  Heart,
  Clock,
  FileText,
  BarChart3,
  Users,
  TrendingUp,
  IndianRupee,
  ArrowRight,
  Zap,
  ChevronDown,
  X,
  Menu,
  Activity,
  CheckSquare,
  MessageSquare,
} from 'lucide-react'

// ─── FRAMER VARIANTS ─────────────────────────────────────────────────────────
const V = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] } },
  },
  stagger: (d = 0.12) => ({
    hidden: {},
    visible: { transition: { staggerChildren: d } },
  }),
  slideLeft: {
    hidden: { opacity: 0, x: -48 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
  },
  slideRight: {
    hidden: { opacity: 0, x: 48 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
  },
}

// ─── SCROLL REVEAL WRAPPER ───────────────────────────────────────────────────
function Reveal({ children, variant = 'fadeUp', delay = 0, style = {}, className = '' }) {
  const ref = useRef(null)
  const controls = useAnimation()
  const inView = useInView(ref, { once: true, margin: '-80px' })
  useEffect(() => { if (inView) controls.start('visible') }, [inView, controls])
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={V[variant]}
      transition={{ delay }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── CURSOR GLOW ─────────────────────────────────────────────────────────────
function CursorGlow() {
  const [pos, setPos] = useState({ x: -400, y: -400 })
  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return (
    <motion.div
      animate={{ x: pos.x - 200, y: pos.y - 200 }}
      transition={{ type: 'spring', stiffness: 80, damping: 22, mass: 0.5 }}
      style={{
        position: 'fixed', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,39,42,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 1, top: 0, left: 0,
      }}
    />
  )
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'What We Solve', href: '#cta' },
  ]

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          height: 68,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 48px',
          background: scrolled ? 'rgba(10,10,15,0.90)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
          transition: 'background 0.4s, border-color 0.4s',
        }}
      >
        {/* Logo */}
        <motion.a
          href="/"
          whileHover={{ scale: 1.03 }}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px',
            display: 'flex', alignItems: 'center', color: '#F0F0F5',
          }}
        >
          Artha
          <motion.span
            style={{ color: '#E8272A' }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >.</motion.span>
        </motion.a>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {navLinks.map((l) => (
            <motion.a
              key={l.label}
              href={l.href}
              whileHover={{ color: '#F0F0F5' }}
              style={{ color: '#9A9AAD', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}
            >
              {l.label}
            </motion.a>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: '0 0 32px rgba(232,39,42,0.45)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/dashboard')}
          style={{
            background: '#E8272A', color: '#fff',
            borderRadius: 9, padding: '10px 22px',
            fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 20px rgba(232,39,42,0.28)',
          }}
        >
          Open Dashboard <ArrowRight size={14} />
        </motion.button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 999,
              background: 'rgba(10,10,15,0.97)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 32,
            }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              style={{ position: 'absolute', top: 20, right: 24, color: '#9A9AAD' }}
            >
              <X size={28} />
            </button>
            {navLinks.map((l, i) => (
              <motion.a
                key={l.label} href={l.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 32, fontWeight: 700, color: '#F0F0F5',
                }}
              >
                {l.label}
              </motion.a>
            ))}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate('/dashboard')}
              style={{
                background: '#E8272A', color: '#fff', borderRadius: 11,
                padding: '14px 36px', fontSize: 16, fontWeight: 700,
              }}
            >
              Open Dashboard
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── FLOATING HERO CARD ───────────────────────────────────────────────────────
function FloatingCard({ children, delay = 0, style = {} }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{
        position: 'absolute',
        background: 'rgba(17,17,24,0.92)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14, padding: '14px 18px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}

// Mini radar data for hero
const radarData = [
  { axis: 'Savings', value: 72 },
  { axis: 'Insurance', value: 55 },
  { axis: 'Debt', value: 80 },
  { axis: 'Invest', value: 60 },
  { axis: 'Goals', value: 68 },
  { axis: 'Tax', value: 74 },
]

// ─── HERO SECTION ─────────────────────────────────────────────────────────────
function HeroSection() {
  const navigate = useNavigate()

  return (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        textAlign: 'center',
        padding: '120px 24px 80px',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* ── Background glows ── */}
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '14%', left: '50%',
          transform: 'translateX(-50%)',
          width: 800, height: 460, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(232,39,42,0.14) 0%, transparent 68%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{
        position: 'absolute', top: '45%', right: '-8%',
        width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%',
      }} />

      {/* ── Grid pattern ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 55% at 50% 0%, black 0%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 55% at 50% 0%, black 0%, transparent 100%)',
      }} />

      {/* ── Floating cards — visible on md+ ── */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="hero-float-left"
        style={{ position: 'absolute', top: '28%', left: '5%', display: 'none' }}
      >
        <FloatingCard delay={0}>
          <div style={{ width: 72, height: 72 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={28}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <Radar
                  dataKey="value"
                  stroke="#10B981" fill="#10B981"
                  fillOpacity={0.18} strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#9A9AAD', marginBottom: 3 }}>Money Health</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
              72<span style={{ fontSize: 13, color: '#9A9AAD' }}>/100</span>
            </p>
            <p style={{ fontSize: 11, color: '#9A9AAD' }}>Good Standing</p>
          </div>
        </FloatingCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="hero-float-right"
        style={{ position: 'absolute', top: '30%', right: '5%', display: 'none' }}
      >
        <FloatingCard delay={1.5}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(232,39,42,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={17} color="#E8272A" />
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#9A9AAD', marginBottom: 3 }}>FIRE SIP Needed</p>
            <p style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              ₹18,400<span style={{ fontSize: 12, color: '#9A9AAD' }}>/mo</span>
            </p>
            <p style={{ fontSize: 11, color: '#10B981' }}>↑ On track · age 45</p>
          </div>
        </FloatingCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="hero-float-bottom"
        style={{ position: 'absolute', bottom: '20%', right: '7%', display: 'none' }}
      >
        <FloatingCard delay={0.8}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'rgba(16,185,129,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IndianRupee size={15} color="#10B981" />
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#9A9AAD' }}>Tax saved this FY</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
              ₹47,250
            </p>
          </div>
        </FloatingCard>
      </motion.div>

      {/* ── Hero copy ── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={V.stagger(0.13)}
        style={{ position: 'relative', zIndex: 2, maxWidth: 860 }}
      >
        {/* Badge */}
        <motion.div variants={V.fadeUp} style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <motion.span
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(232,39,42,0)',
                '0 0 0 8px rgba(232,39,42,0)',
                '0 0 0 0 rgba(232,39,42,0)',
              ],
            }}
            transition={{ duration: 2.4, repeat: Infinity }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(232,39,42,0.12)',
              border: '1px solid rgba(232,39,42,0.28)',
              borderRadius: 100, padding: '6px 18px',
              fontSize: 11, fontWeight: 700, letterSpacing: '1.4px',
              textTransform: 'uppercase', color: '#E8272A',
            }}
          >
            <motion.span
              style={{ width: 7, height: 7, borderRadius: '50%', background: '#E8272A', display: 'inline-block' }}
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            ET × AI Challenge 2025
          </motion.span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={V.fadeUp}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(48px, 8vw, 96px)',
            fontWeight: 900, lineHeight: 1.03,
            letterSpacing: '-3px', marginBottom: 26,
          }}
        >
          Making{' '}
          <motion.em style={{ fontStyle: 'normal', color: '#E8272A', position: 'relative', display: 'inline-block' }}>
            finance
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.0, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'absolute', bottom: -4, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #E8272A, rgba(232,39,42,0.2))',
                borderRadius: 2, transformOrigin: 'left',
              }}
            />
          </motion.em>
          <br />
          as easy as<br />
          <span style={{ color: '#9A9AAD' }}>checking WhatsApp.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={V.fadeUp}
          style={{
            fontSize: 'clamp(16px, 2vw, 19px)', color: '#9A9AAD',
            lineHeight: 1.65, maxWidth: 540, margin: '0 auto 44px',
          }}
        >
          India's AI-powered personal finance mentor — five modules that turn your raw
          numbers into a complete financial plan. Free. Instant. No jargon.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={V.fadeUp}
          style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <motion.button
            whileHover={{ scale: 1.04, y: -3, boxShadow: '0 16px 52px rgba(232,39,42,0.48)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#E8272A', color: '#fff',
              borderRadius: 11, padding: '16px 40px',
              fontSize: 16, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 6px 32px rgba(232,39,42,0.36)',
            }}
          >
            Check My Money Health <ArrowRight size={17} />
          </motion.button>

          <motion.button
            whileHover={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              background: 'transparent', color: '#F0F0F5',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 11, padding: '15px 34px',
              fontSize: 15, fontWeight: 500,
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            See Features
          </motion.button>
        </motion.div>

        {/* ET RSS pill */}
        <motion.div
          variants={V.fadeUp}
          style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(17,17,24,0.8)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 100, padding: '8px 20px',
            fontSize: 12, color: '#9A9AAD',
            backdropFilter: 'blur(12px)',
          }}>
            <Zap size={12} color="#E8272A" />
            Powered by live{' '}
            <strong style={{ color: '#E8272A', fontWeight: 600 }}>Economic Times RSS</strong>
            {' '}— advice from today's market.
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4 }}
        style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)' }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={22} color="#9A9AAD" />
        </motion.div>
      </motion.div>

      {/* Responsive — show floating cards on wide screens */}
      <style>{`
        @media (min-width: 1000px) {
          .hero-float-left,
          .hero-float-right,
          .hero-float-bottom { display: flex !important; }
        }
        @media (max-width: 600px) {
          nav { padding: 0 20px !important; }
        }
      `}</style>
    </section>
  )
}

// ─── FEATURES GRID ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 1,
    icon: Heart,
    iconColor: '#10B981',
    iconBg: 'rgba(16,185,129,0.12)',
    badge: 'Low · ~2 hrs',
    badgeColor: '#10B981',
    badgeBg: 'rgba(16,185,129,0.12)',
    title: 'Money Health Score',
    desc: '12 questions across 6 dimensions produce a score out of 100 with a radar chart and AI-written action plan — your financial vitals in 5 minutes.',
    tags: ['Radar Chart', 'React Countup', 'Score /100', 'AI Plan'],
    etRss: false,
    wide: false,
  },
  {
    id: 2,
    icon: Clock,
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.12)',
    badge: 'Medium · ~3 hrs',
    badgeColor: '#F59E0B',
    badgeBg: 'rgba(245,158,11,0.12)',
    title: 'FIRE Path Planner',
    desc: 'Enter income, expenses, savings and life goals. Artha builds a month-by-month roadmap with SIP targets, asset allocation shifts and insurance gap analysis — grounded in today\'s ET repo rate & CPI data.',
    tags: ['Live ET RSS', 'Timeline Chart', 'Donut Chart', 'SIP Calculator'],
    etRss: true,
    wide: true,
  },
  {
    id: 3,
    icon: FileText,
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.12)',
    badge: 'Medium · ~3 hrs',
    badgeColor: '#F59E0B',
    badgeBg: 'rgba(245,158,11,0.12)',
    title: 'Tax Wizard',
    desc: 'Upload Form 16 or enter manually. Old vs New regime comparison, every missed deduction (80C, 80D, NPS, HRA) surfaced — using Budget 2025 rules pulled live from ET.',
    tags: ['PDF Upload', 'Live ET RSS', 'Old vs New', '80C / 80D / NPS'],
    etRss: true,
    wide: true,
  },
  {
    id: 4,
    icon: BarChart3,
    iconColor: '#EF4444',
    iconBg: 'rgba(239,68,68,0.12)',
    badge: 'High · ~4 hrs',
    badgeColor: '#EF4444',
    badgeBg: 'rgba(239,68,68,0.12)',
    title: 'MF Portfolio X-Ray',
    desc: 'Upload your CAMS/KFintech PDF. True XIRR, fund overlap detection, expense ratio drag and a full rebalancing plan — in under 10 seconds.',
    tags: ['XIRR · pyxirr', 'Overlap Analysis', 'CAMS PDF', 'Expense Ratio'],
    etRss: false,
    wide: false,
  },
  {
    id: 5,
    icon: Users,
    iconColor: '#10B981',
    iconBg: 'rgba(16,185,129,0.12)',
    badge: 'Low · ~2 hrs',
    badgeColor: '#10B981',
    badgeBg: 'rgba(16,185,129,0.12)',
    title: "Couple's Money Planner",
    desc: "India's first AI joint financial planner. Optimize HRA claims, route 80C investments through the right bracket, and build a combined net worth projection — both incomes, one plan.",
    tags: ['Dual Income', 'HRA Optimizer', 'Joint Net Worth', '80C Routing'],
    etRss: false,
    wide: false,
  },
]

function FeatureCard({ feature, delay }) {
  const [hovered, setHovered] = useState(false)
  const Icon = feature.icon

  return (
    <Reveal
      delay={delay}
      style={{ gridColumn: feature.wide ? 'span 2' : 'span 1' }}
    >
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ y: -7, boxShadow: '0 32px 80px rgba(0,0,0,0.55)' }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{
          height: '100%', minHeight: 260,
          background: '#111118',
          border: `1px solid ${hovered ? 'rgba(232,39,42,0.25)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 22, padding: '32px 28px',
          position: 'relative', overflow: 'hidden',
          cursor: 'default',
          transition: 'border-color 0.3s',
        }}
      >
        {/* Animated top bar */}
        <motion.div
          animate={{ scaleX: hovered ? 1 : 0 }}
          transition={{ duration: 0.32 }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${feature.iconColor} 30%, transparent)`,
            transformOrigin: 'left', borderRadius: '22px 22px 0 0',
          }}
        />

        {/* Ghost number */}
        <span style={{
          position: 'absolute', bottom: 8, right: 20,
          fontFamily: "'Playfair Display', serif",
          fontSize: 88, fontWeight: 900,
          color: hovered ? 'rgba(232,39,42,0.04)' : 'rgba(255,255,255,0.025)',
          lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
          transition: 'color 0.4s',
        }}>
          {String(feature.id).padStart(2, '0')}
        </span>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <motion.div
            whileHover={{ scale: 1.08, rotate: 4 }}
            style={{
              width: 50, height: 50, borderRadius: 14,
              background: feature.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon size={22} color={feature.iconColor} strokeWidth={2} />
          </motion.div>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
            padding: '4px 12px', borderRadius: 100,
            background: feature.badgeBg, color: feature.badgeColor,
          }}>
            {feature.badge}
          </span>
        </div>

        {/* ET pill */}
        {feature.etRss && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(232,39,42,0.08)', border: '1px solid rgba(232,39,42,0.18)',
            borderRadius: 6, padding: '3px 9px', fontSize: 10, fontWeight: 700,
            color: '#E8272A', marginBottom: 12, letterSpacing: '0.4px',
          }}>
            <Zap size={9} /> ET RSS LIVE
          </div>
        )}

        <h3 style={{ fontSize: 21, fontWeight: 700, marginBottom: 10, lineHeight: 1.2 }}>
          {feature.title}
        </h3>
        <p style={{ fontSize: 14, color: '#9A9AAD', lineHeight: 1.7, marginBottom: 22 }}>
          {feature.desc}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {feature.tags.map((t) => (
            <span
              key={t}
              style={{
                fontSize: 11, fontWeight: 500, color: '#9A9AAD',
                background: '#18181F', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 7, padding: '4px 11px',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </motion.div>
    </Reveal>
  )
}

function FeaturesSection() {
  return (
    <section
      id="features"
      style={{ padding: '30px 48px 110px', maxWidth: 1180, margin: '0 auto' }}
    >
      {/* Section header */}
      <div style={{ marginBottom: 56 }}>
        <Reveal>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '2.5px',
            textTransform: 'uppercase', color: '#E8272A', marginBottom: 14,
          }}>
            Five Modules
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(30px, 3.8vw, 48px)', fontWeight: 800,
            lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: 16,
          }}>
            Everything a financial advisor<br />would charge ₹25,000 for.
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p style={{ fontSize: 16, color: '#9A9AAD', lineHeight: 1.7, maxWidth: 500 }}>
            Five AI-powered modules — each with real math, live ET market data, and
            personalized advice. All free.
          </p>
        </Reveal>
      </div>

      {/* Grid */}
      <motion.div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={V.stagger(0.1)}
      >
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.id} feature={f} delay={i * 0.08} />
        ))}
      </motion.div>

      <style>{`
        @media (max-width: 900px) {
          #features > div:last-child { grid-template-columns: 1fr !important; }
          #features > div:last-child > * { grid-column: span 1 !important; }
        }
      `}</style>
    </section>
  )
}

// ─── CTA SECTION ──────────────────────────────────────────────────────────────
function CTASection() {
  const navigate = useNavigate()
  const { ref, inView } = useIOView({ triggerOnce: true, threshold: 0.4 })

  // Stats for countup
  const stats = [
    { end: 95, suffix: '%', prefix: '', label: 'Indians have no financial plan', color: '#E8272A' },
    { end: 25, suffix: 'K+', prefix: '₹', label: 'per year charged by advisors', color: '#F0F0F5' },
    { end: 5, suffix: '', prefix: '', label: 'minutes to your full plan', color: '#F0F0F5' },
    { end: 100, suffix: '%', prefix: '', label: 'free for every Indian', color: '#10B981' },
  ]

  return (
    <section
      id="cta"
      style={{
        padding: '100px 48px',
        position: 'relative', overflow: 'hidden',
        background: '#111118',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700, height: 400, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(232,39,42,0.1) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Stats strip */}
        <div
          ref={ref}
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 0, marginBottom: 80,
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center', padding: '0 24px',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}
            >
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(36px, 4vw, 54px)', fontWeight: 800,
                lineHeight: 1, marginBottom: 10,
                color: s.color, fontVariantNumeric: 'tabular-nums',
              }}>
                {inView ? (
                  <CountUp
                    start={0} end={s.end} duration={1.8}
                    prefix={s.prefix} suffix={s.suffix}
                  />
                ) : `${s.prefix}0${s.suffix}`}
              </p>
              <p style={{ fontSize: 13, color: '#9A9AAD', lineHeight: 1.5, fontWeight: 500 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* CTA copy */}
        <div style={{ textAlign: 'center' }}>
          <Reveal>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '2.5px',
              textTransform: 'uppercase', color: '#E8272A', marginBottom: 18,
            }}>
              Start Now — It's Free
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(34px, 5vw, 60px)',
              fontWeight: 900, lineHeight: 1.06,
              letterSpacing: '-1.5px', marginBottom: 18,
            }}>
              95% of Indians deserve<br />
              the advice the top 5% get.
            </h2>
          </Reveal>

          <Reveal delay={0.16}>
            <p style={{ fontSize: 17, color: '#9A9AAD', marginBottom: 44 }}>
              No advisor. No fees. No jargon. Just Artha.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <motion.button
              whileHover={{ scale: 1.05, y: -4, boxShadow: '0 24px 64px rgba(232,39,42,0.5)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 280, damping: 18 }}
              onClick={() => navigate('/dashboard')}
              style={{
                background: '#E8272A', color: '#fff',
                borderRadius: 13, padding: '18px 56px',
                fontSize: 18, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 10,
                boxShadow: '0 8px 40px rgba(232,39,42,0.38)',
              }}
            >
              Open Dashboard <ArrowRight size={20} />
            </motion.button>
            <p style={{ fontSize: 13, color: '#9A9AAD', marginTop: 16 }}>
              Takes 5 minutes · Completely free · No signup required
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.07)',
      padding: '28px 48px',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
    }}>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 22, fontWeight: 800,
      }}>
        Artha<span style={{ color: '#E8272A' }}>.</span>
      </div>
      <p style={{ fontSize: 13, color: '#9A9AAD' }}>
        ET × AI Hackathon 2025 — Confidential Submission
      </p>
      <p style={{ fontSize: 13, color: '#9A9AAD' }}>
        अर्थ — wealth, prosperity, purpose.
      </p>
    </footer>
  )
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ background: '#0A0A0F', minHeight: '100vh', position: 'relative' }}
    >
      <CursorGlow />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </motion.div>
  )
}
