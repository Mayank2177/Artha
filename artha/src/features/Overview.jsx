// ─────────────────────────────────────────────────────────────────────────────
//  Overview — /dashboard (index route)
//  Stats · Quick Insights · Jump To feature cards
// ─────────────────────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import {
    Heart, Flame, FileText, BarChart3, Users,
    TrendingUp, IndianRupee, Wallet, ChevronRight,
} from 'lucide-react'

const STATS = [
    { label: 'Money Health Score', value: 72, suffix: '/100', prefix: '', color: '#10B981', icon: Heart, change: '+4 pts this month', up: true },
    { label: 'Net Worth', value: 18.4, suffix: 'L', prefix: '₹', color: '#F0F0F5', icon: Wallet, change: '₹1.2L growth YTD', up: true },
    { label: 'Monthly Savings', value: 28500, suffix: '', prefix: '₹', color: '#F59E0B', icon: IndianRupee, change: '−₹2,000 vs last month', up: false },
    { label: 'Investments', value: 12.8, suffix: 'L', prefix: '₹', color: '#10B981', icon: TrendingUp, change: 'XIRR 14.2%', up: true },
]

const INSIGHTS = [
    { dot: '#EF4444', title: 'Biggest risk', sub: 'Emergency fund covers only 2 months — target is 6' },
    { dot: '#F59E0B', title: 'Tax opportunity', sub: '₹25,000 savings available via 80D before March 31' },
    { dot: '#10B981', title: 'FIRE on track', sub: 'SIP of ₹18,400/mo keeps retirement target at age 45' },
    { dot: '#8B5CF6', title: 'Portfolio overlap alert', sub: '3 funds share identical top-10 stocks — consider merging' },
]

const FEATURES = [
    { path: '/dashboard/health', label: 'Money Health', icon: Heart, color: '#10B981', desc: '12-question financial vitals check' },
    { path: '/dashboard/fire', label: 'FIRE Planner', icon: Flame, color: '#F59E0B', desc: 'Build your retirement roadmap' },
    { path: '/dashboard/tax', label: 'Tax Wizard', icon: FileText, color: '#F59E0B', desc: 'Old vs New regime — find savings' },
    { path: '/dashboard/portfolio', label: 'Portfolio X-Ray', icon: BarChart3, color: '#EF4444', desc: 'True XIRR, overlap, rebalancing' },
    { path: '/dashboard/couple', label: "Couple's Planner", icon: Users, color: '#8B5CF6', desc: 'Joint HRA, 80C and net worth plan' },
]

export default function Overview() {
    const navigate = useNavigate()

    return (
        <div style={{ padding: '28px 28px 40px' }}>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                style={{ marginBottom: 28 }}
            >
                <h1 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4,
                }}>
                    Good morning, Arjun.
                </h1>
                <p style={{ fontSize: 13, color: '#9A9AAD' }}>
                    Your financial command center — last updated today.
                </p>
            </motion.div>

            {/* ── Stat cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
                {STATS.map((s, i) => {
                    const Icon = s.icon
                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07, duration: 0.45 }}
                            whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}
                            style={{
                                background: '#111118',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 16, padding: 20,
                                position: 'relative', overflow: 'hidden',
                                cursor: 'default',
                            }}
                        >
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
                                fontSize: 30, fontWeight: 800, color: s.color,
                                lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: 8,
                            }}>
                                <CountUp
                                    end={s.value} duration={1.4}
                                    decimals={s.suffix === 'L' ? 1 : 0}
                                    prefix={s.prefix}
                                    suffix={s.suffix}
                                    separator=","
                                    useEasing
                                />
                            </p>
                            <p style={{ fontSize: 11, color: s.up ? '#10B981' : '#EF4444' }}>
                                {s.up ? '↑' : '↓'} {s.change}
                            </p>
                        </motion.div>
                    )
                })}
            </div>

            {/* ── Insights + Jump to ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, marginBottom: 22 }}>

                {/* Insights */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        background: '#111118',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 16, padding: 22,
                    }}
                >
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#9A9AAD', marginBottom: 16, letterSpacing: '1px' }}>
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

                {/* Jump to features */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    style={{
                        background: '#111118',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 16, padding: 22,
                    }}
                >
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#9A9AAD', marginBottom: 16, letterSpacing: '1px' }}>
                        JUMP TO
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {FEATURES.map((f) => {
                            const Icon = f.icon
                            return (
                                <motion.button
                                    key={f.path}
                                    whileHover={{ x: 4, background: `${f.color}10`, borderColor: `${f.color}30` }}
                                    onClick={() => navigate(f.path)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '11px 13px',
                                        background: '#18181F',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: 10, cursor: 'pointer',
                                        color: '#F0F0F5', fontSize: 13, fontWeight: 500,
                                        textAlign: 'left', width: '100%',
                                        fontFamily: 'Inter, sans-serif',
                                        transition: 'background 0.2s, border-color 0.2s',
                                    }}
                                >
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 7,
                                        background: `${f.color}20`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Icon size={13} color={f.color} strokeWidth={2} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{f.label}</p>
                                        <p style={{ fontSize: 10, color: '#9A9AAD', marginTop: 1 }}>{f.desc}</p>
                                    </div>
                                    <ChevronRight size={12} color="#9A9AAD" style={{ flexShrink: 0 }} />
                                </motion.button>
                            )
                        })}
                    </div>
                </motion.div>
            </div>

            {/* ── Feature grid ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                style={{
                    background: '#111118',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, padding: 22,
                }}
            >
                <p style={{ fontSize: 11, fontWeight: 600, color: '#9A9AAD', marginBottom: 18, letterSpacing: '1px' }}>
                    ALL MODULES
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                    {FEATURES.map((f, i) => {
                        const Icon = f.icon
                        return (
                            <motion.button
                                key={f.path}
                                initial={{ opacity: 0, scale: 0.94 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + i * 0.06 }}
                                whileHover={{ y: -4, borderColor: `${f.color}40`, boxShadow: `0 12px 32px rgba(0,0,0,0.4)` }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => navigate(f.path)}
                                style={{
                                    background: '#18181F',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 14, padding: '18px 14px',
                                    cursor: 'pointer', textAlign: 'center',
                                    fontFamily: 'Inter, sans-serif',
                                    transition: 'border-color 0.2s, box-shadow 0.2s',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                                }}
                            >
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: `${f.color}18`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={20} color={f.color} strokeWidth={2} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#F0F0F5', marginBottom: 3, lineHeight: 1.3 }}>{f.label}</p>
                                    <p style={{ fontSize: 10, color: '#9A9AAD', lineHeight: 1.4 }}>{f.desc}</p>
                                </div>
                                <div style={{
                                    fontSize: 10, fontWeight: 700, color: f.color,
                                    background: `${f.color}15`, border: `1px solid ${f.color}30`,
                                    borderRadius: 20, padding: '2px 10px', letterSpacing: '0.5px',
                                }}>
                                    Open →
                                </div>
                            </motion.button>
                        )
                    })}
                </div>
            </motion.div>

        </div>
    )
}
