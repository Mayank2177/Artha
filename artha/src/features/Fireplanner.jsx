// ─────────────────────────────────────────────────────────────────────────────
//  FEATURE 02 — FIRE Path Planner
//  Layout : matches uploaded HTML reference (sticky left panel, right results)
//  Theme  : Artha dashboard dark (#08080E bg, #111118 surface, #E8272A accent)
//  Fonts  : Inter (body) + Playfair Display (headings) — same as rest of app
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

// ─── ARTHA DESIGN TOKENS ─────────────────────────────────────────────────────
const T = {
    bg: '#08080E',
    surface: '#111118',
    surface2: '#18181F',
    border: 'rgba(255,255,255,0.07)',
    borderHi: 'rgba(255,255,255,0.12)',
    red: '#E8272A',
    redDim: 'rgba(232,39,42,0.12)',
    redGlow: 'rgba(232,39,42,0.25)',
    green: '#10B981',
    greenDim: 'rgba(16,185,129,0.12)',
    amber: '#F59E0B',
    amberDim: 'rgba(245,158,11,0.12)',
    blue: '#3B82F6',
    blueDim: 'rgba(59,130,246,0.12)',
    danger: '#EF4444',
    dangerDim: 'rgba(239,68,68,0.12)',
    text: '#F0F0F5',
    muted: '#9A9AAD',
}

const GOAL_TYPES = ['Home Purchase', 'Child Education', 'Retirement', 'Wedding', 'Vehicle', 'Travel', 'Business', 'Other']
const GOAL_COLORS = ['#E8272A', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmtINR(n) {
    if (!n || isNaN(n) || n === 0) return '₹0'
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr'
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1) + ' L'
    return '₹' + Math.round(n).toLocaleString('en-IN')
}
function calcFV(pv, r, n) { return pv * Math.pow(1 + r, n) }
function calcSIP(fv, r, n) {
    const mr = r / 12, mo = n * 12
    if (mo <= 0 || mr <= 0) return 0
    return fv * mr / (Math.pow(1 + mr, mo) - 1)
}

// ─── CORE MATH ────────────────────────────────────────────────────────────────
function calcAll(form, goals, market) {
    const age = +form.age || 0
    const retireAge = +form.retireAge || 60
    const income = +form.income || 0
    const expenses = +form.expenses || 0
    const savings = +form.savings || 0
    const insurance = +form.insurance || 0
    const inflation = (market.cpi || 5) / 100
    const cagr = 0.12
    const curYear = new Date().getFullYear()

    const surplus = income - expenses
    const emergency = expenses * 6
    const insuranceGap = Math.max(0, income * 12 * 10 - insurance)
    const equity = Math.max(0, Math.min(100, 100 - age))
    const yearsToRetire = Math.max(retireAge - age, 1)
    const fireCorpus = expenses * 12 * 25

    const processedGoals = goals.map((g, i) => {
        const yearsLeft = g.year ? Math.max(+g.year - curYear, 0) : 0
        const amount = +g.amount || 0
        const corpus = yearsLeft > 0 ? calcFV(amount, inflation, yearsLeft) : amount
        const sip = yearsLeft > 0 ? calcSIP(corpus, cagr, yearsLeft) : 0
        const fvSav = calcFV(savings * 0.1, cagr, yearsLeft)
        const gap = corpus - fvSav
        return { ...g, yearsLeft, corpus, sip, gap, color: GOAL_COLORS[i % GOAL_COLORS.length] }
    })

    const totalSIP = processedGoals.reduce((s, g) => s + g.sip, 0)

    const debt = Math.round((100 - equity) * 0.5)
    const gold = Math.round((100 - equity) * 0.3)
    const liquid = Math.max(0, 100 - equity - debt - gold)
    const allocation = [
        { name: 'Equity', value: equity, color: T.green },
        { name: 'Debt', value: debt, color: T.blue },
        { name: 'Gold', value: gold, color: T.amber },
        { name: 'Liquid', value: liquid, color: T.muted },
    ]

    const years = Math.max(yearsToRetire, 10)
    const growthData = Array.from({ length: years + 1 }, (_, i) => {
        const c = calcFV(savings, cagr, i)
        const s = totalSIP > 0
            ? totalSIP * (Math.pow(1 + cagr / 12, i * 12) - 1) / (cagr / 12)
            : 0
        return { year: String(curYear + i), value: Math.round(c + s) }
    })

    return {
        surplus, emergency, insuranceGap, equity, yearsToRetire,
        fireCorpus, processedGoals, totalSIP, allocation, growthData,
        age, retireAge, income, expenses, savings, insurance,
    }
}

