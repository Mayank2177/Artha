// ─────────────────────────────────────────────────────────────────────────────
//  FEATURE 04 — MF Portfolio X-Ray
//  Upload CAMS PDF → scan animation → XIRR + table + overlap warnings + AI
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import CountUp from 'react-countup'
import { BarChart3, Upload, FileText, X, Sparkles, Zap, AlertTriangle, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_BASE = 'http://localhost:8000/api'

// ── Mock portfolio data (simulates backend response) ──────────────────────────
const MOCK_PORTFOLIO = [
    { fund: 'Parag Parikh Flexi Cap', value: 284000, xirr: 18.4, expense: 0.59, overlap: false, action: 'Hold' },
    { fund: 'Mirae Asset Emerging Bluechip', value: 156000, xirr: 14.2, expense: 0.72, overlap: true, action: 'Review' },
    { fund: 'Axis Bluechip Fund', value: 98000, xirr: 11.8, expense: 0.89, overlap: true, action: 'Merge' },
    { fund: 'SBI Small Cap Fund', value: 67000, xirr: 22.1, expense: 1.76, overlap: false, action: 'Hold' },
    { fund: 'HDFC Nifty 50 Index', value: 132000, xirr: 13.9, expense: 0.10, overlap: false, action: 'Add' },
    { fund: 'Kotak Corporate Bond', value: 75000, xirr: 7.4, expense: 0.34, overlap: false, action: 'Hold' },
]

const TOTAL_VALUE = MOCK_PORTFOLIO.reduce((a, f) => a + f.value, 0)
const AVG_XIRR = (MOCK_PORTFOLIO.reduce((a, f) => a + f.xirr * f.value, 0) / TOTAL_VALUE).toFixed(1)
const OVERLAP_CT = MOCK_PORTFOLIO.filter(f => f.overlap).length

const WARNINGS = [
    { type: 'danger', icon: AlertTriangle, title: 'Portfolio Overlap Detected', desc: `${OVERLAP_CT} funds share identical top-10 holdings. You're paying for the same stocks twice.` },
    { type: 'warning', icon: TrendingDown, title: 'High Expense Ratio', desc: 'Axis Bluechip charges 0.89% — 8x more than your Nifty index fund for similar large-cap exposure.' },
    { type: 'success', icon: CheckCircle, title: 'Strong XIRR', desc: `Your blended XIRR of ${AVG_XIRR}% beats Nifty 50 XIRR of 13.2% over the same period.` },
]

const AI_PORTFOLIO = `**Portfolio X-Ray Analysis:**

Your blended XIRR of **${AVG_XIRR}%** is strong — but you're losing approximately **₹18,400/year** to overlap and excess expenses.

**Rebalancing plan — 3 moves:**

1. **Merge Axis Bluechip → HDFC Nifty 50** — Same large-cap exposure at 0.10% vs 0.89% expense. Saves ₹780/year on ₹98K corpus. Do via STP over 3 months.

2. **Exit Mirae Asset Emerging Bluechip** — Heavy overlap with Parag Parikh Flexi Cap (top 8 stocks identical). Redirect ₹1.56L → SBI Small Cap for true diversification.

3. **Add HDFC Nifty 50** — Your portfolio is fund-manager-heavy. Add ₹5,000/mo index SIP to reduce concentration risk.

**Post-rebalance projection:** Expected XIRR improves to 15.8% with 40% lower expense drag.

**Target portfolio:** Parag Parikh + SBI Small Cap + HDFC Nifty 50 + Kotak Bond — 4 funds, zero overlap.`

// ── Scan animation ─────────────────────────────────────────────────────────────
function ScanAnimation({ onDone }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '80px 32px', textAlign: 'center',
            }}
        >
            <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 28 }}>
                {/* Doc outline */}
                <div style={{
                    width: 80, height: 100, margin: '0 auto',
                    background: '#18181F', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, position: 'relative', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                }}>
                    <FileText size={28} color="#EF4444" />
                    {/* Scan line */}
                    <motion.div
                        animate={{ y: ['-60px', '60px', '-60px'] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute', left: 0, right: 0, height: 2,
                            background: 'linear-gradient(90deg, transparent, #EF4444, transparent)',
                        }}
                    />
                </div>
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Analysing CAMS Statement</p>
            <p style={{ fontSize: 13, color: '#9A9AAD', marginBottom: 4 }}>pdfplumber extracting transactions…</p>
            <p style={{ fontSize: 12, color: '#9A9AAD' }}>pyxirr computing XIRR from cashflow arrays…</p>

            {/* Fake progress bar */}
            <div style={{ width: 280, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 28, overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.5, ease: 'easeInOut' }}
                    onAnimationComplete={onDone}
                    style={{ height: '100%', background: '#EF4444', borderRadius: 2 }}
                />
            </div>
        </motion.div>
    )
}

