export interface Session {
  id: string
  title: string
  createdAt: string
  messageCount: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isError?: boolean
  errorType?: string
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
}

export interface AIConfig {
  provider: 'openai' | 'deepseek' | 'grok' | 'claude' | 'zhipu'
  model: string
  apiKey: string
}

export interface ChatRequest {
  sessionId: string
  message: string
  config: AIConfig
}

export interface ChatResponse {
  reply: string
  keywords: string[]
  error?: string
  errorType?: 'config' | 'auth_error' | 'rate_limit' | 'timeout' | 'network_error' | 'model_error' | 'api_error'
}

export interface SearchRequest {
  query: string
  engine: string
}

export interface SearchResponse {
  results: SearchResult[]
  similarities?: string[]
  differences?: string[]
  highlightedAI?: string[]
  highlightedSearch?: string[]
}

export interface ExtractKeywordsRequest {
  messages: Array<{ role: string; content: string }>
  config: AIConfig
}

export interface ExtractKeywordsResponse {
  keywords: string[]
  searchQuery: string
}

