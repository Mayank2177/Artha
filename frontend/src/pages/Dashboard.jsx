// ─────────────────────────────────────────────────────────────────────────────
//  ARTHA — Dashboard Shell
//  Uses React Router <Outlet> — each feature is a real URL route
//  /dashboard            → Overview
//  /dashboard/health     → Money Health Score
//  /dashboard/fire       → FIRE Path Planner
//  /dashboard/tax        → Tax Wizard
//  /dashboard/portfolio  → MF Portfolio X-Ray
//  /dashboard/couple     → Couple's Money Planner
// ─────────────────────────────────────────────────────────────────────────────
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
    LayoutDashboard, Heart, Flame, FileText,
    BarChart3, Users, ArrowLeft, Bell, ChevronRight, User,
} from 'lucide-react'

// ─── ROUTE MAP ────────────────────────────────────────────────────────────────
const NAV = [
    { path: '/dashboard', id: 'overview', label: 'Overview', icon: LayoutDashboard, color: '#9A9AAD' },
    { path: '/dashboard/health', id: 'health', label: 'Money Health', icon: Heart, color: '#10B981' },
    { path: '/dashboard/fire', id: 'fire', label: 'FIRE Planner', icon: Flame, color: '#F59E0B' },
    { path: '/dashboard/tax', id: 'tax', label: 'Tax Wizard', icon: FileText, color: '#F59E0B' },
    { path: '/dashboard/portfolio', id: 'portfolio', label: 'Portfolio X-Ray', icon: BarChart3, color: '#EF4444' },
    { path: '/dashboard/couple', id: 'couple', label: "Couple's Planner", icon: Users, color: '#8B5CF6' },
    { path: '/dashboard/profile', id: 'profile', label: 'Profile', icon: User, color: '#9A9AAD' },
]

// Returns the current active nav item based on pathname
function useActiveNav() {
    const { pathname } = useLocation()
    // Match longest path first so /dashboard/health beats /dashboard
    return [...NAV].reverse().find(n => pathname.startsWith(n.path)) ?? NAV[0]
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar() {
    const navigate = useNavigate()
    const activeItem = useActiveNav()
    const { user } = useAuth()

    const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'

    return (
        <aside style={{
            width: 228, flexShrink: 0,
            background: '#0D0D14',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column',
            position: 'fixed', top: 0, left: 0, height: '100vh',
            zIndex: 50,
        }}>
            {/* Logo */}
            <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px',
                    display: 'flex', alignItems: 'center',
                }}>
                    <span style={{ color: '#F0F0F5' }}>Artha</span>
                    <motion.span
                        style={{ color: '#E8272A' }}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                    >.</motion.span>
                </div>
                <p style={{ fontSize: 10, color: '#9A9AAD', marginTop: 3, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    AI Money Mentor
                </p>
            </div>

            {/* Nav */}
            <nav style={{ padding: '14px 12px', flex: 1, overflowY: 'auto' }}>
                <p style={{
                    fontSize: 9, color: '#9A9AAD', letterSpacing: '2px',
                    textTransform: 'uppercase', padding: '0 12px', marginBottom: 10,
                }}>
                    Modules
                </p>

                {NAV.map((item) => {
                    const Icon = item.icon
                    const isActive = activeItem.id === item.id
                    return (
                        <motion.button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            whileHover={{ x: 3 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                width: '100%', padding: '10px 12px',
                                borderRadius: 10, marginBottom: 2,
                                background: isActive ? `${item.color}15` : 'transparent',
                                border: `1px solid ${isActive ? item.color + '35' : 'transparent'}`,
                                color: isActive ? '#F0F0F5' : '#9A9AAD',
                                fontSize: 13, fontWeight: isActive ? 600 : 400,
                                cursor: 'pointer', textAlign: 'left',
                                fontFamily: 'Inter, sans-serif',
                                transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                            }}
                        >
                            <div style={{
                                width: 28, height: 28, borderRadius: 7,
                                background: isActive ? `${item.color}22` : 'rgba(255,255,255,0.04)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, transition: 'background 0.2s',
                            }}>
                                <Icon size={14} color={isActive ? item.color : '#9A9AAD'} strokeWidth={2} />
                            </div>

                            <span style={{ flex: 1 }}>{item.label}</span>

                            {isActive && (
                                <motion.div
                                    layoutId="sidebarDot"
                                    style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, flexShrink: 0 }}
                                />
                            )}
                        </motion.button>
                    )
                })}
            </nav>

            {/* Bottom — back + user chip */}
            <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <motion.button
                    whileHover={{ x: -2, color: '#F0F0F5' }}
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        color: '#9A9AAD', fontSize: 12, fontWeight: 500,
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '8px 12px', borderRadius: 8, width: '100%',
                        fontFamily: 'Inter, sans-serif', transition: 'color 0.2s',
                    }}
                >
                    <ArrowLeft size={14} /> Back to Home
                </motion.button>

                <div
                    onClick={() => navigate('/dashboard/profile')}
                    style={{
                    margin: '10px 0 0',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer', transition: 'background 0.2s',
                }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: 'linear-gradient(135deg, #E8272A, #F59E0B)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#fff',
                    }}>{initials}</div>
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#F0F0F5' }}>{user?.name || 'User'}</p>
                        <p style={{ fontSize: 10, color: '#9A9AAD' }}>{[user?.city, user?.age ? `${user.age} yrs` : ''].filter(Boolean).join(' · ') || 'Tap to edit profile'}</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}

// ─── TOPBAR ──────────────────────────────────────────────────────────────────
function Topbar() {
    const activeItem = useActiveNav()
    const Icon = activeItem.icon
    const { user } = useAuth()

    return (
        <header style={{
            height: 56, background: '#08080E',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky', top: 0, zIndex: 40,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={15} color={activeItem.color} strokeWidth={2} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#F0F0F5' }}>{activeItem.label}</span>
                <ChevronRight size={13} color="#9A9AAD" />
                <span style={{ fontSize: 12, color: '#9A9AAD' }}>{user?.name || 'User'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* ET Live badge */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(232,39,42,0.1)',
                    border: '1px solid rgba(232,39,42,0.2)',
                    borderRadius: 20, padding: '4px 12px',
                }}>
                    <motion.span
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8272A', display: 'inline-block' }}
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                    />
                    <span style={{ fontSize: 10, color: '#E8272A', fontWeight: 700, letterSpacing: '0.8px' }}>
                        ET LIVE
                    </span>
                </div>

                {/* Notification */}
                <motion.button
                    whileHover={{ background: 'rgba(255,255,255,0.06)' }}
                    style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#9A9AAD', cursor: 'pointer',
                        position: 'relative',
                    }}
                >
                    <Bell size={14} />
                    <span style={{
                        position: 'absolute', top: 7, right: 7,
                        width: 6, height: 6, borderRadius: '50%', background: '#E8272A',
                    }} />
                </motion.button>
            </div>
        </header>
    )
}

// ─── DASHBOARD SHELL ─────────────────────────────────────────────────────────
export default function Dashboard() {
    const { pathname } = useLocation()

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
                background: '#08080E', minHeight: '100vh',
                display: 'flex',
                fontFamily: 'Inter, sans-serif',
                color: '#F0F0F5',
            }}
        >
            <Sidebar />

            <div style={{ marginLeft: 228, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Topbar />

                {/* Outlet renders the matched child route */}
                <main style={{ flex: 1 }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            style={{ minHeight: '100%' }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </motion.div>
    )
}
