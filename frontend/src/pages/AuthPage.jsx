// ─────────────────────────────────────────────────────────────────────────────
//  AuthPage — Login / Signup with toggle
//  Route: /auth
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, MapPin, Calendar, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react'

const T = {
    bg: '#08080E', surface: '#111118', surface2: '#18181F',
    border: 'rgba(255,255,255,0.07)', borderHover: 'rgba(255,255,255,0.14)',
    text: '#F0F0F5', muted: '#9A9AAD', red: '#E8272A',
    green: '#10B981', danger: '#EF4444',
}

const INPUT_STYLE = {
    width: '100%', background: T.surface2,
    border: `1px solid ${T.border}`,
    borderRadius: 12, padding: '13px 14px 13px 42px',
    color: T.text, fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s',
}

export default function AuthPage() {
    const [mode, setMode] = useState('signup') // 'login' | 'signup'
    const [form, setForm] = useState({ name: '', email: '', password: '', city: '', age: '' })
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { login, signup, user } = useAuth()

    // Redirect to dashboard immediately if user state updates (successful login/signup)
    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true })
        }
    }, [user, navigate])

    function set(k, v) { setForm(prev => ({ ...prev, [k]: v })); setError('') }

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (mode === 'signup') {
            if (!form.name.trim()) { setError('Name is required'); setLoading(false); return }
            if (!form.email.trim()) { setError('Email is required'); setLoading(false); return }
            if (form.password.length < 4) { setError('Password must be at least 4 characters'); setLoading(false); return }

            const result = await signup({
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                password: form.password,
                city: form.city.trim(),
                age: form.age ? parseInt(form.age) : '',
            })
            if (!result.ok) { setError(result.error); setLoading(false); return }
        } else {
            if (!form.email.trim() || !form.password) { setError('Email and password are required'); setLoading(false); return }

            const result = await login({
                email: form.email.trim().toLowerCase(),
                password: form.password,
            })
            if (!result.ok) { setError(result.error); setLoading(false); return }
        }
    }

    const InputIcon = ({ icon: Icon }) => (
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }}>
            <Icon size={15} strokeWidth={2} />
        </div>
    )

    return (
        <div style={{
            minHeight: '100vh', background: T.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Inter, sans-serif', color: T.text,
            padding: 20,
        }}>
            {/* Background glow */}
            <div style={{
                position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 600, height: 600, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(232,39,42,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    width: 420, maxWidth: '100%',
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 24,
                    padding: '40px 36px 36px',
                    position: 'relative', overflow: 'hidden',
                }}
            >
                {/* Top accent line */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, ${T.red}, #F59E0B, ${T.red})`,
                }} />

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    >
                        <span style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: 36, fontWeight: 800, letterSpacing: '-1px',
                        }}>
                            <span style={{ color: T.text }}>Artha</span>
                            <motion.span
                                style={{ color: T.red }}
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 2.5, repeat: Infinity }}
                            >.</motion.span>
                        </span>
                    </motion.div>
                    <p style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>
                        {mode === 'signup' ? 'Create your account' : 'Welcome back'}
                    </p>
                </div>

                {/* Toggle */}
                <div style={{
                    display: 'flex', background: T.surface2, borderRadius: 12,
                    padding: 3, marginBottom: 24, border: `1px solid ${T.border}`,
                }}>
                    {['signup', 'login'].map(m => (
                        <motion.button
                            key={m}
                            onClick={() => { setMode(m); setError('') }}
                            style={{
                                flex: 1, padding: '10px 0', borderRadius: 10,
                                background: mode === m ? T.red : 'transparent',
                                color: mode === m ? '#fff' : T.muted,
                                fontSize: 13, fontWeight: 600,
                                border: 'none', cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                transition: 'background 0.2s, color 0.2s',
                            }}
                        >
                            {m === 'signup' ? 'Sign Up' : 'Login'}
                        </motion.button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, x: mode === 'signup' ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: mode === 'signup' ? 20 : -20 }}
                            transition={{ duration: 0.25 }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {/* Name — signup only */}
                                {mode === 'signup' && (
                                    <div style={{ position: 'relative' }}>
                                        <InputIcon icon={User} />
                                        <input
                                            type="text" placeholder="Full Name"
                                            value={form.name} onChange={e => set('name', e.target.value)}
                                            style={INPUT_STYLE}
                                            onFocus={e => e.target.style.borderColor = T.red}
                                            onBlur={e => e.target.style.borderColor = T.border}
                                        />
                                    </div>
                                )}

                                {/* Email */}
                                <div style={{ position: 'relative' }}>
                                    <InputIcon icon={Mail} />
                                    <input
                                        type="email" placeholder="Email"
                                        value={form.email} onChange={e => set('email', e.target.value)}
                                        style={INPUT_STYLE}
                                        onFocus={e => e.target.style.borderColor = T.red}
                                        onBlur={e => e.target.style.borderColor = T.border}
                                    />
                                </div>

                                {/* Password */}
                                <div style={{ position: 'relative' }}>
                                    <InputIcon icon={Lock} />
                                    <input
                                        type={showPw ? 'text' : 'password'} placeholder="Password"
                                        value={form.password} onChange={e => set('password', e.target.value)}
                                        style={INPUT_STYLE}
                                        onFocus={e => e.target.style.borderColor = T.red}
                                        onBlur={e => e.target.style.borderColor = T.border}
                                    />
                                    <button
                                        type="button" onClick={() => setShowPw(!showPw)}
                                        style={{
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4,
                                        }}
                                    >
                                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>

                                {/* City + Age — signup only */}
                                {mode === 'signup' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div style={{ position: 'relative' }}>
                                            <InputIcon icon={MapPin} />
                                            <input
                                                type="text" placeholder="City"
                                                value={form.city} onChange={e => set('city', e.target.value)}
                                                style={INPUT_STYLE}
                                                onFocus={e => e.target.style.borderColor = T.red}
                                                onBlur={e => e.target.style.borderColor = T.border}
                                            />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <InputIcon icon={Calendar} />
                                            <input
                                                type="number" placeholder="Age" min="18" max="100"
                                                value={form.age} onChange={e => set('age', e.target.value)}
                                                style={INPUT_STYLE}
                                                onFocus={e => e.target.style.borderColor = T.red}
                                                onBlur={e => e.target.style.borderColor = T.border}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{ color: T.danger, fontSize: 12, marginTop: 12, textAlign: 'center' }}
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(232,39,42,0.25)' }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        style={{
                            width: '100%', marginTop: 20,
                            padding: '14px 0',
                            background: `linear-gradient(135deg, ${T.red}, #C41E21)`,
                            color: '#fff', fontSize: 14, fontWeight: 700,
                            border: 'none', borderRadius: 12, cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            opacity: loading ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        <Sparkles size={15} />
                        {mode === 'signup' ? 'Create Account' : 'Login'}
                        <ArrowRight size={15} />
                    </motion.button>
                </form>

                {/* Footer */}
                <p style={{ textAlign: 'center', fontSize: 11, color: T.muted, marginTop: 20, lineHeight: 1.6 }}>
                    {mode === 'signup'
                        ? 'Already have an account? '
                        : "Don't have an account? "
                    }
                    <span
                        onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError('') }}
                        style={{ color: T.red, cursor: 'pointer', fontWeight: 600 }}
                    >
                        {mode === 'signup' ? 'Login' : 'Sign Up'}
                    </span>
                </p>
            </motion.div>
        </div>
    )
}
