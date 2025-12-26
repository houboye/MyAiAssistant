import { useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import SearchPanel from './components/SearchPanel'
import InputArea from './components/InputArea'
import Header from './components/Header'
import { useStore } from './store'

function App() {
  const { theme, initSession, loadSessions } = useStore()

  useEffect(() => {
    loadSessions()
    initSession()
  }, [])

  return (
    <div className={`app ${theme}`}>
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="content-panels">
          <ChatPanel />
          <SearchPanel />
        </div>
        <InputArea />
      </main>
    </div>
  )
}

export default App

