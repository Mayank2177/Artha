// ─────────────────────────────────────────────────────────────────────────────
//  Profile — /dashboard/profile
//  View and edit user profile, logout
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { User, Mail, MapPin, Calendar, Save, LogOut, CheckCircle, Edit3 } from 'lucide-react'

const T = {
    bg: '#08080E', surface: '#111118', surface2: '#18181F',
    border: 'rgba(255,255,255,0.07)', borderHover: 'rgba(255,255,255,0.14)',
    text: '#F0F0F5', muted: '#9A9AAD', red: '#E8272A',
    green: '#10B981',
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

export default function Profile() {
    const { user, updateProfile, logout } = useAuth()
    const navigate = useNavigate()
    const [editing, setEditing] = useState(false)
    const [saved, setSaved] = useState(false)
    const [form, setForm] = useState({
        name: user?.name || '',
        city: user?.city || '',
        age: user?.age || '',
    })

    function set(k, v) { setForm(prev => ({ ...prev, [k]: v })) }

    function handleSave() {
        updateProfile({
            name: form.name.trim() || user.name,
            city: form.city.trim(),
            age: form.age ? parseInt(form.age) : '',
        })
        setEditing(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    function handleLogout() {
        logout()
        navigate('/')
    }

    const InputIcon = ({ icon: Icon }) => (
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }}>
            <Icon size={15} strokeWidth={2} />
        </div>
    )

    if (!user) return null

    const initials = user.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

    return (
        <div style={{ padding: '28px 28px 40px', maxWidth: 640 }}>

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
                    Your Profile
                </h1>
                <p style={{ fontSize: 13, color: T.muted }}>
                    Manage your account details
                </p>
            </motion.div>

            {/* Avatar card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.45 }}
                style={{
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 20, padding: '32px 28px', marginBottom: 18,
                    display: 'flex', alignItems: 'center', gap: 20,
                    position: 'relative', overflow: 'hidden',
                }}
            >
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, ${T.red}, #F59E0B, ${T.red})`,
                }} />

                {/* Avatar */}
                <div style={{
                    width: 72, height: 72, borderRadius: 18, flexShrink: 0,
                    background: `linear-gradient(135deg, ${T.red}, #F59E0B)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 800, color: '#fff',
                    fontFamily: "'Playfair Display', serif",
                    boxShadow: '0 8px 24px rgba(232,39,42,0.25)',
                }}>
                    {initials}
                </div>

                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.3px' }}>
                        {user.name}
                    </h2>
                    <p style={{ fontSize: 13, color: T.muted }}>{user.email}</p>
                    {(user.city || user.age) && (
                        <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                            {[user.city, user.age ? `${user.age} yrs` : ''].filter(Boolean).join(' · ')}
                        </p>
                    )}
                </div>

                {/* Saved toast */}
                {saved && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                            borderRadius: 10, padding: '6px 14px',
                            fontSize: 12, fontWeight: 600, color: T.green,
                        }}
                    >
                        <CheckCircle size={13} /> Saved
                    </motion.div>
                )}
            </motion.div>

            {/* Edit form */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.45 }}
                style={{
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 20, padding: '24px 28px', marginBottom: 18,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: '1px' }}>
                        ACCOUNT DETAILS
                    </p>
                    {!editing && (
                        <motion.button
                            whileHover={{ color: T.red }}
                            onClick={() => setEditing(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                background: 'none', border: 'none', color: T.muted, cursor: 'pointer',
                                fontSize: 12, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                            }}
                        >
                            <Edit3 size={12} /> Edit
                        </motion.button>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Name */}
                    <div style={{ position: 'relative' }}>
                        <InputIcon icon={User} />
                        <input
                            type="text" placeholder="Full Name"
                            value={form.name} onChange={e => set('name', e.target.value)}
                            disabled={!editing}
                            style={{ ...INPUT_STYLE, opacity: editing ? 1 : 0.6, cursor: editing ? 'text' : 'default' }}
                            onFocus={e => editing && (e.target.style.borderColor = T.red)}
                            onBlur={e => e.target.style.borderColor = T.border}
                        />
                    </div>

                    {/* Email (read-only) */}
                    <div style={{ position: 'relative' }}>
                        <InputIcon icon={Mail} />
                        <input
                            type="email" value={user.email}
                            disabled
                            style={{ ...INPUT_STYLE, opacity: 0.5, cursor: 'default' }}
                        />
                    </div>

                    {/* City + Age */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{ position: 'relative' }}>
                            <InputIcon icon={MapPin} />
                            <input
                                type="text" placeholder="City"
                                value={form.city} onChange={e => set('city', e.target.value)}
                                disabled={!editing}
                                style={{ ...INPUT_STYLE, opacity: editing ? 1 : 0.6, cursor: editing ? 'text' : 'default' }}
                                onFocus={e => editing && (e.target.style.borderColor = T.red)}
                                onBlur={e => e.target.style.borderColor = T.border}
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <InputIcon icon={Calendar} />
                            <input
                                type="number" placeholder="Age" min="18" max="100"
                                value={form.age} onChange={e => set('age', e.target.value)}
                                disabled={!editing}
                                style={{ ...INPUT_STYLE, opacity: editing ? 1 : 0.6, cursor: editing ? 'text' : 'default' }}
                                onFocus={e => editing && (e.target.style.borderColor = T.red)}
                                onBlur={e => e.target.style.borderColor = T.border}
                            />
                        </div>
                    </div>
                </div>

                {/* Save button */}
                {editing && (
                    <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.01, boxShadow: '0 6px 24px rgba(232,39,42,0.2)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        style={{
                            width: '100%', marginTop: 18,
                            padding: '12px 0',
                            background: `linear-gradient(135deg, ${T.red}, #C41E21)`,
                            color: '#fff', fontSize: 13, fontWeight: 700,
                            border: 'none', borderRadius: 12, cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                    >
                        <Save size={14} /> Save Changes
                    </motion.button>
                )}
            </motion.div>

            {/* Logout */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.45 }}
                style={{
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 20, padding: '20px 28px',
                }}
            >
                <motion.button
                    whileHover={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    style={{
                        width: '100%', padding: '12px 0',
                        background: 'rgba(239,68,68,0.06)',
                        border: `1px solid rgba(239,68,68,0.15)`,
                        borderRadius: 12, cursor: 'pointer',
                        color: '#EF4444', fontSize: 13, fontWeight: 600,
                        fontFamily: 'Inter, sans-serif',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'background 0.2s, border-color 0.2s',
                    }}
                >
                    <LogOut size={14} /> Logout
                </motion.button>
            </motion.div>
        </div>
    )
}
