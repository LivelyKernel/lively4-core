import Morph from 'src/components/widgets/lively-morph.js';
import { dirtyFlags, lastValues, counts, getOldestToMostRecentValues } from 'src/client/probes.js';

import d3 from "src/external/d3.v5.js"
import { shake } from 'utils'
import ContextMenu from 'src/client/contextmenu.js'

/*MD # Probes

#TODO:

- [x] \_\_probes\_\_ as known global in eslint
- [x] Keyboard shortcut to insert probes (Ctrl-Shift-Alt-P)
- [x] define Proxy to import to lively.js
- [x] separate Web component lively-probe
- [x] preload Web Component
- [x] visualize strings with "str"
- [x] ideally with code-mirror highlighting (cm-string, ...)
- #Bugs
  - [ ] probes do not get applied to workspaces after a page reload (but works in container), they are not even replaced by a web component (lively-probe)
  - [ ] size changes do not affect the cursor position (cursor stays in place, but should follow the document flow)
    - idea: only on dirty update: compare own width *before* and *after*. Notify cm if changed
- improvements
  - [ ] minor: widgets/lively-probe.js and client/probes.js should be part of the bundle
  - [x] Click to open inspextor
  - [ ] Smart correlation
  - [x] Die letzten 10/n? On rightclick
  - [x] count
  - [ ] Per execution context (distinguish by name: tests, babylonian, global): count + last value. Environments can reset.
    - maybe wait for `AsyncContext`? [https://github.com/tc39/proposal-async-context]()
    - [ ] Global environment (reset manually)
MD*/
export default class LivelyProbe extends Morph {
  static observedAttributes = __probes__['probe 31 0cff812f'] = ['data-probe-id'];

  get probeId() {
    return __probes__['probe 35 c353c68d'] = this.getAttribute('data-probe-id')
  }
  
  /*MD ## Callbacks MD*/
  constructor(...args) {
    super(...args)
    
    // lively.notify('CONSTRUCTOR')
    // queueMicrotask(() => lively.notify('MICRO CONSTRUCTOR'))
  }
  
  async initialize() {
    this.windowTitle = "LivelyProbe";
    
    this.addEventListener('click', evt => this.onClick(evt), true)
    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);  

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
    // lively.notify('FORCE RENDER')
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
    
    __probes__['probe 121 afab055f'] = dirtyFlags[probeId] = false;
    
    // this.get('#probe-id').innerText = [probeId]
    // this.get('#meta').style.backgroundColor = d3.hsl(Math.random()*360,0.7,0.5) + ''
    
    const countElement = this.get('#count');
    if (lastValues.hasOwnProperty(probeId)) {
      const value = lastValues[probeId];
      this.replaceContent(value)
      countElement.innerText = counts[probeId]
    } else {
      this.innerText = 'no value yet'
      countElement.innerText = ''
    }
  }
  
  replaceContent(value) {
    this.replaceChildren(this.printValue(value))
  }
  
  printValue(value, depth = 0) {
    if (depth > 5) {
      return <span style='color: gray'>...</span>
    }
    
    __probes__['probe 142 4a4734f7'] = [1, '2'];
    var arr = [1,2]
    arr.push(arr)
    __probes__['probe 145 93716caf'] = arr
    
    if (value instanceof HTMLElement) {
      return lively.elementPrinter.tagName.id.classes(value)
    }
    
    if (Array.isArray(value)) {
      return <span>[{...value.flatMap((v, i) => {
        const element = this.printValue(v, depth + 1);
        return i > 0 ? [<span>,&nbsp;</span>, element] : [element]
      })}]</span>
    }
    
    if (typeof value === "string") {
      return <span class='cm-string' onclick={function() {lively.notify(1343)}}>"{value}"</span>
    }
    
    if (typeof value === "number") {
      return <span class='cm-number'>{value}</span>
    }

    if (typeof value === "boolean") {
      return <span class='cm-atom'>{value}</span>
    }

    return <span>{value}</span>
  }
  
  /*MD ## More Interactions MD*/
  onClick(evt) {
    evt.preventDefault()
    evt.stopPropagation()
    
    const probeId = __probes__['probe 164 82fbf44d'] = this.probeId;
    if (!probeId) {
      shake(this)
      return;
    }
    
    if (!lastValues.hasOwnProperty(probeId)) {
      shake(this)
      return;
    }

    const value = lastValues[probeId];
    lively.openInspector(__probes__['probe 191 94b9d2f3'] = value)
  }
  
  onContextMenu(evt) {
    evt.shiftKey
    evt.stopPropagation();
    evt.preventDefault();

    const values = getOldestToMostRecentValues(this.probeId).toReversed()
    if (__probes__['probe 211 54e657e7'] = values.length === 0) {
      shake(this)
      return
    }
    
    const items = [
      '---Recent to Old---',
      ...values.map((value, i) => [<span style="display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">{this.printValue(value)}</span>, evt => {
        lively.openInspector(value)
      }, undefined, i === 0 ? 'new' : i === values.length - 1 ? 'old' : undefined])
    ]
    
    const menu = new ContextMenu(this, items);
    menu.openIn(document.body, evt, this);
  }
  
  /*MD ## Lively-specific API MD*/
  livelyMigrate(other) {
    this.animationFrameId = other.animationFrameId
  }

  async livelyExample() {
    this.setAttribute('data-probe-id', 'code-mirror 1431 8a12c78d')
  }
}
