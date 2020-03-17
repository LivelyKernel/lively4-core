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
  id(object, store, ) {}
  static pid(prom) {
    if (!prom) {
      return;
    }
    if (prom instanceof self.Promise || prom instanceof self.OriginalPromise) {

      if (!self.__promise_id__) {
        self.__promise_id__ = 1;
      }
      if (!prom.id) {
        prom.id = self.__promise_id__++;
      }
      return prom.id;
      
    }
    
    return undefined;
  }
  static fid(fn) {
    if (!fn) {
      return;
    }
    if (fn instanceof Function) {

      if (!self.__function_id__) {
        self.__function_id__ = 1;
      }
      if (!fn.id) {
        fn.id = self.__function_id__++;
      }
      return fn.id;
      
    }
    
    return undefined;
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

      const usefulFrame = e.stack.getFrames(2)
        .filter(f => !f.file || !f.file.includes("active-expression-rewriting.js"))
        .filter(f => !f.file || !f.file.includes("Layers.js"))
        .map(f => (f.async ? '🦓' : '')+f.func + '@' + (f.file ? f.file.replace(/.*\//,"") : ""))
        .join(', ');
      return `<div class="eventEntry">E${e.id}: ${msg} (${usefulFrame})</div>`;
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