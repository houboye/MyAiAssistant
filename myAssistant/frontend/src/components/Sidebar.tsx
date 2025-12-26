import { motion } from 'framer-motion'
import { useStore } from '../store'

export default function Sidebar() {
  const { 
    sessions, 
    currentSessionId, 
    messages,
    createSession, 
    selectSession,
    clearAllSessions,
    theme,
    toggleTheme,
  } = useStore()

  const canCreateNew = messages.length > 0

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <aside className="sidebar">
      <motion.button 
        className={`new-chat-btn ${!canCreateNew ? 'disabled' : ''}`}
        onClick={createSession}
        disabled={!canCreateNew}
        whileHover={canCreateNew ? { scale: 1.02 } : {}}
        whileTap={canCreateNew ? { scale: 0.98 } : {}}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        新对话
      </motion.button>

      <div className="sessions-list">
        {/* 当前新对话 */}
        {!sessions.find(s => s.id === currentSessionId) && currentSessionId && (
          <motion.div
            className="session-item active"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="session-icon">💬</div>
            <div className="session-info">
              <span className="session-title">新对话</span>
              <span className="session-meta">{formatDate(new Date().toISOString())} · {messages.length}条消息</span>
            </div>
          </motion.div>
        )}

        {/* 历史会话 */}
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
            onClick={() => selectSession(session.id)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ backgroundColor: 'var(--hover-bg)' }}
          >
            <div className="session-info">
              <span className="session-title">{session.title}</span>
              <span className="session-meta">
                {formatDate(session.createdAt)} · {session.messageCount}条消息
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="clear-btn" onClick={clearAllSessions}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
          </svg>
          清空历史
        </button>
        <div className="theme-toggle">
          <button 
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => theme === 'light' && toggleTheme()}
          >
            🌙
          </button>
          <button 
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => theme === 'dark' && toggleTheme()}
          >
            ☀️
          </button>
        </div>
      </div>
    </aside>
  )
}

