<template>
  <main class="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50 px-4 py-8 text-slate-900 sm:px-8">
    <section class="mx-auto w-full max-w-6xl rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-8">
      <header class="mb-6">
        <p class="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">VueJS App</p>
        <h1 class="text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">Text to Speech</h1>
        <p class="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500 sm:text-lg">
          Nhập văn bản, import file, chia đoạn cho CapCut, đọc trực tiếp và tải MP3 tiếng Việt.
        </p>
      </header>

      <div class="space-y-3">
        <label class="block text-sm font-extrabold text-slate-700" for="text">Nội dung cần đọc</label>
        <textarea
          id="text"
          v-model="text"
          class="min-h-56 w-full resize-y rounded-3xl border border-slate-300 bg-white p-5 text-base leading-8 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          placeholder="Nhập nội dung ở đây..."
          rows="8"
        ></textarea>
      </div>

      <div class="mt-4 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          ref="fileInput"
          class="hidden"
          type="file"
          accept=".txt,.md,.docx,.srt,.vtt,.json,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          @change="importFile"
        />
        <button
          class="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          @click="openFilePicker"
        >
          Import file
        </button>
        <button
          class="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          :disabled="!text"
          @click="clearText"
        >
          Xóa nội dung
        </button>
        <span class="text-sm font-bold text-slate-500">Hỗ trợ: TXT, MD, DOCX, SRT, VTT, JSON</span>
      </div>

      <section class="mt-5 rounded-[26px] border border-slate-200 bg-slate-50 p-5">
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p class="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">CapCut Helper</p>
            <h2 class="text-2xl font-black text-slate-950">Chia văn bản cho CapCut</h2>
            <p class="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Mỗi đoạn được chia nhỏ để không vượt quá giới hạn ký tự của ô Text to Speech trong CapCut.
            </p>
          </div>
          <div class="w-fit rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">
            {{ text.length }} ký tự
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div class="w-full sm:w-40">
            <label class="mb-2 block text-sm font-extrabold text-slate-700" for="chunkLimit">Giới hạn mỗi đoạn</label>
            <input
              id="chunkLimit"
              v-model.number="chunkLimit"
              class="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              type="number"
              min="100"
              max="500"
              step="10"
            />
          </div>
          <button
            class="rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            :disabled="!capCutChunks.length"
            @click="copyAllChunks"
          >
            Copy tất cả đoạn
          </button>
        </div>

        <div class="mt-4 grid max-h-96 gap-3 overflow-auto pr-1">
          <article
            v-for="(chunk, index) in capCutChunks"
            :key="index"
            class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <strong class="text-slate-950">Đoạn {{ index + 1 }}</strong>
              <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{{ chunk.length }} ký tự</span>
            </div>
            <p class="mb-4 whitespace-pre-line text-sm font-medium leading-7 text-slate-600">{{ chunk }}</p>
            <button
              class="rounded-xl bg-slate-100 px-4 py-2 text-xs font-extrabold text-slate-800 transition hover:bg-slate-200"
              type="button"
              @click="copyChunk(chunk, index)"
            >
              Copy đoạn {{ index + 1 }}
            </button>
          </article>
        </div>
      </section>

      <div class="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <label class="mb-2 block text-sm font-extrabold text-slate-700" for="voice">Giọng đọc</label>
          <select
            id="voice"
            v-model="selectedVoiceName"
            class="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">Giọng mặc định</option>
            <option v-for="voice in filteredVoices" :key="voice.name" :value="voice.name">
              {{ voice.name }} - {{ voice.lang }}
            </option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-extrabold text-slate-700" for="language">Lọc ngôn ngữ</label>
          <select
            id="language"
            v-model="languageFilter"
            class="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">Tất cả</option>
            <option v-for="lang in languages" :key="lang" :value="lang">
              {{ lang }}
            </option>
          </select>
        </div>
      </div>

      <div class="mt-5 grid gap-4 lg:grid-cols-3">
        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div class="mb-3 flex items-center justify-between font-extrabold">
            <label for="rate">Tốc độ</label>
            <span class="text-blue-700">{{ rate.toFixed(1) }}</span>
          </div>
          <input id="rate" v-model.number="rate" class="w-full accent-blue-600" type="range" min="0.5" max="2" step="0.1" />
        </div>

        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div class="mb-3 flex items-center justify-between font-extrabold">
            <label for="pitch">Cao độ</label>
            <span class="text-blue-700">{{ pitch.toFixed(1) }}</span>
          </div>
          <input id="pitch" v-model.number="pitch" class="w-full accent-blue-600" type="range" min="0" max="2" step="0.1" />
        </div>

        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div class="mb-3 flex items-center justify-between font-extrabold">
            <label for="volume">Âm lượng</label>
            <span class="text-blue-700">{{ Math.round(volume * 100) }}%</span>
          </div>
          <input id="volume" v-model.number="volume" class="w-full accent-blue-600" type="range" min="0" max="1" step="0.1" />
        </div>
      </div>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          class="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canSpeak"
          @click="speak"
        >
          Đọc văn bản
        </button>
        <button
          class="rounded-2xl bg-slate-200 px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!isSpeaking"
          @click="pause"
        >
          Tạm dừng
        </button>
        <button
          class="rounded-2xl bg-slate-200 px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!isPaused"
          @click="resume"
        >
          Tiếp tục
        </button>
        <button
          class="rounded-2xl bg-red-100 px-5 py-3 text-sm font-extrabold text-red-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!isSpeaking && !isPaused"
          @click="stop"
        >
          Dừng
        </button>
        <button
          class="rounded-2xl bg-green-100 px-5 py-3 text-sm font-extrabold text-green-700 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canSpeak || isDownloading"
          @click="downloadMp3"
        >
          {{ isDownloading ? 'Đang tạo MP3...' : 'Tải MP3' }}
        </button>
      </div>

      <div class="mt-5 space-y-3">
        <p v-if="status" class="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-extrabold text-blue-700">{{ status }}</p>
        <p v-if="downloadStatus" class="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-extrabold text-blue-700">{{ downloadStatus }}</p>
        <p v-if="!isSupported" class="rounded-2xl bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700">
          Trình duyệt này chưa hỗ trợ Web Speech API. Hãy thử Chrome, Edge hoặc Safari bản mới.
        </p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import mammoth from 'mammoth/mammoth.browser'

