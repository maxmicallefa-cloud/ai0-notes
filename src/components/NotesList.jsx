import { useState } from 'react'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function NotesList({
  notes, activeNote, folders, openNote, removeNote, pinNote,
  moveNoteToFolder, addNote, activeFolder
}) {
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [moveMenu,      setMoveMenu]      = useState(null)

  const folderName = (id) => folders.find(f => f.id === id)?.name ?? ''
  const folderColor = (id) => folders.find(f => f.id === id)?.color ?? '#555'

  const pinned  = notes.filter(n => n.pinned)
  const unpinned = notes.filter(n => !n.pinned)

  const renderNote = (note) => (
    <div
      key={note.id}
      style={{ ...s.noteRow, ...(activeNote?.id === note.id ? s.noteActive : {}) }}
      onClick={() => openNote(note)}
    >
      <div style={s.noteTop}>
        <span style={s.noteTitle}>{note.title || 'Untitled'}</span>
        <div style={s.noteActions} onClick={e => e.stopPropagation()}>
          {/* Pin */}
          <button
            style={{ ...s.actionBtn, color: note.pinned ? '#b8ff57' : '#444' }}
            title={note.pinned ? 'Unpin' : 'Pin'}
            onClick={() => pinNote(note.id, !note.pinned)}
          >⊕</button>
          {/* Move to folder */}
          <button
            style={s.actionBtn}
            title="Move to folder"
            onClick={() => setMoveMenu(moveMenu === note.id ? null : note.id)}
          >⇅</button>
          {/* Delete */}
          <button
            style={{ ...s.actionBtn, color: '#ff4040' }}
            title="Delete note"
            onClick={() => setConfirmDelete(note)}
          >✕</button>
        </div>
      </div>

      {/* Tags */}
      {note.tags?.length > 0 && (
        <div style={s.tagRow}>
          {note.tags.map(t => <span key={t} style={s.tag}>{t}</span>)}
        </div>
      )}

      <div style={s.noteMeta}>
        {note.folder_id && (
          <span style={{ ...s.folderBadge, color: folderColor(note.folder_id) }}>
            {folderName(note.folder_id)}
          </span>
        )}
        <span style={s.noteTime}>{timeAgo(note.updated_at)}</span>
      </div>

      {/* Move folder dropdown */}
      {moveMenu === note.id && (
        <div style={s.moveMenu} onClick={e => e.stopPropagation()}>
          <button style={s.moveItem} onClick={() => { moveNoteToFolder(note.id, null); setMoveMenu(null) }}>
            <span style={{ ...s.moveDot, background:'#555' }} /> All Notes
          </button>
          {folders.map(f => (
            <button key={f.id} style={s.moveItem} onClick={() => { moveNoteToFolder(note.id, f.id); setMoveMenu(null) }}>
              <span style={{ ...s.moveDot, background: f.color }} /> {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div style={s.list}>
      {/* Header */}
      <div style={s.listHeader}>
        <span style={s.listTitle}>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
        <button style={s.newBtn} onClick={addNote}>+ New</button>
      </div>

      {notes.length === 0 && (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📝</div>
          <div style={s.emptyText}>No notes yet</div>
          <button style={s.emptyBtn} onClick={addNote}>Create one</button>
        </div>
      )}

      <div style={s.scroll}>
        {pinned.length > 0 && (
          <>
            <div style={s.sectionLabel}>PINNED</div>
            {pinned.map(renderNote)}
          </>
        )}
        {unpinned.length > 0 && (
          <>
            {pinned.length > 0 && <div style={s.sectionLabel}>NOTES</div>}
            {unpinned.map(renderNote)}
          </>
        )}
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={s.modalBg}>
          <div style={s.modal}>
            <p style={s.modalText}>Delete <strong>"{confirmDelete.title || 'Untitled'}"</strong>? This cannot be undone.</p>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button style={s.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button style={s.deleteBtn} onClick={() => { removeNote(confirmDelete.id); setConfirmDelete(null) }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  list: { width:240, minWidth:240, height:'100%', background:'#0e0e0e', borderRight:'1px solid #1a1a1a', display:'flex', flexDirection:'column', overflow:'hidden' },
  listHeader: { padding:'12px 12px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #1a1a1a' },
  listTitle: { fontSize:11, color:'#555', fontFamily:"'Space Mono',monospace" },
  newBtn: { background:'#b8ff5720', color:'#b8ff57', border:'1px solid #b8ff5730', borderRadius:4, padding:'3px 9px', fontSize:11, cursor:'pointer', fontFamily:'inherit' },
  scroll: { flex:1, overflowY:'auto', padding:'4px 0' },
  sectionLabel: { padding:'8px 12px 3px', fontSize:9, color:'#444', letterSpacing:'0.12em', fontFamily:"'Space Mono',monospace" },
  noteRow: { padding:'9px 12px', cursor:'pointer', borderBottom:'1px solid #141414', position:'relative', transition:'background 0.1s' },
  noteActive: { background:'#1a1a1a' },
  noteTop: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:6 },
  noteTitle: { fontSize:13, fontWeight:500, color:'#ddd', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  noteActions: { display:'flex', gap:3, opacity:0.4, transition:'opacity 0.15s', flexShrink:0 },
  actionBtn: { background:'transparent', border:'none', color:'#666', cursor:'pointer', fontSize:12, padding:'0 2px', lineHeight:1 },
  tagRow: { display:'flex', flexWrap:'wrap', gap:3, marginTop:4 },
  tag: { fontSize:9, background:'#1e1e1e', color:'#888', borderRadius:3, padding:'1px 5px', border:'1px solid #2a2a2a' },
  noteMeta: { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 },
  folderBadge: { fontSize:9, fontWeight:500, letterSpacing:'0.04em' },
  noteTime: { fontSize:9, color:'#444' },
  moveMenu: { position:'absolute', right:8, top:28, background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:6, padding:'4px', zIndex:50, minWidth:140, boxShadow:'0 4px 16px rgba(0,0,0,0.5)' },
  moveItem: { display:'flex', alignItems:'center', gap:7, width:'100%', padding:'5px 8px', background:'transparent', border:'none', color:'#ccc', fontSize:11, cursor:'pointer', borderRadius:4, textAlign:'left' },
  moveDot: { width:7, height:7, borderRadius:'50%', flexShrink:0 },
  empty: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:24 },
  emptyIcon: { fontSize:28, opacity:0.3 },
  emptyText: { fontSize:12, color:'#444' },
  emptyBtn: { background:'#b8ff5720', color:'#b8ff57', border:'1px solid #b8ff5730', borderRadius:4, padding:'5px 12px', fontSize:11, cursor:'pointer', fontFamily:'inherit' },
  modalBg: { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 },
  modal: { background:'#161616', border:'1px solid #2a2a2a', borderRadius:10, padding:'18px 20px', width:280 },
  modalText: { fontSize:13, color:'#ccc', marginBottom:14, lineHeight:1.6 },
  cancelBtn: { background:'transparent', color:'#888', border:'1px solid #2a2a2a', borderRadius:4, padding:'5px 12px', fontSize:11, cursor:'pointer', fontFamily:'inherit' },
  deleteBtn: { background:'#ff4040', color:'#fff', border:'none', borderRadius:4, padding:'5px 12px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
}
