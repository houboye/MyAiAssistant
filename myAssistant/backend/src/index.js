import express from 'express'
import cors from 'cors'
import { sessionsRouter } from './routes/sessions.js'
import { searchRouter } from './routes/search.js'

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/sessions', sessionsRouter)
app.use('/api/search', searchRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => {
  console.log(`✨ Backend server running at http://localhost:${PORT}`)
})

