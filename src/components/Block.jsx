import { useRef, useEffect, useState } from 'react'

const BLOCK_TYPES = [
  { type: 'text',      label: 'Text',      icon: '¶' },
  { type: 'heading1',  label: 'Heading 1', icon: 'H1' },
  { type: 'heading2',  label: 'Heading 2', icon: 'H2' },
  { type: 'checkbox',  label: 'Checkbox',  icon: '☑' },
  { type: 'divider',   label: 'Divider',   icon: '—' },
]

export default function Block({
  block, index, totalBlocks, autoFocus,
  onChange, onToggleCheck, onTypeChange,
  onEnter, onDelete, onMoveUp, onMoveDown,
}) {
  const inputRef  = useRef(null)
  const [typeMenu, setTypeMenu] = useState(false)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
      const len = inputRef.current.value?.length ?? 0
      inputRef.current.setSelectionRange(len, len)
    }
  }, [autoFocus])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onEnter(index, block.type === 'checkbox' ? 'checkbox' : 'text')
    }
    if (e.key === 'Backspace' && block.content === '' && totalBlocks > 1) {
      e.preventDefault()
      onDelete(block.id, index)
    }
    if (e.key === '/' && block.content === '') {
      setTypeMenu(true)
    }
  }

  const handleInput = (e) => {
    const val = e.target.value
    // Slash command detection
    if (val === '/') { setTypeMenu(true); return }
    setTypeMenu(false)
    onChange(block.id, val)
  }

  // Divider — no input
  if (block.type === 'divider') {
    return (
      <div style={s.blockRow}>
        <div style={s.dragHandle} title="Drag">⠿</div>
        <div style={s.divider} />
        <button style={s.deleteBlockBtn} onClick={() => onDelete(block.id, index)}>✕</button>
      </div>
    )
  }

  return (
    <div style={{ ...s.blockRow, ...(dragging ? s.blockDragging : {}) }}>
      {/* Drag handle */}
      <div
        style={s.dragHandle}
        draggable
        onDragStart={e => { setDragging(true); e.dataTransfer.setData('blockIndex', index) }}
        onDragEnd={() => setDragging(false)}
        title="Drag to reorder"
      >⠿</div>

      {/* Type switcher */}
      <div style={{ position:'relative' }}>
        <button
          style={s.typeBtn}
          onClick={() => setTypeMenu(p => !p)}
          title="Change block type"
        >
          {BLOCK_TYPES.find(t => t.type === block.type)?.icon ?? '¶'}
        </button>
        {typeMenu && (
          <div style={s.typeMenu}>
            {BLOCK_TYPES.map(bt => (
              <button
                key={bt.type}
                style={{ ...s.typeMenuItem, ...(bt.type === block.type ? s.typeMenuActive : {}) }}
                onClick={() => { onTypeChange(block.id, bt.type); setTypeMenu(false) }}
              >
                <span style={s.typeMenuIcon}>{bt.icon}</span>
                {bt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Checkbox tick */}
      {block.type === 'checkbox' && (
        <button
          style={{ ...s.checkbox, ...(block.checked ? s.checkboxChecked : {}) }}
          onClick={() => onToggleCheck(block.id, !block.checked)}
        >
          {block.checked && '✓'}
        </button>
      )}

      {/* Content */}
      <input
        ref={inputRef}
        style={{
          ...s.input,
          ...typeStyles[block.type],
          ...(block.checked ? s.checkedText : {}),
        }}
        value={block.content}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={block.type === 'text' ? "Type '/' for commands…" : block.type.startsWith('heading') ? 'Heading' : ''}
      />

      {/* Move up/down + delete */}
      <div style={s.blockBtns}>
        {index > 0 && <button style={s.microBtn} onClick={() => onMoveUp(index)} title="Move up">↑</button>}
        {index < totalBlocks-1 && <button style={s.microBtn} onClick={() => onMoveDown(index)} title="Move down">↓</button>}
        <button style={{ ...s.microBtn, color:'#ff5040' }} onClick={() => onDelete(block.id, index)} title="Delete block">✕</button>
      </div>
    </div>
  )
}

const typeStyles = {
  text:     { fontSize:14, color:'#ccc', fontWeight:400 },
  heading1: { fontSize:22, color:'#e8e8e0', fontWeight:600, fontFamily:"'Space Mono',monospace" },
  heading2: { fontSize:17, color:'#e0e0d8', fontWeight:600 },
  checkbox: { fontSize:13, color:'#bbb' },
  divider:  {},
}

const s = {
  blockRow: { display:'flex', alignItems:'center', gap:6, padding:'2px 0', position:'relative', borderRadius:4 },
  blockDragging: { opacity:0.4 },
  dragHandle: { color:'#333', cursor:'grab', fontSize:12, userSelect:'none', flexShrink:0, padding:'0 2px', opacity:0, transition:'opacity 0.15s' },
  typeBtn: { background:'transparent', border:'none', color:'#444', cursor:'pointer', fontSize:11, padding:'2px 4px', borderRadius:3, fontFamily:"'Space Mono',monospace", flexShrink:0, minWidth:22 },
  typeMenu: { position:'absolute', left:0, top:24, background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:7, padding:'4px', zIndex:60, minWidth:130, boxShadow:'0 4px 20px rgba(0,0,0,0.6)' },
  typeMenuItem: { display:'flex', alignItems:'center', gap:8, width:'100%', padding:'5px 8px', background:'transparent', border:'none', color:'#bbb', fontSize:12, cursor:'pointer', borderRadius:4 },
  typeMenuActive: { color:'#b8ff57', background:'#b8ff5710' },
  typeMenuIcon: { width:18, textAlign:'center', fontFamily:"'Space Mono',monospace", fontSize:10, color:'#888' },
  checkbox: { width:16, height:16, border:'1.5px solid #444', borderRadius:3, background:'transparent', cursor:'pointer', color:'#b8ff57', fontSize:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  checkboxChecked: { background:'#b8ff5720', borderColor:'#b8ff57' },
  input: { flex:1, background:'transparent', border:'none', outline:'none', padding:'3px 0', lineHeight:1.6, fontFamily:"'Inter',sans-serif", resize:'none' },
  checkedText: { textDecoration:'line-through', opacity:0.45 },
  divider: { flex:1, height:1, background:'#2a2a2a', margin:'6px 0' },
  blockBtns: { display:'flex', gap:2, opacity:0, transition:'opacity 0.15s', flexShrink:0 },
  microBtn: { background:'transparent', border:'none', color:'#444', cursor:'pointer', fontSize:10, padding:'1px 3px' },
  deleteBlockBtn: { background:'transparent', border:'none', color:'#444', cursor:'pointer', fontSize:10 },
}
