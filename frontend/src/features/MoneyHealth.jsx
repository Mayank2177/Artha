// ─────────────────────────────────────────────────────────────────────────────
//  FEATURE 01 — Money Health Score
//  Quiz (12 questions, 1 per screen) → Result (radar + subscores + AI drawer)
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResponsiveContainer, Tooltip,
} from 'recharts'
import { X, Sparkles, ChevronRight, RotateCcw, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_BASE = 'http://localhost:8000/api'

// ── 12 Questions across 6 dimensions ─────────────────────────────────────────
const QUESTIONS = [
    // Savings (dim 0)
    { dim: 'Savings', q: 'What % of your monthly income do you save consistently?', opts: ['Less than 5%', '5–10%', '10–20%', 'More than 20%'], pts: [5, 15, 25, 40] },
    { dim: 'Savings', q: 'Do you have an emergency fund covering 6+ months of expenses?', opts: ['No fund', '1–2 months', '3–5 months', '6+ months'], pts: [0, 10, 20, 40] },
    // Insurance (dim 1)
    { dim: 'Insurance', q: 'Do you have a term life insurance policy?', opts: ['None', 'Under-insured', 'Adequate cover', '10x income cover'], pts: [0, 8, 20, 40] },
    { dim: 'Insurance', q: 'Do you have a health insurance policy?', opts: ['None', 'Employer-only', '₹5–10L cover', '₹10L+ family floater'], pts: [0, 10, 22, 40] },
    // Debt (dim 2)
    { dim: 'Debt', q: 'What is your monthly EMI-to-income ratio?', opts: ['Above 50%', '30–50%', '10–30%', 'Under 10%'], pts: [5, 12, 25, 40] },
    { dim: 'Debt', q: 'Do you carry any high-interest debt (credit card / personal loan)?', opts: ['Yes, large', 'Yes, small', 'Paid off recently', 'No debt'], pts: [5, 12, 28, 40] },
    // Investments (dim 3)
    { dim: 'Invest', q: 'Are you investing regularly via SIP or recurring deposits?', opts: ['Not investing', 'Irregular', 'Regular SIP', 'SIP + diversified'], pts: [0, 10, 25, 40] },
    { dim: 'Invest', q: 'How diversified is your investment portfolio?', opts: ['FD only', 'FD + 1 MF', 'Equity + Debt', 'Multi-asset diversified'], pts: [5, 12, 25, 40] },
    // Goals (dim 4)
    { dim: 'Goals', q: 'Do you have written financial goals with target amounts and years?', opts: ['No goals', 'Vague goals', '2–3 clear goals', 'Full goal plan'], pts: [0, 8, 22, 40] },
    { dim: 'Goals', q: 'Are you on track for retirement planning?', opts: ['Not started', 'Thinking about it', 'NPS/PPF started', 'FIRE planned'], pts: [0, 8, 22, 40] },
    // Tax (dim 5)
    { dim: 'Tax', q: 'Do you actively plan tax deductions each financial year?', opts: ['No planning', 'Last-minute', '80C + 80D used', 'Full optimization'], pts: [0, 8, 22, 40] },
    { dim: 'Tax', q: 'Have you compared old vs new tax regime for your income?', opts: ['Never', 'Heard of it', 'Compared once', 'Compare every year'], pts: [0, 8, 20, 40] },
]

const DIM_COLORS = {
    Savings: '#10B981',
    Insurance: '#F59E0B',
    Debt: '#3B82F6',
    Invest: '#8B5CF6',
    Goals: '#EC4899',
    Tax: '#E8272A',
}

// ── DEFAULT RESPONSE (fallback only) ───────────────────────────────────
const DEFAULT_AI_RESPONSE = `Your financial health analysis is complete. Review your dimension scores above to understand your financial strengths and areas for improvement.`

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function MoneyHealth() {
    const { user } = useAuth()
    const [step, setStep] = useState(0)          // 0..11 = quiz, 12 = result
    const [answers, setAnswers] = useState([])          // point values
    const [selected, setSelected] = useState(null)        // current selection index
    const [selectedOptions, setSelectedOptions] = useState([]) // {qid, opt} per question
    const [loading, setLoading] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [aiTyping, setAiTyping] = useState(false)
    const [aiText, setAiText] = useState('')

    const isQuiz = step < 12
    const progress = (step / 12) * 100

    // Compute dim scores from answers
    const computeScores = (ans) => {
        const dims = ['Savings', 'Insurance', 'Debt', 'Invest', 'Goals', 'Tax']
        const pairs = [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11]]
        return dims.map((d, i) => {
            const [a, b] = pairs[i]
            const total = (ans[a] ?? 0) + (ans[b] ?? 0)
            return { dim: d, score: Math.round((total / 80) * 100), fullMark: 100 }
        })
    }

    const radarData = computeScores(answers)
    const totalScore = answers.length
        ? Math.round(answers.reduce((a, b) => a + b, 0) / (12 * 40) * 100)
        : 0

    const scoreColor = totalScore >= 75 ? '#10B981' : totalScore >= 50 ? '#F59E0B' : '#EF4444'
    const scoreLabel = totalScore >= 75 ? 'Good Standing' : totalScore >= 50 ? 'Needs Work' : 'At Risk'

    function pickOption(idx) {
        setSelected(idx)
    }

    function nextQuestion() {
        if (selected === null) return
        const option = String.fromCharCode(65 + selected) // A, B, C, D
        const pts = QUESTIONS[step].pts[selected]
        const newSelectedOptions = [...selectedOptions, { qid: step + 1, opt: option }]
        
        setSelectedOptions(newSelectedOptions)
        setAnswers([...answers, pts])
        setSelected(null)
        
        if (step === 11) {
            setStep(12)
            
            // Background silent save to db
            if (user?.email) {
                const payload = {
                    answers: newSelectedOptions.map((a) => ({
                        question_id: a.qid,
                        selected_option: a.opt,
                    })),
                    user_name: user?.name?.split(' ')[0] || 'User',
                    user_email: user.email,
                    skip_ai: true,
                }
                fetch(`${API_BASE}/money-health`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }).catch(e => console.error(e))
            }
        } else {
            setStep(step + 1)
        }
    }

    function openAI() {
        setDrawerOpen(true)
        setAiTyping(true)
        setAiText('')
        setLoading(true)

        // Call backend API
        const payload = {
            answers: selectedOptions.map((a) => ({
                question_id: a.qid,
                selected_option: a.opt,
            })),
            user_name: user?.name?.split(' ')[0] || 'User',
            user_email: user?.email || null,
        }

        fetch(`${API_BASE}/money-health`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then((res) => res.json())
            .then((data) => {
                setLoading(false)
                const advice = data.ai_advice || DEFAULT_AI_RESPONSE

                // Typewriter effect
                let i = 0
                const interval = setInterval(() => {
                    i++
                    setAiText(advice.slice(0, i * 3))
                    if (i * 3 >= advice.length) {
                        clearInterval(interval)
                        setAiTyping(false)
                        setAiText(advice)
                    }
                }, 18)
            })
            .catch((err) => {
                setLoading(false)
                setAiTyping(false)
                setAiText('Error fetching advice. Please try again.')
                console.error('API Error:', err)
            })
    }

    function reset() {
        setStep(0); setAnswers([]); setSelected(null)
        setSelectedOptions([]); setLoading(false)
        setDrawerOpen(false); setAiText('')
    }

    // ── QUIZ UI ────────────────────────────────────────────────────────────────
    if (isQuiz) {
        const q = QUESTIONS[step]
        const dim = q.dim
        const col = DIM_COLORS[dim]
        return (
            <div style={{ padding: '28px', maxWidth: 680, margin: '0 auto' }}>
                {/* Progress */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: '#9A9AAD', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            Question {step + 1} of 12
                        </span>
                        <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                            color: col, background: col + '18',
                            border: `1px solid ${col}30`,
                            borderRadius: 20, padding: '2px 10px',
                        }}>
                            {dim}
                        </span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                        <motion.div
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4 }}
                            style={{ height: '100%', background: col, borderRadius: 2 }}
                        />
                    </div>
                </div>

                {/* Question card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div style={{
                            background: '#111118',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 20, padding: '36px 32px',
                            marginBottom: 16,
                            position: 'relative', overflow: 'hidden',
                        }}>
                            {/* Glow behind question */}
                            <div style={{
                                position: 'absolute', top: -60, right: -60,
                                width: 200, height: 200, borderRadius: '50%',
                                background: `radial-gradient(circle, ${col}12 0%, transparent 70%)`,
                                pointerEvents: 'none',
                            }} />
                            <p style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 700,
                                lineHeight: 1.35, color: '#F0F0F5', position: 'relative', zIndex: 1,
                            }}>
                                {q.q}
                            </p>
                        </div>

                        {/* Options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {q.opts.map((opt, i) => (
                                <motion.button
                                    key={i}
                                    onClick={() => pickOption(i)}
                                    whileHover={{ x: 5 }}
                                    whileTap={{ scale: 0.99 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '15px 18px',
                                        background: selected === i ? `${col}12` : '#111118',
                                        border: `1px solid ${selected === i ? col + '50' : 'rgba(255,255,255,0.07)'}`,
                                        borderRadius: 12, cursor: 'pointer',
                                        color: '#F0F0F5', fontSize: 14, fontWeight: selected === i ? 600 : 400,
                                        textAlign: 'left', width: '100%',
                                        fontFamily: 'Inter, sans-serif',
                                        transition: 'background 0.2s, border-color 0.2s',
                                    }}
                                >
                                    <span style={{
                                        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                                        background: selected === i ? col + '22' : 'rgba(255,255,255,0.06)',
                                        border: `1px solid ${selected === i ? col + '50' : 'rgba(255,255,255,0.1)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 10, fontFamily: 'monospace', color: selected === i ? col : '#9A9AAD',
                                        transition: 'all 0.2s',
                                    }}>
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                    {opt}
                                    {selected === i && <CheckCircle size={14} color={col} style={{ marginLeft: 'auto' }} />}
                                </motion.button>
                            ))}
                        </div>

                        {/* Next */}
                        <motion.button
                            whileHover={selected !== null ? { scale: 1.02, boxShadow: '0 8px 28px rgba(232,39,42,0.4)' } : {}}
                            whileTap={selected !== null ? { scale: 0.98 } : {}}
                            onClick={nextQuestion}
                            style={{
                                marginTop: 22, width: '100%',
                                background: selected !== null ? '#E8272A' : 'rgba(255,255,255,0.05)',
                                color: selected !== null ? '#fff' : '#9A9AAD',
                                border: `1px solid ${selected !== null ? '#E8272A' : 'rgba(255,255,255,0.08)'}`,
                                borderRadius: 12, padding: '14px',
                                fontSize: 15, fontWeight: 700, cursor: selected !== null ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                fontFamily: 'Inter, sans-serif',
                                transition: 'background 0.25s, color 0.25s, border-color 0.25s',
                            }}
                        >
                            {step === 11 ? 'See My Score' : 'Next'} <ChevronRight size={16} />
                        </motion.button>
                    </motion.div>
                </AnimatePresence>
            </div>
        )
    }

    // ── RESULT UI ──────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: '28px', position: 'relative' }}>
            {/* AI Drawer */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDrawerOpen(false)}
                            style={{
                                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                                zIndex: 200, backdropFilter: 'blur(4px)',
                            }}
                        />
                        <motion.div
                            initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                            style={{
                                position: 'fixed', right: 0, top: 0, bottom: 0,
                                width: 380, background: '#0D0D14',
                                borderLeft: '1px solid rgba(255,255,255,0.08)',
                                zIndex: 300, overflowY: 'auto', padding: '28px 24px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Sparkles size={16} color="#E8272A" />
                                    <span style={{ fontSize: 14, fontWeight: 700 }}>Artha AI Advisor</span>
                                </div>
                                <button onClick={() => setDrawerOpen(false)} style={{ color: '#9A9AAD', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: 'rgba(232,39,42,0.1)', border: '1px solid rgba(232,39,42,0.2)',
                                borderRadius: 6, padding: '3px 10px',
                                fontSize: 10, fontWeight: 700, color: '#E8272A',
                                letterSpacing: '0.5px', marginBottom: 18,
                            }}>
                                <motion.span
                                    style={{ width: 5, height: 5, borderRadius: '50%', background: '#E8272A', display: 'inline-block' }}
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                                {aiTyping ? 'GENERATING...' : 'ARTHA AI · GROQ LLAMA 3.3'}
                            </div>
                            <div style={{ fontSize: 14, color: '#C8C8D8', lineHeight: 1.8 }}>
                                {aiText.split('\n').map((line, i) => {
                                    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F0F0F5">$1</strong>')
                                    return (
                                        <p
                                            key={i}
                                            dangerouslySetInnerHTML={{ __html: bold }}
                                            style={{ marginBottom: line === '' ? 10 : 4 }}
                                        />
                                    )
                                })}
                                {aiTyping && <span style={{ animation: 'blink 1s infinite' }}>|</span>}
                            </div>
                            <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <h2 style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4,
                    }}>
                        Your Money Health Report
                    </h2>
                    <p style={{ fontSize: 13, color: '#9A9AAD' }}>Based on 12 questions across 6 financial dimensions</p>
                </div>
                <motion.button
                    whileHover={{ background: 'rgba(255,255,255,0.06)' }}
                    onClick={reset}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#9A9AAD', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                    }}
                >
                    <RotateCcw size={12} /> Retake
                </motion.button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                {/* Score + ring */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        background: '#111118',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 18, padding: '28px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        position: 'relative', overflow: 'hidden',
                    }}
                >
                    <div style={{
                        position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
                        width: 200, height: 200, borderRadius: '50%',
                        background: `radial-gradient(circle, ${scoreColor}10 0%, transparent 70%)`,
                        pointerEvents: 'none',
                    }} />

                    {/* SVG ring */}
                    <div style={{ position: 'relative', width: 150, height: 150, marginBottom: 20 }}>
                        <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="75" cy="75" r="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                            <motion.circle
                                cx="75" cy="75" r="60" fill="none"
                                stroke={scoreColor} strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 60}`}
                                initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - totalScore / 100) }}
                                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                            />
                        </svg>
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <p style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: 42, fontWeight: 800, color: scoreColor, lineHeight: 1,
                                fontVariantNumeric: 'tabular-nums',
                            }}>
                                <CountUp end={totalScore} duration={1.5} />
                            </p>
                            <p style={{ fontSize: 12, color: '#9A9AAD', marginTop: 2 }}>/100</p>
                        </div>
                    </div>

                    <p style={{ fontSize: 18, fontWeight: 700, color: scoreColor, marginBottom: 4 }}>{scoreLabel}</p>
                    <p style={{ fontSize: 12, color: '#9A9AAD', textAlign: 'center' }}>
                        Better than ~{totalScore}% of Indian savers
                    </p>

                    <motion.button
                        whileHover={{ scale: 1.03, boxShadow: '0 8px 28px rgba(232,39,42,0.4)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={openAI}
                        style={{
                            marginTop: 22,
                            background: '#E8272A', color: '#fff',
                            border: 'none', borderRadius: 10,
                            padding: '12px 28px', fontSize: 14, fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 4px 20px rgba(232,39,42,0.3)',
                        }}
                    >
                        <Sparkles size={14} /> View AI Analysis
                    </motion.button>
                </motion.div>

                {/* Radar chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{
                        background: '#111118',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 18, padding: '24px',
                    }}
                >
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#9A9AAD', marginBottom: 16, letterSpacing: '0.5px' }}>
                        6 DIMENSIONS
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={radarData} outerRadius={80}>
                            <PolarGrid stroke="rgba(255,255,255,0.07)" />
                            <PolarAngleAxis
                                dataKey="dim"
                                tick={{ fill: '#9A9AAD', fontSize: 11, fontFamily: 'Inter' }}
                            />
                            <Radar
                                name="score" dataKey="score"
                                stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Sub-scores */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{
                    background: '#111118',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 18, padding: '24px',
                }}
            >
                <p style={{ fontSize: 12, fontWeight: 600, color: '#9A9AAD', marginBottom: 18, letterSpacing: '0.5px' }}>
                    DIMENSION BREAKDOWN
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    {radarData.map((d) => {
                        const col = DIM_COLORS[d.dim]
                        const label = d.score >= 70 ? 'Good' : d.score >= 45 ? 'Fair' : 'Weak'
                        return (
                            <div key={d.dim} style={{
                                background: '#18181F',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: 12, padding: '14px 16px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600 }}>{d.dim}</p>
                                    <span style={{
                                        fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                                        color: col, background: col + '18',
                                        border: `1px solid ${col}30`, borderRadius: 4, padding: '2px 7px',
                                    }}>
                                        {label}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${d.score}%` }}
                                            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                            style={{ height: '100%', background: col, borderRadius: 2 }}
                                        />
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: col, fontVariantNumeric: 'tabular-nums', minWidth: 28 }}>
                                        {d.score}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </motion.div>
        </div>
    )
}
