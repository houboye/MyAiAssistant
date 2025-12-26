import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'

export default function InputArea() {
  const [, forceUpdate] = useState({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { sendMessage, isLoading } = useStore()

  // 强制刷新以更新按钮状态
  const triggerUpdate = useCallback(() => {
    forceUpdate({})
  }, [])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  })

  const getInputValue = () => {
    return textareaRef.current?.value?.trim() || ''
  }

  const handleSubmit = () => {
    const value = getInputValue()
    if (!value || isLoading) return
    sendMessage(value)
    if (textareaRef.current) {
      textareaRef.current.value = ''
    }
    triggerUpdate()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 提交，Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const hasInput = getInputValue().length > 0

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          onChange={triggerUpdate}
          onInput={triggerUpdate}
          onKeyDown={handleKeyDown}
          placeholder="有什么可以帮你的？"
          rows={1}
          disabled={isLoading}
        />
        <motion.button 
          className={`send-btn ${hasInput && !isLoading ? 'active' : ''}`}
          onClick={handleSubmit}
          disabled={isLoading}
          whileHover={hasInput && !isLoading ? { scale: 1.05 } : {}}
          whileTap={hasInput && !isLoading ? { scale: 0.95 } : {}}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </motion.button>
      </div>
      <span className="input-hint">Enter 发送，Shift+Enter 换行</span>
    </div>
  )
}

