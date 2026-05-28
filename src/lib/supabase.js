import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ── Folders ──────────────────────────────────────────────────────────────────
export const getFolders = async (userId) => {
  const { data, error } = await supabase
    .from('notes_folders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export const createFolder = async (userId, name, color = '#b8ff57') => {
  const { data, error } = await supabase
    .from('notes_folders')
    .insert({ user_id: userId, name, color })
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateFolder = async (id, patch) => {
  const { data, error } = await supabase
    .from('notes_folders')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteFolder = async (id) => {
  const { error } = await supabase.from('notes_folders').delete().eq('id', id)
  if (error) throw error
}

// ── Notes ─────────────────────────────────────────────────────────────────────
export const getNotes = async (userId) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export const createNote = async (userId, folderId = null) => {
  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, folder_id: folderId, title: 'Untitled' })
    .select()
    .single()
  if (error) throw error

  // Create a default text block
  await supabase.from('note_blocks').insert({
    note_id: data.id, type: 'text', content: '', position: 0
  })
  return data
}

export const updateNote = async (id, patch) => {
  const { data, error } = await supabase
    .from('notes')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteNote = async (id) => {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}

// ── Blocks ────────────────────────────────────────────────────────────────────
export const getBlocks = async (noteId) => {
  const { data, error } = await supabase
    .from('note_blocks')
    .select('*')
    .eq('note_id', noteId)
    .order('position', { ascending: true })
  if (error) throw error
  return data
}

export const createBlock = async (noteId, type = 'text', content = '', position = 0) => {
  const { data, error } = await supabase
    .from('note_blocks')
    .insert({ note_id: noteId, type, content, position })
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateBlock = async (id, patch) => {
  const { data, error } = await supabase
    .from('note_blocks')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteBlock = async (id) => {
  const { error } = await supabase.from('note_blocks').delete().eq('id', id)
  if (error) throw error
}

export const reorderBlocks = async (blocks) => {
  const updates = blocks.map((b, i) => ({ id: b.id, position: i, note_id: b.note_id, type: b.type, content: b.content, checked: b.checked }))
  const { error } = await supabase.from('note_blocks').upsert(updates)
  if (error) throw error
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function logDeviceInfo(userId) {
  const info = {
    user_id:      userId,
    device_type:  /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    os:           navigator.platform || 'unknown',
    browser:      navigator.userAgent.split(' ').pop() || 'unknown',
    screen_width:  window.screen.width,
    screen_height: window.screen.height,
    timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
    language:     navigator.language,
    logged_at:    new Date().toISOString(),
  }
  await supabase.from('device_logs').insert(info).catch(() => {})
}

export async function logActivity(userId, action, app = 'landing') {
  await supabase.from('activity_logs').insert({
    user_id: userId, action, app,
    logged_at: new Date().toISOString(),
  }).catch(() => {})
}

export async function signOut() {
  await supabase.auth.signOut()
}
