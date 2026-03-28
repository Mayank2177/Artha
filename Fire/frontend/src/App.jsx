import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────
const C = {
  bg: '#0c0f0a', surface: '#141a10', surface2: '#1c251a',
  border: '#2a3526', accent: '#7ec44f', accent2: '#b5e87a',
  accentDim: '#3d6228', gold: '#e8c96e', red: '#e87070',
  blue: '#70abe8', text: '#e8ead6', textDim: '#8a9680', textMuted: '#4a5544',
}

// ─── STYLES (JS objects — zero import issues) ─────────────────────────────
const S = {
  // Layout
  app:    { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${C.border}`, background: `linear-gradient(90deg, ${C.bg}, ${C.surface})`, position: 'sticky', top: 0, zIndex: 100 },
  body:   { display: 'grid', gridTemplateColumns: '400px 1fr', minHeight: 'calc(100vh - 62px)' },
  // Left panel
  left:   { borderRight: `1px solid ${C.border}`, padding: '24px 20px', background: C.surface, overflowY: 'auto', maxHeight: 'calc(100vh - 62px)', position: 'sticky', top: 62 },
  // Right panel
  right:  { padding: '24px 28px', overflowY: 'auto' },
  // Cards
  card:   { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px', position: 'relative', overflow: 'hidden' },
  // Form elements
  label:  { fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: C.textDim, fontWeight: 500, display: 'block', marginBottom: 4 },
  input:  { background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: '8px 10px', borderRadius: 6, fontSize: 13, outline: 'none', width: '100%', fontFamily: "'DM Sans', sans-serif" },
  // Section title
  sectionTitle: { fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: C.textDim, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}`, fontWeight: 500 },
  // Buttons
  addGoalBtn: { width: '100%', padding: 10, background: 'transparent', border: `1px dashed ${C.border}`, color: C.textDim, borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', marginBottom: 12, fontFamily: "'DM Sans', sans-serif" },
  submitBtn:  { width: '100%', padding: '13px 0', background: `linear-gradient(135deg, ${C.accentDim}, #2d4f1a)`, border: `1px solid ${C.accentDim}`, color: C.accent2, borderRadius: 8, fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3 },
}

// ─── FIRE MATH ────────────────────────────────────────────────────────────
function fmtINR(n) {
  if (!n || isNaN(n)) return '₹0'
  const a = Math.abs(n), s = n < 0 ? '-' : ''
  if (a >= 1e7) return `${s}₹${(a/1e7).toFixed(2)} Cr`
  if (a >= 1e5) return `${s}₹${(a/1e5).toFixed(1)} L`
  return `${s}₹${Math.round(a).toLocaleString('en-IN')}`
}

function computeProfile(inputs, inflation = 0.05) {
  const { age, retireAge, income, expenses, savings, insurance, goals } = inputs
  const cy = new Date().getFullYear(), CAGR = 0.12
  const surplus      = income - expenses
  const emergency    = expenses * 6
  const insGap       = Math.max(0, income * 12 * 10 - insurance)
  const equityPct    = Math.max(0, Math.min(100, 100 - age))
  const fireCorpus   = expenses * 12 * 25
  const yearsToFire  = retireAge - age
  const debt         = Math.round((100 - equityPct) * 0.5)
  const gold         = Math.round((100 - equityPct) * 0.3)
  const liquid       = 100 - equityPct - debt - gold

  const processedGoals = (goals || []).map(g => {
    const yrs    = (g.year || cy) - cy
    const corpus = yrs > 0 ? g.amount * Math.pow(1 + inflation, yrs) : g.amount
    const r      = CAGR / 12, m = yrs * 12
    const sip    = (yrs > 0 && m > 0) ? corpus * r / (Math.pow(1+r, m) - 1) : 0
    const gap    = corpus - savings * Math.pow(1 + CAGR, yrs)
    return { ...g, yrs, corpus, sip, gap, funded: gap <= 0 }
  })

  const totalSIP  = processedGoals.reduce((s, g) => s + g.sip, 0)
  const projYears = Math.min(Math.max(yearsToFire, 10), 40)

  const growthData = Array.from({ length: projYears + 1 }, (_, i) => {
    const cg = savings * Math.pow(1 + CAGR, i)
    const sg = totalSIP > 0 ? totalSIP * (Math.pow(1 + CAGR/12, i*12) - 1) / (CAGR/12) : 0
    return { year: cy + i, value: Math.round(cg + sg) }
  })

  return { surplus, emergency, insGap, equityPct, fireCorpus, yearsToFire, totalSIP, processedGoals, alloc: { equity: equityPct, debt, gold, liquid }, growthData }
}

// ─── GOAL TYPES ───────────────────────────────────────────────────────────
const GOAL_TYPES = ['Retirement','Home Purchase','Child Education','Wedding','Travel','Vehicle','Business','Other']
const GOAL_COLORS = ['#7ec44f','#e8c96e','#70abe8','#e87070','#b5e87a','#e8a870','#a870e8','#8a9680']
let _gid = 0
const newGoal = (o={}) => ({ id: ++_gid, type: 'Home Purchase', amount: 0, year: new Date().getFullYear()+8, ...o })

// ─── API CALLS ────────────────────────────────────────────────────────────
async function apiFetch(path, body) {
  const opts = body ? { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) } : {}
  const r = await fetch(path, opts)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// ═══════════════════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  )
}

