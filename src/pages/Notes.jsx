import { useState } from 'react'
import { useNotes } from '../hooks/useNotes'
import Sidebar from '../components/Sidebar'
import NotesList from '../components/NotesList'
import NoteEditor from '../components/NoteEditor'

export default function Notes() {
  const n = useNotes()
  const [mobilePanelIdx, setMobilePanelIdx] = useState(1) // 0=sidebar, 1=list, 2=editor

  if (n.loading) return (
    <div style={s.loading}>
      <span style={s.loadingText}>NOTES</span>
    </div>
  )

  if (!n.session) return (
    <div style={s.loading}>
      <span style={s.loadingText}>Not logged in</span>
      <a href={import.meta.env.VITE_LANDING_URL || '/'} style={s.loginLink}>← Go to Dashboard</a>
    </div>
  )

  const handleOpenNote = async (note) => {
    await n.openNote(note)
    setMobilePanelIdx(2)
  }

  const handleAddNote = async () => {
    await n.addNote()
    setMobilePanelIdx(2)
  }

  return (
    <div style={s.root}>
      {/* Desktop: three-panel */}
      <div style={s.desktop}>
        <Sidebar
          folders={n.folders}
          notes={n.allNotes}
          activeFolder={n.activeFolder}
          setActiveFolder={id => { n.setActiveFolder(id); }}
          addFolder={n.addFolder}
          renameFolder={n.renameFolder}
          removeFolder={n.removeFolder}
          search={n.search}
          setSearch={n.setSearch}
          addNote={handleAddNote}
        />
        <NotesList
          notes={n.notes}
          activeNote={n.activeNote}
          folders={n.folders}
          openNote={handleOpenNote}
          removeNote={n.removeNote}
          pinNote={n.pinNote}
          moveNoteToFolder={n.moveNoteToFolder}
          addNote={handleAddNote}
          activeFolder={n.activeFolder}
        />
        <NoteEditor
          note={n.activeNote}
          blocks={n.blocks}
          folders={n.folders}
          saving={n.saving}
          updateNoteTitle={n.updateNoteTitle}
          updateNoteTags={n.updateNoteTags}
          addBlock={n.addBlock}
          removeBlock={n.removeBlock}
          changeBlockType={n.changeBlockType}
          moveBlock={n.moveBlock}
          scheduleBlockSave={n.scheduleBlockSave}
          moveNoteToFolder={n.moveNoteToFolder}
        />
      </div>

      {/* Mobile: single-panel with bottom nav */}
      <div style={s.mobile}>
        {mobilePanelIdx === 0 && (
          <Sidebar
            folders={n.folders}
            notes={n.allNotes}
            activeFolder={n.activeFolder}
            setActiveFolder={id => { n.setActiveFolder(id); setMobilePanelIdx(1) }}
            addFolder={n.addFolder}
            renameFolder={n.renameFolder}
            removeFolder={n.removeFolder}
            search={n.search}
            setSearch={n.setSearch}
            addNote={handleAddNote}
            onClose={() => setMobilePanelIdx(1)}
          />
        )}
        {mobilePanelIdx === 1 && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={s.mobileHeader}>
              <button style={s.mobileBack} onClick={() => setMobilePanelIdx(0)}>☰</button>
              <span style={s.mobileTitle}>Notes</span>
              <button style={s.mobileNew} onClick={handleAddNote}>+</button>
            </div>
            <div style={{ flex:1, overflow:'hidden' }}>
              <NotesList
                notes={n.notes}
                activeNote={n.activeNote}
                folders={n.folders}
                openNote={handleOpenNote}
                removeNote={n.removeNote}
                pinNote={n.pinNote}
                moveNoteToFolder={n.moveNoteToFolder}
                addNote={handleAddNote}
                activeFolder={n.activeFolder}
              />
            </div>
          </div>
        )}
        {mobilePanelIdx === 2 && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={s.mobileHeader}>
              <button style={s.mobileBack} onClick={() => setMobilePanelIdx(1)}>← Notes</button>
              {n.saving && <span style={{ fontSize:10, color:'#555' }}>saving…</span>}
            </div>
            <div style={{ flex:1, overflow:'hidden' }}>
              <NoteEditor
                note={n.activeNote}
                blocks={n.blocks}
                folders={n.folders}
                saving={n.saving}
                updateNoteTitle={n.updateNoteTitle}
                updateNoteTags={n.updateNoteTags}
                addBlock={n.addBlock}
                removeBlock={n.removeBlock}
                changeBlockType={n.changeBlockType}
                moveBlock={n.moveBlock}
                scheduleBlockSave={n.scheduleBlockSave}
                moveNoteToFolder={n.moveNoteToFolder}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  root: { width:'100%', height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' },
  desktop: { flex:1, display:'flex', overflow:'hidden', '@media(max-width:600px)': { display:'none' } },
  mobile: { display:'none', flex:1, overflow:'hidden', flexDirection:'column' },
  loading: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 },
  loadingText: { fontFamily:"'Space Mono',monospace", fontSize:14, color:'#b8ff57', letterSpacing:'0.1em' },
  loginLink: { fontSize:12, color:'#555', textDecoration:'none' },
  mobileHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid #1a1a1a', background:'#111' },
  mobileBack: { background:'transparent', border:'none', color:'#b8ff57', cursor:'pointer', fontSize:13, fontFamily:'inherit' },
  mobileTitle: { fontSize:13, fontWeight:500, fontFamily:"'Space Mono',monospace", color:'#b8ff57' },
  mobileNew: { background:'transparent', border:'1px solid #b8ff5730', color:'#b8ff57', cursor:'pointer', fontSize:16, width:26, height:26, borderRadius:4 },
}
