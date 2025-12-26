import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { api } from '../services/api'

const AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'] },
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] },
  { id: 'claude', name: 'Claude', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  { id: 'zhipu', name: '智谱AI', models: ['glm-4-plus', 'glm-4', 'glm-4-flash', 'glm-4-air'] },
  { id: 'grok', name: 'Grok', models: ['grok-1'] },
]

export default function Header() {
  const { aiConfig, setAIConfig, aiConnected, setAIConnected } = useStore()
  const [showConfig, setShowConfig] = useState(false)
  const [tempApiKey, setTempApiKey] = useState(aiConfig.apiKey)

  const currentProvider = AI_PROVIDERS.find(p => p.id === aiConfig.provider)

  useEffect(() => {
    // 检查AI连接状态
    if (aiConfig.apiKey) {
      api.checkAIConnection({ provider: aiConfig.provider, apiKey: aiConfig.apiKey })
        .then(setAIConnected)
    }
  }, [aiConfig.provider, aiConfig.apiKey])

  const handleSaveConfig = () => {
    setAIConfig({ apiKey: tempApiKey })
    setShowConfig(false)
  }

  return (
    <header className="header">
      <div className="header-left">
        <div className="ai-selector">
          <select 
            value={aiConfig.provider}
            onChange={(e) => {
              const provider = e.target.value as typeof aiConfig.provider
              const models = AI_PROVIDERS.find(p => p.id === provider)?.models || []
              setAIConfig({ provider, model: models[0] })
            }}
          >
            {AI_PROVIDERS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="header-right">
        <div className="ai-status">
          <span className="status-dot" data-connected={aiConnected}></span>
          <span>AI服务{aiConnected ? '已' : '未'}连接</span>
          {aiConnected && <span className="status-badge">✅ {aiConfig.model}</span>}
        </div>
        
        <button className="config-btn" onClick={() => setShowConfig(!showConfig)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>

        <button className="icon-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        </button>
      </div>

      {showConfig && (
        <div className="config-modal">
          <div className="config-content">
            <h3>AI 配置</h3>
            
            <div className="config-field">
              <label>服务提供商</label>
              <select 
                value={aiConfig.provider}
                onChange={(e) => {
                  const provider = e.target.value as typeof aiConfig.provider
                  const models = AI_PROVIDERS.find(p => p.id === provider)?.models || []
                  setAIConfig({ provider, model: models[0] })
                }}
              >
                {AI_PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="config-field">
              <label>模型</label>
              <select 
                value={aiConfig.model}
                onChange={(e) => setAIConfig({ model: e.target.value })}
              >
                {currentProvider?.models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="config-field">
              <label>API Key</label>
              <input 
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="输入你的 API Key"
              />
            </div>

            <div className="config-actions">
              <button className="cancel-btn" onClick={() => setShowConfig(false)}>取消</button>
              <button className="save-btn" onClick={handleSaveConfig}>保存</button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

