// ─────────────────────────────────────────────────────────────────────────────
//  ARTHA — Dashboard Shell
//  Sidebar navigation + Topbar + renders active feature panel
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Heart, Flame, FileText,
    BarChart3, Users, ArrowLeft, Bell, ChevronRight,
    TrendingUp, IndianRupee, Wallet, Activity,
} from 'lucide-react'
import CountUp from 'react-countup'

import MoneyHealth from '../features/MoneyHealth.jsx'
import FirePlanner from '../features/Fireplanner.jsx'
import TaxWizard from '../features/TaxWizard.jsx'
import PortfolioXRay from '../features/PortfolioXray.jsx'
import CouplePlanner from '../features/Coupleplanner.jsx'

// ─── NAV ITEMS ───────────────────────────────────────────────────────────────
const NAV = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: '#9A9AAD' },
    { id: 'health', label: 'Money Health', icon: Heart, color: '#10B981' },
    { id: 'fire', label: 'FIRE Planner', icon: Flame, color: '#F59E0B' },
    { id: 'tax', label: 'Tax Wizard', icon: FileText, color: '#F59E0B' },
    { id: 'portfolio', label: 'Portfolio X-Ray', icon: BarChart3, color: '#EF4444' },
    { id: 'couple', label: "Couple's Planner", icon: Users, color: '#8B5CF6' },
]

// ─── OVERVIEW CARDS ──────────────────────────────────────────────────────────
const OVERVIEW_STATS = [
    { label: 'Money Health Score', value: 72, suffix: '/100', color: '#10B981', icon: Heart, change: '+4 pts this month', up: true },
    { label: 'Net Worth', value: 18.4, suffix: 'L', color: '#F0F0F5', icon: Wallet, change: '₹1.2L growth YTD', up: true },
    { label: 'Monthly Savings', value: 28500, suffix: '', color: '#F59E0B', icon: IndianRupee, change: '-₹2,000 vs last month', up: false },
    { label: 'Investments', value: 12.8, suffix: 'L', color: '#10B981', icon: TrendingUp, change: 'XIRR 14.2%', up: true },
]

