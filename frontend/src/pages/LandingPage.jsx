// ─────────────────────────────────────────────────────────────────────────────
//  ARTHA — Landing Page (Upgraded v6: Elegant Staggered Subheadline)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  motion, useAnimation, useInView, AnimatePresence,
} from 'framer-motion'
import CountUp from 'react-countup'
import { useInView as useIOView } from 'react-intersection-observer'
import { ResponsiveContainer, RadarChart, PolarGrid, Radar } from 'recharts'
import {
  Heart, Clock, FileText, BarChart3, Users,
  TrendingUp, IndianRupee, ArrowRight, Zap,
  ChevronDown, X,
} from 'lucide-react'

// ─── 3D IMPORTS ──────────────────────────────────────────────────────────────
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment } from '@react-three/drei'

// ─── VARIANTS ───────────────────────────────
const V = {
  fadeUp: {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', damping: 22, stiffness: 120 }
    },
  },
  stagger: (d = 0.15) => ({
    hidden: {},
    visible: { transition: { staggerChildren: d, delayChildren: 0.2 } },
  }),
}

// ─── SCROLL REVEAL ───────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, style = {} }) {
  const ref = useRef(null)
  const controls = useAnimation()
  const inView = useInView(ref, { once: true, margin: '-80px' })
  useEffect(() => { if (inView) controls.start('visible') }, [inView, controls])
  return (
    <motion.div
      ref={ref} initial="hidden" animate={controls}
      variants={V.fadeUp} transition={{ delay }} style={style}
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
  const { user } = useAuth()
  const dest = user ? '/dashboard' : '/auth'
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'The Problem', href: '#problem' },
  ]
  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          height: 68, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 48px',
          background: scrolled ? 'rgba(10,10,15,0.90)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
          transition: 'background 0.4s, border-color 0.4s',
        }}
      >
        <motion.a href="/" whileHover={{ scale: 1.03 }} style={{
          fontFamily: "'Playfair Display', serif", fontSize: 26,
          fontWeight: 800, letterSpacing: '-0.5px',
          display: 'flex', alignItems: 'center', color: '#F0F0F5',
        }}>
          Artha
          <motion.span style={{ color: '#E8272A' }}
            animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>.</motion.span>
        </motion.a>

        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          {navLinks.map((l) => (
            <motion.a key={l.label} href={l.href} whileHover={{ color: '#F0F0F5' }}
              style={{ color: '#9A9AAD', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }}>
              {l.label}
            </motion.a>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.04, boxShadow: '0 0 32px rgba(232,39,42,0.45)' }}
          whileTap={{ scale: 0.97 }} onClick={() => navigate(dest)}
          style={{
            background: '#E8272A', color: '#fff', borderRadius: 9, padding: '10px 22px',
            fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 20px rgba(232,39,42,0.28)',
          }}
        >
          Open Dashboard <ArrowRight size={14} />
        </motion.button>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(10,10,15,0.97)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32,
            }}>
            <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', top: 20, right: 24, color: '#9A9AAD', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={28} />
            </button>
            {navLinks.map((l, i) => (
              <motion.a key={l.label} href={l.href}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                onClick={() => setMobileOpen(false)}
                style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: '#F0F0F5' }}>
                {l.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── 3D BACKGROUND COMPONENTS ────────────────────────────────────────────────
function RotatingShape() {
  const meshRef = useRef()
  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta * 0.1
    meshRef.current.rotation.y += delta * 0.15
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5}>
      <mesh ref={meshRef} position={[2, 0, -2]} scale={1.8}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#0A0A0F"
          emissive="#E8272A"
          emissiveIntensity={0.4}
          wireframe={true}
          transparent={true}
          opacity={0.3}
        />
      </mesh>
    </Float>
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
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        maxWidth: 260,
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}

const radarData = [
  { axis: 'Savings', value: 72 }, { axis: 'Insurance', value: 55 },
  { axis: 'Debt', value: 80 }, { axis: 'Invest', value: 60 },
  { axis: 'Goals', value: 68 }, { axis: 'Tax', value: 74 },
]

// ─── HERO SECTION ─────────────────────────────────────────────────────────────
function HeroSection() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const dest = user ? '/dashboard' : '/auth'

  // The words we want to stagger animate
  const swipeWords = ["as", "easy", "as", "a", "swipe."]

  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      textAlign: 'center', padding: '120px 24px 80px',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* ─── 3D CANVAS INJECTION ─── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} color="#E8272A" />
          <RotatingShape />
          <Environment preset="city" />
        </Canvas>
      </div>

      {/* Background glows */}
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '14%', left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 460, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(232,39,42,0.14) 0%, transparent 68%)',
          pointerEvents: 'none', zIndex: 1
        }}
      />
      <div style={{
        position: 'absolute', top: '45%', right: '-8%', width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',
        pointerEvents: 'none', borderRadius: '50%', zIndex: 1
      }} />

      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 55% at 50% 0%, black 0%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 55% at 50% 0%, black 0%, transparent 100%)',
      }} />

      {/* Floating cards — FIXED POSITIONS */}
      <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="hero-float-left"
        style={{ position: 'absolute', top: '25%', left: '8%', display: 'none', zIndex: 3 }}>
        <FloatingCard delay={0}>
          <div style={{ width: 72, height: 72 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={28}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <Radar dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.18} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 11, color: '#9A9AAD', marginBottom: 3 }}>Money Health</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>
              72<span style={{ fontSize: 13, color: '#9A9AAD' }}>/100</span>
            </p>
            <p style={{ fontSize: 11, color: '#9A9AAD' }}>Good Standing</p>
          </div>
        </FloatingCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="hero-float-right"
        style={{ position: 'absolute', top: '22%', right: '15%', display: 'none', zIndex: 3 }}>
        <FloatingCard delay={1.5}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(232,39,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={17} color="#E8272A" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 11, color: '#9A9AAD', marginBottom: 3 }}>FIRE SIP Needed</p>
            <p style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              ₹18,400<span style={{ fontSize: 12, color: '#9A9AAD' }}>/mo</span>
            </p>
            <p style={{ fontSize: 11, color: '#10B981' }}>↑ On track · age 45</p>
          </div>
        </FloatingCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="hero-float-bottom"
        style={{ position: 'absolute', bottom: '15%', right: '12%', display: 'none', zIndex: 3 }}>
        <FloatingCard delay={0.8}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IndianRupee size={15} color="#10B981" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 11, color: '#9A9AAD' }}>Tax saved this FY</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>₹47,250</p>
          </div>
        </FloatingCard>
      </motion.div>

      {/* Hero copy */}
      <motion.div
        initial="hidden" animate="visible"
        variants={V.stagger(0.15)}
        style={{ position: 'relative', zIndex: 3, maxWidth: 800 }}
      >
        {/* Badge */}
        <motion.div variants={V.fadeUp} style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <motion.span
            animate={{ boxShadow: ['0 0 0 0 rgba(232,39,42,0)', '0 0 0 8px rgba(232,39,42,0)', '0 0 0 0 rgba(232,39,42,0)'] }}
            transition={{ duration: 2.4, repeat: Infinity }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(232,39,42,0.12)', border: '1px solid rgba(232,39,42,0.28)',
              borderRadius: 100, padding: '6px 18px',
              fontSize: 11, fontWeight: 700, letterSpacing: '1.4px',
              textTransform: 'uppercase', color: '#E8272A',
            }}
          >
            <motion.span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E8272A', display: 'inline-block' }}
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
            ET × AI Challenge 2025
          </motion.span>
        </motion.div>

        {/* ── HEADLINE ── */}
        <motion.h1 variants={V.fadeUp} style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(48px, 8vw, 96px)',
          fontWeight: 900, lineHeight: 1.03,
          letterSpacing: '-3px', marginBottom: 0,
        }}>
          Making{' '}
          <motion.em style={{ fontStyle: 'normal', color: '#E8272A', position: 'relative', display: 'inline-block' }}>
            finance
            <motion.span
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 1.0, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: 'absolute', bottom: -4, left: 0, right: 0, height: 3,
                background: 'linear-gradient(90deg, #E8272A, rgba(232,39,42,0.2))',
                borderRadius: 2, transformOrigin: 'left',
              }}
            />
          </motion.em>
        </motion.h1>

        {/* ── Subheadline "Swipe" Text (Staggered Animation) ── */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.25, // Delay between each word
                delayChildren: 0.6,    // Starts right after the main headline
              }
            }
          }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: 32,
            marginTop: 8,
          }}
        >
          {swipeWords.map((word, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0, y: 15, filter: 'blur(5px)' },
                visible: {
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                }
              }}
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: 'clamp(22px, 3.5vw, 42px)', // Much more elegant and refined size
                fontWeight: 400, // Lighter, unique feel
                color: '#C8C8D0', // Soft grey to let the main headline shine
                letterSpacing: '-0.5px',
                lineHeight: 1.2,
              }}
            >
              {word === "swipe." ? (
                <span style={{ color: '#F0F0F5', fontWeight: 500 }}>{word}</span>
              ) : (
                word
              )}
            </motion.span>
          ))}
        </motion.div>

        {/* Subtitle */}
        <motion.p variants={V.fadeUp} style={{
          fontSize: 'clamp(16px, 2vw, 19px)', color: '#9A9AAD',
          lineHeight: 1.65, maxWidth: 540, margin: '0 auto 44px',
        }}>
          India's AI-powered personal finance mentor — five modules that turn your raw
          numbers into a complete financial plan. Free. Instant. No jargon.
        </motion.p>

        {/* Buttons */}
        <motion.div variants={V.fadeUp}
          style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.04, y: -3, boxShadow: '0 16px 52px rgba(232,39,42,0.48)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => navigate(dest)}
            style={{
              background: '#E8272A', color: '#fff', borderRadius: 11, padding: '16px 40px',
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
              borderRadius: 11, padding: '15px 34px', fontSize: 15, fontWeight: 500,
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            See Features
          </motion.button>
        </motion.div>

        {/* ET pill */}
        <motion.div variants={V.fadeUp} style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(17,17,24,0.8)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 100, padding: '8px 20px', fontSize: 12, color: '#9A9AAD',
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}
        style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
          <ChevronDown size={22} color="#9A9AAD" />
        </motion.div>
      </motion.div>

      <style>{`
        @media (min-width: 1000px) {
          .hero-float-left,.hero-float-right,.hero-float-bottom { display: flex !important; }
        }
        @media (max-width: 600px) { nav { padding: 0 20px !important; } }
      `}</style>
    </section>
  )
}

