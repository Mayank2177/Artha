// ─────────────────────────────────────────────────────────────────────────────
//  FEATURE 05 — Couple's Money Planner
//  Partner A + B inputs → Joint net worth + HRA opt + tax routing + AI
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CountUp from 'react-countup'
import { Users, Sparkles, X, Zap, Heart, TrendingUp, Shield, IndianRupee, CheckCircle } from 'lucide-react'

const API_BASE = 'http://localhost:8000/api'

const INPUT_STYLE = {
    width: '100%', background: '#18181F',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 9, padding: '10px 13px',
    fontSize: 14, color: '#F0F0F5', outline: 'none',
    fontFamily: 'Inter, sans-serif', transition: 'border-color 0.2s',
}

// ── Calculations ──────────────────────────────────────────────────────────────
function calcCouple(a, b) {
    // HRA optimization — give to the one with higher HRA exemption
    const hraA = Math.min(a.hra, a.rent * 12 * 0.4, a.income * 0.5)
    const hraB = Math.min(b.hra, b.rent * 12 * 0.4, b.income * 0.5)
    const hraBetter = hraA >= hraB ? 'A' : 'B'
    const hraSaving = Math.abs(hraA - hraB) * 0.3

    // 80C routing — put in higher bracket person
    const higherBracket = a.income >= b.income ? 'A' : 'B'
    const lowerBracket = a.income < b.income ? 'A' : 'B'
    const routingSaving = Math.round((a.savings80C + b.savings80C) * 0.3 * 0.05)

    // Insurance
    const insuranceNeededA = a.income * 10
    const insuranceNeededB = b.income * 10
    const insuranceGapA = Math.max(insuranceNeededA - a.insurance, 0)
    const insuranceGapB = Math.max(insuranceNeededB - b.insurance, 0)

    // Net worth
    const netWorth = (a.savings + b.savings + a.investments + b.investments) - (a.debt + b.debt)

    // Projection (10yr, 12% CAGR)
    const projection = netWorth * Math.pow(1.12, 10)

    return {
        hraBetter, hraSaving: Math.round(hraSaving),
        higherBracket, routingSaving,
        insuranceGapA, insuranceGapB,
        netWorth, projection: Math.round(projection),
        combinedIncome: a.income + b.income,
        combinedSIP: Math.round((a.income + b.income) * 0.15 / 12),
    }
}

const AI_COUPLE = `**Joint Financial Strategy — Arjun & Priya:**

**HRA Optimization:**
Priya's HRA exemption (₹1.62L) is higher than Arjun's (₹1.44L). Ensure Priya is claiming HRA in her ITR. Annual saving: ₹5,400 at 30% bracket.

**80C Routing:**
At Arjun's ₹12L income, his marginal rate is 30%. Route all 80C investments (ELSS, PPF, ELSS) through Arjun's name first — each ₹1L saves ₹30,000 vs ₹20,000 if in Priya's name.

**Insurance gap:**
Arjun needs ₹1.2 Cr term cover (has ₹50L). Priya needs ₹80L (has ₹0). Combined premium at today's rates: ~₹2,100/mo for both.

**Joint SIP strategy:**
Combined SIP of ₹28,500/mo → Split 70/30. Arjun: equity heavy (age 32). Priya: balanced (age 29).

**10-year projection:**
Combined net worth grows from ₹18.4L to ₹87L+ at 12% CAGR — assuming 10% annual SIP step-up.`

