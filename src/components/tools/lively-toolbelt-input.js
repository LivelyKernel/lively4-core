/*
 * Install-once pointer input for lively-toolbelt's drawing modes.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Capture-phase listeners on one element fire in REGISTRATION ORDER — the DOM has
 * no priority. Graffle (graffle.js) and lively-selection register their
 * capture-phase pointerdown on document.documentElement at boot, so anything the
 * drawing layer registered later would run AFTER them and couldn't
 * stopImmediatePropagation them out.
 *
 * So this module is imported in lively.js ABOVE the Selection import (and graffle
 * only loads later, in exportModules) — its stubs are therefore the FIRST
 * capture-phase pointer listeners on the page. A claimed draw gesture then
 * stopImmediatePropagation's and graffle/selection never see it; no per-draw
 * handling of them is needed.
 *
 * The listeners are PERMANENT and installed exactly once. They are dumb stubs
 * that late-bind to a swappable handler set (window.livelyToolbeltInput); the
 * heavy interaction module swaps that set on every reload/migration WITHOUT
 * touching these listeners, so they keep their first-in-line slot forever.
 *
 * NATIVE addEventListener (not lively.addEventListener) is used deliberately: the
 * stubs need only document.documentElement, so install runs safely at lively.js's
 * early import phase — before window.lively even exists — and never gets removed.
 *
 * If no drawing layer is active (window.livelyToolbeltInput is null), the stubs
 * are no-ops and every event falls through to Lively unchanged.
 */

const EVENTS = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'click']

// Route one event to the current handler set, with a safety net so a throwing or
// missing handler can never break the page's pointer pipeline.
function dispatch(name, evt) {
  const handlers = window.livelyToolbeltInput
  const fn = handlers && handlers[name]
  if (!fn) return // no drawing layer active -> falls through to Lively
  try {
    fn(evt)
  } catch (e) {
    console.error('[lively-toolbelt-input] handler error:', name, e)
  }
}

// The interaction module calls this to point the stubs at its controller.
// Overwriting the previous set makes any older controller inert.
export function setToolbeltInputHandler(handlers) {
  window.livelyToolbeltInput = handlers
}

// Install the permanent stubs exactly once per page. The guard lives on window so
// a module reload can't re-register them (which would drop us behind
// graffle/selection).
export function installToolbeltInput() {
  if (window.__livelyToolbeltInputInstalled) return
  window.__livelyToolbeltInputInstalled = true

  const root = document.documentElement
  for (const name of EVENTS) {
    root.addEventListener(name, evt => dispatch(name, evt), true) // capture, permanent
  }
}

installToolbeltInput()
