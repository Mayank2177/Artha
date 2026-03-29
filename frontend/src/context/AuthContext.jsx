// ─────────────────────────────────────────────────────────────────────────────
//  AuthContext — localStorage-based user authentication
//  Provides: user, login, signup, logout, updateProfile
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'artha_user'
const USERS_KEY = 'artha_users' // array of {email, password, name, city, age}

const API_BASE = 'http://localhost:8000/api'

export function AuthProvider({ children }) {
    // Read cached user from storage on initial load
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            return raw ? JSON.parse(raw) : null
        } catch { return null }
    })

    // Sync to localStorage whenever user changes
    useEffect(() => {
        if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
        else localStorage.removeItem(STORAGE_KEY)
    }, [user])

    async function signup({ name, email, password, city, age }) {
        try {
            const res = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, city, age: age ? parseInt(age, 10) : null }),
            })
            const data = await res.json()
            if (!res.ok) return { ok: false, error: data.detail || 'Signup failed' }
            
            setUser(data) // The new user object (schema UserOut)
            return { ok: true }
        } catch (err) {
            return { ok: false, error: 'Network error connecting to backend' }
        }
    }

    async function login({ email, password }) {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            const data = await res.json()
            if (!res.ok) return { ok: false, error: data.detail || 'Login failed' }
            
            setUser(data)
            return { ok: true }
        } catch (err) {
            return { ok: false, error: 'Network error connecting to backend' }
        }
    }

    function logout() {
        setUser(null)
    }

    async function updateProfile(fields) {
        if (!user) return
        try {
            const res = await fetch(`${API_BASE}/auth/profile?email=${encodeURIComponent(user.email)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: fields.name,
                    city: fields.city,
                    age: fields.age ? parseInt(fields.age, 10) : null
                }),
            })
            if (res.ok) {
                const updatedUser = await res.json()
                setUser(updatedUser)
            }
        } catch (err) {
            console.error('Failed to update profile', err)
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