export default function PortfolioXRay() {
    const { user } = useAuth()
    const [stage, setStage] = useState('upload')  // upload | scanning | result
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [aiText, setAiText] = useState('')
    const [aiTyping, setAiTyping] = useState(false)
    const [loading, setLoading] = useState(false)
    const [portfolio, setPortfolio] = useState(MOCK_PORTFOLIO) // dynamic from API
    const [analysisData, setAnalysisData] = useState(null) // full backend response
    const [uploadedFile, setUploadedFile] = useState(null)
    const [pdfPassword, setPdfPassword] = useState('')

    // Compute derived values from current portfolio data
    const totalValue = portfolio.reduce((a, f) => a + f.value, 0)
    const avgXirr = totalValue > 0 ? (portfolio.reduce((a, f) => a + f.xirr * f.value, 0) / totalValue).toFixed(1) : '0.0'
    const overlapCt = portfolio.filter(f => f.overlap).length

    const warnings = [
        { type: 'danger', icon: AlertTriangle, title: 'Portfolio Overlap Detected', desc: `${overlapCt} funds share identical top-10 holdings. You're paying for the same stocks twice.` },
        { type: 'warning', icon: TrendingDown, title: 'High Expense Ratio', desc: portfolio.find(f => f.expense > 0.8) ? `${portfolio.find(f => f.expense > 0.8)?.fund} has high expense ratio.` : 'Expense ratios are reasonable.' },
        { type: 'success', icon: CheckCircle, title: 'Strong XIRR', desc: `Your blended XIRR of ${avgXirr}% ${parseFloat(avgXirr) >= 13 ? 'beats' : 'trails'} Nifty 50 XIRR of 13.2%.` },
    ]

    const onDrop = useCallback((accepted) => {
        if (accepted.length) {
            setUploadedFile(accepted[0])
            setStage('scanning')

            // Step 1: Upload PDF to extract text
            const formData = new FormData()
            formData.append('file', accepted[0])
            if (pdfPassword.trim()) {
                formData.append('password', pdfPassword.trim())
            }

            fetch(`${API_BASE}/mf-xray/upload`, {
                method: 'POST',
                body: formData,
            })
                .then(async res => {
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        throw new Error(`Upload Failed: ${data.detail || res.statusText}`);
                    }
                    if (!data.pdf_text) {
                        throw new Error('No PDF text extracted.');
                    }
                    return data.pdf_text;
                })
                .then(pdf_text => {
                    // Step 2: Analyze extracted text
                    return fetch(`${API_BASE}/mf-xray`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pdf_text: pdf_text, user_email: user?.email || null }),
                    });
                })
                .then(async res => {
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                        throw new Error(`Analysis Failed: ${data.detail || res.statusText}`);
                    }
                    if (!data || !data.holdings) {
                        throw new Error('Analysis returned empty holdings.');
                    }
                    return data;
                })
                .then(data => {
                    setAnalysisData(data)
                    const mapped = data.holdings.map(h => ({
                        fund: h.fund_name,
                        value: Math.round(h.current_value),
                        xirr: h.xirr != null ? parseFloat(h.xirr.toFixed(1)) : 0,
                        expense: h.expense_ratio || 0,
                        overlap: data.overlaps?.some(o => o.fund_a === h.fund_name || o.fund_b === h.fund_name) || false,
                        action: h.xirr && h.xirr < 8 ? 'Review' : 'Hold',
                    }))
                    setPortfolio(mapped)
                    setStage('result')
                })
                .catch(err => {
                    console.error('MF X-Ray API error:', err)
                    alert(`Error: ${err.message}\nFalling back to Demo Portfolio.`);
                    if (user?.email) {
                        fetch(`${API_BASE}/mf-xray/demo`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_email: user.email }),
                        }).catch(e => console.error(e));
                    }
                    setStage('result') // show mock data
                })
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1,
    })

    function openAI() {
        setDrawerOpen(true); setAiTyping(true); setAiText('')

        // Use real AI advice if available, otherwise fallback to mock
        const advice = analysisData?.ai_advice || AI_PORTFOLIO
        let i = 0
        const iv = setInterval(() => {
            i++; setAiText(advice.slice(0, i * 4))
            if (i * 4 >= advice.length) { clearInterval(iv); setAiTyping(false); setAiText(advice) }
        }, 14)
    }

    const ACTION_STYLE = {
        Hold: { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
        Review: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
        Merge: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
        Add: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    }

    return (
        <div style={{ padding: '28px', position: 'relative' }}>
            {/* AI Drawer */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setDrawerOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(4px)' }}
                        />
                        <motion.div
                            initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                            style={{
                                position: 'fixed', right: 0, top: 0, bottom: 0, width: 400,
                                background: '#0D0D14', borderLeft: '1px solid rgba(255,255,255,0.08)',
                                zIndex: 300, overflowY: 'auto', padding: '28px 24px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <BarChart3 size={16} color="#EF4444" />
                                    <span style={{ fontSize: 14, fontWeight: 700 }}>Portfolio Rebalancing — AI</span>
                                </div>
                                <button onClick={() => setDrawerOpen(false)} style={{ color: '#9A9AAD', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 6, padding: '3px 10px',
                                fontSize: 10, fontWeight: 700, color: '#EF4444',
                                letterSpacing: '0.5px', marginBottom: 18,
                            }}>
                                <Zap size={9} /> PYXIRR COMPUTED · GROQ LLAMA 3.3
                            </div>
                            <div style={{ fontSize: 14, color: '#C8C8D8', lineHeight: 1.8 }}>
                                {aiText.split('\n').map((line, i) => {
                                    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F0F0F5">$1</strong>')
                                    return <p key={i} dangerouslySetInnerHTML={{ __html: bold }} style={{ marginBottom: line === '' ? 10 : 4 }} />
                                })}
                                {aiTyping && <span>|</span>}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
                    MF Portfolio X-Ray
                </h2>
                <p style={{ fontSize: 13, color: '#9A9AAD' }}>Upload CAMS / KFintech PDF — true XIRR, overlap, rebalancing in 10 seconds</p>
            </div>

            <AnimatePresence mode="wait">
                {/* UPLOAD */}
                {stage === 'upload' && (
                    <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div
                            {...getRootProps()}
                            style={{
                                border: `2px dashed ${isDragActive ? '#EF4444' : 'rgba(255,255,255,0.12)'}`,
                                borderRadius: 18, padding: '72px 32px',
                                textAlign: 'center', cursor: 'pointer',
                                background: isDragActive ? 'rgba(239,68,68,0.04)' : 'transparent',
                                transition: 'all 0.3s', maxWidth: 560, margin: '0 auto',
                            }}
                        >
                            <input {...getInputProps()} />
                            <motion.div
                                animate={{ y: isDragActive ? -8 : 0 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <Upload size={48} color={isDragActive ? '#EF4444' : '#9A9AAD'} style={{ marginBottom: 18 }} />
                                <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                                    {isDragActive ? 'Drop your CAMS PDF here' : 'Upload CAMS / KFintech Statement'}
                                </p>
                                <p style={{ fontSize: 13, color: '#9A9AAD', marginBottom: 6 }}>Drag & drop or click to browse · PDF only</p>
                                <p style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)', fontWeight: 600 }}>
                                    Demo: any PDF triggers the analysis
                                </p>
                            </motion.div>
                        </div>

                        {/* Password Input */}
                        <div style={{ textAlign: 'center', marginTop: 24, maxWidth: 320, margin: '24px auto 0' }}>
                            <p style={{ fontSize: 13, color: '#9A9AAD', marginBottom: 8, textAlign: 'left' }}>
                                PDF Password (usually your PAN)
                            </p>
                            <input
                                type="password"
                                placeholder="e.g. ABCDE1234F"
                                value={pdfPassword}
                                onChange={e => setPdfPassword(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 14px',
                                    background: '#18181F', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 8, color: '#F0F0F5', fontSize: 13,
                                    outline: 'none', fontFamily: 'Inter, sans-serif'
                                }}
                            />
                        </div>

                        {/* Demo shortcut */}
                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                            <motion.button
                                whileHover={{ color: '#EF4444' }}
                                onClick={() => {
                                    // Demo mode uses the mock data
                                    setPortfolio(MOCK_PORTFOLIO)
                                    setAnalysisData(null)
                                    setStage('scanning')
                                    
                                    // Silently write to backend so dashboard updates
                                    if (user?.email) {
                                        fetch(`${API_BASE}/mf-xray/demo`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ user_email: user.email }),
                                        }).catch(err => console.error("Demo save missed:", err))
                                    }
                                }}
                                style={{
                                    fontSize: 13, color: '#9A9AAD', background: 'none', border: 'none',
                                    cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'underline',
                                }}
                            >
                                Skip upload — use demo portfolio
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* SCANNING */}
                {stage === 'scanning' && (
                    <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ScanAnimation onDone={() => setTimeout(() => setStage('result'), 300)} />
                    </motion.div>
                )}

                {/* RESULT */}
                {stage === 'result' && (
                    <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        {/* XIRR hero */}
                        <div style={{ textAlign: 'center', marginBottom: 28, padding: '8px 0' }}>
                            <p style={{ fontSize: 11, color: '#9A9AAD', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>
                                Your True Portfolio XIRR
                            </p>
                            <motion.p
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                                style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: 'clamp(64px, 8vw, 96px)', fontWeight: 900,
                                    color: '#10B981', lineHeight: 1, letterSpacing: '-3px',
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                <CountUp end={parseFloat(avgXirr)} duration={1.8} decimals={1} suffix="%" />
                            </motion.p>
                            <p style={{ fontSize: 13, color: '#9A9AAD', marginTop: 6 }}>
                                Portfolio value: ₹{(totalValue / 100000).toFixed(1)}L · {portfolio.length} funds
                            </p>
                        </div>

                        {/* Table */}
                        <div style={{
                            background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 16, overflow: 'hidden', marginBottom: 18,
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#18181F' }}>
                                        {['Fund', 'Current Value', 'XIRR', 'Expense', 'Overlap', 'Action'].map(h => (
                                            <th key={h} style={{
                                                fontSize: 10, color: '#9A9AAD', fontWeight: 600,
                                                textAlign: 'left', padding: '12px 14px',
                                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                                letterSpacing: '0.5px',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.map((f, i) => (
                                        <motion.tr
                                            key={f.fund}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#18181F' }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                        >
                                            <td style={{ fontSize: 13, fontWeight: 600, padding: '13px 14px', maxWidth: 200 }}>{f.fund}</td>
                                            <td style={{ fontSize: 13, padding: '13px 14px', fontVariantNumeric: 'tabular-nums' }}>
                                                ₹{(f.value / 1000).toFixed(0)}K
                                            </td>
                                            <td style={{
                                                fontSize: 13, fontWeight: 700, padding: '13px 14px',
                                                color: f.xirr >= 14 ? '#10B981' : f.xirr >= 10 ? '#F59E0B' : '#EF4444',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}>
                                                {f.xirr}%
                                            </td>
                                            <td style={{
                                                fontSize: 12, padding: '13px 14px',
                                                color: f.expense > 1 ? '#EF4444' : f.expense > 0.5 ? '#F59E0B' : '#10B981',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}>
                                                {f.expense}%
                                            </td>
                                            <td style={{ padding: '13px 14px' }}>
                                                {f.overlap
                                                    ? <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, padding: '2px 7px' }}>OVERLAP</span>
                                                    : <span style={{ fontSize: 10, color: '#9A9AAD' }}>—</span>
                                                }
                                            </td>
                                            <td style={{ padding: '13px 14px' }}>
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700,
                                                    color: ACTION_STYLE[f.action].color,
                                                    background: ACTION_STYLE[f.action].bg,
                                                    borderRadius: 5, padding: '3px 9px',
                                                }}>
                                                    {f.action}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Warning cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 }}>
                            {warnings.map((w, i) => {
                                const Icon = w.icon
                                const col = w.type === 'danger' ? '#EF4444' : w.type === 'warning' ? '#F59E0B' : '#10B981'
                                return (
                                    <motion.div
                                        key={w.title}
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + i * 0.1 }}
                                        style={{
                                            background: '#111118',
                                            border: `1px solid ${col}30`,
                                            borderRadius: 14, padding: '16px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <Icon size={14} color={col} strokeWidth={2} />
                                            <p style={{ fontSize: 12, fontWeight: 700, color: col }}>{w.title}</p>
                                        </div>
                                        <p style={{ fontSize: 12, color: '#9A9AAD', lineHeight: 1.55 }}>{w.desc}</p>
                                    </motion.div>
                                )
                            })}
                        </div>

                        {/* AI CTA */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(232,39,42,0.06))',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 14, padding: '18px 22px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>3-move rebalancing plan ready</p>
                                <p style={{ fontSize: 13, color: '#9A9AAD' }}>AI will tell you exactly which funds to merge, exit and add</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(239,68,68,0.4)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={openAI}
                                style={{
                                    background: '#EF4444', color: '#fff', border: 'none',
                                    borderRadius: 10, padding: '11px 24px',
                                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                                }}
                            >
                                <Sparkles size={13} /> View Rebalancing Plan
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
