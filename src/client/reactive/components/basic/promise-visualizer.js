"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export class Track {
  static get events() {
    if (!self.__events__) {
      self.__events__ = [1, 2, 3];
    }
    return self.__events__;
  }
  static clearE() {
    this.events.length = 0;
  }
  static get promises() {
    if (!self.__promises__) {
      self.__promises__ = new Set();
    }
    return self.__promises__;
  }
  static update() {}
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
    this.list.innerHTML = Track.events.map(e => `<div class="eventEntry">E${e.id}:${e.msg}</div>`).join('\n');
  }

  renderPromises() {
    this.promiseArea.innerHTML = 'sssss';
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