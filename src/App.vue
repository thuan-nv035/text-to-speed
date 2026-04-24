<template>
  <main class="app-shell">
    <section class="card">
      <div class="header">
        <p class="eyebrow">VueJS App</p>
        <h1>Text to Speech</h1>
        <p class="subtitle">Nhập văn bản, chọn giọng đọc và điều chỉnh tốc độ đọc.</p>
      </div>

      <label class="label" for="text">Nội dung cần đọc</label>
      <textarea
        id="text"
        v-model="text"
        class="textarea"
        placeholder="Nhập nội dung ở đây..."
        rows="8"
      ></textarea>

      <section class="capcut-panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow small">CapCut Helper</p>
            <h2>Chia văn bản cho CapCut</h2>
            <p>Mỗi đoạn được chia nhỏ để không vượt quá giới hạn ký tự của ô Text to Speech trong CapCut.</p>
          </div>
          <div class="counter">
            {{ text.length }} ký tự
          </div>
        </div>

        <div class="chunk-control">
          <label class="label" for="chunkLimit">Giới hạn mỗi đoạn</label>
          <input
            id="chunkLimit"
            v-model.number="chunkLimit"
            class="input small-input"
            type="number"
            min="100"
            max="500"
            step="10"
          />
          <button class="btn" type="button" @click="copyAllChunks">
            Copy tất cả đoạn
          </button>
        </div>

        <div class="chunk-list">
          <article v-for="(chunk, index) in capCutChunks" :key="index" class="chunk-card">
            <div class="chunk-head">
              <strong>Đoạn {{ index + 1 }}</strong>
              <span>{{ chunk.length }} ký tự</span>
            </div>
            <p>{{ chunk }}</p>
            <button class="btn mini" type="button" @click="copyChunk(chunk, index)">
              Copy đoạn {{ index + 1 }}
            </button>
          </article>
        </div>
      </section>

      <div class="grid two">
        <div class="field">
          <label class="label" for="voice">Giọng đọc</label>
          <select id="voice" v-model="selectedVoiceName" class="input">
            <option value="">Giọng mặc định</option>
            <option v-for="voice in filteredVoices" :key="voice.name" :value="voice.name">
              {{ voice.name }} - {{ voice.lang }}
            </option>
          </select>
        </div>

        <div class="field">
          <label class="label" for="language">Lọc ngôn ngữ</label>
          <select id="language" v-model="languageFilter" class="input">
            <option value="">Tất cả</option>
            <option v-for="lang in languages" :key="lang" :value="lang">
              {{ lang }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid three">
        <div class="range-box">
          <div class="range-title">
            <label for="rate">Tốc độ</label>
            <span>{{ rate.toFixed(1) }}</span>
          </div>
          <input id="rate" v-model.number="rate" type="range" min="0.5" max="2" step="0.1" />
        </div>

        <div class="range-box">
          <div class="range-title">
            <label for="pitch">Cao độ</label>
            <span>{{ pitch.toFixed(1) }}</span>
          </div>
          <input id="pitch" v-model.number="pitch" type="range" min="0" max="2" step="0.1" />
        </div>

        <div class="range-box">
          <div class="range-title">
            <label for="volume">Âm lượng</label>
            <span>{{ Math.round(volume * 100) }}%</span>
          </div>
          <input id="volume" v-model.number="volume" type="range" min="0" max="1" step="0.1" />
        </div>
      </div>

      <div class="actions">
        <button class="btn primary" :disabled="!canSpeak" @click="speak">
          Đọc văn bản
        </button>
        <button class="btn" :disabled="!isSpeaking" @click="pause">
          Tạm dừng
        </button>
        <button class="btn" :disabled="!isPaused" @click="resume">
          Tiếp tục
        </button>
        <button class="btn danger" :disabled="!isSpeaking && !isPaused" @click="stop">
          Dừng
        </button>
        <button class="btn success" :disabled="!canSpeak || isDownloading" @click="downloadMp3">
          {{ isDownloading ? 'Đang tạo MP3...' : 'Tải MP3' }}
        </button>
      </div>

      <p v-if="status" class="status">{{ status }}</p>
      <p v-if="downloadStatus" class="status">{{ downloadStatus }}</p>
      <p v-if="!isSupported" class="warning">
        Trình duyệt này chưa hỗ trợ Web Speech API. Hãy thử Chrome, Edge hoặc Safari bản mới.
      </p>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const STORAGE_KEY = 'vue-text-to-speech-content'

const text = ref(localStorage.getItem(STORAGE_KEY) || 'Xin chào! Đây là ứng dụng chuyển văn bản thành giọng nói bằng VueJS.')
const voices = ref([])
const selectedVoiceName = ref('')
const languageFilter = ref('vi-VN')
const chunkLimit = ref(480)
const rate = ref(1)
const pitch = ref(1)
const volume = ref(1)
const status = ref('')
const downloadStatus = ref('')
const isDownloading = ref(false)
const isSpeaking = ref(false)
const isPaused = ref(false)

const TTS_API_URL = '/api/tts'

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
const isSupported = computed(() => Boolean(synth && window.SpeechSynthesisUtterance))

const filteredVoices = computed(() => {
  if (!languageFilter.value) return voices.value
  return voices.value.filter((voice) => voice.lang === languageFilter.value)
})

const languages = computed(() => {
  return [...new Set(voices.value.map((voice) => voice.lang))].sort()
})

const selectedVoice = computed(() => {
  return voices.value.find((voice) => voice.name === selectedVoiceName.value) || null
})

const canSpeak = computed(() => {
  return isSupported.value && text.value.trim().length > 0
})

const capCutChunks = computed(() => {
  return splitTextForCapCut(text.value, chunkLimit.value)
})

function splitTextForCapCut(input, limit = 480) {
  const cleanText = input
    .replaceAll(String.fromCharCode(10), ' ')
    .replaceAll(String.fromCharCode(9), ' ')
    .split(' ')
    .filter(Boolean)
    .join(' ')
    .trim()

  if (!cleanText) return []

  const safeLimit = Math.min(Math.max(Number(limit) || 480, 100), 500)
  const sentences = cleanText.match(/[^.!?。！？]+[.!?。！？]*/g) || [cleanText]
  const chunks = []
  let current = ''

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim()

    if (!trimmedSentence) continue

    if (trimmedSentence.length > safeLimit) {
      if (current) {
        chunks.push(current.trim())
        current = ''
      }

      const words = trimmedSentence.split(' ')
      let wordChunk = ''

      for (const word of words) {
        const next = wordChunk ? `${wordChunk} ${word}` : word

        if (next.length <= safeLimit) {
          wordChunk = next
        } else {
          if (wordChunk) chunks.push(wordChunk.trim())
          wordChunk = word
        }
      }

      if (wordChunk) chunks.push(wordChunk.trim())
      continue
    }

    const nextChunk = current ? `${current} ${trimmedSentence}` : trimmedSentence

    if (nextChunk.length <= safeLimit) {
      current = nextChunk
    } else {
      if (current) chunks.push(current.trim())
      current = trimmedSentence
    }
  }

  if (current) chunks.push(current.trim())

  return chunks
}

