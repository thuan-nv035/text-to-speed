import gTTS from 'gtts'
import fs from 'fs'
import path from 'path'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const { text } = req.body

  if (!text || !text.trim()) {
    return res.status(400).json({ message: 'Text is required' })
  }

  const fileName = `tts-${Date.now()}.mp3`
  const filePath = path.join('/tmp', fileName)

  const speech = new gTTS(text, 'vi')

  speech.save(filePath, (err) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ message: 'Cannot create MP3 file' })
    }

    const audioBuffer = fs.readFileSync(filePath)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Disposition', 'attachment; filename="giong-doc-tieng-viet.mp3"')
    return res.status(200).send(audioBuffer)
  })
}