// ─── FEATURES GRID ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 1, icon: Heart, iconColor: '#10B981', iconBg: 'rgba(16,185,129,0.12)',
    badge: 'Low · ~2 hrs', badgeColor: '#10B981', badgeBg: 'rgba(16,185,129,0.12)',
    title: 'Money Health Score',
    desc: '12 questions across 6 dimensions produce a score out of 100 with a radar chart and AI-written action plan — your financial vitals in 5 minutes.',
    tags: ['Radar Chart', 'React Countup', 'Score /100', 'AI Plan'], etRss: false, wide: false,
  },
  {
    id: 2, icon: Clock, iconColor: '#F59E0B', iconBg: 'rgba(245,158,11,0.12)',
    badge: 'Medium · ~3 hrs', badgeColor: '#F59E0B', badgeBg: 'rgba(245,158,11,0.12)',
    title: 'FIRE Path Planner',
    desc: "Enter income, expenses, savings and life goals. Artha builds a month-by-month roadmap with SIP targets, asset allocation shifts and insurance gap analysis — grounded in today's ET repo rate & CPI data.",
    tags: ['Live ET RSS', 'Timeline Chart', 'Donut Chart', 'SIP Calculator'], etRss: true, wide: true,
  },
  {
    id: 3, icon: FileText, iconColor: '#F59E0B', iconBg: 'rgba(245,158,11,0.12)',
    badge: 'Medium · ~3 hrs', badgeColor: '#F59E0B', badgeBg: 'rgba(245,158,11,0.12)',
    title: 'Tax Wizard',
    desc: 'Upload Form 16 or enter manually. Old vs New regime comparison, every missed deduction (80C, 80D, NPS, HRA) surfaced — using Budget 2025 rules pulled live from ET.',
    tags: ['PDF Upload', 'Live ET RSS', 'Old vs New', '80C / 80D / NPS'], etRss: true, wide: true,
  },
  {
    id: 4, icon: BarChart3, iconColor: '#EF4444', iconBg: 'rgba(239,68,68,0.12)',
    badge: 'High · ~4 hrs', badgeColor: '#EF4444', badgeBg: 'rgba(239,68,68,0.12)',
    title: 'MF Portfolio X-Ray',
    desc: 'Upload your CAMS/KFintech PDF. True XIRR, fund overlap detection, expense ratio drag and a full rebalancing plan — in under 10 seconds.',
    tags: ['XIRR · pyxirr', 'Overlap Analysis', 'CAMS PDF', 'Expense Ratio'], etRss: false, wide: false,
  },
  {
    id: 5, icon: Users, iconColor: '#10B981', iconBg: 'rgba(16,185,129,0.12)',
    badge: 'Low · ~2 hrs', badgeColor: '#10B981', badgeBg: 'rgba(16,185,129,0.12)',
    title: "Couple's Money Planner",
    desc: "India's first AI joint financial planner. Optimize HRA claims, route 80C investments through the right bracket, and build a combined net worth projection — both incomes, one plan.",
    tags: ['Dual Income', 'HRA Optimizer', 'Joint Net Worth', '80C Routing'], etRss: false, wide: false,
  },
]