// ─── INPUT STYLE ─────────────────────────────────────────────────────────────
const INP = {
    background: T.surface2,
    border: `1px solid ${T.border}`,
    color: T.text,
    padding: '9px 12px',
    borderRadius: 7,
    fontFamily: 'Inter, sans-serif',
    fontSize: 13,
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
function SLabel({ children }) {
    return (
        <p style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '2px',
            textTransform: 'uppercase', color: T.muted,
            marginBottom: 14, paddingBottom: 8,
            borderBottom: `1px solid ${T.border}`,
            fontFamily: 'Inter, sans-serif',
        }}>
            {children}
        </p>
    )
}

// ─── METRIC CARD ─────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, accentColor = T.text }) {
    return (
        <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 12, padding: 16,
            position: 'relative', overflow: 'hidden',
        }}>
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${accentColor}60, transparent)`,
            }} />
            <p style={{ fontSize: 9, letterSpacing: '1.8px', textTransform: 'uppercase', color: T.muted, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                {label}
            </p>
            <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20, fontWeight: 700,
                color: accentColor, lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
            }}>
                {value}
            </p>
            {sub && <p style={{ fontSize: 11, color: T.muted, marginTop: 5, fontFamily: 'Inter, sans-serif' }}>{sub}</p>}
        </div>
    )
}

// ─── GOAL CARD ────────────────────────────────────────────────────────────────
function GoalCard({ goal, index, onChange, onRemove }) {
    const color = GOAL_COLORS[index % GOAL_COLORS.length]
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden', marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
            transition={{ duration: 0.22 }}
            style={{
                background: T.surface2,
                border: `1px solid ${color}25`,
                borderRadius: 10, padding: 14, marginBottom: 10,
                transition: 'border-color 0.2s',
            }}
            whileHover={{ borderColor: color + '50' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{
                    fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase',
                    padding: '3px 9px', borderRadius: 20,
                    background: color + '18', color, fontWeight: 700,
                    fontFamily: 'Inter, sans-serif',
                }}>
                    {goal.type}
                </span>
                <motion.button
                    whileHover={{ color: T.danger }}
                    onClick={() => onRemove(goal.id)}
                    style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 18, lineHeight: 1, transition: 'color 0.2s' }}
                >×</motion.button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                    { label: 'Type', field: 'type', isSelect: true },
                    { label: 'Amount (₹)', field: 'amount', isSelect: false },
                    { label: 'Target Year', field: 'year', isSelect: false },
                ].map(({ label, field, isSelect }) => (
                    <div key={field}>
                        <p style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.muted, marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>
                            {label}
                        </p>
                        {isSelect ? (
                            <select
                                value={goal[field]}
                                onChange={e => onChange(goal.id, field, e.target.value)}
                                style={{ ...INP, fontSize: 12 }}
                                onFocus={e => { e.target.style.borderColor = color }}
                                onBlur={e => { e.target.style.borderColor = T.border }}
                            >
                                {GOAL_TYPES.map(t => (
                                    <option key={t} style={{ background: T.surface2, color: T.text }}>{t}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="number" value={goal[field]}
                                placeholder={field === 'year' ? String(new Date().getFullYear() + 8) : '2000000'}
                                onChange={e => onChange(goal.id, field, e.target.value)}
                                style={{ ...INP, fontSize: 12 }}
                                onFocus={e => { e.target.style.borderColor = color }}
                                onBlur={e => { e.target.style.borderColor = T.border }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </motion.div>
    )
}

// ─── TIMELINE ─────────────────────────────────────────────────────────────────
function Timeline({ data }) {
    const curYear = new Date().getFullYear()
    const retireYear = curYear + data.yearsToRetire
    const goalYears = data.processedGoals.map(g => +g.year).filter(y => y > curYear)
    const allY = [...goalYears, retireYear].filter(Boolean)
    if (allY.length === 0) return null

    const minY = curYear
    const maxY = Math.max(...allY) + 1
    const range = maxY - minY || 1
    const pct = y => Math.min(97, Math.max(3, ((y - minY) / range) * 100))

    return (
        <div style={{ overflowX: 'auto' }}>
            <div style={{ position: 'relative', height: 76, minWidth: 560, marginTop: 8 }}>
                {/* Base track */}
                <div style={{
                    position: 'absolute', top: 26, left: 0, right: 0, height: 2,
                    background: T.border, borderRadius: 1,
                }} />
                {/* Animated fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '35%' }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: 'absolute', top: 26, left: 0, height: 2,
                        background: `linear-gradient(90deg, ${T.green}, ${T.amber})`,
                        borderRadius: 1,
                    }}
                />

                {/* Goal markers */}
                {data.processedGoals.map((g, i) => {
                    const y = +g.year
                    if (!y || y <= curYear) return null
                    const above = i % 2 === 0
                    return (
                        <motion.div
                            key={g.id}
                            initial={{ opacity: 0, y: above ? -8 : 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            style={{
                                position: 'absolute', top: 0,
                                left: `${pct(y)}%`,
                                transform: 'translateX(-50%)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                            }}
                        >
                            {above && (
                                <div style={{ marginBottom: 4, textAlign: 'center' }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: g.color, whiteSpace: 'nowrap', lineHeight: 1.2 }}>{g.type}</p>
                                    <p style={{ fontSize: 9, color: T.muted, whiteSpace: 'nowrap' }}>{fmtINR(g.corpus)}</p>
                                </div>
                            )}
                            <motion.div
                                whileHover={{ scale: 1.5 }}
                                style={{
                                    width: 12, height: 12, borderRadius: '50%',
                                    background: g.color, border: `2px solid ${T.bg}`,
                                    boxShadow: `0 0 8px ${g.color}66`, zIndex: 2,
                                }}
                            />
                            {!above && (
                                <div style={{ marginTop: 4, textAlign: 'center' }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: g.color, whiteSpace: 'nowrap', lineHeight: 1.2 }}>{g.type}</p>
                                    <p style={{ fontSize: 9, color: T.muted, whiteSpace: 'nowrap' }}>{fmtINR(g.corpus)}</p>
                                </div>
                            )}
                            <p style={{
                                position: 'absolute',
                                top: above ? 'auto' : -16,
                                bottom: above ? -16 : 'auto',
                                fontSize: 9, color: T.muted, fontFamily: 'monospace', whiteSpace: 'nowrap',
                            }}>
                                {y}
                            </p>
                        </motion.div>
                    )
                })}

                {/* FIRE marker */}
                {data.age > 0 && data.yearsToRetire > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{
                            position: 'absolute', top: 0,
                            left: `${pct(retireYear)}%`,
                            transform: 'translateX(-50%)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                        }}
                    >
                        <div style={{ marginBottom: 4, textAlign: 'center' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: T.amber, whiteSpace: 'nowrap', lineHeight: 1.2 }}>FIRE</p>
                            <p style={{ fontSize: 9, color: T.muted, whiteSpace: 'nowrap' }}>{fmtINR(data.fireCorpus)}</p>
                        </div>
                        <div style={{
                            width: 14, height: 14, borderRadius: '50%',
                            background: T.amber, border: `2px solid ${T.bg}`,
                            boxShadow: `0 0 10px rgba(245,158,11,0.6)`, zIndex: 2,
                        }} />
                        <p style={{ position: 'absolute', bottom: -16, fontSize: 9, color: T.muted, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                            {retireYear}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

// ─── AI PHASE CARD ─────────────────────────────────────────────────────────────
function PhaseCard({ iconColor, iconBg, emoji, title, children }) {
    return (
        <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, flexShrink: 0,
                }}>
                    {emoji}
                </div>
                <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 15, fontWeight: 700, color: T.text,
                }}>
                    {title}
                </p>
            </div>
            <div style={{ paddingLeft: 40, fontSize: 13.5, lineHeight: 1.75, color: '#C8C8D8', fontFamily: 'Inter, sans-serif' }}>
                {children}
            </div>
        </div>
    )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function FirePlanner() {
    const [form, setForm] = useState({
        age: '30', retireAge: '50',
        income: '120000', expenses: '65000',
        savings: '800000', insurance: '1500000',
    })
    const [goals, setGoals] = useState([])
    const [goalCount, setGoalCount] = useState(0)
    const [market, setMarket] = useState({ repo: 6.5, cpi: 4.8, nifty: '24,100', rawContext: '', loading: true })
    const [aiState, setAiState] = useState('idle')   // idle | thinking | done | error
    const [roadmap, setRoadmap] = useState(null)

    const data = useMemo(() => calcAll(form, goals, market), [form, goals, market])

    // ── Fetch ET RSS on mount ───────────────────────────────────────────────────
    useEffect(() => {
        async function fetchET() {
            try {
                const url = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms')
                const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
                const json = await res.json()
                const doc = new DOMParser().parseFromString(json.contents || '', 'text/xml')
                const items = Array.from(doc.querySelectorAll('item')).slice(0, 8)
                const txt = items.map(i => i.querySelector('title')?.textContent || '').join(' ')

                const repoM = txt.match(/repo\s+rate[^0-9]*([0-9]+\.?[0-9]*)\s*%/i)
                const cpiM = txt.match(/CPI[^0-9]*([0-9]+\.?[0-9]*)\s*%/i) || txt.match(/inflation[^0-9]*([0-9]+\.?[0-9]*)\s*%/i)
                const niftyM = txt.match(/Nifty[^0-9]*([0-9,]+)/i)

                setMarket({
                    repo: repoM ? parseFloat(repoM[1]) : 6.5,
                    cpi: cpiM ? parseFloat(cpiM[1]) : 4.8,
                    nifty: niftyM ? niftyM[1] : '24,100',
                    rawContext: items.slice(0, 5).map(i => i.querySelector('title')?.textContent || '').join('. '),
                    loading: false,
                })
            } catch {
                setMarket({ repo: 6.25, cpi: 4.6, nifty: '23,800', rawContext: 'RBI held repo rate steady. CPI easing.', loading: false })
            }
        }
        fetchET()
    }, [])

    function setF(k, v) { setForm(p => ({ ...p, [k]: v })) }

    function addGoal() {
        const id = goalCount + 1
        setGoalCount(id)
        setGoals(g => [...g, { id, type: 'Home Purchase', amount: '', year: String(new Date().getFullYear() + 8) }])
    }
    function updateGoal(id, k, v) { setGoals(g => g.map(item => item.id === id ? { ...item, [k]: v } : item)) }
    function removeGoal(id) { setGoals(g => g.filter(item => item.id !== id)) }

    // ── Generate roadmap via Anthropic API ────────────────────────────────────
    async function generateRoadmap() {
        if (!form.age || !form.income) return
        setAiState('thinking')
        setRoadmap(null)

        const goalsText = data.processedGoals.map(g =>
            `- ${g.type}: ₹${g.amount} in ${g.yearsLeft} yrs. Corpus: ${fmtINR(g.corpus)}. SIP: ${fmtINR(g.sip)}/mo. ${g.gap <= 0 ? 'Funded' : 'Gap: ' + fmtINR(g.gap)}`
        ).join('\n')

        const sys = `You are Artha, expert Indian FIRE advisor. Respond ONLY in valid JSON:
{"summary":"string","first6Months":["...","...","...","..."],"year1Changes":["...","...","..."],"priorityOrder":["..."],"riskFlags":["..."],"insuranceRecommendation":"string","taxMoves":["...","...","..."],"sipBreakdown":[{"goal":"name","amount":5000,"instrument":"ELSS/Index/etc"}],"assetShiftPlan":"string","monthlyBudgetAdvice":"string"}
No markdown, no text outside JSON.`

        const usr = `Profile: Age ${form.age}, Retire ${form.retireAge}, Income ₹${Number(form.income).toLocaleString('en-IN')}/mo, Expenses ₹${Number(form.expenses).toLocaleString('en-IN')}/mo, Surplus ₹${data.surplus.toLocaleString('en-IN')}/mo, Savings ₹${Number(form.savings).toLocaleString('en-IN')}, Insurance ₹${Number(form.insurance).toLocaleString('en-IN')}, Gap ₹${data.insuranceGap.toLocaleString('en-IN')}, Emergency ₹${data.emergency.toLocaleString('en-IN')}, Equity ${data.equity}%, FIRE Corpus ${fmtINR(data.fireCorpus)}, Total SIP ${fmtINR(data.totalSIP)}
