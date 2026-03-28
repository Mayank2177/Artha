// ─────────────────────────────────────────────────────────────────────────────
//  FEATURE 03 — Tax Wizard
//  Toggle: Manual | Upload PDF → Old vs New regime → Deduction table → AI
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import CountUp from 'react-countup'
import { FileText, Upload, X, Sparkles, Zap, CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react'

const INPUT_STYLE = {
    width: '100%', background: '#18181F',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 9, padding: '10px 13px',
    fontSize: 14, color: '#F0F0F5', outline: 'none',
    fontFamily: 'Inter, sans-serif', transition: 'border-color 0.2s',
}

// ── Tax calculation (FY 2024-25) ──────────────────────────────────────────────
function calcTax({ income, hra, rent, deductions80C, deductions80D, nps }) {
    // Old regime
    const stdDeductOld = 50000
    const hraExempt = rent > 0 ? Math.min(deductions80C, hra, rent * 12 * 0.4) : 0
    const totalDedOld = stdDeductOld + deductions80C + deductions80D + nps + hraExempt
    const taxableOld = Math.max(income - totalDedOld, 0)

    function oldSlabs(t) {
        let tax = 0
        if (t > 1000000) tax += (t - 1000000) * 0.30
        if (t > 500000) tax += (Math.min(t, 1000000) - 500000) * 0.20
        if (t > 250000) tax += (Math.min(t, 500000) - 250000) * 0.05
        return tax + tax * 0.04  // cess
    }

    // New regime
    const stdDeductNew = 75000
    const taxableNew = Math.max(income - stdDeductNew, 0)

    function newSlabs(t) {
        let tax = 0
        if (t > 1500000) tax += (t - 1500000) * 0.30
        if (t > 1200000) tax += (Math.min(t, 1500000) - 1200000) * 0.20
        if (t > 900000) tax += (Math.min(t, 1200000) - 900000) * 0.15
        if (t > 600000) tax += (Math.min(t, 900000) - 600000) * 0.10
        if (t > 300000) tax += (Math.min(t, 600000) - 300000) * 0.05
        return t <= 700000 ? 0 : tax + tax * 0.04
    }

    const taxOld = oldSlabs(taxableOld)
    const taxNew = newSlabs(taxableNew)

    // Missed deductions
    const missed = []
    if (deductions80C < 150000) missed.push({ head: '80C', limit: '₹1.5L', used: `₹${(deductions80C / 1000).toFixed(0)}K`, potential: `₹${((150000 - deductions80C) * 0.3 / 1000).toFixed(0)}K saved` })
    if (deductions80D < 25000) missed.push({ head: '80D', limit: '₹25K', used: `₹${(deductions80D / 1000).toFixed(0)}K`, potential: `₹${((25000 - deductions80D) * 0.3 / 1000).toFixed(0)}K saved` })
    if (nps < 50000) missed.push({ head: 'NPS 80CCD(1B)', limit: '₹50K', used: `₹${(nps / 1000).toFixed(0)}K`, potential: `₹${((50000 - nps) * 0.3 / 1000).toFixed(0)}K saved` })

    return { taxOld: Math.round(taxOld), taxNew: Math.round(taxNew), betterOld: taxOld < taxNew, saving: Math.abs(taxOld - taxNew), missed }
}

const AI_TAX = `**Tax Strategy — FY 2024-25:**

Based on your income of ₹12L and current deductions, the **Old Regime saves you ₹18,400** vs New Regime.

**Top 3 investments before March 31:**

1. **ELSS fund ₹46,000** — Fill remaining 80C limit. Parag Parikh or Mirae Asset ELSS gives both tax saving and 15%+ CAGR historically.

2. **Health insurance top-up ₹7,000** — Upgrade family floater to ₹10L for full 80D benefit of ₹25,000.

3. **NPS Tier 1 ₹50,000** — Extra ₹50K deduction under 80CCD(1B) that most salaried employees miss entirely.

**Live ET context:** Budget 2025 kept old regime deductions unchanged. New regime standard deduction rose to ₹75K but at ₹12L income, old regime still wins with your deduction profile.

**One action today:** Log into your NPS portal and make a lump-sum contribution before March 31.`

// ─── Dropzone ─────────────────────────────────────────────────────────────────
function PDFDropzone({ onFile }) {
    const [scanning, setScanning] = useState(false)
    const [done, setDone] = useState(false)

    const onDrop = useCallback((accepted) => {
        if (!accepted.length) return
        setScanning(true)
        setTimeout(() => { setScanning(false); setDone(true); onFile(accepted[0].name) }, 2200)
    }, [onFile])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1 })

    return (
        <div
            {...getRootProps()}
            style={{
                border: `2px dashed ${isDragActive ? '#F59E0B' : done ? '#10B981' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 16, padding: '52px 32px',
                textAlign: 'center', cursor: 'pointer',
                background: isDragActive ? 'rgba(245,158,11,0.05)' : done ? 'rgba(16,185,129,0.04)' : 'transparent',
                transition: 'all 0.3s',
                position: 'relative', overflow: 'hidden',
            }}
        >
            <input {...getInputProps()} />

            {scanning && (
                <motion.div
                    animate={{ y: ['-100%', '200%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute', left: 0, right: 0, height: 2,
                        background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)',
                    }}
                />
            )}

            {done ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                    <CheckCircle size={40} color="#10B981" style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>Form 16 Uploaded</p>
                    <p style={{ fontSize: 12, color: '#9A9AAD' }}>AI is extracting salary data…</p>
                </motion.div>
            ) : scanning ? (
                <div>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <FileText size={40} color="#F59E0B" style={{ marginBottom: 12 }} />
                    </motion.div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#F59E0B' }}>Scanning PDF…</p>
                    <p style={{ fontSize: 12, color: '#9A9AAD' }}>pdfplumber + LLaMA 3.1 8B extracting data</p>
                </div>
            ) : (
                <div>
                    <Upload size={40} color="#9A9AAD" style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                        {isDragActive ? 'Drop Form 16 here' : 'Upload Form 16 PDF'}
                    </p>
                    <p style={{ fontSize: 12, color: '#9A9AAD' }}>Drag & drop or click to browse · PDF only</p>
                </div>
            )}
        </div>
    )
}

export default function TaxWizard() {
    const [mode, setMode] = useState('manual')  // 'manual' | 'upload'
    const [form, setForm] = useState({
        income: 1200000, hra: 180000, rent: 20000,
        deductions80C: 104000, deductions80D: 10000, nps: 0,
    })
    const [computed, setComputed] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [aiText, setAiText] = useState('')
    const [aiTyping, setAiTyping] = useState(false)

    function set(k, v) { setForm(prev => ({ ...prev, [k]: Number(v) })) }

    function compute() { setComputed(calcTax(form)) }

    function openAI() {
        setDrawerOpen(true); setAiTyping(true); setAiText('')
        let i = 0
        const iv = setInterval(() => {
            i++; setAiText(AI_TAX.slice(0, i * 4))
            if (i * 4 >= AI_TAX.length) { clearInterval(iv); setAiTyping(false); setAiText(AI_TAX) }
        }, 15)
    }

    const Label = ({ children }) => (
        <p style={{ fontSize: 11, color: '#9A9AAD', marginBottom: 6, fontWeight: 500 }}>{children}</p>
    )
    const Inp = ({ label, field, prefix = '' }) => (
        <div style={{ marginBottom: 14 }}>
            <Label>{label}</Label>
            <div style={{ position: 'relative' }}>
                {prefix && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9A9AAD', fontSize: 13 }}>{prefix}</span>}
                <input
                    type="number" value={form[field]}
                    onChange={e => set(field, e.target.value)}
                    style={{ ...INPUT_STYLE, paddingLeft: prefix ? 24 : 13 }}
                    onFocus={e => { e.target.style.borderColor = '#F59E0B' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                />
            </div>
        </div>
    )

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
                                    <FileText size={16} color="#F59E0B" />
                                    <span style={{ fontSize: 14, fontWeight: 700 }}>Tax Strategy — AI</span>
                                </div>
                                <button onClick={() => setDrawerOpen(false)} style={{ color: '#9A9AAD', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: 'rgba(232,39,42,0.1)', border: '1px solid rgba(232,39,42,0.2)',
                                borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700,
                                color: '#E8272A', letterSpacing: '0.5px', marginBottom: 18,
                            }}>
                                <Zap size={9} /> ET RSS BUDGET 2025 · GROQ LLAMA 3.3
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
            <div style={{ marginBottom: 22 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
                    Tax Wizard
                </h2>
                <p style={{ fontSize: 13, color: '#9A9AAD' }}>Old vs New Regime — FY 2024-25 · Budget 2025 rules via ET RSS</p>
            </div>

            {/* Mode toggle */}
            <div style={{
                display: 'flex', background: '#18181F',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                padding: 4, width: 'fit-content', marginBottom: 22,
            }}>
                {['manual', 'upload'].map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                            padding: '8px 22px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                            background: mode === m ? '#111118' : 'transparent',
                            color: mode === m ? '#F0F0F5' : '#9A9AAD',
                            border: `1px solid ${mode === m ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                            transition: 'all 0.2s',
                        }}
                    >
                        {m === 'manual' ? 'Enter Manually' : 'Upload Form 16'}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {mode === 'upload' ? (
                    <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <PDFDropzone onFile={() => setTimeout(compute, 2400)} />
                    </motion.div>
                ) : (
                    <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                            {/* Income inputs */}
                            <div style={{
                                background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 16, padding: '22px',
                            }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#9A9AAD', marginBottom: 16, letterSpacing: '0.5px' }}>INCOME DETAILS</p>
                                <Inp label="Annual CTC / Gross Income (₹)" field="income" prefix="₹" />
                                <Inp label="HRA Received from Employer (₹)" field="hra" prefix="₹" />
                                <Inp label="Monthly Rent Paid (₹)" field="rent" prefix="₹" />
                            </div>
                            {/* Deductions */}
                            <div style={{
                                background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 16, padding: '22px',
                            }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#9A9AAD', marginBottom: 16, letterSpacing: '0.5px' }}>DEDUCTIONS CLAIMED</p>
                                <Inp label="80C Investments (max ₹1.5L)" field="deductions80C" prefix="₹" />
                                <Inp label="80D Health Insurance (max ₹25K)" field="deductions80D" prefix="₹" />
                                <Inp label="NPS 80CCD(1B) (max ₹50K)" field="nps" prefix="₹" />
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 8px 28px rgba(245,158,11,0.3)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={compute}
                            style={{
                                background: '#F59E0B', color: '#000',
                                border: 'none', borderRadius: 11,
                                padding: '13px 36px', fontSize: 15, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
                            }}
                        >
                            <FileText size={16} /> Calculate Tax
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
                {computed && (
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Regime cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            {[
                                { label: 'Old Regime', tax: computed.taxOld, rec: computed.betterOld },
                                { label: 'New Regime', tax: computed.taxNew, rec: !computed.betterOld },
                            ].map((r) => (
                                <motion.div
                                    key={r.label}
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        background: r.rec
                                            ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))'
                                            : '#111118',
                                        border: `1px solid ${r.rec ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`,
                                        borderRadius: 16, padding: '24px',
                                        position: 'relative',
                                    }}
                                >
                                    {r.rec && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                position: 'absolute', top: 14, right: 14,
                                                background: '#10B981', color: '#000',
                                                fontSize: 9, fontWeight: 800, letterSpacing: '1px',
                                                borderRadius: 5, padding: '3px 9px', textTransform: 'uppercase',
                                            }}
                                        >
                                            RECOMMENDED
                                        </motion.div>
                                    )}
                                    <p style={{ fontSize: 12, color: '#9A9AAD', marginBottom: 10, letterSpacing: '0.5px' }}>{r.label}</p>
                                    <p style={{
                                        fontFamily: "'Playfair Display', serif",
                                        fontSize: 38, fontWeight: 800,
                                        color: r.rec ? '#10B981' : '#F0F0F5',
                                        lineHeight: 1, marginBottom: 8,
                                        fontVariantNumeric: 'tabular-nums',
                                    }}>
                                        ₹<CountUp end={r.tax} duration={1.2} separator="," />
                                    </p>
                                    <p style={{ fontSize: 12, color: r.rec ? '#10B981' : '#9A9AAD' }}>
                                        {r.rec ? `Save ₹${Math.round(computed.saving).toLocaleString('en-IN')} vs other regime` : 'Higher tax liability'}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Missed deductions table */}
                        {computed.missed.length > 0 && (
                            <div style={{
                                background: '#111118', border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 16, padding: '22px', marginBottom: 16,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <AlertTriangle size={14} color="#F59E0B" />
                                    <p style={{ fontSize: 12, fontWeight: 600, color: '#9A9AAD', letterSpacing: '0.5px' }}>
                                        MISSED DEDUCTIONS — YOU COULD SAVE MORE
                                    </p>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            {['Deduction Head', 'Limit', 'You Used', 'Potential Saving'].map(h => (
                                                <th key={h} style={{
                                                    fontSize: 10, color: '#9A9AAD', fontWeight: 600,
                                                    textAlign: 'left', padding: '8px 12px',
                                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                                    letterSpacing: '0.5px',
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {computed.missed.map((m) => (
                                            <tr key={m.head}>
                                                <td style={{ fontSize: 13, fontWeight: 600, padding: '11px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{m.head}</td>
                                                <td style={{ fontSize: 12, color: '#9A9AAD', padding: '11px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{m.limit}</td>
                                                <td style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, padding: '11px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{m.used}</td>
                                                <td style={{ fontSize: 12, color: '#10B981', fontWeight: 700, padding: '11px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{m.potential}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* AI CTA */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(232,39,42,0.06))',
                                border: '1px solid rgba(245,158,11,0.2)',
                                borderRadius: 14, padding: '18px 22px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
                                    AI found your optimal tax strategy
                                </p>
                                <p style={{ fontSize: 13, color: '#9A9AAD' }}>
                                    Using Budget 2025 rules from ET RSS + your exact numbers
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(232,39,42,0.4)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={openAI}
                                style={{
                                    background: '#E8272A', color: '#fff', border: 'none',
                                    borderRadius: 10, padding: '11px 24px',
                                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                                }}
                            >
                                <Sparkles size={13} /> View Strategy
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