function Input({ ...props }) {
  return <input style={S.input} {...props} />
}

function SectionTitle({ children }) {
  return <p style={S.sectionTitle}>{children}</p>
}

// ─── HEADER ───────────────────────────────────────────────────────────────
function Header({ market, loading }) {
  return (
    <header style={S.header}>
      <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:C.accent2 }}>Artha</span>
        <span style={{ fontSize:11, color:C.textDim, letterSpacing:'2px', textTransform:'uppercase' }}>FIRE Path Planner</span>
      </div>
      <div style={{ display:'flex', gap:24 }}>
        {[
          ['Repo Rate', loading ? '...' : `${market?.repo ?? 6.25}%`],
          ['CPI Inflation', loading ? '...' : `${market?.cpi ?? 4.6}%`],
          ['Nifty 50', loading ? '...' : `₹${market?.nifty ?? '23,800'}`],
        ].map(([k,v]) => (
          <div key={k} style={{ display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
            <span style={{ fontSize:9, color:C.textMuted, letterSpacing:'1.5px', textTransform:'uppercase' }}>{k}</span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:13, color:C.accent }}>{v}</span>
          </div>
        ))}
      </div>
    </header>
  )
}

// ─── PROFILE FORM ─────────────────────────────────────────────────────────
function ProfileForm({ inputs, onChange, goals, onAddGoal, onRemoveGoal, onGoalChange, onSubmit, busy }) {
  const cy = new Date().getFullYear()

  return (
    <aside style={S.left}>
      <SectionTitle>Your Profile</SectionTitle>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:22 }}>
        {[
          ['age','Age','28','number'],
          ['retireAge','Target Retire Age','50','number'],
          ['income','Monthly Income (₹)','120000','number'],
          ['expenses','Monthly Expenses (₹)','65000','number'],
          ['savings','Existing Savings (₹)','800000','number'],
          ['insurance','Insurance Cover (₹)','1500000','number'],
        ].map(([name,label,placeholder,type]) => (
          <Field key={name} label={label}>
            <Input
              type={type} name={name} placeholder={placeholder}
              value={inputs[name] || ''}
              onChange={e => onChange(name, e.target.value)}
            />
          </Field>
        ))}
      </div>

      <SectionTitle>Life Goals</SectionTitle>
      <div style={{ marginBottom:10 }}>
        {goals.length === 0 && (
          <p style={{ fontSize:12, color:C.textMuted, textAlign:'center', padding:'8px 0 14px' }}>
            No goals yet — add one below
          </p>
        )}
        {goals.map((g, i) => {
          const color = GOAL_COLORS[i % GOAL_COLORS.length]
          return (
            <div key={g.id} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:12, marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:10, letterSpacing:'1px', textTransform:'uppercase', padding:'3px 8px', borderRadius:20, background:`${color}22`, color, fontWeight:600 }}>
                  {g.type}
                </span>
                <button onClick={() => onRemoveGoal(g.id)} style={{ background:'none', border:'none', color:C.textMuted, fontSize:18, cursor:'pointer', lineHeight:1 }}>×</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                <Field label="Type">
                  <select value={g.type} onChange={e => onGoalChange(g.id,'type',e.target.value)}
                    style={{ ...S.input, appearance:'none' }}>
                    {GOAL_TYPES.map(t => <option key={t} style={{ background:C.surface2 }}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Amount (₹)">
                  <Input type="number" value={g.amount || ''} placeholder="5000000"
                    onChange={e => onGoalChange(g.id,'amount', Number(e.target.value))} />
                </Field>
                <Field label="Target Year">
                  <Input type="number" value={g.year || ''} placeholder={cy+8}
                    min={cy+1} onChange={e => onGoalChange(g.id,'year', Number(e.target.value))} />
                </Field>
              </div>
            </div>
          )
        })}
      </div>

      <button style={S.addGoalBtn} onClick={onAddGoal}>
        <span style={{ fontSize:18, lineHeight:1 }}>+</span> Add Goal
      </button>

      <button
        style={{ ...S.submitBtn, opacity: busy ? 0.6 : 1, cursor: busy ? 'not-allowed':'pointer' }}
        onClick={onSubmit} disabled={busy}
      >
        {busy ? 'Generating Roadmap…' : 'Generate My FIRE Roadmap →'}
      </button>
    </aside>
  )
}

