import express from 'express'
import cors from 'cors'
import gTTS from 'gtts'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
const PORT = 3000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.post('/api/tts', (req, res) => {
  const { text } = req.body

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Text is required' })
  }

  const fileName = `tts-${Date.now()}.mp3`
  const filePath = path.join(__dirname, fileName)

  const speech = new gTTS(text, 'vi')

  speech.save(filePath, (err) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ message: 'Cannot create MP3 file' })
    }

    res.download(filePath, 'giong-doc-tieng-viet.mp3', () => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    })
  })
})

app.listen(PORT, () => {
  console.log(`TTS server running at http://localhost:${PORT}`)
})