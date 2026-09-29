import { AudioRecorder } from "src/client/audio.js"
import OpenAI, { Speech } from "src/client/openai.js"

window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Chromium's Web Speech routes audio to Google's cloud service via an API key
// baked only into official Google Chrome builds. Electron (and keyless Chromium)
// therefore get error:'network' with zero results every time — SpeechRecognition
// exists but can never succeed. Detected so the tier is reported unusable up
// front instead of recording and silently failing with "nothing heard".
const IS_ELECTRON = typeof window !== "undefined" && !!(
  window.lively4shell || (navigator.userAgent || "").includes("Electron")
)

// Seeded into whisper's initial prompt to bias recognition toward Lively/JS
// identifiers it would otherwise mis-spell ("shadow root" → shadowRoot). A soft
// prior, not a dictionary. A neutral identifier list (rather than English prose)
// keeps it from nudging auto-detect away from German. Edit via localStorage
// 'whisper-prompt'; override the detect language via 'whisper-lang'.
const LIVELY_WHISPER_PROMPT =
  "Lively4, Morph, shadowRoot, SystemJS, lively-container, lively-toolbelt, " +
  "lively-voice-compose, componentFolder, connectedCallback, livelyMigrate, " +
  "addEventListener, VoiceCapture, shadow DOM, camelCase"

/*
 * Transcribe a spoken burst through a degrading fallback chain, reporting which
 * tier produced the text so a silent downgrade is never mistaken for a bug.
 *
 * Tiers, best first:
 *   'whisper-local'  — local whisper.cpp server (POST <url>/inference, no key)
 *   'whisper-openai' — OpenAI Whisper on the recorded blob (needs a stored key)
 *   'web-speech'     — the browser's built-in SpeechRecognition, live transcript
 *                      (UNAVAILABLE in Electron — see IS_ELECTRON above)
 *
 * Web Speech only ever hears the LIVE microphone and emits results incrementally,
 * so it can't be handed a finished blob. It therefore runs in PARALLEL with the
 * MediaRecorder that feeds Whisper: by the time a blob exists the audio is gone.
 * stop() tries Whisper first and falls back to whatever Web Speech heard live.
 */
export class VoiceCapture {
  constructor() {
    this.recorder = new AudioRecorder()
    this.recognition = null
    this._finalText = ""
    this._interimText = ""
    this.onInterim = null // callback(text) for a live preview while recording
    this.lastError = null // last Web Speech error, for diagnostics
  }

  // Web Speech is only usable where the Google backend is reachable — i.e. a
  // real Chrome tab, never Electron (where it always errors 'network').
  static get webSpeechUsable() {
    return ("SpeechRecognition" in window) && !IS_ELECTRON
  }

  // Local whisper.cpp server. On by default; override the URL or disable via
  // localStorage ('whisper-local' = 'off'). The blob is WAV-converted first.
  static get localWhisperUrl() {
    return localStorage.getItem("whisper-local-url") || "http://127.0.0.1:8080/inference"
  }
  static get localWhisperEnabled() {
    return localStorage.getItem("whisper-local") !== "off"
  }

  // 'auto' → detect + transcribe in the spoken language (fixes German coming
  // back as English). No UI toggle — the multilingual model handles it.
  static get whisperLanguage() {
    return localStorage.getItem("whisper-lang") || "auto"
  }
  static get whisperPrompt() {
    return localStorage.getItem("whisper-prompt") || LIVELY_WHISPER_PROMPT
  }

  // A Whisper tier (local or OpenAI) can consume a recorded blob.
  static get whisperAvailable() {
    return this.localWhisperEnabled || !!OpenAI.getSubscriptionKey()
  }

  // True when at least one tier can produce text.
  static get available() {
    return this.webSpeechUsable || this.whisperAvailable
  }

  // Human-readable reason there's no working tier, or null if one is available.
  static get unavailableReason() {
    if (this.available) return null
    if (IS_ELECTRON) return "No transcription backend. Start the local whisper server, or add an OpenAI key."
    if (!("SpeechRecognition" in window)) return "No SpeechRecognition, local whisper disabled, and no OpenAI key."
    return "No transcription backend available."
  }

  get interimText() { return this._interimText }

  async start() {
    this._finalText = ""
    this._interimText = ""
    this._lastInterim = ""
    this.lastError = null
    // The MediaRecorder blob only exists to feed Whisper, so only record when a
    // Whisper tier can actually consume it. Otherwise it's pure web-speech (like
    // lively-smaug) — no second mic consumer, hence no getUserMedia contention.
    this._recordedForWhisper = VoiceCapture.whisperAvailable
    if (this._recordedForWhisper) await this.recorder.startRecording()
    this._startWebSpeech()               // live tier / Whisper fallback
  }

