import { openDB } from 'idb'
import type { DBSchema } from 'idb'

export interface Chat {
  id: string
  title: string
  level: 'basic' | 'cet4' | 'cet6'
  partnerName: string
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

export interface DiaryEntry {
  date: string // YYYY-MM-DD
  content: string
  mood?: string // emoji or mood key
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
    indexes: { updatedAt: number }
  }
}

const dbPromise = openDB<CetChatDB>('cet-chat', 2, {
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

export async function getDiaryEntry(date: string): Promise<DiaryEntry | undefined> {
  const db = await dbPromise
  return db.get('diary', date)
}

export async function saveDiaryEntry(entry: DiaryEntry): Promise<void> {
  const db = await dbPromise
  await db.put('diary', entry)
}

export async function deleteDiaryEntry(date: string): Promise<void> {
  const db = await dbPromise
  await db.delete('diary', date)
}

export async function getAllDiaryEntries(): Promise<DiaryEntry[]> {
  const db = await dbPromise
  return db.getAllFromIndex('diary', 'updatedAt')
}

export async function getDiaryDates(): Promise<string[]> {
  const db = await dbPromise
  const all = await db.getAll('diary')
  return all.map((e) => e.date)
}
