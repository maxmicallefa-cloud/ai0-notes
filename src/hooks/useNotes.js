import { useState, useEffect, useCallback, useRef } from 'react'
import {
  supabase, getSession,
  getFolders, createFolder, updateFolder, deleteFolder,
  getNotes, createNote, updateNote, deleteNote,
  getBlocks, createBlock, updateBlock, deleteBlock
} from '../lib/supabase'

export function useNotes() {
  const [session,      setSession]      = useState(null)
  const [folders,      setFolders]      = useState([])
  const [notes,        setNotes]        = useState([])
  const [activeFolder, setActiveFolder] = useState(null)
  const [activeNote,   setActiveNote]   = useState(null)
  const [blocks,       setBlocks]       = useState([])
  const [search,       setSearch]       = useState('')
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const saveTimerRef = useRef(null)
  const channelsRef  = useRef([])

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Hard timeout — ALWAYS stops loading after 6s no matter what
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 6000)

    getSession()
      .then(sess => {
        clearTimeout(timeout)
        setSession(sess)
        if (sess?.user) {
          loadAll(sess.user.id)
        } else {
          setLoading(false)   // ← not logged in, show sign-in screen
        }
      })
      .catch(err => {
        console.error('getSession failed:', err)
        clearTimeout(timeout)
        setLoading(false)     // ← supabase error, show sign-in screen
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess)
      if (event === 'SIGNED_IN' && sess?.user) {
        loadAll(sess.user.id)
      }
      if (event === 'SIGNED_OUT') {
        setLoading(false)
        setNotes([])
        setFolders([])
        setActiveNote(null)
        setBlocks([])
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
      channelsRef.current.forEach(c => supabase.removeChannel(c))
    }
  }, [])

  const loadAll = async (userId) => {
    setLoading(true)
    try {
      const [f, n] = await Promise.all([
        getFolders(userId),
        getNotes(userId)
      ])
      setFolders(f || [])
      setNotes(n || [])
    } catch (e) {
      console.error('loadAll error:', e)
    } finally {
      setLoading(false)
    }
    subscribeRealtime(userId)
  }

  // ── Real-time ──────────────────────────────────────────────────────────────
  const subscribeRealtime = useCallback((userId) => {
    channelsRef.current.forEach(c => supabase.removeChannel(c))
    channelsRef.current = []

    const notesCh = supabase
      .channel(`notes-${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notes',
        filter: `user_id=eq.${userId}`
      }, payload => {
        if (payload.eventType === 'INSERT') setNotes(p => [payload.new, ...p])
        if (payload.eventType === 'UPDATE') setNotes(p => p.map(n => n.id === payload.new.id ? payload.new : n))
        if (payload.eventType === 'DELETE') setNotes(p => p.filter(n => n.id !== payload.old.id))
      })
      .subscribe()

    const blocksCh = supabase
      .channel(`blocks-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'note_blocks' }, payload => {
        setBlocks(prev => {
          if (payload.eventType === 'INSERT') {
            if (prev.find(b => b.id === payload.new.id)) return prev
            return [...prev, payload.new].sort((a, b) => a.position - b.position)
          }
          if (payload.eventType === 'UPDATE') return prev.map(b => b.id === payload.new.id ? payload.new : b)
          if (payload.eventType === 'DELETE') return prev.filter(b => b.id !== payload.old.id)
          return prev
        })
      })
      .subscribe()

    const foldersCh = supabase
      .channel(`folders-${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'notes_folders',
        filter: `user_id=eq.${userId}`
      }, payload => {
        if (payload.eventType === 'INSERT') setFolders(p => [...p, payload.new])
        if (payload.eventType === 'UPDATE') setFolders(p => p.map(f => f.id === payload.new.id ? payload.new : f))
        if (payload.eventType === 'DELETE') setFolders(p => p.filter(f => f.id !== payload.old.id))
      })
      .subscribe()

    channelsRef.current = [notesCh, blocksCh, foldersCh]
  }, [])

  // ── Note CRUD ──────────────────────────────────────────────────────────────
  const openNote = useCallback(async (note) => {
    setActiveNote(note)
    setBlocks([])
    try {
      const b = await getBlocks(note.id)
      setBlocks(b || [])
    } catch (e) { console.error('getBlocks:', e) }
  }, [])

  const scheduleNoteSave = useCallback((id, patch) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n))
    if (activeNote?.id === id) setActiveNote(p => ({ ...p, ...patch }))
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      try { await updateNote(id, patch) } catch (e) { console.error(e) }
      setSaving(false)
    }, 500)
  }, [activeNote])

  const scheduleBlockSave = useCallback((id, patch) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      try { await updateBlock(id, patch) } catch (e) { console.error(e) }
      setSaving(false)
    }, 400)
  }, [])

  const addNote = useCallback(async () => {
    if (!session?.user) return
    try {
      const note = await createNote(session.user.id, activeFolder)
      setNotes(prev => [note, ...prev])
      await openNote(note)
    } catch (e) { console.error('addNote:', e) }
  }, [session, activeFolder, openNote])

  const removeNote = useCallback(async (id) => {
    try {
      await deleteNote(id)
      if (activeNote?.id === id) { setActiveNote(null); setBlocks([]) }
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch (e) { console.error('removeNote:', e) }
  }, [activeNote])

  const pinNote        = useCallback((id, pinned)      => scheduleNoteSave(id, { pinned }), [scheduleNoteSave])
  const moveNoteToFolder = useCallback((id, folder_id) => scheduleNoteSave(id, { folder_id }), [scheduleNoteSave])
  const updateNoteTitle  = useCallback((id, title)     => scheduleNoteSave(id, { title }), [scheduleNoteSave])
  const updateNoteTags   = useCallback((id, tags)      => scheduleNoteSave(id, { tags }), [scheduleNoteSave])

  // ── Block CRUD ─────────────────────────────────────────────────────────────
  const addBlock = useCallback(async (afterIndex, type = 'text') => {
    if (!activeNote) return
    const position = afterIndex + 1
    const toShift = blocks.filter(b => b.position >= position)
    for (const b of toShift) await updateBlock(b.id, { position: b.position + 1 })
    setBlocks(prev =>
      prev.map(b => b.position >= position ? { ...b, position: b.position + 1 } : b)
        .sort((a, b) => a.position - b.position)
    )
    const nb = await createBlock(activeNote.id, type, '', position)
    setBlocks(prev => [...prev, nb].sort((a, b) => a.position - b.position))
    return nb
  }, [activeNote, blocks])

  const removeBlock = useCallback(async (id) => {
    if (blocks.length <= 1) return
    try { await deleteBlock(id); setBlocks(prev => prev.filter(b => b.id !== id)) }
    catch (e) { console.error(e) }
  }, [blocks])

  const changeBlockType = useCallback((id, type) => scheduleBlockSave(id, { type, checked: false }), [scheduleBlockSave])

  const moveBlock = useCallback(async (fromIndex, toIndex) => {
    const reordered = [...blocks]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    const updated = reordered.map((b, i) => ({ ...b, position: i }))
    setBlocks(updated)
    for (const b of updated) await updateBlock(b.id, { position: b.position })
  }, [blocks])

  // ── Folder CRUD ────────────────────────────────────────────────────────────
  const addFolder = useCallback(async (name, color) => {
    if (!session?.user) return
    try {
      const f = await createFolder(session.user.id, name, color)
      setFolders(prev => [...prev, f])
      return f
    } catch (e) { console.error(e) }
  }, [session])

  const renameFolder = useCallback(async (id, name) => {
    try { await updateFolder(id, { name }); setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f)) }
    catch (e) { console.error(e) }
  }, [])

  const removeFolder = useCallback(async (id) => {
    try {
      await deleteFolder(id)
      setFolders(prev => prev.filter(f => f.id !== id))
      if (activeFolder === id) setActiveFolder(null)
    } catch (e) { console.error(e) }
  }, [activeFolder])

  // ── Filtered notes ─────────────────────────────────────────────────────────
  const visibleNotes = notes
    .filter(n => activeFolder === null || n.folder_id === activeFolder)
    .filter(n => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return n.title.toLowerCase().includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q))
    })
    .sort((a, b) =>
      (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
      new Date(b.updated_at) - new Date(a.updated_at)
    )

  return {
    session, loading, saving,
    folders, notes: visibleNotes, allNotes: notes,
    activeFolder, setActiveFolder,
    activeNote, openNote,
    blocks, search, setSearch,
    addNote, removeNote, pinNote, moveNoteToFolder,
    updateNoteTitle, updateNoteTags,
    addBlock, removeBlock, changeBlockType, moveBlock,
    scheduleBlockSave, scheduleNoteSave,
    addFolder, renameFolder, removeFolder,
  }
}