async function copyChunk(chunk, index) {
  try {
    await navigator.clipboard.writeText(chunk)
    downloadStatus.value = `Đã copy đoạn ${index + 1}.`
  } catch {
    downloadStatus.value = 'Không copy được. Hãy copy thủ công trong trình duyệt.'
  }
}

async function copyAllChunks() {
  try {
    const lineBreak = String.fromCharCode(10)
    const allChunks = capCutChunks.value
      .map((chunk, index) => [`Đoạn ${index + 1}:`, chunk].join(lineBreak))
      .join(lineBreak + lineBreak)

    await navigator.clipboard.writeText(allChunks)
    downloadStatus.value = `Đã copy ${capCutChunks.value.length} đoạn.`
  } catch {
    downloadStatus.value = 'Không copy được tất cả đoạn. Hãy copy từng đoạn.'
  }
}

function loadVoices() {
  if (!isSupported.value) return

  const allVoices = synth.getVoices()
  voices.value = allVoices

  if (!selectedVoiceName.value) {
    const vietnameseVoice = allVoices.find((voice) => voice.lang.toLowerCase().startsWith('vi'))
    selectedVoiceName.value = vietnameseVoice?.name || allVoices[0]?.name || ''
  }
}

function speak() {
  if (!canSpeak.value) {
    status.value = 'Vui lòng nhập văn bản cần đọc.'
    return
  }

  stop()

  const utterance = new SpeechSynthesisUtterance(text.value.trim())
  utterance.voice = selectedVoice.value
  utterance.rate = rate.value
  utterance.pitch = pitch.value
  utterance.volume = volume.value
  utterance.lang = selectedVoice.value?.lang || 'vi-VN'

  utterance.onstart = () => {
    isSpeaking.value = true
    isPaused.value = false
    status.value = 'Đang đọc văn bản...'
  }

  utterance.onpause = () => {
    isPaused.value = true
    status.value = 'Đã tạm dừng.'
  }

  utterance.onresume = () => {
    isPaused.value = false
    status.value = 'Đang tiếp tục đọc...'
  }

  utterance.onend = () => {
    isSpeaking.value = false
    isPaused.value = false
    status.value = 'Đã đọc xong.'
  }

  utterance.onerror = () => {
    isSpeaking.value = false
    isPaused.value = false
    status.value = 'Có lỗi khi đọc văn bản.'
  }

  synth.speak(utterance)
}

function pause() {
  if (!isSupported.value || !synth.speaking) return
  synth.pause()
  isPaused.value = true
}

