import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { useStore } from '../store'

export default function ChatPanel() {
  const { messages, isLoading, highlightedAI } = useStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="chat-panel">
      <div className="panel-header">
        <span className="panel-icon">🤖</span>
        <h2>AI 回答</h2>
      </div>

      <div className="messages-container">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div 
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="empty-icon">💬</div>
              <p>开始一段新对话吧</p>
              <span>输入你的问题，AI将为你解答</span>
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id}
                className={`message ${message.role}${message.isError ? ' error-message' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="message-avatar">
                  {message.role === 'user' ? '👤' : message.isError ? '⚠️' : '🤖'}
                </div>
                <div className="message-content">
                  {message.role === 'assistant' ? (
                    <div className={`markdown-body${message.isError ? ' error-content' : ''}`}>
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                      {message.isError && message.errorType && (
                        <div className="error-badge">
                          {message.errorType === 'config' && '🔧 配置错误'}
                          {message.errorType === 'auth_error' && '🔑 认证错误'}
                          {message.errorType === 'rate_limit' && '⏱️ 频率限制'}
                          {message.errorType === 'timeout' && '⏳ 请求超时'}
                          {message.errorType === 'network_error' && '🌐 网络错误'}
                          {message.errorType === 'model_error' && '🤖 模型错误'}
                          {message.errorType === 'api_error' && '❌ API错误'}
                        </div>
                      )}
                      {highlightedAI.length > 0 && (
                        <style>{`
                          .markdown-body mark.highlight-match {
                            background: rgba(245, 158, 11, 0.3);
                            padding: 1px 4px;
                            border-radius: 3px;
                          }
                        `}</style>
                      )}
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {isLoading && (
          <motion.div 
            className="message assistant loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

