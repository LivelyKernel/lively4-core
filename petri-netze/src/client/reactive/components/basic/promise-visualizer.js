"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export class Track {

  // events
  static get events() {
    if (!self.__events__) {
      self.__events__ = [];
    }

    return self.__events__;
  }
  static clearE() {
    this.events.length = 0;
  }
  static logE() {}

  // promises
  static get promises() {
    if (!self.__promises__) {
      self.__promises__ = new Set();
    }

    return self.__promises__;
  }
  static update() {}
  static ensureID(thing, store) {
    if (!self[store]) {
      self[store] = 1;
    }
    if (!thing.id) {
      thing.id = self[store]++;
    }
    return thing.id;
  }
  static id(thing) {
    return this.printID(thing)
  }
  static printID(thing) {
    if (!thing) {
      return;
    }
    if (thing instanceof self.Promise || thing instanceof self.OriginalPromise) {
      return 'P' + this.ensureID(thing, '__promise_id__')
    }
    if (thing instanceof Function) {
      return 'F' + this.ensureID(thing, '__function_id__')
    }
    
    return undefined;
  }
  // get print id
  static pid(prom) {
    return this.printID(prom)
  }
  static fid(fn) {
    return this.printID(fn)
  }

}

export default class PromiseVisualizer extends Morph {
  get list() {
    return this.get("#promiseList");
  }
  get numEvt() {
    return this.get("#numEvt");
  }
  get numProm() {
    return this.get("#numProm");
  }
  get promiseArea() {
    return this.get("#promiseArea");
  }

  async initialize() {
    this.windowTitle = "PromiseVisualizer";

    this.registerButtons();
    lively.html.registerKeys(this);

    this.throttledUpdate = ((...args) => this.update(...args)).throttle(7000);
  }

  update() {
    this.numEvt.innerHTML = Track.events.length;
    this.numProm.innerHTML = Track.promises.size;
    this.renderEvents();
  }

  renderEvents() {
    this.list.innerHTML = '';
    this.list.innerHTML = Track.events.map(e => {
      const msg = e.msg
        .replace(/new Promise/gm, `<span class="Method">new</span> Promise`)
        .replace(/Promise\.([a-zA-Z0-9$_]+)\(/gm, `Promise.<span class="Method">$1</span>(`)
        .replace(/(P\d+)\.([a-zA-Z0-9$_]+)/gm, `$1.<span class="Method">$2</span>`)
        .replace(/(P\d+)/gm, `<span class="Promise $1" onmouseover="
var parents = lively.allParents(this, undefined, true)
var viewer = parents.find(e => e && e.tagName === 'PROMISE-VISUALIZER');
if (viewer) {
  viewer.highlightPromise('$1')
}
">$1</span>`);

      function printFrame(frame) {
        //if(frame.func === 'example2') {debugger}
        const isAsync = frame.async ? '🦓' : '';
        const func = isAsync + frame.func;
        if (!frame.file) {
          return func
        } else {
          let file = frame.file
            .replace(/^workspace.*$/, 'workspace')
            .replace(/.*\//, '')
          return func + '@' + file
        }
      }
      let usefulFrame = e.stack.getFrames(2)
        .filter(f => !f.file || !f.file.includes("active-expression-rewriting.js"))
        .filter(f => !f.file || !f.file.includes("Layers.js"))
        .filter(f => !f.func || !f.func.includes(".layered ReplayLayerActivationsLayer"))
        .map(printFrame)
        [0];
      if (!usefulFrame) {
        usefulFrame = '&lt;no frame>'
      }
      const entry = `E${e.id}: ${msg} (${usefulFrame})`
        .replace(/(example\d+)/gm, `<span class="Example">$1</span>`);
      return `<div class="eventEntry">${entry}</div>`;
    }).join('\n');
  }

  get highlightPromiseStyle() {
    return this.get('#highlight-promise');
  }
  highlightPromise(pid) {
    this.highlightPromiseStyle.innerHTML = `
  #promiseList .Promise.${pid} {
    background-color: steelblue;
  }
`;
  }

  renderPromises() {
    this.promiseArea.innerHTML = '';
    Track.promises.forEach(e => this.promiseArea.innerHTML += `<div>${e}</div>`);
  }

  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    lively.notify("Key Down!" + evt.charCode);
  }

  onClearButton() {
    Track.clearE();
    this.update();
  }

  onUpdateButton() {
    this.update();
  }

  /* Lively-specific API */

  // store something that would be lost
  livelyPrepareSave() {}

  livelyPreMigrate() {
    // is called on the old object before the migration
  }

  livelyMigrate(other) {
    this.update();
  }

  livelyInspect(contentNode, inspector) {
    // do nothing
  }

  async livelyExample() {
    this.update();
  }

}