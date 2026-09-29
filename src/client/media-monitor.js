/*
 * media-monitor.js — passive privacy indicator for microphone / camera use.
 *
 * A PURE ADDITION. It wraps navigator.mediaDevices.getUserMedia and
 * SpeechRecognition ONLY to observe — never to change behaviour:
 *   - getUserMedia is called with the caller's args untouched and its ORIGINAL
 *     promise is returned; our observation runs on a separate branch inside
 *     try/catch, so a bug here (or a future Chrome API change) can never affect
 *     capture. If the API is absent or returns a non-promise, we pass through
 *     and simply do not observe.
 *   - SpeechRecognition is only augmented with addEventListener (the caller's
 *     onend/onerror are left alone) and the original start() is called through.
 *
 * When any audio or video input is live it shows a small red glyph in the
 * top-right corner, just left of #mutationIndicator; otherwise nothing shows.
 * Display-only (pointer-events:none), and marked so Lively never persists it.
 */

// --- module-private state (no public API by design) -------------------------
const audioTracks = new Set();       // live MediaStreamTracks, kind === 'audio'
const videoTracks = new Set();       // live MediaStreamTracks, kind === 'video'
const speechRecognizers = new Set(); // running SpeechRecognition instances (mic, no stream handed to us)

const RED = '#e11';
const MIC_SVG = `<svg class="mm-mic" height="11" viewBox="0 0 12 12" style="display:none;vertical-align:middle" xmlns="http://www.w3.org/2000/svg"><g fill="${RED}"><rect x="4.5" y="1" width="3" height="6" rx="1.5"/><path d="M3 6a3 3 0 0 0 6 0h-1a2 2 0 0 1-4 0z"/><rect x="5.5" y="8.8" width="1" height="2"/><rect x="4" y="10.4" width="4" height="1" rx="0.5"/></g></svg>`;
const CAM_SVG = `<svg class="mm-cam" height="11" viewBox="0 0 14 12" style="display:none;vertical-align:middle" xmlns="http://www.w3.org/2000/svg"><g fill="${RED}"><rect x="1" y="3.5" width="8" height="5" rx="1"/><path d="M9.5 5.2 L13 3.5 v5 L9.5 6.8 z"/></g></svg>`;

let dotEl = null;
function ensureDot() {
  if (dotEl && dotEl.isConnected) return dotEl;
  const el = document.createElement('div');
  el.id = 'mediaMonitorIndicator';
  el.setAttribute('data-lively4-donotpersist', 'all'); // excluded from world serialization
  el.setAttribute('data-is-meta', 'true');             // its own mutations never trigger a save
  Object.assign(el.style, {
    position: 'fixed', top: '0px', right: '14px',       // just left of #mutationIndicator (10px @ right:0)
    display: 'none', alignItems: 'center', gap: '2px',
    height: '12px', lineHeight: '0',
    pointerEvents: 'none', zIndex: '2147483646'
  });
  el.innerHTML = MIC_SVG + CAM_SVG;
  document.body.appendChild(el);
  dotEl = el;
  return el;
}

// --- sweep: catch manual track.stop() (which does NOT fire 'ended') ----------
let sweepId = null;
function startSweep() {
  if (sweepId) return;
  sweepId = setInterval(() => {
    let changed = false;
    for (const t of audioTracks) if (t.readyState === 'ended') { audioTracks.delete(t); changed = true; }
    for (const t of videoTracks) if (t.readyState === 'ended') { videoTracks.delete(t); changed = true; }
    if (changed) render();
    if (!audioTracks.size && !videoTracks.size && !speechRecognizers.size) stopSweep();
  }, 750);
}
function stopSweep() { if (sweepId) { clearInterval(sweepId); sweepId = null; } }

// --- render -----------------------------------------------------------------
function render() {
  const audioLive = [...audioTracks].filter(t => t.readyState === 'live');
  const videoLive = [...videoTracks].filter(t => t.readyState === 'live');
  const speechOn = speechRecognizers.size > 0;

  const micLive = speechOn || audioLive.length > 0;
  const camLive = videoLive.length > 0;
  // "hot" = actually capturing; dim when open but muted/disabled
  const micHot = speechOn || audioLive.some(t => !t.muted && t.enabled);
  const camHot = videoLive.some(t => !t.muted && t.enabled);

  if (!micLive && !camLive) {
    if (dotEl) dotEl.style.display = 'none';
    stopSweep();
    return;
  }
  const el = ensureDot();
  el.style.display = 'inline-flex';
  const mic = el.querySelector('.mm-mic');
  const cam = el.querySelector('.mm-cam');
  mic.style.display = micLive ? 'inline' : 'none';
  mic.style.opacity = micHot ? '1' : '0.35';
  cam.style.display = camLive ? 'inline' : 'none';
  cam.style.opacity = camHot ? '1' : '0.35';
  el.title = [
    micLive ? (micHot ? 'microphone in use' : 'microphone open (muted)') : null,
    camLive ? (camHot ? 'camera in use' : 'camera open') : null
  ].filter(Boolean).join(', ');
  startSweep();
}

// --- observe getUserMedia streams -------------------------------------------
function registerStream(stream) {
  if (!stream || typeof stream.getTracks !== 'function') return;
  stream.getTracks().forEach(track => {
    const set = track.kind === 'video' ? videoTracks : audioTracks;
    if (set.has(track)) return;
    set.add(track);
    track.addEventListener('ended', () => { set.delete(track); render(); });
    track.addEventListener('mute', render);
    track.addEventListener('unmute', render);
  });
  render();
}

// --- install passive wrappers (guarded; idempotent) -------------------------
function installGetUserMedia() {
  const md = navigator.mediaDevices;
  if (!md || typeof md.getUserMedia !== 'function' || md.__mmPatched) return;
  const orig = md.getUserMedia;
  md.getUserMedia = function (...args) {
    const result = orig.apply(this, args); // untouched call-through — caller gets this
    try {
      Promise.resolve(result).then(
        stream => { try { registerStream(stream); } catch (e) {} },
        () => {} // caller still receives the original rejection via `result`
      );
    } catch (e) { /* observation must never throw into the caller */ }
    return result;
  };
  md.__mmPatched = true;
}

function installSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR || !SR.prototype || typeof SR.prototype.start !== 'function' || SR.prototype.__mmPatched) return;
  const origStart = SR.prototype.start;
  SR.prototype.start = function (...args) {
    try {
      if (!this.__mmTracked) {
        this.__mmTracked = true; // attach lifetime listeners once (survives auto-restart)
        this.addEventListener('end', () => { speechRecognizers.delete(this); render(); });
        this.addEventListener('error', () => { speechRecognizers.delete(this); render(); });
      }
      speechRecognizers.add(this);
      render();
    } catch (e) { /* observation must never break recognition */ }
    return origStart.apply(this, args);
  };
  SR.prototype.__mmPatched = true;
}

try { installGetUserMedia(); } catch (e) { /* never break boot */ }
try { installSpeechRecognition(); } catch (e) { /* never break boot */ }
