import { useState } from 'react'
import { useNotes } from '../hooks/useNotes'
import Sidebar from '../components/Sidebar'
import NotesList from '../components/NotesList'
import NoteEditor from '../components/NoteEditor'
import UserHeader from '../components/UserHeader'
import { supabase } from '../lib/supabase'

export default function Notes() {
  const n = useNotes()
  const [mobilePanelIdx, setMobilePanelIdx] = useState(1)
  const [signingIn, setSigningIn] = useState(false)

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    })
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (n.loading) return (
    <div style={s.centered}>
      <span style={s.logoText}>NOTES</span>
      <span style={s.subText}>Loading…</span>
    </div>
  )

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!n.session) return (
    <div style={s.centered}>
      <div style={s.loginCard}>
        <div style={s.loginLogo}>NOTES</div>
        <div style={s.loginSub}>Sign in to access your notes</div>

        <button style={s.googleBtn} onClick={handleGoogleSignIn} disabled={signingIn}>
          <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {signingIn ? 'Signing in…' : 'Sign in with Google'}
        </button>

        <a href={import.meta.env.VITE_LANDING_URL || '/'} style={s.backLink}>← Back to Dashboard</a>
      </div>
    </div>
  )

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleOpenNote = async (note) => {
    await n.openNote(note)
    setMobilePanelIdx(2)
  }

  const handleAddNote = async () => {
    await n.addNote()
    setMobilePanelIdx(2)
  }

  const sidebarProps = {
    folders: n.folders,
    notes: n.allNotes,
    activeFolder: n.activeFolder,
    addFolder: n.addFolder,
    renameFolder: n.renameFolder,
    removeFolder: n.removeFolder,
    search: n.search,
    setSearch: n.setSearch,
    addNote: handleAddNote,
  }

  const listProps = {
    notes: n.notes,
    activeNote: n.activeNote,
    folders: n.folders,
    openNote: handleOpenNote,
    removeNote: n.removeNote,
    pinNote: n.pinNote,
    moveNoteToFolder: n.moveNoteToFolder,
    addNote: handleAddNote,
    activeFolder: n.activeFolder,
  }

  const editorProps = {
    note: n.activeNote,
    blocks: n.blocks,
    folders: n.folders,
    saving: n.saving,
    updateNoteTitle: n.updateNoteTitle,
    updateNoteTags: n.updateNoteTags,
    addBlock: n.addBlock,
    removeBlock: n.removeBlock,
    changeBlockType: n.changeBlockType,
    moveBlock: n.moveBlock,
    scheduleBlockSave: n.scheduleBlockSave,
    moveNoteToFolder: n.moveNoteToFolder,
  }

  // ── App ───────────────────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      {/* Top bar — shown always when logged in */}
      <UserHeader session={n.session} saving={n.saving} />

      {/* Desktop: three-panel */}
      <div style={s.desktop}>
        <Sidebar
          {...sidebarProps}
          setActiveFolder={n.setActiveFolder}
        />
        <NotesList {...listProps} />
        <NoteEditor {...editorProps} />
      </div>

      {/* Mobile: single-panel with nav */}
      <div style={s.mobile}>
        {mobilePanelIdx === 0 && (
          <Sidebar
            {...sidebarProps}
            setActiveFolder={id => { n.setActiveFolder(id); setMobilePanelIdx(1) }}
            onClose={() => setMobilePanelIdx(1)}
          />
        )}

        {mobilePanelIdx === 1 && (
          <div style={s.mobilePanel}>
            <div style={s.mobileBar}>
              <button style={s.mobileBarBtn} onClick={() => setMobilePanelIdx(0)}>☰</button>
              <span style={s.mobileBarTitle}>Notes</span>
              <button style={s.mobileBarBtn} onClick={handleAddNote}>+</button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <NotesList {...listProps} />
            </div>
          </div>
        )}

        {mobilePanelIdx === 2 && (
          <div style={s.mobilePanel}>
            <div style={s.mobileBar}>
              <button style={s.mobileBarBtn} onClick={() => setMobilePanelIdx(1)}>← Notes</button>
              {n.saving && <span style={{ fontSize: 10, color: '#555' }}>saving…</span>}
              <div style={{ width: 60 }} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <NoteEditor {...editorProps} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  root: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#0e0e0e',
  },
  desktop: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  mobile: {
    display: 'none',
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },

  // ── Auth screens ──────────────────────────────────────────────────────────
  centered: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0e0e0e',
    gap: 8,
  },
  logoText: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 14,
    color: '#b8ff57',
    letterSpacing: '0.1em',
  },
  subText: { fontSize: 12, color: '#444' },

  loginCard: {
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: 12,
    padding: '32px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    width: 300,
  },
  loginLogo: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 22,
    fontWeight: 700,
    color: '#b8ff57',
    letterSpacing: '0.12em',
  },
  loginSub: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#fff',
    color: '#1a1a1a',
    border: 'none',
    borderRadius: 6,
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  backLink: {
    fontSize: 11,
    color: '#444',
    textDecoration: 'none',
    fontFamily: "'Space Mono', monospace",
    marginTop: 4,
  },

  // ── Mobile nav ─────────────────────────────────────────────────────────────
  mobilePanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mobileBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 14px',
    borderBottom: '1px solid #1a1a1a',
    background: '#111',
  },
  mobileBarBtn: {
    background: 'transparent',
    border: 'none',
    color: '#b8ff57',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
    width: 60,
  },
  mobileBarTitle: {
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "'Space Mono', monospace",
    color: '#b8ff57',
  },
}
