import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, Message, SearchResult, AIConfig } from '../types'
import { api } from '../services/api'

interface AppState {
  // Theme
  theme: 'light' | 'dark'
  toggleTheme: () => void

  // AI Config
  aiConfig: AIConfig
  setAIConfig: (config: Partial<AIConfig>) => void
  aiConnected: boolean
  setAIConnected: (connected: boolean) => void

  // Sessions
  sessions: Session[]
  currentSessionId: string | null
  loadSessions: () => Promise<void>
  initSession: () => void
  createSession: () => void
  selectSession: (id: string) => void
  deleteSession: (id: string) => void
  clearAllSessions: () => Promise<void>

  // Messages
  messages: Message[]
  isLoading: boolean
  sendMessage: (content: string) => Promise<void>

  // Search
  searchEngine: string
  setSearchEngine: (engine: string) => void
  keywords: string[]
  setKeywords: (keywords: string[]) => void
  addKeyword: (keyword: string) => void
  removeKeyword: (index: number) => void
  updateKeyword: (index: number, value: string) => void
  searchResults: SearchResult[]
  isSearching: boolean
  customSearch: string
  setCustomSearch: (value: string) => void
  performSearch: (query?: string) => Promise<void>

  // Comparison
  similarities: string[]
  differences: string[]
  highlightedAI: string[]
  highlightedSearch: string[]
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      // AI Config
      aiConfig: {
        provider: 'zhipu',
        model: 'glm-4-flash',
        apiKey: 'f6d4b57824a348ecb46a09bf200c20a0.Gh4Hw7b7eMZXhiOz',
      },
      setAIConfig: (config) => set((state) => ({ aiConfig: { ...state.aiConfig, ...config } })),
      aiConnected: false,
      setAIConnected: (connected) => set({ aiConnected: connected }),

      // Sessions
      sessions: [],
      currentSessionId: null,
      
      loadSessions: async () => {
        try {
          const sessions = await api.getSessions()
          set({ sessions })
        } catch (error) {
          console.error('Failed to load sessions:', error)
        }
      },

      initSession: () => {
        const { sessions, currentSessionId } = get()
        if (!currentSessionId || !sessions.find(s => s.id === currentSessionId)) {
          const newSession: Session = {
            id: Date.now().toString(),
            title: '新对话',
            createdAt: new Date().toISOString(),
            messageCount: 0,
          }
          set({ 
            currentSessionId: newSession.id,
            messages: [],
            keywords: [],
            searchResults: [],
            similarities: [],
            differences: [],
          })
        }
      },

      createSession: () => {
        const { sessions, currentSessionId, messages } = get()
        
        // 如果当前会话没有消息，不创建新会话
        if (messages.length === 0) return
        
        // 保存当前会话到历史
        const currentSession = sessions.find(s => s.id === currentSessionId)
        if (currentSession) {
          // 会话已存在，无需重复添加
        }
        
        const newSession: Session = {
          id: Date.now().toString(),
          title: '新对话',
          createdAt: new Date().toISOString(),
          messageCount: 0,
        }
        
        set({
          currentSessionId: newSession.id,
          messages: [],
          keywords: [],
          searchResults: [],
          similarities: [],
          differences: [],
        })
      },

      selectSession: async (id) => {
        try {
          const messages = await api.getSessionMessages(id)
          set({ 
            currentSessionId: id, 
            messages,
            keywords: [],
            searchResults: [],
          })
          
          // 自动提取关键词并搜索
          if (messages.length > 0) {
            const { aiConfig } = get()
            try {
              const keywordResponse = await api.extractKeywords({
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                config: aiConfig,
              })
              
              if (keywordResponse.keywords.length > 0) {
                set({ keywords: keywordResponse.keywords })
                // 自动执行搜索
                get().performSearch(keywordResponse.searchQuery || keywordResponse.keywords.join(' '))
              }
            } catch (err) {
              console.error('Failed to extract keywords:', err)
            }
          }
        } catch (error) {
          console.error('Failed to load session:', error)
        }
      },

      deleteSession: async (id) => {
        try {
          await api.deleteSession(id)
          const { sessions, currentSessionId } = get()
          const newSessions = sessions.filter(s => s.id !== id)
          
          if (currentSessionId === id) {
            set({
              sessions: newSessions,
              currentSessionId: newSessions[0]?.id || null,
              messages: [],
            })
          } else {
            set({ sessions: newSessions })
          }
        } catch (error) {
          console.error('Failed to delete session:', error)
        }
      },

