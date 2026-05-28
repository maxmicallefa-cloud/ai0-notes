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

  const folderName  = (id) => folders.find(f => f.id === id)?.name ?? ''
  const folderColor = (id) => folders.find(f => f.id === id)?.color ?? '#555'

  const pinned   = notes.filter(n => n.pinned)
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
          <button
            style={{ ...s.actionBtn, color: note.pinned ? '#b8ff57' : '#555' }}
            onClick={() => pinNote(note.id, !note.pinned)}
            title={note.pinned ? 'Unpin' : 'Pin'}
          >⊕</button>
          <button
            style={s.actionBtn}
            onClick={() => setMoveMenu(moveMenu === note.id ? null : note.id)}
            title="Move to folder"
          >⇅</button>
          <button
            style={{ ...s.actionBtn, color:'#ff5040' }}
            onClick={() => setConfirmDelete(note)}
            title="Delete"
          >✕</button>
        </div>
      </div>

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
  list: { width:'100%', height:'100%', background:'#0e0e0e', display:'flex', flexDirection:'column', overflow:'hidden' },
  listHeader: { padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #1a1a1a', flexShrink:0 },
  listTitle: { fontSize:11, color:'#555', fontFamily:"'Space Mono',monospace" },
  newBtn: { background:'#b8ff5720', color:'#b8ff57', border:'1px solid #b8ff5730', borderRadius:6, padding:'6px 14px', fontSize:12, cursor:'pointer', fontFamily:'inherit' },
  scroll: { flex:1, overflowY:'auto' },
  sectionLabel: { padding:'10px 16px 4px', fontSize:9, color:'#444', letterSpacing:'0.12em', fontFamily:"'Space Mono',monospace" },
  noteRow: { padding:'12px 16px', cursor:'pointer', borderBottom:'1px solid #141414', position:'relative', minHeight:64 },
  noteActive: { background:'#1a1a1a' },
  noteTop: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 },
  noteTitle: { fontSize:14, fontWeight:500, color:'#ddd', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  noteActions: { display:'flex', gap:4, flexShrink:0 },
  actionBtn: { background:'transparent', border:'none', color:'#666', cursor:'pointer', fontSize:14, padding:'2px 4px', minWidth:28, minHeight:28, display:'flex', alignItems:'center', justifyContent:'center' },
  tagRow: { display:'flex', flexWrap:'wrap', gap:4, marginTop:5 },
  tag: { fontSize:10, background:'#1e1e1e', color:'#888', borderRadius:3, padding:'2px 6px', border:'1px solid #2a2a2a' },
  noteMeta: { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:5 },
  folderBadge: { fontSize:10, fontWeight:500 },
  noteTime: { fontSize:10, color:'#444' },
  moveMenu: { position:'absolute', right:8, top:36, background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8, padding:'4px', zIndex:50, minWidth:150, boxShadow:'0 4px 16px rgba(0,0,0,0.5)' },
  moveItem: { display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', background:'transparent', border:'none', color:'#ccc', fontSize:12, cursor:'pointer', borderRadius:4, textAlign:'left', minHeight:36 },
  moveDot: { width:8, height:8, borderRadius:'50%', flexShrink:0 },
  empty: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, padding:24 },
  emptyIcon: { fontSize:32, opacity:0.3 },
  emptyText: { fontSize:13, color:'#444' },
  emptyBtn: { background:'#b8ff5720', color:'#b8ff57', border:'1px solid #b8ff5730', borderRadius:6, padding:'8px 16px', fontSize:12, cursor:'pointer', fontFamily:'inherit' },
  modalBg: { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 },
  modal: { background:'#161616', border:'1px solid #2a2a2a', borderRadius:10, padding:'20px', width:300 },
  modalText: { fontSize:13, color:'#ccc', marginBottom:14, lineHeight:1.6 },
  cancelBtn: { background:'transparent', color:'#888', border:'1px solid #2a2a2a', borderRadius:4, padding:'6px 14px', fontSize:12, cursor:'pointer', fontFamily:'inherit' },
  deleteBtn: { background:'#ff4040', color:'#fff', border:'none', borderRadius:4, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
}