function FeatureCard({ feature, delay }) {
  const [hovered, setHovered] = useState(false)
  const Icon = feature.icon
  return (
    <Reveal delay={delay} style={{ gridColumn: feature.wide ? 'span 2' : 'span 1' }}>
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
          position: 'relative', overflow: 'hidden', cursor: 'default',
          transition: 'border-color 0.3s',
        }}
      >
        <motion.div animate={{ scaleX: hovered ? 1 : 0 }} transition={{ duration: 0.32 }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${feature.iconColor} 30%, transparent)`,
            transformOrigin: 'left', borderRadius: '22px 22px 0 0',
          }}
        />
        <span style={{
          position: 'absolute', bottom: 8, right: 20,
          fontFamily: "'Playfair Display', serif", fontSize: 88, fontWeight: 900,
          color: hovered ? 'rgba(232,39,42,0.04)' : 'rgba(255,255,255,0.025)',
          lineHeight: 1, userSelect: 'none', pointerEvents: 'none', transition: 'color 0.4s',
        }}>
          {String(feature.id).padStart(2, '0')}
        </span>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <motion.div whileHover={{ scale: 1.08, rotate: 4 }}
            style={{ width: 50, height: 50, borderRadius: 14, background: feature.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={22} color={feature.iconColor} strokeWidth={2} />
          </motion.div>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
            padding: '4px 12px', borderRadius: 100, background: feature.badgeBg, color: feature.badgeColor,
          }}>
            {feature.badge}
          </span>
        </div>
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
        <h3 style={{ fontSize: 21, fontWeight: 700, marginBottom: 10, lineHeight: 1.2 }}>{feature.title}</h3>
        <p style={{ fontSize: 14, color: '#9A9AAD', lineHeight: 1.7, marginBottom: 22 }}>{feature.desc}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {feature.tags.map((t) => (
            <span key={t} style={{
              fontSize: 11, fontWeight: 500, color: '#9A9AAD',
              background: '#18181F', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 7, padding: '4px 11px',
            }}>{t}</span>
          ))}
        </div>
      </motion.div>
    </Reveal>
  )
}

function FeaturesSection() {
  return (
    <section id="features" style={{ padding: '30px 48px 110px', maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ marginBottom: 56 }}>
        <Reveal>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#E8272A', marginBottom: 14 }}>
            Five Modules
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 3.8vw, 48px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.5px', marginBottom: 16 }}>
            Everything a financial advisor<br />would charge ₹25,000 for.
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p style={{ fontSize: 16, color: '#9A9AAD', lineHeight: 1.7, maxWidth: 500 }}>
            Five AI-powered modules — each with real math, live ET market data, and personalized advice. All free.
          </p>
        </Reveal>
      </div>
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
        initial="hidden" whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={V.stagger(0.1)}
      >
        {FEATURES.map((f, i) => <FeatureCard key={f.id} feature={f} delay={i * 0.08} />)}
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

// ─── THE PROBLEM SECTION ────────────────────────────────────────────────────
function ProblemSection() {
  const lines = [
    { num: '95%', unit: '', text: 'of Indians have no financial plan.', color: '#E8272A' },
    { num: '₹25', unit: 'K+', text: 'per year is what a human advisor charges.', color: '#F0F0F5' },
    { num: '80%', unit: '', text: 'of salaried Indians choose the wrong tax regime.', color: '#F59E0B' },
    { num: '3', unit: ' of 4', text: 'mutual fund investors don\'t know their real returns.', color: '#F0F0F5' },
  ]

  return (
    <section id="problem" style={{
      background: '#0A0A0F',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '96px 48px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: 'linear-gradient(180deg, transparent, #E8272A 30%, #E8272A 70%, transparent)',
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Reveal>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#E8272A', marginBottom: 48 }}>
            The Problem
          </p>
        </Reveal>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {lines.map((l, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div
                onMouseEnter={e => e.currentTarget.style.paddingLeft = '12px'}
                onMouseLeave={e => e.currentTarget.style.paddingLeft = '0px'}
                style={{
                  display: 'flex', alignItems: 'baseline', gap: 20,
                  padding: '28px 0', paddingLeft: 0,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  transition: 'padding-left 0.3s ease',
                }}
              >
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(36px, 4.5vw, 60px)', fontWeight: 800,
                  color: l.color, lineHeight: 1, minWidth: 120,
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}>
                  {l.num}<span style={{ fontSize: '0.5em', fontWeight: 600 }}>{l.unit}</span>
                </span>
                <span style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.15)', flexShrink: 0, marginBottom: 8 }} />
                <p style={{
                  fontSize: 'clamp(15px, 1.8vw, 20px)',
                  color: '#C8C8D0', fontWeight: 400, lineHeight: 1.4,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {l.text}
                </p>
                <span style={{
                  marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.12)',
                  fontFamily: 'monospace', flexShrink: 0,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.5}>
          <div style={{ marginTop: 56, display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ width: 3, background: '#E8272A', borderRadius: 2, alignSelf: 'stretch', flexShrink: 0, minHeight: 60 }} />
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(18px, 2.5vw, 26px)',
              fontWeight: 600, fontStyle: 'italic',
              color: '#F0F0F5', lineHeight: 1.5,
              maxWidth: 680,
            }}>
              "The difference between a good financial decision and a bad one is rarely knowledge.
              It's access. Artha closes that gap."
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ─── CTA SECTION ─────────────────────────────────────────────────────────────
function CTASection() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const dest = user ? '/dashboard' : '/auth'

  return (
    <section id="cta" style={{
      padding: '100px 48px',
      position: 'relative', overflow: 'hidden',
      background: '#111118',
      borderTop: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 700, height: 400, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(232,39,42,0.1) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center' }}>
          <Reveal>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#E8272A', marginBottom: 18 }}>
              Start Now — It's Free
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(34px, 5vw, 60px)', fontWeight: 900,
              lineHeight: 1.06, letterSpacing: '-1.5px', marginBottom: 18,
            }}>
              95% of Indians deserve<br />the advice the top 5% get.
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
              onClick={() => navigate(dest)}
              style={{
                background: '#E8272A', color: '#fff', borderRadius: 13, padding: '18px 56px',
                fontSize: 18, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: 10,
                boxShadow: '0 8px 40px rgba(232,39,42,0.38)',
              }}
            >
              Open Dashboard <ArrowRight size={20} />
            </motion.button>
            <p style={{ fontSize: 13, color: '#9A9AAD', marginTop: 16 }}>
              Takes 5 minutes · Completely free
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ─── FOOTER — rich contact footer ─────────────────────────────────────────────
function Footer() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const socials = [
    {
      label: 'LinkedIn',
      href: 'https://linkedin.com/in/artha-ai',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      label: 'Instagram',
      href: 'https://instagram.com/artha.ai',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
    {
      label: 'WhatsApp',
      href: 'https://wa.me/919876543210',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a9.87 9.87 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      label: 'Facebook',
      href: 'https://facebook.com/arthaai',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ]

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'The Problem', href: '#problem' },
    { label: 'Dashboard', action: () => navigate(user ? '/dashboard' : '/auth') },
  ]

  return (
    <footer style={{
      background: '#0A0A0F',
      borderTop: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{
        maxWidth: 1180, margin: '0 auto',
        padding: '64px 48px 48px',
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
        gap: 48,
      }}>
        <div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px',
            marginBottom: 14,
          }}>
            Artha<span style={{ color: '#E8272A' }}>.</span>
          </div>
          <p style={{ fontSize: 14, color: '#9A9AAD', lineHeight: 1.7, maxWidth: 320, marginBottom: 24 }}>
            India's AI-powered personal finance mentor. Making financial planning as
            accessible as checking WhatsApp — free for every Indian.
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(232,39,42,0.08)', border: '1px solid rgba(232,39,42,0.18)',
            borderRadius: 20, padding: '5px 14px',
            fontSize: 11, fontWeight: 600, color: '#E8272A', letterSpacing: '0.5px',
          }}>
            <motion.span
              style={{ width: 5, height: 5, borderRadius: '50%', background: '#E8272A', display: 'inline-block' }}
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
            />
            ET × AI Hackathon 2025
          </div>
        </div>

        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#9A9AAD', marginBottom: 20 }}>
            Navigate
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {links.map((l) => (
              l.action ? (
                <motion.button key={l.label} whileHover={{ x: 4, color: '#F0F0F5' }}
                  onClick={l.action}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14, color: '#9A9AAD', fontFamily: 'Inter, sans-serif', padding: 0, transition: 'color 0.2s' }}>
                  {l.label}
                </motion.button>
              ) : (
                <motion.a key={l.label} href={l.href} whileHover={{ x: 4, color: '#F0F0F5' }}
                  style={{ fontSize: 14, color: '#9A9AAD', transition: 'color 0.2s' }}>
                  {l.label}
                </motion.a>
              )
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#9A9AAD', marginBottom: 20 }}>
            Connect
          </p>
          <a href="mailto:hello@artha.money"
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#9A9AAD', fontSize: 14, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#F0F0F5'}
            onMouseLeave={e => e.currentTarget.style.color = '#9A9AAD'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
            </svg>
            hello@artha.money
          </a>
          <a href="https://wa.me/919876543210"
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: '#9A9AAD', fontSize: 14, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#F0F0F5'}
            onMouseLeave={e => e.currentTarget.style.color = '#9A9AAD'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#25D366' }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a9.87 9.87 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            </svg>
            <span style={{ color: '#9A9AAD' }}>+91 98765 43210</span>
          </a>
          <div style={{ display: 'flex', gap: 10 }}>
            {socials.map((s) => (
              <motion.a
                key={s.label} href={s.href} target="_blank" rel="noreferrer"
                title={s.label}
                whileHover={{ y: -3, background: 'rgba(232,39,42,0.15)', borderColor: 'rgba(232,39,42,0.3)' }}
                style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: '#18181F', border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#9A9AAD', transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#F0F0F5'}
                onMouseLeave={e => e.currentTarget.style.color = '#9A9AAD'}
              >
                {s.icon}
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '20px 48px',
        maxWidth: 1180, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, sans-serif' }}>
          © 2025 Artha. ET × AI Hackathon — Confidential Submission.
        </p>
        <p style={{
          fontSize: 13, color: 'rgba(255,255,255,0.25)',
          fontFamily: "'Playfair Display', serif", fontStyle: 'italic',
        }}>
          अर्थ — wealth, prosperity, purpose.
        </p>
      </div>
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
      <ProblemSection />
      <CTASection />
      <Footer />
    </motion.div>
  )
}
