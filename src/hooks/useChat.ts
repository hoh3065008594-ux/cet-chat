import { useState, useEffect, useCallback } from 'react'
import type {
  Chat,
  Message,
} from '../services/db'
import {
  createChat,
  getChat,
  getAllChats,
  updateChat,
  deleteChat,
  addMessage,
  getMessages,
} from '../services/db'
import { sendChatMessage, generateGreeting } from '../services/ai'
import type { ChatMessage } from '../services/ai'
import { getSettings } from '../services/settings'

function uid(): string {
  try {
    return crypto.randomUUID()
  } catch {
    // Fallback for non-secure contexts (HTTP)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 3)
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  }
}

export function useChat(chatId?: string) {
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadChats = useCallback(async () => {
    const all = await getAllChats()
    all.sort((a, b) => b.updatedAt - a.updatedAt)
    setChats(all)
  }, [])

  const loadMessages = useCallback(async (id: string) => {
    const msgs = await getMessages(id)
    msgs.sort((a, b) => a.timestamp - b.timestamp)
    setMessages(msgs)
  }, [])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  useEffect(() => {
    if (chatId) {
      loadMessages(chatId)
    } else {
      setMessages([])
    }
  }, [chatId, loadMessages])

  const startNewChat = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { partnerName, vocabLevel } = getSettings()

    try {
      const greeting = await generateGreeting(partnerName, vocabLevel)

      const chatId = uid()
      const chat: Chat = {
        id: chatId,
        title: greeting.slice(0, 40) + '...',
        level: vocabLevel,
        partnerName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await createChat(chat)

      const aiMsg: Message = {
        id: uid(),
        chatId,
        role: 'assistant',
        content: greeting,
        usedVocab: [],
        timestamp: Date.now(),
      }
      await addMessage(aiMsg)

      setMessages([aiMsg])
      await loadChats()
      return chatId
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败')
      return null
    } finally {
      setLoading(false)
    }
  }, [loadChats])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!chatId) return
      setLoading(true)
      setError(null)
      const { vocabLevel } = getSettings()

      try {
        const userMsg: Message = {
          id: uid(),
          chatId,
          role: 'user',
          content,
          usedVocab: [],
          timestamp: Date.now(),
        }
        await addMessage(userMsg)
        setMessages((prev) => [...prev, userMsg])

        const chat = await getChat(chatId)
        if (chat) {
          chat.title = content.slice(0, 40)
          await updateChat(chatId, { title: chat.title })
        }

        const allMsgs = [...messages, userMsg]
        const apiMessages: ChatMessage[] = allMsgs.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))

        const { content: reply, usedVocab } = await sendChatMessage(apiMessages, vocabLevel)

        const aiMsg: Message = {
          id: uid(),
          chatId,
          role: 'assistant',
          content: reply,
          usedVocab,
          timestamp: Date.now(),
        }
        await addMessage(aiMsg)
        await updateChat(chatId, { updatedAt: Date.now() })
        setMessages((prev) => [...prev, aiMsg])
        await loadChats()
      } catch (e) {
        setError(e instanceof Error ? e.message : '发送失败')
      } finally {
        setLoading(false)
      }
    },
    [chatId, messages, loadChats]
  )

  const removeChat = useCallback(
    async (id: string) => {
      await deleteChat(id)
      await loadChats()
    },
    [loadChats]
  )

  return { chats, messages, loading, error, startNewChat, sendMessage, removeChat, loadChats }
}