export default function CouplePlanner() {
    const [partnerA, setPartnerA] = useState({
        name: 'Arjun', income: 1200000, hra: 180000, rent: 18000,
        savings80C: 104000, insurance: 5000000, savings: 800000, investments: 600000, debt: 200000,
    })
    const [partnerB, setPartnerB] = useState({
        name: 'Priya', income: 900000, hra: 135000, rent: 18000,
        savings80C: 60000, insurance: 0, savings: 400000, investments: 250000, debt: 0,
    })
    const [computed, setComputed] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [aiText, setAiText] = useState('')
    const [aiTyping, setAiTyping] = useState(false)
    const [loading, setLoading] = useState(false)

    function setA(k, v) { setPartnerA(p => ({ ...p, [k]: isNaN(Number(v)) ? v : Number(v) })) }
    function setB(k, v) { setPartnerB(p => ({ ...p, [k]: isNaN(Number(v)) ? v : Number(v) })) }

    function compute() { setComputed(calcCouple(partnerA, partnerB)) }

    function openAI() {
        setDrawerOpen(true); setAiTyping(true); setAiText(''); setLoading(true)

        // Map frontend fields to backend CouplesInput schema
        const payload = {
            partner_a: {
                name: partnerA.name,
                annual_income: partnerA.income,
                tax_bracket: partnerA.income >= 1000000 ? 0.30 : partnerA.income >= 500000 ? 0.20 : 0.05,
                basic_salary: Math.round(partnerA.income * 0.5),
                hra_received: partnerA.hra,
                annual_rent_paid: partnerA.rent * 12,
                is_metro: true,
                section_80c_invested: partnerA.savings80C,
                nps_invested: 0,
                existing_life_cover: partnerA.insurance,
                existing_health_cover: 500000,
                assets: partnerA.savings + partnerA.investments,
                liabilities: partnerA.debt,
            },
            partner_b: {
                name: partnerB.name,
                annual_income: partnerB.income,
                tax_bracket: partnerB.income >= 1000000 ? 0.30 : partnerB.income >= 500000 ? 0.20 : 0.05,
                basic_salary: Math.round(partnerB.income * 0.5),
                hra_received: partnerB.hra,
                annual_rent_paid: partnerB.rent * 12,
                is_metro: true,
                section_80c_invested: partnerB.savings80C,
                nps_invested: 0,
                existing_life_cover: partnerB.insurance,
                existing_health_cover: 300000,
                assets: partnerB.savings + partnerB.investments,
                liabilities: partnerB.debt,
            },
        }

        fetch(`${API_BASE}/couples-planner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(data => {
                setLoading(false)
                const advice = data.ai_advice || AI_COUPLE
                let i = 0
                const iv = setInterval(() => {
                    i++; setAiText(advice.slice(0, i * 4))
                    if (i * 4 >= advice.length) { clearInterval(iv); setAiTyping(false); setAiText(advice) }
                }, 14)
            })
            .catch(err => {
                console.error('Couples API error:', err)
                setLoading(false)
                // Fallback to mock
                let i = 0
                const iv = setInterval(() => {
                    i++; setAiText(AI_COUPLE.slice(0, i * 4))
                    if (i * 4 >= AI_COUPLE.length) { clearInterval(iv); setAiTyping(false); setAiText(AI_COUPLE) }
                }, 14)
            })
    }

    const Label = ({ children }) => (
        <p style={{ fontSize: 11, color: '#9A9AAD', marginBottom: 6, fontWeight: 500 }}>{children}</p>
    )

    const PartnerForm = ({ partner, set, color, label }) => (
        <div style={{
            background: '#111118', border: `1px solid ${color}22`,
            borderRadius: 18, padding: '24px',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                paddingBottom: 18, marginBottom: 18,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${color}20`, border: `1px solid ${color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color,
                }}>
                    {label}
                </div>
                <div>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>Partner {label}</p>
                    <input
                        value={partner.name}
                        onChange={e => set('name', e.target.value)}
                        style={{
                            background: 'none', border: 'none', outline: 'none',
                            fontSize: 11, color: '#9A9AAD', fontFamily: 'Inter, sans-serif',
                            width: 100,
                        }}
                    />
                </div>
            </div>

            {/* Fields */}
            {[
                { label: 'Annual Income (₹)', field: 'income' },
                { label: 'HRA from Employer (₹)', field: 'hra' },
                { label: 'Monthly Rent Paid (₹)', field: 'rent' },
                { label: '80C Investments (₹)', field: 'savings80C' },
                { label: 'Term Insurance Cover (₹)', field: 'insurance' },
            ].map(({ label, field }) => (
                <div key={field} style={{ marginBottom: 12 }}>
                    <Label>{label}</Label>
                    <input
                        type="number" value={partner[field]}
                        onChange={e => set(field, e.target.value)}
                        style={INPUT_STYLE}
                        onFocus={e => { e.target.style.borderColor = color }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    />
                </div>
            ))}

            <p style={{ fontSize: 11, color: '#9A9AAD', marginBottom: 6, fontWeight: 500, marginTop: 16 }}>NET WORTH INPUTS</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                    { label: 'Savings', field: 'savings' },
                    { label: 'Investments', field: 'investments' },
                    { label: 'Debt/Loans', field: 'debt' },
                ].map(({ label, field }) => (
                    <div key={field}>
                        <Label>{label}</Label>
                        <input
                            type="number" value={partner[field]}
                            onChange={e => set(field, e.target.value)}
                            style={{ ...INPUT_STYLE, fontSize: 12, padding: '8px 10px' }}
                            onFocus={e => { e.target.style.borderColor = color }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)' }}
                        />
                    </div>
                ))}
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
                                    <Heart size={16} color="#8B5CF6" />
                                    <span style={{ fontSize: 14, fontWeight: 700 }}>Joint Strategy — AI</span>
                                </div>
                                <button onClick={() => setDrawerOpen(false)} style={{ color: '#9A9AAD', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                                borderRadius: 6, padding: '3px 10px',
                                fontSize: 10, fontWeight: 700, color: '#8B5CF6',
                                letterSpacing: '0.5px', marginBottom: 18,
                            }}>
                                <Zap size={9} /> JOINT OPTIMIZATION · GROQ LLAMA 3.3
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
                    Couple's Money Planner
                </h2>
                <p style={{ fontSize: 13, color: '#9A9AAD' }}>India's first AI joint financial planner — optimize both incomes simultaneously</p>
            </div>

            {/* Dual column */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                <PartnerForm partner={partnerA} set={setA} color="#E8272A" label="A" />
                <PartnerForm partner={partnerB} set={setB} color="#8B5CF6" label="B" />
            </div>

            {/* Calculate button */}
            <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 8px 28px rgba(139,92,246,0.35)' }}
                whileTap={{ scale: 0.98 }}
                onClick={compute}
                style={{
                    width: '100%', marginBottom: 20,
                    background: 'linear-gradient(135deg, #E8272A, #8B5CF6)',
                    color: '#fff', border: 'none', borderRadius: 11,
                    padding: '14px', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
            >
                <Users size={16} /> Calculate Joint Plan
            </motion.button>

            {/* Results */}
            <AnimatePresence>
                {computed && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Net worth hero */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(232,39,42,0.08), rgba(139,92,246,0.08))',
                            border: '1px solid rgba(139,92,246,0.2)',
                            borderRadius: 18, padding: '32px',
                            textAlign: 'center', marginBottom: 18,
                            position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.08), transparent 70%)',
                                pointerEvents: 'none',
                            }} />
                            <p style={{ fontSize: 11, color: '#9A9AAD', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>
                                Combined Net Worth
                            </p>
                            <motion.p
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                                style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 900,
                                    color: '#10B981', lineHeight: 1, letterSpacing: '-2px',
                                    fontVariantNumeric: 'tabular-nums', marginBottom: 8,
                                }}
                            >
                                ₹<CountUp end={computed.netWorth / 100000} duration={1.5} decimals={1} />L
                            </motion.p>
                            <p style={{ fontSize: 13, color: '#9A9AAD' }}>
                                → Projects to{' '}
                                <strong style={{ color: '#8B5CF6' }}>
                                    ₹{(computed.projection / 100000).toFixed(0)}L
                                </strong>
                                {' '}in 10 years at 12% CAGR
                            </p>
                        </div>

                        {/* Optimization cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 18 }}>
                            {[
                                {
                                    icon: IndianRupee, color: '#F59E0B',
                                    title: 'HRA Optimization',
                                    value: `₹${computed.hraSaving.toLocaleString('en-IN')}/yr`,
                                    detail: `Partner ${computed.hraBetter} should claim HRA — higher exemption`,
                                },
                                {
                                    icon: TrendingUp, color: '#10B981',
                                    title: '80C Routing',
                                    value: `₹${computed.routingSaving.toLocaleString('en-IN')}/yr`,
                                    detail: `Route through Partner ${computed.higherBracket} — higher tax bracket saves more`,
                                },
                                {
                                    icon: Shield, color: '#EF4444',
                                    title: 'Insurance Gap',
                                    value: `₹${((computed.insuranceGapA + computed.insuranceGapB) / 100000).toFixed(0)}L`,
                                    detail: `Combined term cover needed — ₹${(computed.insuranceGapA / 100000).toFixed(0)}L + ₹${(computed.insuranceGapB / 100000).toFixed(0)}L`,
                                },
                                {
                                    icon: Users, color: '#8B5CF6',
                                    title: 'Recommended Joint SIP',
                                    value: `₹${computed.combinedSIP.toLocaleString('en-IN')}/mo`,
                                    detail: `15% of combined income — auto-debit on salary day`,
                                },
                            ].map((card, i) => {
                                const Icon = card.icon
                                return (
                                    <motion.div
                                        key={card.title}
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        style={{
                                            background: '#111118',
                                            border: `1px solid ${card.color}22`,
                                            borderRadius: 14, padding: '20px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                            <div style={{
                                                width: 30, height: 30, borderRadius: 8,
                                                background: `${card.color}18`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Icon size={14} color={card.color} strokeWidth={2} />
                                            </div>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: '#9A9AAD' }}>{card.title}</p>
                                        </div>
                                        <p style={{
                                            fontFamily: "'Playfair Display', serif",
                                            fontSize: 24, fontWeight: 800,
                                            color: card.color, marginBottom: 6,
                                        }}>
                                            {card.value}
                                        </p>
                                        <p style={{ fontSize: 12, color: '#9A9AAD', lineHeight: 1.5 }}>{card.detail}</p>
                                    </motion.div>
                                )
                            })}
                        </div>

                        {/* AI CTA */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(232,39,42,0.06))',
                                border: '1px solid rgba(139,92,246,0.25)',
                                borderRadius: 14, padding: '18px 22px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
                                    Joint financial strategy ready
                                </p>
                                <p style={{ fontSize: 13, color: '#9A9AAD' }}>
                                    AI has optimized HRA, 80C, insurance and SIP routing for both incomes
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(139,92,246,0.4)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={openAI}
                                style={{
                                    background: '#8B5CF6', color: '#fff', border: 'none',
                                    borderRadius: 10, padding: '11px 24px',
                                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 7,
                                    fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                                }}
                            >
                                <Sparkles size={13} /> View Joint Strategy
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
