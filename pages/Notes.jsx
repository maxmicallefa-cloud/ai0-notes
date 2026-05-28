import { useState, useEffect } from 'react'
import { useNotes } from '../hooks/useNotes'
import Sidebar from '../components/Sidebar'
import NotesList from '../components/NotesList'
import NoteEditor from '../components/NoteEditor'
import UserHeader from '../components/UserHeader'
import { supabase } from '../lib/supabase'

// ── Hook: detect mobile ────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

// Mobile panels: 0 = folders/sidebar, 1 = notes list, 2 = editor
const PANEL = { SIDEBAR: 0, LIST: 1, EDITOR: 2 }

export default function Notes() {
  const n         = useNotes()
  const isMobile  = useIsMobile()
  const [panel,   setPanel]   = useState(PANEL.LIST)
  const [signingIn, setSigningIn] = useState(false)

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (n.loading) return (
    <div style={s.centered}>
      <div style={s.loadingLogo}>NOTES</div>
      <div style={s.loadingSub}>Loading…</div>
    </div>
  )

  // ── Not signed in ──────────────────────────────────────────────────────
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

  // ── Shared props ───────────────────────────────────────────────────────
  const sidebarProps = {
    folders:       n.folders,
    notes:         n.allNotes,
    activeFolder:  n.activeFolder,
    addFolder:     n.addFolder,
    renameFolder:  n.renameFolder,
    removeFolder:  n.removeFolder,
    search:        n.search,
    setSearch:     n.setSearch,
    addNote:       async () => { await n.addNote(); isMobile && setPanel(PANEL.EDITOR) },
  }

  const listProps = {
    notes:             n.notes,
    activeNote:        n.activeNote,
    folders:           n.folders,
    openNote:          async (note) => { await n.openNote(note); isMobile && setPanel(PANEL.EDITOR) },
    removeNote:        n.removeNote,
    pinNote:           n.pinNote,
    moveNoteToFolder:  n.moveNoteToFolder,
    addNote:           async () => { await n.addNote(); isMobile && setPanel(PANEL.EDITOR) },
    activeFolder:      n.activeFolder,
  }

  const editorProps = {
    note:              n.activeNote,
    blocks:            n.blocks,
    folders:           n.folders,
    saving:            n.saving,
    updateNoteTitle:   n.updateNoteTitle,
    updateNoteTags:    n.updateNoteTags,
    addBlock:          n.addBlock,
    removeBlock:       n.removeBlock,
    changeBlockType:   n.changeBlockType,
    moveBlock:         n.moveBlock,
    scheduleBlockSave: n.scheduleBlockSave,
    moveNoteToFolder:  n.moveNoteToFolder,
  }

  // ── MOBILE layout ──────────────────────────────────────────────────────
  if (isMobile) return (
    <div style={s.mobileRoot}>
      <UserHeader session={n.session} saving={n.saving} />

      {/* Panel content */}
      <div style={s.mobileContent}>
        {panel === PANEL.SIDEBAR && (
          <Sidebar
            {...sidebarProps}
            setActiveFolder={id => { n.setActiveFolder(id); setPanel(PANEL.LIST) }}
            onClose={() => setPanel(PANEL.LIST)}
          />
        )}

        {panel === PANEL.LIST && (
          <NotesList {...listProps} />
        )}

        {panel === PANEL.EDITOR && (
          <NoteEditor {...editorProps} />
        )}
      </div>

      {/* Bottom navigation bar */}
      <nav style={s.bottomNav}>
        <button
          style={{ ...s.navBtn, ...(panel === PANEL.SIDEBAR ? s.navBtnActive : {}) }}
          onClick={() => setPanel(PANEL.SIDEBAR)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span style={s.navLabel}>Folders</span>
        </button>

        <button
          style={{ ...s.navBtn, ...(panel === PANEL.LIST ? s.navBtnActive : {}) }}
          onClick={() => setPanel(PANEL.LIST)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          <span style={s.navLabel}>Notes</span>
          {n.notes.length > 0 && <span style={s.navBadge}>{n.notes.length}</span>}
        </button>

        <button
          style={{ ...s.navBtn, ...(panel === PANEL.EDITOR ? s.navBtnActive : {}) }}
          onClick={() => setPanel(PANEL.EDITOR)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span style={s.navLabel}>Write</span>
        </button>

        {/* New note shortcut */}
        <button
          style={{ ...s.navBtn, ...s.navBtnNew }}
          onClick={async () => { await n.addNote(); setPanel(PANEL.EDITOR) }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span style={s.navLabel}>New</span>
        </button>
      </nav>
    </div>
  )

  // ── DESKTOP layout (3-panel) ───────────────────────────────────────────
  return (
    <div style={s.desktopRoot}>
      <UserHeader session={n.session} saving={n.saving} />
      <div style={s.desktopPanels}>
        <Sidebar {...sidebarProps} setActiveFolder={n.setActiveFolder} />
        <NotesList {...listProps} />
        <NoteEditor {...editorProps} />
      </div>
    </div>
  )
}

const s = {
  // ── Auth screens ─────────────────────────────────────────────────────────
  centered: { width:'100%', height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0e0e0e' },
  loadingLogo: { fontFamily:"'Space Mono',monospace", fontSize:14, color:'#b8ff57', letterSpacing:'0.1em' },
  loadingSub: { fontSize:12, color:'#555', marginTop:8 },
  loginCard: { background:'#111', border:'1px solid #2a2a2a', borderRadius:12, padding:'32px 28px', display:'flex', flexDirection:'column', alignItems:'center', gap:16, width:300 },
  loginLogo: { fontFamily:"'Space Mono',monospace", fontSize:22, fontWeight:700, color:'#b8ff57', letterSpacing:'0.12em' },
  loginSub: { fontSize:13, color:'#666', textAlign:'center', marginBottom:4 },
  googleBtn: { display:'flex', alignItems:'center', gap:10, background:'#fff', color:'#1a1a1a', border:'none', borderRadius:6, padding:'10px 20px', fontSize:13, fontWeight:500, cursor:'pointer', width:'100%', justifyContent:'center', fontFamily:"'Inter',sans-serif" },
  backLink: { fontSize:11, color:'#444', textDecoration:'none', fontFamily:"'Space Mono',monospace", marginTop:4 },

  // ── Desktop ───────────────────────────────────────────────────────────────
  desktopRoot: { width:'100%', height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden', background:'#0e0e0e' },
  desktopPanels: { flex:1, display:'flex', overflow:'hidden' },

  // ── Mobile root ───────────────────────────────────────────────────────────
  mobileRoot: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#0e0e0e',
  },
  mobileContent: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },

  // ── Bottom nav ────────────────────────────────────────────────────────────
  bottomNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    background: '#111',
    borderTop: '1px solid #1e1e1e',
    flexShrink: 0,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  navBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    background: 'transparent',
    border: 'none',
    color: '#555',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: 8,
    minWidth: 60,
    position: 'relative',
  },
  navBtnActive: {
    color: '#b8ff57',
  },
  navBtnNew: {
    color: '#b8ff57',
    background: '#b8ff5715',
    border: '1px solid #b8ff5730',
    borderRadius: 10,
  },
  navLabel: {
    fontSize: 10,
    letterSpacing: '0.04em',
    fontFamily: "'Space Mono', monospace",
  },
  navBadge: {
    position: 'absolute',
    top: 2,
    right: 8,
    background: '#b8ff57',
    color: '#0a0a0a',
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 8,
    padding: '1px 4px',
    fontFamily: "'Space Mono', monospace",
  },
}