function resume() {
  if (!isSupported.value || !synth.paused) return
  synth.resume()
  isPaused.value = false
}

function stop() {
  if (!isSupported.value) return
  synth.cancel()
  isSpeaking.value = false
  isPaused.value = false
}

async function downloadMp3() {
  if (!text.value.trim()) {
    downloadStatus.value = 'Vui lòng nhập văn bản trước khi tải MP3.'
    return
  }

  try {
    isDownloading.value = true
    downloadStatus.value = 'Đang gửi văn bản lên server để tạo file MP3...'

    const response = await fetch(TTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.value.trim(),
        voice: selectedVoice.value?.name || selectedVoiceName.value || 'vi-VN',
        lang: selectedVoice.value?.lang || languageFilter.value || 'vi-VN',
        rate: rate.value,
        pitch: pitch.value,
        volume: volume.value,
      }),
    })

    if (!response.ok) {
      throw new Error('Server không tạo được file MP3.')
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const fileName = `text-to-speech-${Date.now()}.mp3`

    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)

    downloadStatus.value = `Đã tải file ${fileName}.`
  } catch (error) {
    downloadStatus.value = error.message || 'Có lỗi khi tải file MP3.'
  } finally {
    isDownloading.value = false
  }
}

watch(text, (value) => {
  localStorage.setItem(STORAGE_KEY, value)
})

watch(languageFilter, () => {
  const available = filteredVoices.value
  const vietnameseVoice = available.find((voice) => voice.lang.toLowerCase().startsWith('vi'))
  selectedVoiceName.value = vietnameseVoice?.name || available[0]?.name || ''
})

onMounted(() => {
  loadVoices()

  if (isSupported.value) {
    synth.onvoiceschanged = loadVoices
  }
})

onBeforeUnmount(() => {
  stop()
  if (isSupported.value) {
    synth.onvoiceschanged = null
  }
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
  background: linear-gradient(135deg, #edf2ff, #f8fafc 45%, #ecfeff);
  color: #0f172a;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.card {
  width: min(980px, 100%);
  padding: 32px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.14);
  border: 1px solid rgba(148, 163, 184, 0.25);
  backdrop-filter: blur(18px);
}

.header {
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #2563eb;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 13px;
}

h1 {
  margin: 0;
  font-size: clamp(32px, 6vw, 56px);
  line-height: 1;
}

.subtitle {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 17px;
}

.label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
  color: #334155;
}

.textarea,
.input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 18px;
  background: #ffffff;
  color: #0f172a;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.textarea {
  resize: vertical;
  min-height: 190px;
  padding: 18px;
  font-size: 17px;
  line-height: 1.6;
}

.input {
  height: 48px;
  padding: 0 14px;
}

.textarea:focus,
.input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.grid {
  display: grid;
  gap: 16px;
  margin-top: 18px;
}

.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.capcut-panel {
  margin-top: 20px;
  padding: 20px;
  border-radius: 22px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.panel-header h2 {
  margin: 0;
  font-size: 24px;
}

.panel-header p {
  margin: 8px 0 0;
  color: #64748b;
}

.small {
  margin-bottom: 6px;
  font-size: 12px;
}

.counter {
  flex: 0 0 auto;
  padding: 10px 14px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 800;
}

.chunk-control {
  display: flex;
  gap: 12px;
  align-items: end;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.small-input {
  width: 140px;
}

.chunk-list {
  display: grid;
  gap: 12px;
  max-height: 360px;
  overflow: auto;
  padding-right: 4px;
}

.chunk-card {
  padding: 14px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.chunk-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.chunk-head span {
  color: #2563eb;
  font-weight: 700;
}

.chunk-card p {
  margin: 0 0 12px;
  color: #334155;
  line-height: 1.55;
}

.mini {
  padding: 9px 12px;
  border-radius: 12px;
  font-size: 13px;
}

.range-box {
  padding: 18px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.range-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 700;
}

.range-title span {
  color: #2563eb;
}

input[type='range'] {
  width: 100%;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  border: 0;
  border-radius: 16px;
  padding: 13px 18px;
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.primary {
  background: #2563eb;
  color: white;
}

.danger {
  background: #fee2e2;
  color: #b91c1c;
}

.success {
  background: #dcfce7;
  color: #166534;
}

.status,
.warning {
  margin: 18px 0 0;
  padding: 14px 16px;
  border-radius: 16px;
  font-weight: 700;
}

.status {
  background: #eff6ff;
  color: #1d4ed8;
}

.warning {
  background: #fef2f2;
  color: #b91c1c;
}

@media (max-width: 760px) {
  .app-shell {
    padding: 18px;
  }

  .card {
    padding: 22px;
  }

  .panel-header {
    flex-direction: column;
  }

  .chunk-control {
    align-items: stretch;
    flex-direction: column;
  }

  .small-input {
    width: 100%;
  }

  .two,
  .three {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
