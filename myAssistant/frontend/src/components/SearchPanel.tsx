import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

const SEARCH_ENGINES = [
  { id: 'google', name: 'Google', icon: '🔍', searchUrl: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', icon: '🔎', searchUrl: 'https://www.bing.com/search?q=' },
  { id: 'baidu', name: '百度', icon: '🔍', searchUrl: 'https://www.baidu.com/s?wd=' },
]

export default function SearchPanel() {
  const {
    searchEngine,
    setSearchEngine,
    keywords,
    addKeyword,
    removeKeyword,
    updateKeyword,
    searchResults,
    isSearching,
    customSearch,
    setCustomSearch,
    performSearch,
    similarities,
    differences,
    highlightedSearch,
  } = useStore()

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentEngine = SEARCH_ENGINES.find(e => e.id === searchEngine)

  // 直接执行搜索，使用输入框当前值
  const handleSearch = () => {
    const searchValue = searchInputRef.current?.value || customSearch || keywords.join(' ')
    if (searchValue.trim()) {
      performSearch(searchValue.trim())
    }
  }

  const handleEditKeyword = (index: number, value: string) => {
    setEditingIndex(index)
    setEditValue(value)
  }

  const handleSaveKeyword = (index: number) => {
    if (editValue.trim()) {
      updateKeyword(index, editValue.trim())
    }
    setEditingIndex(null)
    performSearch()
  }

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      addKeyword(newKeyword.trim())
      setNewKeyword('')
      performSearch()
    }
  }

  const handleRemoveKeyword = (index: number) => {
    removeKeyword(index)
    performSearch()
  }

  const highlightText = (text: string) => {
    if (!highlightedSearch.length) return text
    
    let result = text
    highlightedSearch.forEach(phrase => {
      if (phrase) {
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`(${escaped})`, 'gi')
        result = result.replace(regex, '<mark class="highlight-match">$1</mark>')
      }
    })
    return result
  }

  // 打开搜索引擎主页并填入搜索内容
  const handleOpenSearchEngine = () => {
    const engine = SEARCH_ENGINES.find(e => e.id === searchEngine)
    if (!engine) return
    
    const query = customSearch || keywords.join(' ')
    const url = engine.searchUrl + encodeURIComponent(query)
    window.open(url, '_blank')
  }

  return (
    <div className="search-panel">
      <div className="panel-header">
        <span className="panel-icon">🔍</span>
        <h2>{currentEngine?.name} 搜索</h2>
        <select 
          className="engine-select"
          value={searchEngine}
          onChange={(e) => setSearchEngine(e.target.value)}
        >
          {SEARCH_ENGINES.map(engine => (
            <option key={engine.id} value={engine.id}>
              {engine.icon} {engine.name}
            </option>
          ))}
        </select>
      </div>

      <div className="search-input-wrapper">
        <input
          ref={searchInputRef}
          type="text"
          className="search-input"
          placeholder="输入搜索内容（留空则自动提取关键词）"
          value={customSearch}
          onChange={(e) => setCustomSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        {customSearch && (
          <button className="clear-input-btn" onClick={() => setCustomSearch('')}>
            ✕
          </button>
        )}
        <button 
          className="search-btn"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <span className="loading-spinner"></span>
          ) : (
            <>🔍 搜索</>
          )}
        </button>
        <button 
          className="more-btn"
          onClick={handleOpenSearchEngine}
          title={`在 ${currentEngine?.name} 中打开搜索`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          更多
        </button>
      </div>

      {/* 关键词标签 */}
      {keywords.length > 0 && (
        <div className="keywords-section">
          <div className="keywords-header">
            <span>AI 提取关键词</span>
          </div>
          <div className="keywords-list">
            <AnimatePresence>
              {keywords.map((keyword, index) => (
                <motion.div
                  key={`${keyword}-${index}`}
                  className="keyword-tag"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  {editingIndex === index ? (
                    <input
                      type="text"
                      className="keyword-edit-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSaveKeyword(index)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveKeyword(index)}
                      autoFocus
                    />
                  ) : (
                    <>
                      <span onClick={() => handleEditKeyword(index, keyword)}>
                        {keyword}
                      </span>
                      <button 
                        className="keyword-remove"
                        onClick={() => handleRemoveKeyword(index)}
                      >
                        ✕
                      </button>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            <div className="add-keyword">
              <input
                type="text"
                placeholder="+ 添加关键词"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
            </div>
          </div>
        </div>
      )}

      {/* 相同点和不同点 */}
      {(similarities.length > 0 || differences.length > 0) && (
        <div className="comparison-section">
          {similarities.length > 0 && (
            <div className="comparison-block similarities">
              <h4>✅ 相同观点</h4>
              <ul>
                {similarities.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {differences.length > 0 && (
            <div className="comparison-block differences">
              <h4>⚡ 不同观点</h4>
              <ul>
                {differences.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 搜索结果 */}
      <div className="search-results">
        {isSearching ? (
          <div className="searching-state">
            <div className="search-loading">
              <div className="loading-bar"></div>
            </div>
            <p>正在搜索...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <AnimatePresence>
            {searchResults.map((result, index) => (
              <motion.a
                key={result.url}
                className="search-result-item"
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="result-source">{result.source}</div>
                <h3 className="result-title">{result.title}</h3>
                <p 
                  className="result-snippet"
                  dangerouslySetInnerHTML={{ __html: highlightText(result.snippet) }}
                />
                <span className="result-url">{result.url}</span>
              </motion.a>
            ))}
          </AnimatePresence>
        ) : (
          <div className="empty-results">
            <span>🔍</span>
            <p>搜索结果将显示在这里</p>
          </div>
        )}
      </div>
    </div>
  )
}

