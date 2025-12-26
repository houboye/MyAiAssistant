import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../../data')
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json')

export const sessionsRouter = Router()

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// 读取会话数据
async function readSessions() {
  await ensureDataDir()
  try {
    const data = await fs.readFile(SESSIONS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return { sessions: [], messages: {} }
  }
}

// 写入会话数据
async function writeSessions(data) {
  await ensureDataDir()
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(data, null, 2))
}

// 获取所有会话列表
sessionsRouter.get('/', async (req, res) => {
  try {
    const data = await readSessions()
    res.json(data.sessions || [])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 获取特定会话的消息
sessionsRouter.get('/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params
    const data = await readSessions()
    const messages = data.messages?.[sessionId] || []
    res.json(messages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 保存会话和消息
sessionsRouter.post('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const { session, messages } = req.body
    
    const data = await readSessions()
    
    // 更新或添加会话
    const existingIndex = data.sessions.findIndex(s => s.id === sessionId)
    if (existingIndex >= 0) {
      data.sessions[existingIndex] = session
    } else {
      data.sessions.unshift(session)
    }
    
    // 保存消息
    if (!data.messages) data.messages = {}
    data.messages[sessionId] = messages
    
    await writeSessions(data)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 删除特定会话
sessionsRouter.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const data = await readSessions()
    
    data.sessions = data.sessions.filter(s => s.id !== sessionId)
    if (data.messages) {
      delete data.messages[sessionId]
    }
    
    await writeSessions(data)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 清空所有会话
sessionsRouter.delete('/', async (req, res) => {
  try {
    await writeSessions({ sessions: [], messages: {} })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

