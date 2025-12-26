import axios from 'axios'
import type { Session, Message, ChatRequest, ChatResponse, SearchRequest, SearchResponse, ExtractKeywordsRequest, ExtractKeywordsResponse } from '../types'

const apiClient = axios.create({
  timeout: 60000,
})

export const api = {
  // Session APIs
  async getSessions(): Promise<Session[]> {
    const response = await apiClient.get('/api/sessions')
    return response.data
  },

  async getSessionMessages(sessionId: string): Promise<Message[]> {
    const response = await apiClient.get(`/api/sessions/${sessionId}/messages`)
    return response.data
  },

  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/api/sessions/${sessionId}`)
  },

  async clearAllSessions(): Promise<void> {
    await apiClient.delete('/api/sessions')
  },

  async saveSession(sessionId: string, data: { session: Session; messages: Message[] }): Promise<void> {
    await apiClient.post(`/api/sessions/${sessionId}`, data)
  },

  // Chat API
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post('/ai/chat', request)
    return response.data
  },

  // Search API
  async search(request: SearchRequest): Promise<SearchResponse> {
    const response = await apiClient.post('/api/search', request)
    return response.data
  },

  // Health check
  async checkAIConnection(config: { provider: string; apiKey: string }): Promise<boolean> {
    try {
      const response = await apiClient.post('/ai/health', config)
      return response.data.connected
    } catch {
      return false
    }
  },

  // Extract keywords from conversation context
  async extractKeywords(request: ExtractKeywordsRequest): Promise<ExtractKeywordsResponse> {
    const response = await apiClient.post('/ai/extract-keywords', request)
    return response.data
  },
}