const INSIGHTS = [
    { dot: '#EF4444', title: 'Biggest risk', sub: 'Emergency fund covers only 2 months — target is 6' },
    { dot: '#F59E0B', title: 'Tax opportunity', sub: '₹25,000 savings available via 80D before March 31' },
    { dot: '#10B981', title: 'FIRE on track', sub: 'SIP of ₹18,400/mo keeps retirement target at age 45' },
    { dot: '#8B5CF6', title: 'Portfolio overlap alert', sub: '3 funds hold identical top-10 stocks — consider merging' },
]

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive }) {
    const navigate = useNavigate()
    return (
        <aside style={{
            width: 228, flexShrink: 0,
            background: '#0D0D14',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column',
            position: 'fixed', top: 0, left: 0, height: '100vh',
            zIndex: 50,
        }}>
            {/* Logo */}
            <div style={{
                padding: '22px 24px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px',
                    display: 'flex', alignItems: 'center',
                }}>
                    <span style={{ color: '#F0F0F5' }}>Artha</span>
                    <motion.span
                        style={{ color: '#E8272A' }}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                    >.</motion.span>
                </div>
                <p style={{ fontSize: 10, color: '#9A9AAD', marginTop: 3, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    AI Money Mentor
                </p>
            </div>

            {/* Nav items */}
            <nav style={{ padding: '14px 12px', flex: 1 }}>
                <p style={{
                    fontSize: 9, color: '#9A9AAD', letterSpacing: '2px',
                    textTransform: 'uppercase', padding: '0 12px', marginBottom: 8,
                }}>
                    Modules
                </p>
                {NAV.map((item) => {
                    const Icon = item.icon
                    const isActive = active === item.id
                    return (
                        <motion.button
                            key={item.id}
                            onClick={() => setActive(item.id)}
                            whileHover={{ x: 3 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                width: '100%', padding: '10px 12px',
                                borderRadius: 10, marginBottom: 2,
                                background: isActive
                                    ? `${item.color}15`
                                    : 'transparent',
                                border: `1px solid ${isActive ? item.color + '30' : 'transparent'}`,
                                color: isActive ? '#F0F0F5' : '#9A9AAD',
                                fontSize: 13, fontWeight: isActive ? 600 : 400,
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                                fontFamily: 'Inter, sans-serif',
                            }}
                        >
                            <div style={{
                                width: 28, height: 28, borderRadius: 7,
                                background: isActive ? `${item.color}20` : 'rgba(255,255,255,0.04)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'background 0.2s',
                            }}>
                                <Icon size={14} color={isActive ? item.color : '#9A9AAD'} strokeWidth={2} />
                            </div>
                            {item.label}
                            {isActive && (
                                <motion.div
                                    layoutId="sidebarIndicator"
                                    style={{
                                        marginLeft: 'auto', width: 5, height: 5,
                                        borderRadius: '50%', background: item.color,
                                    }}
                                />
                            )}
                        </motion.button>
                    )
                })}
            </nav>

            {/* Back to landing */}
            <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <motion.button
                    whileHover={{ x: -2 }}
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        color: '#9A9AAD', fontSize: 12, fontWeight: 500,
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '8px 12px', borderRadius: 8, width: '100%',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'color 0.2s',
                    }}
                >
                    <ArrowLeft size={14} /> Back to Home
                </motion.button>
                <div style={{
                    margin: '12px 12px 0',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: 'linear-gradient(135deg, #E8272A, #F59E0B)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#fff',
                    }}>A</div>
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#F0F0F5' }}>Arjun Mehta</p>
                        <p style={{ fontSize: 10, color: '#9A9AAD' }}>Mumbai · 32 yrs</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}

// ─── TOPBAR ──────────────────────────────────────────────────────────────────
function Topbar({ active }) {
    const item = NAV.find(n => n.id === active)
    return (
        <header style={{
            height: 56, background: '#08080E',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky', top: 0, zIndex: 40,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {item && <item.icon size={15} color={item.color} strokeWidth={2} />}
                <span style={{ fontSize: 14, fontWeight: 600, color: '#F0F0F5' }}>{item?.label ?? 'Dashboard'}</span>
                <ChevronRight size={13} color="#9A9AAD" />
                <span style={{ fontSize: 12, color: '#9A9AAD' }}>Arjun Mehta</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(232,39,42,0.1)',
                    border: '1px solid rgba(232,39,42,0.2)',
                    borderRadius: 20, padding: '4px 12px',
                }}>
                    <motion.span
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8272A', display: 'inline-block' }}
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                    />
                    <span style={{ fontSize: 10, color: '#E8272A', fontWeight: 700, letterSpacing: '0.8px' }}>
                        ET LIVE
                    </span>
                </div>
                <motion.button
                    whileHover={{ background: 'rgba(255,255,255,0.06)' }}
                    style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#9A9AAD', cursor: 'pointer',
                        position: 'relative',
                    }}
                >
                    <Bell size={14} />
                    <span style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#E8272A',
                    }} />
                </motion.button>
            </div>
        </header>
    )
}