  // Returns { text, tier }. tier is 'whisper-openai' | 'web-speech' | 'none'.
  async stop() {
    const blob = this._recordedForWhisper ? await this.recorder.stopRecording() : null
    // Stop web-speech now, but only AWAIT its finalization if we actually fall
    // back to it — otherwise its ~1.5s finalize wait would tax every Whisper hit.
    const liveTextPromise = this._stopWebSpeech()

    if (blob) {
      // whisper.cpp wants 16kHz mono WAV; MediaRecorder gives webm/opus.
      let wav = null
      try { wav = await blobToWav16kMono(blob) } catch (e) {
        console.warn("[VoiceCapture] WAV conversion failed", e)
      }

      // Tier 1: local whisper.cpp — no key, no cloud. Fast-fails if server down.
      if (wav && VoiceCapture.localWhisperEnabled) {
        try {
          const result = await Speech.transcript(wav, {
            url: VoiceCapture.localWhisperUrl, apiKey: null, filename: "audio.wav",
            language: VoiceCapture.whisperLanguage, prompt: VoiceCapture.whisperPrompt
          })
          const text = cleanTranscript(result && result.text)
          if (text) return { text, tier: "whisper-local" }
        } catch (e) {
          console.warn("[VoiceCapture] local whisper failed, falling back", e)
        }
      }

      // Tier 2: OpenAI Whisper — only when a key is ALREADY stored (never prompts).
      if (OpenAI.getSubscriptionKey()) {
        try {
          const result = await Speech.transcript(blob)
          const text = cleanTranscript(result && result.text)
          if (text) return { text, tier: "whisper-openai" }
        } catch (e) {
          console.warn("[VoiceCapture] OpenAI whisper failed, falling back", e)
        }
      }
    }

    // Tier 3: the browser's built-in transcription, captured live during the burst.
    const liveText = await liveTextPromise
    if (liveText) return { text: liveText, tier: "web-speech" }

    return { text: "", tier: "none" }
  }

  // Immediately stop all listening (mic tracks + SpeechRecognition) without transcribing.
  // Used when the dock is closed so nothing keeps the microphone open. Idempotent.
  async abort() {
    const rec = this.recognition
    this.recognition = null
    if (rec) {
      rec.onresult = null
      rec.onend = null
      rec.onerror = null
      try { rec.abort() } catch (e) {}
    }
    try { await this.recorder.stopRecording() } catch (e) {}
    this._recordedForWhisper = false
  }

  _startWebSpeech() {
    if (!VoiceCapture.webSpeechUsable) return
    const rec = new window.SpeechRecognition()
    rec.interimResults = true
    rec.continuous = true
    rec.maxAlternatives = 1
    rec.onresult = evt => {
      let interim = ""
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const r = evt.results[i]
        if (r.isFinal) this._finalText += r[0].transcript
        else interim += r[0].transcript
      }
      this._interimText = interim
      this._lastInterim = interim
      this.onInterim && this.onInterim((this._finalText + interim).trim())
    }
    rec.onerror = evt => { this.lastError = evt.error } // yield to Whisper / report
    this.recognition = rec
    try { rec.start() } catch (e) { /* already started */ }
  }

  // Chrome only flips a result to isFinal after a pause, so a quick stop leaves
  // the spoken words sitting in interim. stop() therefore asks the recognizer to
  // finalize, waits for 'end' (bounded), and folds in the last interim tail so a
  // short burst never loses its text.
  _stopWebSpeech() {
    const rec = this.recognition
    this.recognition = null
    if (!rec) return Promise.resolve(this._finalText.trim())
    return new Promise(resolve => {
      let done = false
      const finish = () => {
        if (done) return
        done = true
        let text = this._finalText.trim()
        const tail = (this._lastInterim || "").trim()
        if (tail && !text.endsWith(tail)) text = (text + " " + tail).trim()
        resolve(text)
      }
      rec.onend = finish
      try { rec.stop() } catch (e) {} // asks Chrome to emit a trailing final
      setTimeout(finish, 1500)        // ...but never block forever on 'end'
    })
  }
}

// whisper.cpp emits placeholders for non-speech — "[BLANK_AUDIO]", "(silence)",
// or lone punctuation like " ." — which must not become empty-looking chunks.
function cleanTranscript(text) {
  if (!text) return ""
  const t = text.trim()
  if (/^[\[(].*[\])]$/.test(t)) return ""  // bracketed marker
  if (!/[a-z0-9]/i.test(t)) return ""      // pure punctuation / whitespace
  return t
}

// MediaRecorder yields webm/opus; whisper.cpp wants 16kHz mono WAV. Decode with
// the Web Audio API, let an OfflineAudioContext downmix-to-mono + resample, then
// PCM16-encode. No ffmpeg, no extra dependency.
async function blobToWav16kMono(blob) {
  const arrayBuf = await blob.arrayBuffer()
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  const tmp = new AudioCtx()
  let decoded
  try { decoded = await tmp.decodeAudioData(arrayBuf) }
  finally { tmp.close() }

  const targetRate = 16000
  const frames = Math.ceil(decoded.duration * targetRate)
  if (frames < 1) throw new Error("empty audio")
  const offline = new OfflineAudioContext(1, frames, targetRate) // mono dest = downmix + resample
  const src = offline.createBufferSource()
  src.buffer = decoded
  src.connect(offline.destination)
  src.start(0)
  const rendered = await offline.startRendering()
  return encodeWavPCM16(rendered.getChannelData(0), targetRate)
}

function encodeWavPCM16(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)) }
  writeStr(0, "RIFF")
  view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, "WAVE")
  writeStr(12, "fmt ")
  view.setUint32(16, 16, true)              // fmt chunk size
  view.setUint16(20, 1, true)               // PCM
  view.setUint16(22, 1, true)               // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)  // byte rate
  view.setUint16(32, 2, true)               // block align
  view.setUint16(34, 16, true)              // bits/sample
  writeStr(36, "data")
  view.setUint32(40, samples.length * 2, true)
  let o = 44
  for (let i = 0; i < samples.length; i++, o += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Blob([view], { type: "audio/wav" })
}