      clearAllSessions: async () => {
        try {
          await api.clearAllSessions()
          set({
            sessions: [],
            currentSessionId: null,
            messages: [],
            keywords: [],
            searchResults: [],
          })
          get().initSession()
        } catch (error) {
          console.error('Failed to clear sessions:', error)
        }
      },

      // Messages
      messages: [],
      isLoading: false,

      sendMessage: async (content) => {
        const { currentSessionId, messages, sessions, aiConfig } = get()
        
        if (!currentSessionId) return

        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        }

        set({ messages: [...messages, userMessage], isLoading: true })

        try {
          // 调用AI API
          const response = await api.chat({
            sessionId: currentSessionId,
            message: content,
            config: aiConfig,
          })

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.reply,
            timestamp: new Date().toISOString(),
            isError: !!response.error,
            errorType: response.errorType,
          }

          const newMessages = [...get().messages, assistantMessage]
          
          // 更新会话标题（使用第一条消息）
          let updatedSessions = sessions
          const existingSession = sessions.find(s => s.id === currentSessionId)
          
          if (!existingSession) {
            const newSession: Session = {
              id: currentSessionId,
              title: content.slice(0, 20) + (content.length > 20 ? '...' : ''),
              createdAt: new Date().toISOString(),
              messageCount: newMessages.length,
            }
            updatedSessions = [newSession, ...sessions]
          } else {
            updatedSessions = sessions.map(s => 
              s.id === currentSessionId 
                ? { ...s, messageCount: newMessages.length }
                : s
            )
          }

          set({ 
            messages: newMessages, 
            sessions: updatedSessions,
            isLoading: false,
          })

          // 持久化保存会话到后端
          try {
            const sessionToSave = updatedSessions.find(s => s.id === currentSessionId)
            if (sessionToSave) {
              await api.saveSession(currentSessionId, {
                session: sessionToSave,
                messages: newMessages
              })
            }
          } catch (err) {
            console.error('Failed to persist session:', err)
          }

          // 使用AI智能提取关键词（基于整个对话上下文，包括AI回复）
          try {
            const keywordResponse = await api.extractKeywords({
              messages: newMessages.map(m => ({ role: m.role, content: m.content })),
              config: aiConfig,
            })
            
            if (keywordResponse.keywords.length > 0) {
              set({ keywords: keywordResponse.keywords })
              // 自动执行搜索
              get().performSearch(keywordResponse.searchQuery || keywordResponse.keywords.join(' '))
            }
          } catch (err) {
            console.error('Failed to extract keywords:', err)
            // 如果AI提取失败，使用后端返回的关键词
            if (response.keywords && response.keywords.length > 0) {
              set({ keywords: response.keywords })
              get().performSearch()
            }
          }
        } catch (error) {
          console.error('Failed to send message:', error)
          set({ isLoading: false })
        }
      },

      // Search
      searchEngine: 'google',
      setSearchEngine: (engine) => set({ searchEngine: engine }),
      keywords: [],
      setKeywords: (keywords) => set({ keywords }),
      addKeyword: (keyword) => set((state) => ({ keywords: [...state.keywords, keyword] })),
      removeKeyword: (index) => set((state) => ({
        keywords: state.keywords.filter((_, i) => i !== index)
      })),
      updateKeyword: (index, value) => set((state) => ({
        keywords: state.keywords.map((k, i) => i === index ? value : k)
      })),
      searchResults: [],
      isSearching: false,
      customSearch: '',
      setCustomSearch: (value) => set({ customSearch: value }),

      performSearch: async (query) => {
        const { searchEngine, keywords, customSearch } = get()
        
        const searchQuery = query || customSearch || keywords.join(' ')
        if (!searchQuery.trim()) return

        set({ isSearching: true })

        try {
          const response = await api.search({
            query: searchQuery,
            engine: searchEngine,
          })

          set({
            searchResults: response.results,
            similarities: response.similarities || [],
            differences: response.differences || [],
            highlightedAI: response.highlightedAI || [],
            highlightedSearch: response.highlightedSearch || [],
            isSearching: false,
          })
        } catch (error) {
          console.error('Search failed:', error)
          set({ isSearching: false })
        }
      },

      // Comparison
      similarities: [],
      differences: [],
      highlightedAI: [],
      highlightedSearch: [],
    }),
    {
      name: 'ai-assistant-storage',
      partialize: (state) => ({
        theme: state.theme,
        searchEngine: state.searchEngine,
        // 不持久化 aiConfig，使用代码中的默认值
      }),
    }
  )
)

