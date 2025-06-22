import Morph from 'src/components/widgets/lively-morph.js';
import { dirtyFlags, lastValues } from 'src/client/probes.js';

import d3 from "src/external/d3.v5.js"

/*MD # Probes

#TODO:

- [x] \_\_probes\_\_ as known global in eslint
- [x] Keyboard shortcut to insert probes (Ctrl-Shift-Alt-P)
- [x] define Proxy to import to lively.js
- [x] separate Web component lively-probe
- [x] preload Web Component
- [x] visualize strings with "str"
- [x] ideally with code-mirror highlighting (cm-string, ...)
- [ ] probes do not get applied to workspaces after a page reload (but works in container), they are not even replaced by a web component (lively-probe)
- [ ] size changes do not affect the cursor position (cursor stays in place, but should follow the document flow)
  - idea: only on dirty update: compare own width *before* and *after*. Notify cm if changed
- [ ] minor: widgets/lively-probe.js and client/probes.js should be part of the bundle
MD*/
export default class LivelyProbe extends Morph {
  static observedAttributes = ['data-probe-id'];
  
  get probeId() {
    return this.getAttribute('data-probe-id')
  }
  
  set probeId(id) {
    this.setAttribute('data-probe-id', 'code-mirror 1431 8a12c78d')
    return true;
  }
  
  /*MD ## Callbacks MD*/
  constructor(...args) {
    super(...args)
    // lively.notify('CONSTRUCTOR')
    // queueMicrotask(() => lively.notify('MICRO CONSTRUCTOR'))
  }
  
  async initialize() {
    this.windowTitle = "LivelyProbe";
    // this.style.backgroundColor = d3.hsl(Math.random()*360,0.7,0.9) + ''
    // lively.notify('INITIALIZE')
  }
  connectedCallback() {
    // lively.notify('PROBE ADDED')
    this.debounceForceRenderViaMicroTask()
    this.ensureLoop()
    // queueMicrotask(() => lively.notify('MICRO CONNECTED'))
  }

  disconnectedCallback() {
    // lively.notify('PROBE REMOVED')
    this.stopLoop()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // lively.notify('PROPERTY CHANGED: ' + name)
    this.debounceForceRenderViaMicroTask()
  }

  /*MD ## Stepping Behavior MD*/
  // force render (skip isDirty check)
  ensureLoop() {
    if (!this.animationFrameId) {
      this.enqueueUpdate()
    }
  }
  
  enqueueUpdate() {
    this.animationFrameId = requestAnimationFrame(time => {
      // lively.notify('UPDATE')
      this.maybeRender()
      this.enqueueUpdate()
    })
  }
  
  stopLoop() {
    cancelAnimationFrame(this.animationFrameId)
    delete this.animationFrameId
  }

  /*MD ## Rendering MD*/
  debounceForceRenderViaMicroTask() {
    if (this.microtaskQueued) {
      return;
    }
    this.microtaskQueued = true;
    queueMicrotask(() => {
      this.microtaskQueued = false;
      this.forceRender();
    });
  }
  forceRender() {
    lively.notify('FORCE RENDER')
    this.updateContent()
  }

  maybeRender() {
    if (dirtyFlags[this.probeId]) {
      this.updateContent()
    }
  }

  /* #important */
  updateContent() {
    const probeId = this.probeId;
    if (!probeId) {
      this.innerText = 'no probe id found'
      return;
    }
    
    dirtyFlags[probeId] = false;
    
    this.get('#probe-id').innerText = [probeId]
    this.get('#meta').style.backgroundColor = d3.hsl(Math.random()*360,0.7,0.5) + ''
    
    if (lastValues.hasOwnProperty(probeId)) {
      const value = lastValues[probeId];
      this.printValue(value)
    } else {
      this.innerText = 'no value yet'
    }
  }
  
  printValue(value) {
    if (value instanceof HTMLElement) {
      this.replaceChildren(lively.elementPrinter.tagName.id.classes.offset(value))
      return
    }
    
    if (typeof value === "string") {
      this.replaceChildren(<span class='cm-string'>"{value}"</span>)
      return
    }
    
    if (typeof value === "number") {
      this.replaceChildren(<span class='cm-number'>{value}</span>)
      return
    }

    if (typeof value === "boolean") {
      this.replaceChildren(<span class='cm-atom'>{value}</span>)
      return
    }

    this.innerText = value
  }

  /*MD ## Lively-specific API MD*/
  livelyMigrate(other) {
    this.animationFrameId = other.animationFrameId
  }

  async livelyExample() {
    this.setAttribute('data-probe-id', 'code-mirror 1431 8a12c78d')
  }
}
