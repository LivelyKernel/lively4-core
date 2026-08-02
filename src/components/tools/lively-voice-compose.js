import Morph from 'src/components/widgets/lively-morph.js'
import { VoiceCapture } from 'src/client/voice-capture.js'

/*MD # Voice Chat
Floating dock (bottom-left) that turns spoken bursts into confirmable messages.
Tap the mic to start a burst, tap again to stop; each utterance transcribes through
the [[VoiceCapture]] fallback chain (local whisper → OpenAI whisper → browser) and
lands as a message. The in-flight utterance sits live at the end of the list, then
settles into a finished message. Send assembles the messages for the Claude pty.
Shares the toolbelt's look via `lively-tool-panel.css`.
MD*/

export default class LivelyVoiceCompose extends Morph {

  // Append a fresh dock outside the world transform so it floats over windows.
  static async openFloating() {
    document.body.querySelectorAll(':scope > lively-voice-compose').forEach(e => e.remove())
    const el = await lively.create('lively-voice-compose')
    document.body.appendChild(el)
    return el
  }

  async initialize() {
    this.windowTitle = "Voice Chat"
    this.registerButtons()
    this.messages = this.messages || []      // [{ text, tier }]
    this._reRecordIndex = null
    this._pending = null
    this.capture = new VoiceCapture()
    this.capture.onInterim = text => this.updatePending(text)
    this.render()
    this.setStatus()
  }

  disconnectedCallback() {
    // Closing the dock (toggling it off from the toolbelt, or any other removal) must not
    // leave the microphone or a SpeechRecognition session listening in the background.
    this.classList.remove('recording')
    if (this.capture) this.capture.abort()
  }

  get list() { return this.get('#list') }
  get statusEl() { return this.get('#status') }
  get isRecording() { return this.classList.contains('recording') }

  async onRecordButton() {
    if (this.isRecording) await this.stopBurst()
    else await this.startBurst()
  }

  async startBurst() {
    if (!VoiceCapture.available) {
      lively.warn(VoiceCapture.unavailableReason)
      this.setStatus('no backend')
      return
    }
    this.classList.add('recording')
    this.setStatus('listening…')
    this.showPending('')
    await this.capture.start()
  }

  async stopBurst() {
    this.classList.remove('recording')
    this.setStatus('transcribing…')
    const { text, tier } = await this.capture.stop()
    this.removePending()
    if (!text) {
      this._reRecordIndex = null
      this.setStatus('nothing heard')
      return
    }
    const message = { text: this.clean(text), tier }
    if (this._reRecordIndex != null) {
      this.messages[this._reRecordIndex] = message
      this._reRecordIndex = null
    } else {
      this.messages.push(message)
    }
    this.render()
    this.setStatus()
  }

  // ---- in-flight message: a live bubble at the end of the list ----
  showPending(text) {
    this.removePending()
    const bubble = <div class="msg pending"><div class="msg-text"></div></div>
    this._pending = bubble
    this.get('.empty') && this.get('.empty').remove()
    this.list.appendChild(bubble)
    this.updatePending(text)
  }

  updatePending(text) {
    if (!this._pending) return
    const el = this._pending.querySelector('.msg-text')
    el.textContent = text || ''
    el.appendChild(<span class="typing"><i></i><i></i><i></i></span>)
    this.list.scrollTop = this.list.scrollHeight
  }

  removePending() {
    if (this._pending) { this._pending.remove(); this._pending = null }
  }

  render() {
    const list = this.list
    if (!list) return // template not attached yet (e.g. mid hot-reload migration)
    list.innerHTML = ''
    if (this.messages.length === 0) {
      list.appendChild(<div class="empty">Tap the mic and speak</div>)
      return
    }
    this.messages.forEach((msg, i) => list.appendChild(this.renderMessage(msg, i)))
    list.scrollTop = list.scrollHeight
  }

  renderMessage(msg, i) {
    const rerec = <button class="tool-button" title="Re-record"><i class="fa fa-repeat"></i></button>
    const drop = <button class="tool-button" title="Drop"><i class="fa fa-times"></i></button>
    rerec.addEventListener('click', () => this.reRecord(i))
    drop.addEventListener('click', () => this.dropMessage(i))
    return <div class="msg">
      <div class="msg-text">{msg.text}</div>
      <div class="msg-tier">{this.tierLabel(msg.tier)}</div>
      <div class="msg-actions">{rerec}{drop}</div>
    </div>
  }

  // whisper-local / whisper-openai read as "whisper"; web-speech as "browser".
  tierLabel(tier) {
    if (tier === 'web-speech') return 'browser'
    if (tier && tier.startsWith('whisper')) return 'whisper'
    return tier || ''
  }

  // whisper inserts \n at segment boundaries; collapse for a clean bubble/payload.
  clean(text) {
    return text.replace(/\s*\n\s*/g, ' ').trim()
  }

  dropMessage(i) {
    this.messages.splice(i, 1)
    this.render()
    this.setStatus()
  }

  async reRecord(i) {
    this._reRecordIndex = i
    await this.startBurst()
  }

  setStatus(msg) {
    if (this.statusEl) this.statusEl.textContent = msg !== undefined ? msg : ''
  }

  assembledText() {
    return this.messages.map(m => m.text.trim()).filter(Boolean).join(' ')
  }

  onSendButton() {
    const text = this.assembledText()
    if (!text) { lively.warn('Nothing to send'); return }
    // Item F wires this to a server-owned pty. Until then: emit an event and
    // copy to the clipboard, so the payload is usable and the send is observable.
    lively.copyTextToClipboard(text)
    this.dispatchEvent(new CustomEvent('voice-compose-send', {
      detail: { text, messages: this.messages.slice() }, bubbles: true, composed: true
    }))
    lively.success('Voice payload copied + dispatched')
    this.clearMessages()
  }

  onClearButton() { this.clearMessages() }

  clearMessages() {
    this.messages = []
    this.render()
    this.setStatus()
  }

  livelyMigrate(other) {
    this.messages = other.messages || []
  }

  async livelyExample() {
    this.messages = [{ text: 'add a method foo to this class', tier: 'whisper-local' }]
    this.render()
    this.setStatus()
  }
}