// ─── METRICS GRID ─────────────────────────────────────────────────────────
function MetricsGrid({ profile }) {
  if (!profile) return null
  const { surplus, emergency, insGap, totalSIP, fireCorpus, equityPct } = profile

  const cards = [
    { label:'Monthly Surplus',      value: fmtINR(surplus),          sub:'available to invest',  color: surplus < 0 ? C.red : C.accent2 },
    { label:'Emergency Fund',       value: fmtINR(emergency),        sub:'6× monthly expenses',  color: C.accent2 },
    { label:'Insurance Gap',        value: fmtINR(insGap),           sub:'10× income − existing',color: insGap > 0 ? C.gold : C.accent },
    { label:'Total Monthly SIP',    value: fmtINR(totalSIP),         sub:'across all goals',     color: C.accent2 },
    { label:'FIRE Corpus Target',   value: fmtINR(fireCorpus),       sub:'25× annual expenses',  color: C.accent2 },
    { label:'Recommended Equity %', value: `${equityPct}%`,          sub:'100 − age rule',       color: C.accent2 },
  ]

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
      {cards.map(c => (
        <div key={c.label} style={{ ...S.card }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.accentDim},transparent)` }} />
          <p style={{ fontSize:9, letterSpacing:'2px', textTransform:'uppercase', color:C.textMuted, marginBottom:6 }}>{c.label}</p>
          <p style={{ fontFamily:"'DM Mono',monospace", fontSize:18, color:c.color, lineHeight:1 }}>{c.value}</p>
          <p style={{ fontSize:10, color:C.textMuted, marginTop:4 }}>{c.sub}</p>
        </div>
      ))}
    </div>
  )
}

// ─── GOALS TABLE ──────────────────────────────────────────────────────────
function GoalsTable({ goals }) {
  if (!goals || goals.length === 0) return null
  return (
    <div style={{ ...S.card, marginBottom:24, padding:0 }}>
      <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15 }}>Goal Analysis</span>
        <span style={{ fontSize:11, color:C.textMuted }}>live calculations</span>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['Goal','Years Left','Corpus Needed','Monthly SIP','Status'].map(h => (
                <th key={h} style={{ fontSize:9, letterSpacing:'1.5px', textTransform:'uppercase', color:C.textMuted, padding:'10px 18px', textAlign:'left', borderBottom:`1px solid ${C.border}`, background:C.surface2, whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {goals.map((g, i) => {
              const color = GOAL_COLORS[i % GOAL_COLORS.length]
              const st = g.funded
                ? { text:'✓ Funded',      bg:`rgba(126,196,79,0.1)`,   fg:C.accent }
                : g.sip > 0
                  ? { text:'~ Feasible',  bg:`rgba(232,201,110,0.1)`,  fg:C.gold }
                  : { text:'⚠ Underfunded',bg:`rgba(232,112,112,0.1)`, fg:C.red }

              return (
                <tr key={g.id}>
                  <td style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}22` }}>
                    <span style={{ color, fontWeight:600 }}>{g.type}</span>
                  </td>
                  <td style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}22`, fontSize:13 }}>{g.yrs > 0 ? g.yrs : '—'}</td>
                  <td style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}22`, fontFamily:"'DM Mono',monospace", fontSize:12, color:C.accent }}>{fmtINR(g.corpus)}</td>
                  <td style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}22`, fontFamily:"'DM Mono',monospace", fontSize:12, color:C.accent }}>{fmtINR(g.sip)}/mo</td>
                  <td style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}22` }}>
                    <span style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:20, background:st.bg, color:st.fg }}>{st.text}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── CHARTS ───────────────────────────────────────────────────────────────