// ─── OVERVIEW PANEL ───────────────────────────────────────────────────────────
function Overview({ setActive }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ padding: '28px 28px 40px' }}
        >
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px',
                    marginBottom: 4,
                }}>
                    Good morning, Arjun.
                </h1>
                <p style={{ fontSize: 13, color: '#9A9AAD' }}>
                    Here's your financial command center — last updated today.
                </p>
            </div>

            {/* Stat cards */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 14, marginBottom: 22,
            }}>
                {OVERVIEW_STATS.map((s, i) => {
                    const Icon = s.icon
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}
                            style={{
                                background: '#111118',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 16, padding: '20px',
                                position: 'relative', overflow: 'hidden',
                            }}
                        >
                            {/* Top accent line */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                background: `linear-gradient(90deg, ${s.color}, transparent)`,
                            }} />
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                <p style={{ fontSize: 11, color: '#9A9AAD', letterSpacing: '0.3px' }}>{s.label}</p>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 7,
                                    background: `${s.color}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={13} color={s.color} strokeWidth={2} />
                                </div>
                            </div>
                            <p style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: 30, fontWeight: 800,
                                color: s.color, lineHeight: 1,
                                fontVariantNumeric: 'tabular-nums',
                                marginBottom: 8,
                            }}>
                                <CountUp
                                    end={s.value} duration={1.4} decimals={s.suffix === 'L' ? 1 : 0}
                                    prefix={s.suffix === '' && s.value > 999 ? '₹' : ''}
                                    separator=","
                                    suffix={s.suffix}
                                    useEasing
                                />
                            </p>
                            <p style={{
                                fontSize: 11,
                                color: s.up ? '#10B981' : '#EF4444',
                            }}>
                                {s.up ? '↑' : '↓'} {s.change}
                            </p>
                        </motion.div>
                    )
                })}
            </div>

            {/* Insights + Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                {/* Insights */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    style={{
                        background: '#111118',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 16, padding: '22px',
                    }}
                >
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#9A9AAD', marginBottom: 16, letterSpacing: '0.5px' }}>
                        QUICK INSIGHTS
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {INSIGHTS.map((ins, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 + i * 0.07 }}
                                style={{
                                    display: 'flex', gap: 12, alignItems: 'flex-start',
                                    padding: '12px 14px',
                                    background: '#18181F',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: 10,
                                }}
                            >
                                <div style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: ins.dot, flexShrink: 0, marginTop: 5,
                                }} />
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{ins.title}</p>
                                    <p style={{ fontSize: 12, color: '#9A9AAD', lineHeight: 1.5 }}>{ins.sub}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Quick actions */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    style={{
                        background: '#111118',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 16, padding: '22px',
                    }}
                >
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#9A9AAD', marginBottom: 16, letterSpacing: '0.5px' }}>
                        JUMP TO
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {NAV.slice(1).map((item) => {
                            const Icon = item.icon
                            return (
                                <motion.button
                                    key={item.id}
                                    whileHover={{ x: 4, background: `${item.color}10` }}
                                    onClick={() => setActive(item.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '11px 13px',
                                        background: '#18181F',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: 10, cursor: 'pointer',
                                        color: '#F0F0F5', fontSize: 13, fontWeight: 500,
                                        textAlign: 'left', width: '100%',
                                        fontFamily: 'Inter, sans-serif',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    <div style={{
                                        width: 26, height: 26, borderRadius: 6,
                                        background: `${item.color}20`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Icon size={13} color={item.color} strokeWidth={2} />
                                    </div>
                                    {item.label}
                                    <ChevronRight size={12} color="#9A9AAD" style={{ marginLeft: 'auto' }} />
                                </motion.button>
                            )
                        })}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}

// ─── PANEL ROUTER ─────────────────────────────────────────────────────────────
function ActivePanel({ active, setActive }) {
    const panels = {
        overview: <Overview setActive={setActive} />,
        health: <MoneyHealth />,
        fire: <FirePlanner />,
        tax: <TaxWizard />,
        portfolio: <PortfolioXRay />,
        couple: <CouplePlanner />,
    }
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={active}
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
                {panels[active]}
            </motion.div>
        </AnimatePresence>
    )
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export default function Dashboard() {
    const [active, setActive] = useState('overview')
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
                background: '#08080E', minHeight: '100vh',
                display: 'flex',
                fontFamily: 'Inter, sans-serif',
                color: '#F0F0F5',
            }}
        >
            <Sidebar active={active} setActive={setActive} />
            <div style={{ marginLeft: 228, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Topbar active={active} />
                <main style={{ flex: 1, overflowY: 'auto' }}>
                    <ActivePanel active={active} setActive={setActive} />
                </main>
            </div>
        </motion.div>
    )
}