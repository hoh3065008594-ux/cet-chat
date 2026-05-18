import { openDB } from 'idb'
import type { DBSchema } from 'idb'
import type { Persona } from '../types/persona'

export interface Chat {
  id: string
  title: string
  level: 'cet4' | 'cet6'
  partnerName: string
  personaId: string
  createdAt: number
  updatedAt: number
}

export interface Message {
  id: string
  chatId: string
  role: 'user' | 'assistant'
  content: string
  usedVocab: string[]
  timestamp: number
}

export interface DiaryComment {
  id: string
  partnerId: string
  partnerName: string
  avatar?: string
  content: string
  reply?: string
  createdAt: number
}

export interface DiaryEntry {
  id: string
  date: string
  content: string
  mood?: string
  comments?: DiaryComment[]
  createdAt: number
  updatedAt: number
}

interface CetChatDB extends DBSchema {
  chats: {
    key: string
    value: Chat
  }
  messages: {
    key: string
    value: Message
    indexes: { chatId: string }
  }
  diary: {
    key: string
    value: DiaryEntry
    indexes: { date: string; updatedAt: number }
  }
  personas: {
    key: string
    value: Persona
  }
}

const dbPromise = openDB<CetChatDB>('cet-chat', 4, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      db.createObjectStore('chats', { keyPath: 'id' })
      const msgStore = db.createObjectStore('messages', { keyPath: 'id' })
      msgStore.createIndex('chatId', 'chatId')
    }
    if (oldVersion < 2) {
      const diaryStore = db.createObjectStore('diary', { keyPath: 'date' })
      diaryStore.createIndex('updatedAt', 'updatedAt')
    }
    if (oldVersion < 3) {
      db.createObjectStore('personas', { keyPath: 'id' })
    }
    if (oldVersion < 4) {
      // v3→v4: diary key changed from 'date' to 'id', added date index
      // Old entries (keyed by date) get id = date; multiple entries allowed going forward
      db.deleteObjectStore('diary')
      const diaryStore = db.createObjectStore('diary', { keyPath: 'id' })
      diaryStore.createIndex('date', 'date')
      diaryStore.createIndex('updatedAt', 'updatedAt')
    }
  },
})

// --- Chats ---

export async function createChat(chat: Chat): Promise<void> {
  const db = await dbPromise
  await db.add('chats', chat)
}

export async function getChat(id: string): Promise<Chat | undefined> {
  const db = await dbPromise
  return db.get('chats', id)
}

export async function getAllChats(): Promise<Chat[]> {
  const db = await dbPromise
  return db.getAll('chats')
}

export async function updateChat(id: string, updates: Partial<Chat>): Promise<void> {
  const db = await dbPromise
  const chat = await db.get('chats', id)
  if (chat) {
    Object.assign(chat, updates, { updatedAt: Date.now() })
    await db.put('chats', chat)
  }
}

export async function deleteChat(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete('chats', id)
  // Also delete all messages of this chat
  const msgs = await db.getAllFromIndex('messages', 'chatId', id)
  const tx = db.transaction('messages', 'readwrite')
  for (const m of msgs) {
    await tx.store.delete(m.id)
  }
  await tx.done
}

// --- Messages ---

export async function addMessage(msg: Message): Promise<void> {
  const db = await dbPromise
  await db.add('messages', msg)
}

export async function getMessages(chatId: string): Promise<Message[]> {
  const db = await dbPromise
  return db.getAllFromIndex('messages', 'chatId', chatId)
}

export async function getMessageCount(chatId: string): Promise<number> {
  const db = await dbPromise
  return db.countFromIndex('messages', 'chatId', chatId)
}

export async function getLastMessage(chatId: string): Promise<Message | undefined> {
  const msgs = await getMessages(chatId)
  msgs.sort((a, b) => b.timestamp - a.timestamp)
  return msgs[0]
}

// --- Diary ---

export async function getDiaryEntry(id: string): Promise<DiaryEntry | undefined> {
  const db = await dbPromise
  return db.get('diary', id)
}

export async function getEntriesByDate(date: string): Promise<DiaryEntry[]> {
  const db = await dbPromise
  return db.getAllFromIndex('diary', 'date', date)
}

export async function saveDiaryEntry(entry: DiaryEntry): Promise<void> {
  const db = await dbPromise
  await db.put('diary', entry)
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete('diary', id)
}

export async function getAllDiaryEntries(): Promise<DiaryEntry[]> {
  const db = await dbPromise
  return db.getAllFromIndex('diary', 'updatedAt')
}

export async function getDiaryDates(): Promise<string[]> {
  const db = await dbPromise
  const all = await db.getAll('diary')
  return [...new Set(all.map((e) => e.date))]
}

// --- Personas ---

const PERSONAS_LS = 'cet-chat-personas'

function syncPersonasToLocalStorage(personas: Persona[]): void {
  try { localStorage.setItem(PERSONAS_LS, JSON.stringify(personas)) } catch {}
}

function loadPersonasFromLocalStorage(): Persona[] {
  try {
    const raw = localStorage.getItem(PERSONAS_LS)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

async function syncAllPersonas(): Promise<void> {
  const db = await dbPromise
  const all = await db.getAll('personas')
  syncPersonasToLocalStorage(all)
}

export async function createPersona(persona: Persona): Promise<void> {
  const db = await dbPromise
  await db.add('personas', persona)
  syncPersonasToLocalStorage(await db.getAll('personas'))
}

export async function getPersona(id: string): Promise<Persona | undefined> {
  const db = await dbPromise
  const fromDb = await db.get('personas', id)
  if (fromDb) return fromDb
  // Fallback to localStorage (PWA sync)
  const ls = loadPersonasFromLocalStorage()
  const fromLs = ls.find((p) => p.id === id)
  if (fromLs) {
    // Restore to IndexedDB
    await db.put('personas', fromLs)
    return fromLs
  }
}

export async function getAllPersonas(): Promise<Persona[]> {
  const db = await dbPromise
  const fromDb = await db.getAll('personas')
  // Merge with localStorage personas not yet in IndexedDB
  const ls = loadPersonasFromLocalStorage()
  for (const p of ls) {
    if (!fromDb.find((x) => x.id === p.id)) {
      fromDb.push(p)
      await db.put('personas', p).catch(() => {})
    }
  }
  if (fromDb.length > ls.length) {
    syncPersonasToLocalStorage(fromDb)
  }
  return fromDb
}

export async function updatePersona(id: string, updates: Partial<Persona>): Promise<void> {
  const db = await dbPromise
  const persona = await db.get('personas', id)
  if (persona) {
    Object.assign(persona, updates, { updatedAt: Date.now() })
    await db.put('personas', persona)
    syncPersonasToLocalStorage(await db.getAll('personas'))
  }
}

export async function deletePersona(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete('personas', id)
  syncPersonasToLocalStorage(await db.getAll('personas'))
}
