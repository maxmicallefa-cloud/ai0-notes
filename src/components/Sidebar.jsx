import { useState } from 'react'

const FOLDER_COLORS = ['#b8ff57','#57b8ff','#ff5757','#ff9f57','#bf57ff','#57ffd8','#ff57bf','#fff857']

export default function Sidebar({
  folders, notes, activeFolder, setActiveFolder,
  addFolder, renameFolder, removeFolder,
  search, setSearch, addNote, onClose
}) {
  const [newFolderOpen,  setNewFolderOpen]  = useState(false)
  const [newFolderName,  setNewFolderName]  = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#b8ff57')
  const [editingFolder,  setEditingFolder]  = useState(null)
  const [editName,       setEditName]       = useState('')
  const [confirmDelete,  setConfirmDelete]  = useState(null)

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return
    await addFolder(newFolderName.trim(), newFolderColor)
    setNewFolderName(''); setNewFolderColor('#b8ff57'); setNewFolderOpen(false)
  }

  const handleRename = async (id) => {
    if (editName.trim()) await renameFolder(id, editName.trim())
    setEditingFolder(null)
  }

  const folderCount = (folderId) => notes.filter(n => n.folder_id === folderId).length

  return (
    <div style={s.sidebar}>
      {/* Header */}
      <div style={s.header}>
        <span style={s.logo}>NOTES</span>
        <div style={{ display:'flex', gap:8 }}>
          <button style={s.iconBtn} onClick={addNote} title="New note">+</button>
          {onClose && <button style={s.iconBtn} onClick={onClose}>✕</button>}
        </div>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <span style={s.searchIcon}>⌕</span>
        <input
          style={s.search}
          placeholder="Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>}
      </div>

      {/* All Notes */}
      <button
        style={{ ...s.folderRow, ...(activeFolder === null ? s.folderActive : {}) }}
        onClick={() => setActiveFolder(null)}
      >
        <span style={{ ...s.folderDot, background: '#888' }} />
        <span style={s.folderName}>All Notes</span>
        <span style={s.folderCount}>{notes.length}</span>
      </button>

      {/* Folders */}
      <div style={s.foldersLabel}>
        <span>FOLDERS</span>
        <button style={s.addFolderBtn} onClick={() => setNewFolderOpen(p => !p)}>+</button>
      </div>

      {folders.map(f => (
        <div key={f.id} style={s.folderItem}>
          {editingFolder === f.id ? (
            <input
              autoFocus
              style={s.renameInput}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={() => handleRename(f.id)}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(f.id); if (e.key === 'Escape') setEditingFolder(null) }}
            />
          ) : (
            <button
              style={{ ...s.folderRow, ...(activeFolder === f.id ? s.folderActive : {}) }}
              onClick={() => setActiveFolder(f.id)}
              onDoubleClick={() => { setEditingFolder(f.id); setEditName(f.name) }}
            >
              <span style={{ ...s.folderDot, background: f.color }} />
              <span style={s.folderName}>{f.name}</span>
              <span style={s.folderCount}>{folderCount(f.id)}</span>
              <button
                style={s.deleteFolderBtn}
                onClick={e => { e.stopPropagation(); setConfirmDelete(f) }}
                title="Delete folder"
              >✕</button>
            </button>
          )}
        </div>
      ))}

      {/* New folder form */}
      {newFolderOpen && (
        <div style={s.newFolderForm}>
          <input
            autoFocus
            style={s.folderInput}
            placeholder="Folder name..."
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') setNewFolderOpen(false) }}
          />
          <div style={s.colorPicker}>
            {FOLDER_COLORS.map(c => (
              <button
                key={c}
                style={{ ...s.colorSwatch, background: c, outline: newFolderColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }}
                onClick={() => setNewFolderColor(c)}
              />
            ))}
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button style={s.confirmBtn} onClick={handleAddFolder}>Create</button>
            <button style={s.cancelBtn} onClick={() => setNewFolderOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Back to landing */}
      <div style={{ marginTop: 'auto', padding: '12px 12px 16px' }}>
        <a href={import.meta.env.VITE_LANDING_URL || '#'} style={s.backLink}>← Dashboard</a>
      </div>

      {/* Delete folder confirm */}
      {confirmDelete && (
        <div style={s.modalBg}>
          <div style={s.modal}>
            <p style={s.modalText}>Delete folder <strong style={{ color: confirmDelete.color }}>{confirmDelete.name}</strong>?<br /><span style={{ fontSize:11, color:'#888' }}>Notes inside will be moved to All Notes.</span></p>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button style={s.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button style={s.deleteBtn} onClick={() => { removeFolder(confirmDelete.id); setConfirmDelete(null) }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  sidebar: { width:220, minWidth:220, height:'100%', background:'#111', borderRight:'1px solid #1e1e1e', display:'flex', flexDirection:'column', overflow:'hidden' },
  header: { padding:'14px 12px 10px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #1e1e1e' },
  logo: { fontFamily:"'Space Mono',monospace", fontSize:13, fontWeight:700, color:'#b8ff57', letterSpacing:'0.1em' },
  iconBtn: { background:'transparent', border:'1px solid #2a2a2a', color:'#b8ff57', borderRadius:4, width:24, height:24, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' },
  searchWrap: { margin:'8px 10px', position:'relative', display:'flex', alignItems:'center' },
  searchIcon: { position:'absolute', left:8, color:'#555', fontSize:14, pointerEvents:'none' },
  search: { width:'100%', background:'#161616', border:'1px solid #222', borderRadius:6, padding:'5px 24px 5px 26px', color:'#ccc', fontSize:12, outline:'none', fontFamily:'inherit' },
  clearBtn: { position:'absolute', right:6, background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:10 },
  folderRow: { width:'100%', background:'transparent', border:'none', color:'#bbb', display:'flex', alignItems:'center', gap:7, padding:'5px 12px', cursor:'pointer', borderRadius:0, textAlign:'left', fontSize:12 },
  folderActive: { background:'#1a1a1a', color:'#e0e0d8' },
  folderDot: { width:7, height:7, borderRadius:'50%', flexShrink:0 },
  folderName: { flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  folderCount: { fontSize:10, color:'#555', marginLeft:4 },
  deleteFolderBtn: { background:'transparent', border:'none', color:'#444', cursor:'pointer', fontSize:9, padding:'0 2px', opacity:0, transition:'opacity 0.1s' },
  folderItem: { position:'relative', '&:hover .del': { opacity:1 } },
  foldersLabel: { padding:'10px 12px 4px', fontSize:9, color:'#555', letterSpacing:'0.12em', fontFamily:"'Space Mono',monospace", display:'flex', justifyContent:'space-between', alignItems:'center' },
  addFolderBtn: { background:'transparent', border:'none', color:'#555', cursor:'pointer', fontSize:13, lineHeight:1 },
  newFolderForm: { margin:'0 10px 8px', background:'#161616', border:'1px solid #2a2a2a', borderRadius:8, padding:'10px' },
  folderInput: { width:'100%', background:'#0e0e0e', border:'1px solid #2a2a2a', borderRadius:4, padding:'5px 8px', color:'#e0e0d8', fontSize:12, outline:'none', marginBottom:8, fontFamily:'inherit' },
  colorPicker: { display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 },
  colorSwatch: { width:16, height:16, borderRadius:'50%', border:'none', cursor:'pointer' },
  confirmBtn: { background:'#b8ff57', color:'#0a0a0a', border:'none', borderRadius:4, padding:'4px 10px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  cancelBtn: { background:'transparent', color:'#888', border:'1px solid #2a2a2a', borderRadius:4, padding:'4px 10px', fontSize:11, cursor:'pointer', fontFamily:'inherit' },
  deleteBtn: { background:'#ff4040', color:'#fff', border:'none', borderRadius:4, padding:'4px 10px', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  renameInput: { width:'100%', background:'#1e1e1e', border:'1px solid #b8ff5740', borderRadius:4, padding:'4px 12px', color:'#e0e0d8', fontSize:12, outline:'none', fontFamily:'inherit' },
  backLink: { fontSize:10, color:'#444', textDecoration:'none', fontFamily:"'Space Mono',monospace", letterSpacing:'0.05em' },
  modalBg: { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 },
  modal: { background:'#161616', border:'1px solid #2a2a2a', borderRadius:10, padding:'18px 20px', width:280 },
  modalText: { fontSize:13, color:'#ccc', marginBottom:14, lineHeight:1.6 },
}