function Charts({ profile }) {
  if (!profile) return null
  const { alloc, growthData } = profile

  const pieData = [
    { name:'Equity', value:alloc.equity, color:'#7ec44f' },
    { name:'Debt',   value:alloc.debt,   color:'#70abe8' },
    { name:'Gold',   value:alloc.gold,   color:'#e8c96e' },
    { name:'Liquid', value:alloc.liquid, color:'#4a5544' },
  ].filter(d => d.value > 0)

  const fmtY = v => v >= 1e7 ? `${(v/1e7).toFixed(1)}Cr` : v >= 1e5 ? `${(v/1e5).toFixed(0)}L` : v

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
      {/* Allocation donut */}
      <div style={S.card}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:14, marginBottom:16 }}>Asset Allocation</p>
        {/* Allocation bar */}
        <div style={{ display:'flex', height:8, borderRadius:4, overflow:'hidden', marginBottom:14 }}>
          {pieData.map(d => (
            <div key={d.name} style={{ width:`${d.value}%`, background:d.color, transition:'width 0.5s' }} />
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2}>
              {pieData.map(d => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color:C.textDim, fontSize:11 }}>{v}</span>} />
            <Tooltip formatter={(v,n) => [`${v}%`, n]} contentStyle={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:6, fontSize:12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Growth line */}
      <div style={S.card}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:14, marginBottom:16 }}>Portfolio Growth Projection</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={growthData} margin={{ top:4, right:8, bottom:0, left:8 }}>
            <XAxis dataKey="year" tick={{ fill:C.textMuted, fontSize:10 }} tickLine={false} axisLine={{ stroke:C.border }} interval="preserveStartEnd" />
            <YAxis tickFormatter={fmtY} tick={{ fill:C.textMuted, fontSize:10 }} tickLine={false} axisLine={false} width={40} />
            <Tooltip formatter={v => [fmtINR(v), 'Portfolio']} contentStyle={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:6, fontSize:12 }} labelStyle={{ color:C.textDim }} />
            <Line type="monotone" dataKey="value" stroke={C.accent} strokeWidth={2} dot={false} activeDot={{ r:4, fill:C.accent }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── TIMELINE ─────────────────────────────────────────────────────────────
function Timeline({ goals, inputs, profile }) {
  if (!goals || goals.length === 0) return null
  const cy = new Date().getFullYear()
  const retireYear = cy + (profile?.yearsToFire ?? 0)
  const validGoals = goals.filter(g => g.year > cy)
  if (validGoals.length === 0 && retireYear <= cy) return null

  const allYears = [...validGoals.map(g => g.year), retireYear].filter(y => y > cy)
  if (allYears.length === 0) return null
  const maxY = Math.max(...allYears)
  const range = maxY - cy
  const pct = y => Math.min(94, Math.max(4, ((y - cy) / range) * 100))

  return (
    <div style={{ ...S.card, marginBottom:24, overflowX:'auto' }}>
      <p style={S.sectionTitle}>Goal Timeline</p>
      <div style={{ position:'relative', height:90, minWidth:500 }}>
        {/* Track line */}
        <div style={{ position:'absolute', top:28, left:0, right:0, height:2, background:`linear-gradient(90deg,${C.accentDim},${C.border})`, borderRadius:2 }} />

        {/* Goal markers */}
        {validGoals.map((g, i) => {
          const color = GOAL_COLORS[i % GOAL_COLORS.length]
          const pg = profile?.processedGoals?.find(p => p.id === g.id)
          return (
            <div key={g.id} style={{ position:'absolute', left:`${pct(g.year)}%`, top:0, transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color }}>{g.year}</span>
              <div style={{ width:12, height:12, borderRadius:'50%', background:color, border:`2px solid ${C.bg}`, boxShadow:`0 0 10px ${color}66` }} />
              <span style={{ fontSize:9, color:C.textDim, textAlign:'center', whiteSpace:'nowrap', lineHeight:1.4 }}>
                {g.type}<br/><span style={{ color }}>{pg ? fmtINR(pg.corpus) : ''}</span>
              </span>
            </div>
          )
        })}

        {/* FIRE marker */}
        {retireYear > cy && (
          <div style={{ position:'absolute', left:`${pct(retireYear)}%`, top:0, transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:C.gold }}>{retireYear}</span>
            <div style={{ width:14, height:14, borderRadius:'50%', background:C.gold, border:`2px solid ${C.bg}`, boxShadow:`0 0 12px ${C.gold}66` }} />
            <span style={{ fontSize:9, color:C.textDim, textAlign:'center', whiteSpace:'nowrap', lineHeight:1.4 }}>
              🔥 FIRE<br/><span style={{ color:C.gold }}>{fmtINR(profile?.fireCorpus)}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ROADMAP (AI output) ───────────────────────────────────────────────────
function Roadmap({ roadmap, market, busy, error }) {
  return (
    <div style={{ ...S.card, padding:0 }}>
      {/* Header */}
      <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10, background:`linear-gradient(90deg,${C.surface2},${C.surface})` }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:C.accent, flexShrink:0, animation:'none', boxShadow:`0 0 8px ${C.accent}` }} />
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, flex:1 }}>Artha AI Roadmap</span>
        <span style={{ fontSize:9, letterSpacing:'1.5px', textTransform:'uppercase', padding:'3px 8px', borderRadius:20, background:`rgba(126,196,79,0.1)`, border:`1px solid ${C.accentDim}`, color:C.accent }}>Powered by Claude</span>
      </div>

      <div style={{ padding:20 }}>
        {/* Market context */}
        {market && (
          <div style={{ display:'flex', gap:18, flexWrap:'wrap', alignItems:'center', background:`rgba(126,196,79,0.04)`, border:`1px solid ${C.accentDim}`, borderRadius:8, padding:'10px 14px', marginBottom:18 }}>
            {[['Repo Rate',`${market.repo}%`],['CPI Inflation',`${market.cpi}%`],['Nifty 50',`₹${market.nifty}`]].map(([k,v]) => (
              <div key={k} style={{ display:'flex', gap:6, alignItems:'center' }}>
                <span style={{ fontSize:11, color:C.textMuted }}>{k}</span>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:C.accent }}>{v}</span>
              </div>
            ))}
            <span style={{ marginLeft:'auto', fontSize:10, color:C.accentDim }}>Live market data injected into prompt</span>
          </div>
        )}

        {/* Loading */}
        {busy && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'32px 0', color:C.textDim, fontSize:13 }}>
            <span>Artha AI is crafting your roadmap</span>
            <span style={{ display:'flex', gap:4 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:C.accent, opacity:0.5 }}>●</span>
              ))}
            </span>
          </div>
        )}

        {/* Error */}
        {error && !busy && (
          <div style={{ color:C.red, fontSize:13, padding:16, background:`rgba(232,112,112,0.08)`, borderRadius:8, border:`1px solid rgba(232,112,112,0.2)` }}>
            ⚠ {error}<br /><span style={{ fontSize:11, color:C.textMuted, marginTop:4, display:'block' }}>Make sure the Python backend is running on port 8000.</span>
          </div>
        )}

        {/* Placeholder */}
        {!roadmap && !busy && !error && (
          <p style={{ color:C.textMuted, fontStyle:'italic', fontSize:14, textAlign:'center', padding:'36px 20px', lineHeight:1.7 }}>
            Fill in your profile and goals above, then click<br /><em style={{ color:C.textDim }}>"Generate My FIRE Roadmap"</em> to receive your personalised financial plan.
          </p>
        )}

        {/* Roadmap content */}
        {roadmap && !busy && (
          <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
            <Phase icon="📍" color={C.accentDim} title="Where You Stand">
              <p style={{ fontSize:13.5, lineHeight:1.75, color:'#c8cabc' }}>{roadmap.summary}</p>
            </Phase>

            {roadmap.riskFlags?.length > 0 && (
              <Phase icon="🚩" color="rgba(232,112,112,0.3)" title="Risk Flags">
                {roadmap.riskFlags.map((f, i) => (
                  <div key={i} style={{ background:`rgba(232,112,112,0.08)`, border:`1px solid rgba(232,112,112,0.25)`, borderRadius:6, padding:'9px 13px', fontSize:13, color:C.red, marginBottom:6 }}>⚠ {f}</div>
                ))}
              </Phase>
            )}

            <Phase icon="🌱" title="First 6 Months — Build the Foundation" color={C.accentDim}>
              <BulletList items={roadmap.first6Months} />
            </Phase>

            <Phase icon="📈" title="At the 1-Year Mark" color="rgba(232,201,110,0.3)">
              <BulletList items={roadmap.year1Changes} />
            </Phase>

            <Phase icon="🎯" title="Monthly SIP Breakdown" color="rgba(112,171,232,0.3)">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginTop:8 }}>
                {roadmap.sipBreakdown?.map((s, i) => (
                  <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:12 }}>
                    <p style={{ fontSize:10, color:C.textDim, marginBottom:4 }}>{s.goal}</p>
                    <p style={{ fontFamily:"'DM Mono',monospace", fontSize:16, color:C.accent2 }}>{fmtINR(s.amount)}<span style={{ fontSize:10, color:C.textMuted }}>/mo</span></p>
                    <p style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{s.instrument}</p>
                  </div>
                ))}
              </div>
              {roadmap.budgetAdvice && <p style={{ marginTop:12, fontSize:12, color:C.textMuted, lineHeight:1.6 }}>{roadmap.budgetAdvice}</p>}
            </Phase>

            <Phase icon="🛡" title="Insurance & Protection" color={C.accentDim}>
              <p style={{ fontSize:13.5, lineHeight:1.75, color:'#c8cabc' }}>{roadmap.insuranceRec}</p>
            </Phase>

            <Phase icon="💡" title="Tax-Saving Moves" color="rgba(232,201,110,0.3)">
              <BulletList items={roadmap.taxMoves} />
            </Phase>

            <Phase icon="🔄" title="Asset Allocation Shift Plan" color="rgba(112,171,232,0.3)">
              <p style={{ fontSize:13.5, lineHeight:1.75, color:'#c8cabc' }}>{roadmap.assetPlan}</p>
            </Phase>
          </div>
        )}
      </div>
    </div>
  )
}

