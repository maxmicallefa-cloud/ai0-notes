import { useState, useRef } from 'react'
import Block from './Block'

export default function NoteEditor({
  note, blocks, folders, saving,
  updateNoteTitle, updateNoteTags,
  addBlock, removeBlock, changeBlockType, moveBlock,
  scheduleBlockSave, moveNoteToFolder,
}) {
  const [tagInput,   setTagInput]   = useState('')
  const [focusBlock, setFocusBlock] = useState(null)
  const dragOver = useRef(null)

  if (!note) return (
    <div style={s.empty}>
      <div style={s.emptyIcon}>✏️</div>
      <div style={s.emptyText}>Select a note or create a new one</div>
    </div>
  )

  const folder = folders.find(f => f.id === note.folder_id)

  const handleEnter = async (index, type) => {
    const nb = await addBlock(index, type)
    if (nb) setFocusBlock(nb.id)
  }

  const handleDelete = (id, index) => {
    removeBlock(id)
    const prev = blocks[index - 1]
    if (prev) setFocusBlock(prev.id)
  }

  const handleMoveUp = (index) => { if (index > 0) moveBlock(index, index - 1) }
  const handleMoveDown = (index) => { if (index < blocks.length - 1) moveBlock(index, index + 1) }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (!tag || note.tags?.includes(tag)) { setTagInput(''); return }
    updateNoteTags(note.id, [...(note.tags || []), tag])
    setTagInput('')
  }
  const removeTag = (tag) => updateNoteTags(note.id, (note.tags || []).filter(t => t !== tag))

  const handleDrop = (e, toIndex) => {
    const from = parseInt(e.dataTransfer.getData('blockIndex'))
    if (!isNaN(from) && from !== toIndex) moveBlock(from, toIndex)
    dragOver.current = null
  }

  return (
    <div style={s.editor}>
      {/* Toolbar */}
      <div style={s.toolbar}>
        <div style={s.breadcrumb}>
          <span style={s.breadcrumbAll}>All Notes</span>
          {folder && <><span style={s.sep}>/</span><span style={{ color: folder.color }}>{folder.name}</span></>}
        </div>
        <div style={s.toolbarRight}>
          {saving && <span style={s.saving}>saving…</span>}
          <button style={s.addBlockBtn} onClick={() => { handleEnter(blocks.length - 1, 'text') }}>+ Block</button>
        </div>
      </div>

      {/* Title */}
      <input
        style={s.title}
        value={note.title}
        placeholder="Untitled"
        onChange={e => updateNoteTitle(note.id, e.target.value)}
      />

      {/* Tags */}
      <div style={s.tagsRow}>
        {(note.tags || []).map(tag => (
          <span key={tag} style={s.tag}>
            #{tag}
            <button style={s.tagRemove} onClick={() => removeTag(tag)}>✕</button>
          </span>
        ))}
        <input
          style={s.tagInput}
          placeholder="+ tag"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
          onBlur={addTag}
        />
      </div>

      {/* Meta */}
      <div style={s.meta}>
        <span>{new Date(note.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}</span>
        {note.pinned && <span style={s.pinnedBadge}>⊕ pinned</span>}
      </div>

      <div style={s.divider} />

      {/* Blocks */}
      <div
        style={s.blocks}
        onDragOver={e => e.preventDefault()}
      >
        {blocks.map((block, index) => (
          <div
            key={block.id}
            style={{ ...s.blockWrap, ...(dragOver.current === index ? s.dropTarget : {}) }}
            onDragOver={e => { e.preventDefault(); dragOver.current = index }}
            onDrop={e => handleDrop(e, index)}
          >
            <Block
              block={block}
              index={index}
              totalBlocks={blocks.length}
              autoFocus={focusBlock === block.id}
              onChange={(id, content) => scheduleBlockSave(id, { content })}
              onToggleCheck={(id, checked) => scheduleBlockSave(id, { checked })}
              onTypeChange={changeBlockType}
              onEnter={handleEnter}
              onDelete={handleDelete}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          </div>
        ))}

        {/* Add block buttons */}
        <div style={s.addRow}>
          <button style={s.addTypeBtn} onClick={() => handleEnter(blocks.length - 1, 'text')}>+ Text</button>
          <button style={s.addTypeBtn} onClick={() => handleEnter(blocks.length - 1, 'checkbox')}>+ Checkbox</button>
          <button style={s.addTypeBtn} onClick={() => handleEnter(blocks.length - 1, 'heading1')}>+ Heading</button>
          <button style={s.addTypeBtn} onClick={() => handleEnter(blocks.length - 1, 'divider')}>+ Divider</button>
        </div>
      </div>
    </div>
  )
}

const s = {
  editor: { flex:1, height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', background:'#0e0e0e' },
  empty: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'#333' },
  emptyIcon: { fontSize:36, opacity:0.3 },
  emptyText: { fontSize:13 },
  toolbar: { padding:'10px 28px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #181818' },
  breadcrumb: { display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#555' },
  breadcrumbAll: { color:'#444' },
  sep: { color:'#333' },
  toolbarRight: { display:'flex', alignItems:'center', gap:10 },
  saving: { fontSize:10, color:'#555', fontFamily:"'Space Mono',monospace" },
  addBlockBtn: { background:'transparent', color:'#555', border:'1px solid #222', borderRadius:4, padding:'3px 9px', fontSize:11, cursor:'pointer', fontFamily:'inherit' },
  title: { padding:'20px 28px 6px', fontSize:26, fontWeight:600, color:'#e8e8e0', background:'transparent', border:'none', outline:'none', fontFamily:"'Inter',sans-serif", width:'100%' },
  tagsRow: { display:'flex', flexWrap:'wrap', gap:5, padding:'0 28px 8px', alignItems:'center' },
  tag: { display:'flex', alignItems:'center', gap:4, background:'#1a1a1a', color:'#b8ff57', border:'1px solid #b8ff5730', borderRadius:4, padding:'2px 7px', fontSize:11 },
  tagRemove: { background:'transparent', border:'none', color:'#b8ff5780', cursor:'pointer', fontSize:9, padding:'0 1px' },
  tagInput: { background:'transparent', border:'none', outline:'none', color:'#555', fontSize:11, fontFamily:'inherit', width:60 },
  meta: { padding:'0 28px 8px', display:'flex', gap:12, alignItems:'center', fontSize:10, color:'#444' },
  pinnedBadge: { color:'#b8ff57', fontSize:10 },
  divider: { height:1, background:'#181818', margin:'0 0 8px' },
  blocks: { flex:1, overflowY:'auto', padding:'8px 20px 40px' },
  blockWrap: { borderRadius:4, padding:'0 2px' },
  dropTarget: { background:'#b8ff5710', borderTop:'2px solid #b8ff5760' },
  addRow: { display:'flex', gap:6, padding:'16px 6px 0', flexWrap:'wrap' },
  addTypeBtn: { background:'transparent', color:'#333', border:'1px solid #1e1e1e', borderRadius:4, padding:'3px 9px', fontSize:10, cursor:'pointer', fontFamily:'inherit' },
}
