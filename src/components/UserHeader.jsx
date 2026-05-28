import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function UserHeader({ session, saving }) {
  const [menuOpen, setMenuOpen] = useState(false)

  if (!session?.user) return null

  const user  = session.user
  const name  = user.user_metadata?.full_name || user.email
  const email = user.email
  const avatar = user.user_metadata?.avatar_url

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = import.meta.env.VITE_LANDING_URL || '/'
  }

  return (
    <div style={s.header}>
      <div style={s.left}>
        <span style={s.logo}>NOTES</span>
        {saving && <span style={s.saving}>saving…</span>}
      </div>

      <div style={s.right}>
        <div style={s.userBtn} onClick={() => setMenuOpen(p => !p)}>
          {avatar
            ? <img src={avatar} alt={name} style={s.avatar} />
            : <div style={s.avatarFallback}>{name[0].toUpperCase()}</div>
          }
          <span style={s.userName}>{name}</span>
          <span style={s.chevron}>{menuOpen ? '▲' : '▼'}</span>
        </div>

        {menuOpen && (
          <div style={s.menu}>
            <div style={s.menuEmail}>{email}</div>
            <div style={s.menuDivider} />
            <a
              href={import.meta.env.VITE_LANDING_URL || '/'}
              style={s.menuItem}
            >← Dashboard</a>
            <button style={{ ...s.menuItem, ...s.signOutBtn }} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  header: {
    height: 44,
    background: '#111',
    borderBottom: '1px solid #1e1e1e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    flexShrink: 0,
    zIndex: 30,
    position: 'relative',
  },
  left: { display: 'flex', alignItems: 'center', gap: 12 },
  logo: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    fontWeight: 700,
    color: '#b8ff57',
    letterSpacing: '0.1em',
  },
  saving: {
    fontSize: 10,
    color: '#555',
    fontFamily: "'Space Mono', monospace",
  },
  right: { position: 'relative' },
  userBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid #2a2a2a',
    background: '#161616',
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarFallback: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: '#b8ff5730',
    color: '#b8ff57',
    fontSize: 11,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { fontSize: 12, color: '#ccc', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chevron: { fontSize: 8, color: '#555' },
  menu: {
    position: 'absolute',
    right: 0,
    top: 38,
    background: '#161616',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    padding: '6px',
    minWidth: 200,
    boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
    zIndex: 100,
  },
  menuEmail: { fontSize: 11, color: '#555', padding: '4px 8px 6px', fontFamily: "'Space Mono', monospace" },
  menuDivider: { height: 1, background: '#222', margin: '4px 0' },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '7px 10px',
    fontSize: 12,
    color: '#bbb',
    background: 'transparent',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    textAlign: 'left',
    textDecoration: 'none',
    fontFamily: "'Inter', sans-serif",
  },
  signOutBtn: { color: '#ff5040' },
}