Goals:\n${goalsText || '(none)'}
ET RSS — Repo ${market.repo}%, CPI ${market.cpi}%, Nifty ${market.nifty}. ${market.rawContext}
Generate complete actionable FIRE roadmap using Indian instruments (ELSS, NPS, PPF, SGB, Nifty index funds). Specify amounts.`

        try {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, system: sys, messages: [{ role: 'user', content: usr }] }),
            })
            const json = await res.json()
            const raw = json.content?.find(b => b.type === 'text')?.text || ''
            setRoadmap(JSON.parse(raw.replace(/```json|```/g, '').trim()))
            setAiState('done')
        } catch (e) {
            console.error(e)
            setAiState('error')
        }
    }

    const Lbl = ({ ch }) => (
        <p style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.muted, marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>
            {ch}
        </p>
    )

    const FInp = ({ label, id, placeholder, step = 1 }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Lbl ch={label} />
            <input
                type="number" value={form[id]} placeholder={placeholder} step={step}
                onChange={e => setF(id, e.target.value)}
                style={INP}
                onFocus={e => { e.target.style.borderColor = T.red }}
                onBlur={e => { e.target.style.borderColor = T.border }}
            />
        </div>
    )

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)', background: T.bg, color: T.text, fontFamily: 'Inter, sans-serif' }}>

            {/* ════════════════════════════════════
          LEFT PANEL — sticky form
      ════════════════════════════════════ */}
            <div style={{
                width: 380, flexShrink: 0,
                background: T.surface,
                borderRight: `1px solid ${T.border}`,
                padding: '24px 20px',
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 56px)',
                position: 'sticky',
                top: 56,
            }}>

                {/* ET RSS ticker bar */}
                <div style={{
                    display: 'flex', gap: 0,
                    marginBottom: 22,
                    background: T.surface2,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10, overflow: 'hidden',
                }}>
                    {[
                        { label: 'Repo Rate', val: market.loading ? '…' : `${market.repo}%`, color: T.green },
                        { label: 'CPI', val: market.loading ? '…' : `${market.cpi}%`, color: T.amber },
                        { label: 'Nifty 50', val: market.loading ? '…' : `₹${market.nifty}`, color: T.text },
                    ].map((item, i) => (
                        <div key={item.label} style={{
                            flex: 1, padding: '10px 12px',
                            borderRight: i < 2 ? `1px solid ${T.border}` : 'none',
                        }}>
                            <p style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.muted, marginBottom: 3 }}>
                                {item.label}
                            </p>
                            <p style={{
                                fontFamily: 'monospace', fontSize: 13,
                                color: market.loading ? T.muted : item.color,
                                fontStyle: market.loading ? 'italic' : 'normal',
                                fontVariantNumeric: 'tabular-nums',
                            }}>
                                {item.val}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Profile inputs ── */}
                <SLabel>Your Profile</SLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
                    <FInp label="Age" id="age" placeholder="30" step={1} />
                    <FInp label="Retire At Age" id="retireAge" placeholder="50" step={1} />
                    <FInp label="Monthly Income ₹" id="income" placeholder="100000" step={5000} />
                    <FInp label="Monthly Expenses ₹" id="expenses" placeholder="65000" step={5000} />
                    <FInp label="Existing Savings ₹" id="savings" placeholder="500000" step={50000} />
                    <FInp label="Insurance Cover ₹" id="insurance" placeholder="1000000" step={500000} />
                </div>

                {/* ── Life Goals ── */}
                <SLabel>Life Goals</SLabel>
                <AnimatePresence>
                    {goals.length === 0 && (
                        <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ fontSize: 12, color: T.muted, textAlign: 'center', padding: '8px 0 12px', fontStyle: 'italic' }}
                        >
                            No goals added yet
                        </motion.p>
                    )}
                    {goals.map((g, i) => (
                        <GoalCard key={g.id} goal={g} index={i} onChange={updateGoal} onRemove={removeGoal} />
                    ))}
                </AnimatePresence>

                {/* Add goal */}
                <motion.button
                    whileHover={{ borderColor: `${T.red}60`, color: T.text, background: T.redDim }}
                    onClick={addGoal}
                    style={{
                        width: '100%', padding: '10px',
                        background: 'transparent',
                        border: `1px dashed ${T.border}`,
                        color: T.muted, borderRadius: 8,
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                        fontSize: 13,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 0.2s',
                    }}
                >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Goal
                </motion.button>

                {/* Submit */}
                <motion.button
                    whileHover={aiState !== 'thinking' ? { boxShadow: `0 8px 28px ${T.redGlow}`, y: -1 } : {}}
                    whileTap={aiState !== 'thinking' ? { scale: 0.98 } : {}}
                    onClick={generateRoadmap}
                    disabled={aiState === 'thinking'}
                    style={{
                        width: '100%', padding: '13px', marginTop: 14,
                        background: aiState === 'thinking'
                            ? T.surface2
                            : `linear-gradient(135deg, ${T.red}, #C41E21)`,
                        border: `1px solid ${aiState === 'thinking' ? T.border : T.red}`,
                        color: aiState === 'thinking' ? T.muted : '#fff',
                        borderRadius: 10,
                        cursor: aiState === 'thinking' ? 'not-allowed' : 'pointer',
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 15, fontWeight: 700, letterSpacing: '0.3px',
                        transition: 'all 0.25s',
                        boxShadow: aiState === 'thinking' ? 'none' : `0 4px 18px ${T.redGlow}`,
                    }}
                >
                    {aiState === 'thinking' ? 'Generating Roadmap…' : 'Generate My FIRE Roadmap →'}
                </motion.button>
            </div>

            {/* ════════════════════════════════════
          RIGHT PANEL — live preview + results
      ════════════════════════════════════ */}
            <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>

                {/* ── 6 Metric cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                    <MetricCard
                        label="Monthly Surplus" sub="available to invest"
                        value={fmtINR(data.surplus)}
                        accentColor={data.surplus < 0 ? T.danger : T.green}
                    />
                    <MetricCard label="Emergency Fund" sub="6× monthly expenses" value={fmtINR(data.emergency)} accentColor={T.blue} />
                    <MetricCard
                        label="Insurance Gap" sub="10× income − existing"
                        value={fmtINR(data.insuranceGap)}
                        accentColor={data.insuranceGap > 0 ? T.amber : T.green}
                    />
                    <MetricCard label="Total SIP Needed" sub="across all goals" value={fmtINR(data.totalSIP)} accentColor={T.green} />
                    <MetricCard label="FIRE Corpus" sub="25× annual expenses" value={fmtINR(data.fireCorpus)} accentColor={T.amber} />
                    <MetricCard label="Recommended Equity" sub="100 − age rule" value={`${data.equity}%`} accentColor={T.text} />
                </div>

                {/* ── Goal analysis table ── */}
                <AnimatePresence>
                    {data.processedGoals.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{
                                background: T.surface, border: `1px solid ${T.border}`,
                                borderRadius: 12, marginBottom: 20, overflow: 'hidden',
                            }}
                        >
                            <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15 }}>Goal Analysis</span>
                                <span style={{ fontSize: 10, color: T.muted }}>live calculations</span>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: T.surface2 }}>
                                        {['Goal', 'In (yrs)', 'Corpus Needed', 'Monthly SIP', 'Status'].map(h => (
                                            <th key={h} style={{
                                                fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase',
                                                color: T.muted, padding: '9px 16px', textAlign: 'left',
                                                borderBottom: `1px solid ${T.border}`, fontFamily: 'Inter, sans-serif',
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.processedGoals.map((g, i) => {
                                        const sColor = g.gap <= 0 ? T.green : g.sip < data.surplus * 0.5 ? T.amber : T.danger
                                        const sText = g.gap <= 0 ? '✓ Funded' : g.sip > data.surplus ? '⚠ Underfunded' : '~ Feasible'
                                        return (
                                            <motion.tr
                                                key={g.id}
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.05 }}
                                                style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, transition: 'background 0.15s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = T.surface2 }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                            >
                                                <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 600, color: g.color }}>{g.type}</td>
                                                <td style={{ padding: '11px 16px', fontSize: 13, color: T.muted }}>{g.yearsLeft > 0 ? g.yearsLeft : '—'}</td>
                                                <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: 12, color: T.text, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(g.corpus)}</td>
                                                <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontSize: 12, color: T.green, fontVariantNumeric: 'tabular-nums' }}>{fmtINR(g.sip)}/mo</td>
                                                <td style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: sColor }}>{sText}</td>
                                            </motion.tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Charts row ── */}
                {+form.age > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

                        {/* Allocation */}
                        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
                            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, marginBottom: 14 }}>Asset Allocation</p>

                            {/* Segmented bar */}
                            <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10 }}>
                                {data.allocation.map(a => (
                                    <motion.div
                                        key={a.name}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${a.value}%` }}
                                        transition={{ duration: 0.7, ease: 'easeOut' }}
                                        style={{ background: a.color }}
                                    />
                                ))}
                            </div>

                            {/* Legend */}
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                                {data.allocation.map(a => (
                                    <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.muted }}>
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color }} />
                                        {a.name} {a.value}%
                                    </div>
                                ))}
                            </div>

                            {/* Donut */}
                            <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                    <Pie data={data.allocation} dataKey="value" innerRadius={36} outerRadius={56} strokeWidth={0} startAngle={90} endAngle={-270}>
                                        {data.allocation.map(a => <Cell key={a.name} fill={a.color} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 11, color: T.text }}
                                        formatter={(v, n) => [`${v}%`, n]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Growth projection */}
                        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
                            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, marginBottom: 14 }}>Savings Growth Projection</p>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={data.growthData}>
                                    <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="year" tickLine={false} axisLine={false}
                                        tick={{ fill: T.muted, fontSize: 10, fontFamily: 'Inter' }}
                                        interval={Math.floor(data.growthData.length / 5)}
                                    />
                                    <YAxis
                                        tickLine={false} axisLine={false}
                                        tick={{ fill: T.muted, fontSize: 10, fontFamily: 'Inter' }}
                                        tickFormatter={v => v >= 1e7 ? (v / 1e7).toFixed(1) + 'Cr' : (v / 1e5).toFixed(0) + 'L'}
                                    />
                                    <Tooltip
                                        contentStyle={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 11, color: T.text }}
                                        formatter={v => [fmtINR(v), 'Portfolio']}
                                    />
                                    <Line type="monotone" dataKey="value" stroke={T.red} strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* ── Timeline ── */}
                <AnimatePresence>
                    {data.processedGoals.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 22px', marginBottom: 20 }}
                        >
                            <SLabel>Goal Timeline</SLabel>
                            <Timeline data={data} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── AI Roadmap ── */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>

                    {/* Header */}
                    <div style={{
                        padding: '14px 20px', borderBottom: `1px solid ${T.border}`,
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: `linear-gradient(90deg, ${T.surface2}, ${T.surface})`,
                    }}>
                        <motion.div
                            animate={{ boxShadow: [`0 0 0 0 ${T.redDim}`, `0 0 0 6px rgba(232,39,42,0)`, `0 0 0 0 ${T.redDim}`] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ width: 8, height: 8, borderRadius: '50%', background: T.red, flexShrink: 0 }}
                        />
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15 }}>Artha AI Roadmap</span>
                        <div style={{
                            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                            background: T.redDim, border: `1px solid rgba(232,39,42,0.2)`,
                            borderRadius: 20, padding: '3px 10px',
                            fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: T.red,
                        }}>
                            <motion.span
                                style={{ width: 5, height: 5, borderRadius: '50%', background: T.red, display: 'inline-block' }}
                                animate={{ opacity: [1, 0.2, 1] }}
                                transition={{ duration: 1.4, repeat: Infinity }}
                            />
                            ET RSS · Groq LLaMA 3.3
                        </div>
                    </div>

                    <div style={{ padding: 20 }}>

                        {/* Idle */}
                        {aiState === 'idle' && (
                            <p style={{ color: T.muted, fontStyle: 'italic', fontSize: 14, textAlign: 'center', padding: '36px 20px' }}>
                                Fill in your profile and goals, then click{' '}
                                <em style={{ color: T.text }}>Generate My FIRE Roadmap</em>{' '}
                                to receive your personalised financial plan.
                            </p>
                        )}

                        {/* Thinking */}
                        {aiState === 'thinking' && (
                            <div>
                                {/* Market context bar */}
                                <div style={{
                                    display: 'flex', gap: 20, marginBottom: 20, padding: '10px 14px', flexWrap: 'wrap',
                                    background: T.redDim, border: `1px solid rgba(232,39,42,0.15)`, borderRadius: 8,
                                }}>
                                    {[{ k: 'Repo Rate', v: `${market.repo}%` }, { k: 'CPI', v: `${market.cpi}%` }, { k: 'Nifty 50', v: market.nifty }].map(item => (
                                        <div key={item.k} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                                            <span style={{ color: T.muted }}>{item.k}</span>
                                            <span style={{ fontFamily: 'monospace', color: T.red, fontSize: 12 }}>{item.v}</span>
                                        </div>
                                    ))}
                                    <span style={{ marginLeft: 'auto', fontSize: 10, color: T.muted }}>Live data injected into prompt</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', color: T.muted, fontSize: 13, padding: '16px 0' }}>
                                    <span>Artha AI is crafting your roadmap</span>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {[0, 0.2, 0.4].map((delay, i) => (
                                            <motion.span
                                                key={i}
                                                animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                                                transition={{ duration: 1.2, repeat: Infinity, delay }}
                                                style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: T.red }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {aiState === 'error' && (
                            <p style={{ color: T.danger, padding: '16px 0', fontSize: 13 }}>
                                ⚠ Could not generate roadmap. Check your API connection and try again.
                            </p>
                        )}

                        {/* Done */}
                        {aiState === 'done' && roadmap && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

                                {/* Market context */}
                                <div style={{
                                    display: 'flex', gap: 20, marginBottom: 20, padding: '10px 14px', flexWrap: 'wrap',
                                    background: T.redDim, border: `1px solid rgba(232,39,42,0.15)`, borderRadius: 8,
                                }}>
                                    {[{ k: 'Repo Rate', v: `${market.repo}%` }, { k: 'CPI', v: `${market.cpi}%` }, { k: 'Nifty 50', v: market.nifty }].map(item => (
                                        <div key={item.k} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                                            <span style={{ color: T.muted }}>{item.k}</span>
                                            <span style={{ fontFamily: 'monospace', color: T.red }}>{item.v}</span>
                                        </div>
                                    ))}
                                </div>

                                <PhaseCard iconBg={T.greenDim} emoji="📍" title="Where You Stand"><p>{roadmap.summary}</p></PhaseCard>

                                {roadmap.riskFlags?.length > 0 && (
                                    <PhaseCard iconBg={T.dangerDim} emoji="🚩" title="Risk Flags">
                                        {roadmap.riskFlags.map((f, i) => (
                                            <div key={i} style={{
                                                background: T.dangerDim, border: `1px solid rgba(239,68,68,0.22)`,
                                                borderRadius: 7, padding: '9px 13px', marginBottom: 8,
                                                display: 'flex', gap: 8, alignItems: 'flex-start', color: T.danger, fontSize: 13,
                                            }}>
                                                <span>⚠</span><span>{f}</span>
                                            </div>
                                        ))}
                                    </PhaseCard>
                                )}

                                <PhaseCard iconBg={T.greenDim} emoji="🌱" title="First 6 Months — Foundations">
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {roadmap.first6Months?.map((a, i) => (
                                            <li key={i} style={{ padding: '4px 0 4px 16px', position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: 0, color: T.red, fontSize: 11 }}>→</span>{a}
                                            </li>
                                        ))}
                                    </ul>
                                </PhaseCard>

                                <PhaseCard iconBg={T.amberDim} emoji="📈" title="At the 1-Year Mark">
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {roadmap.year1Changes?.map((a, i) => (
                                            <li key={i} style={{ padding: '4px 0 4px 16px', position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: 0, color: T.red, fontSize: 11 }}>→</span>{a}
                                            </li>
                                        ))}
                                    </ul>
                                </PhaseCard>

                                <PhaseCard iconBg={T.blueDim} emoji="🎯" title="Monthly SIP Breakdown">
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 10, marginBottom: 10 }}>
                                        {roadmap.sipBreakdown?.map((s, i) => (
                                            <div key={i} style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 9, padding: 12 }}>
                                                <p style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{s.goal}</p>
                                                <p style={{ fontFamily: 'monospace', fontSize: 16, color: T.green, fontVariantNumeric: 'tabular-nums' }}>
                                                    {fmtINR(s.amount)}<span style={{ fontSize: 10, color: T.muted }}>/mo</span>
                                                </p>
                                                <p style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{s.instrument}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {roadmap.monthlyBudgetAdvice && (
                                        <p style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{roadmap.monthlyBudgetAdvice}</p>
                                    )}
                                </PhaseCard>

                                <PhaseCard iconBg={T.greenDim} emoji="🛡" title="Insurance & Protection"><p>{roadmap.insuranceRecommendation}</p></PhaseCard>

                                <PhaseCard iconBg={T.amberDim} emoji="💡" title="Tax-Saving Moves">
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {roadmap.taxMoves?.map((a, i) => (
                                            <li key={i} style={{ padding: '4px 0 4px 16px', position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: 0, color: T.red, fontSize: 11 }}>→</span>{a}
                                            </li>
                                        ))}
                                    </ul>
                                </PhaseCard>

                                <PhaseCard iconBg={T.blueDim} emoji="🔄" title="Asset Allocation Shift Plan"><p>{roadmap.assetShiftPlan}</p></PhaseCard>

                            </motion.div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