function Phase({ icon, color, title, children }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <div style={{ width:30, height:30, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{icon}</div>
        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700 }}>{title}</span>
      </div>
      <div style={{ paddingLeft:40 }}>{children}</div>
    </div>
  )
}

function BulletList({ items }) {
  if (!items) return null
  return (
    <ul style={{ listStyle:'none', padding:0 }}>
      {items.map((a, i) => (
        <li key={i} style={{ padding:'3px 0 3px 16px', position:'relative', fontSize:13.5, lineHeight:1.75, color:'#c8cabc' }}>
          <span style={{ position:'absolute', left:0, color:C.accentDim, fontSize:11 }}>→</span>
          {a}
        </li>
      ))}
    </ul>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
const DEFAULT_INPUTS = { age:30, retireAge:50, income:120000, expenses:65000, savings:800000, insurance:1500000 }

export default function App() {
  const [market,    setMarket]    = useState(null)
  const [mktLoad,   setMktLoad]   = useState(true)
  const [inputs,    setInputs]    = useState(DEFAULT_INPUTS)
  const [goals,     setGoals]     = useState([newGoal({ type:'Home Purchase', amount:5000000, year:new Date().getFullYear()+7 })])
  const [roadmap,   setRoadmap]   = useState(null)
  const [busy,      setBusy]      = useState(false)
  const [aiError,   setAiError]   = useState(null)

  // Fetch market data on mount
  useEffect(() => {
    apiFetch('/api/market')
      .then(d => { setMarket(d); setMktLoad(false) })
      .catch(() => { setMarket({ repo:6.25, cpi:4.6, nifty:'23,800' }); setMktLoad(false) })
  }, [])

  // Live calculations
  const profile = useMemo(
    () => computeProfile({ ...inputs, goals }, (market?.cpi ?? 5) / 100),
    [inputs, goals, market]
  )

  const handleChange = useCallback((name, val) => {
    setInputs(prev => ({ ...prev, [name]: val === '' ? '' : Number(val) }))
  }, [])

  const handleGoalChange = useCallback((id, field, val) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: val } : g))
  }, [])

  const handleSubmit = useCallback(async () => {
    setBusy(true); setRoadmap(null); setAiError(null)
    const payload = {
      age: inputs.age, retire_age: inputs.retireAge,
      income: inputs.income, expenses: inputs.expenses,
      savings: inputs.savings, insurance: inputs.insurance,
      goals: goals.filter(g => g.amount && g.year).map(g => ({ id:g.id, type:g.type, amount:Number(g.amount), year:Number(g.year) }))
    }
    try {
      const res = await apiFetch('/api/roadmap', payload)
      if (res.ok) setRoadmap(res.roadmap)
      else setAiError(res.error ?? 'Unknown error')
    } catch (e) {
      setAiError(e.message)
    }
    setBusy(false)
  }, [inputs, goals])

  return (
    <div style={S.app}>
      <Header market={market} loading={mktLoad} />
      <div style={S.body}>
        <ProfileForm
          inputs={inputs}        onChange={handleChange}
          goals={goals}          onAddGoal={() => setGoals(prev => [...prev, newGoal()])}
          onRemoveGoal={id => setGoals(prev => prev.filter(g => g.id !== id))}
          onGoalChange={handleGoalChange}
          onSubmit={handleSubmit} busy={busy}
        />
        <main style={S.right}>
          <MetricsGrid profile={profile} />
          <GoalsTable  goals={profile.processedGoals} />
          <Charts      profile={profile} />
          <Timeline    goals={goals} inputs={inputs} profile={profile} />
          <Roadmap     roadmap={roadmap} market={market} busy={busy} error={aiError} />
        </main>
      </div>
    </div>
  )
}