const STORAGE_KEY = 'vue-text-to-speech-content'
const SUPPORTED_TEXT_EXTENSIONS = ['txt', 'md', 'srt', 'vtt', 'json']
const TTS_API_URL = '/api/tts'

const text = ref(localStorage.getItem(STORAGE_KEY) || 'Xin chào! Đây là ứng dụng chuyển văn bản thành giọng nói bằng VueJS.')
const fileInput = ref(null)
const voices = ref([])
const selectedVoiceName = ref('')
const languageFilter = ref('vi-VN')
const chunkLimit = ref(500)
const rate = ref(1)
const pitch = ref(1)
const volume = ref(1)
const status = ref('')
const downloadStatus = ref('')
const isDownloading = ref(false)
const importedFileName = ref('')
const isSpeaking = ref(false)
const isPaused = ref(false)

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

function openFilePicker() {
  fileInput.value?.click()
}

function clearText() {
  stop()
  text.value = ''
  importedFileName.value = ''
  status.value = 'Đã xóa nội dung.'
}

async function importFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''

  if (!file) return

  const extension = file.name.split('.').pop()?.toLowerCase() || ''

  try {
    status.value = `Đang import file ${file.name}...`

    let content = ''

    if (extension === 'docx') {
      content = await readDocxFile(file)
    } else if (SUPPORTED_TEXT_EXTENSIONS.includes(extension) || file.type.startsWith('text/')) {
      content = await readTextFile(file)
    } else {
      throw new Error('Định dạng file chưa được hỗ trợ. Hãy dùng TXT, MD, DOCX, SRT, VTT hoặc JSON.')
    }

    text.value = cleanImportedText(content)
    importedFileName.value = file.name
    status.value = `Đã import ${file.name} (${text.value.length} ký tự).`
  } catch (error) {
    status.value = error.message || 'Không thể import file.'
  }
}

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Không đọc được file văn bản.'))
    reader.readAsText(file, 'utf-8')
  })
}

async function readDocxFile(file) {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value || ''
}

function cleanImportedText(content) {
  const lineBreak = String.fromCharCode(10)

  return String(content)
    .replaceAll(String.fromCharCode(13) + lineBreak, lineBreak)
    .replaceAll(String.fromCharCode(13), lineBreak)
    .split(lineBreak)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(lineBreak + lineBreak)
    .trim()
}

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
  utterance.lang = selectedVoice.value?.lang || languageFilter.value || 'vi-VN'

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
