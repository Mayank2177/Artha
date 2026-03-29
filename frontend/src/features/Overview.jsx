// ─────────────────────────────────────────────────────────────────────────────
//  Overview — /dashboard (index route)
//  Stats · Quick Insights · Jump To feature cards
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { useAuth } from '../context/AuthContext'
import {
    Heart, Flame, FileText, BarChart3, Users,
    TrendingUp, IndianRupee, Wallet, ChevronRight,
} from 'lucide-react'

// We will build dynamic STATS and INSIGHTS from the API response

const FEATURES = [
    { path: '/dashboard/health', label: 'Money Health', icon: Heart, color: '#10B981', desc: '12-question financial vitals check' },
    { path: '/dashboard/fire', label: 'FIRE Planner', icon: Flame, color: '#F59E0B', desc: 'Build your retirement roadmap' },
    { path: '/dashboard/tax', label: 'Tax Wizard', icon: FileText, color: '#F59E0B', desc: 'Old vs New regime — find savings' },
    { path: '/dashboard/portfolio', label: 'Portfolio X-Ray', icon: BarChart3, color: '#EF4444', desc: 'True XIRR, overlap, rebalancing' },
    { path: '/dashboard/couple', label: "Couple's Planner", icon: Users, color: '#8B5CF6', desc: 'Joint HRA, 80C and net worth plan' },
]

export default function Overview() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const firstName = user?.name?.split(' ')[0] || 'there'

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    // Determine greeting based on time
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    useEffect(() => {
        if (!user?.email) return
        fetch(`http://localhost:8000/api/dashboard/${encodeURIComponent(user.email)}`)
            .then(res => res.json())
            .then(json => {
                setData(json)
                setLoading(false)
            })
            .catch(err => {
                console.error("Dashboard fetch failed", err)
                setLoading(false)
            })
    }, [user?.email])

    if (loading || !data) {
        return <div style={{ padding: 40, color: '#A0A0B0' }}>Loading your dashboard...</div>
    }

    // Build dynamic STATS array
    const dynamicStats = [
        { 
            label: 'Money Health Score', 
            value: data.stats.money_health_score || 0, 
            suffix: '/100', prefix: '', color: '#10B981', icon: Heart, change: '', up: true 
        },
        { 
            label: 'Net Worth', 
            value: data.stats.net_worth, 
            suffix: '', prefix: '₹', color: '#F0F0F5', icon: Wallet, change: 'Total tracked assets', up: true, loose: true 
        },
        { 
            label: 'Monthly Savings', 
            value: data.stats.monthly_savings, 
            suffix: '', prefix: '₹', color: '#F59E0B', icon: IndianRupee, change: 'Target SIP needed', up: true, loose: true  
        },
        { 
            label: 'Investments', 
            value: data.stats.investments, 
            suffix: '', prefix: '₹', color: '#10B981', icon: TrendingUp, change: `XIRR ${data.stats.xirr.toFixed(1)}%`, up: true, loose: true 
        },
    ]

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
                    {greeting}, {firstName}.
                </h1>
                <p style={{ fontSize: 13, color: '#9A9AAD' }}>
                    Your financial command center — last updated today.
                </p>
            </motion.div>

            {/* ── Stat cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
                {dynamicStats.map((s, i) => {
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
                                {s.loose ? (
                                    <>{s.prefix}{Math.round(s.value).toLocaleString()}{s.suffix}</>
                                ) : (
                                    <CountUp
                                        end={s.value} duration={1.4}
                                        decimals={s.value % 1 !== 0 ? 1 : 0}
                                        prefix={s.prefix}
                                        suffix={s.suffix}
                                        separator=","
                                        useEasing
                                    />
                                )}
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
                        {data.insights.map((ins, i) => (
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
