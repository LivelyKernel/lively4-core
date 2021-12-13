'use strict';

export class KeyInfo {

  constructor(evt) {
    this.evt = evt;
  }
  
  get char() { return String.fromCharCode(this.evt.keyCode || this.evt.charCode); }

  get meta() { return this.metaKey; }
  get metaKey() { return this.evt.metaKey; }

  get ctrl() { return this.ctrlKey; }
  get ctrlKey() { return this.evt.ctrlKey; }
  get ctrlRight() { return this.evt.ctrlRight; }

  get shift() { return this.shiftKey; }
  get shiftKey() { return this.evt.shiftKey; }
  get shiftRight() { return this.evt.shiftRight; }

  get alt() { return  this.altKey; }
  get altKey() { return this.evt.altKey; }
  get altRight() { return this.evt.altRight; }

  get keyCode() { return this.evt.keyCode; }

  get charCode() { return this.evt.charCode; }
  
  get enter() { return this.keyCode === 13; }
  get esc() { return this.escape; }
  get escape() { return this.keyCode === 27; }
  get space() { return this.keyCode === 32; }
  get backspace() { return this.keyCode === 8; }
  get del() { return this.delete; }
  get delete() { return this.keyCode === 46; }
  get tab() { return this.keyCode === 9; }

  get pageup() { return this.keyCode === 33; }
  get pagedown() { return this.keyCode === 34; }

  get left() { return this.keyCode === 37; }
  get up() { return this.keyCode === 38; }
  get right() { return this.keyCode === 39; }
  get down() { return this.keyCode === 40; }

  // #TODO
  match(pattern) {}
  /*MD ### logging MD*/
  toString() {
    const modifiers = [];
    if (this.meta) { modifiers.push('meta'); }
    if (this.ctrl) { modifiers.push('ctrl'); }
    if (this.shift) { modifiers.push('shift'); }
    if (this.alt) { modifiers.push('alt'); }
    
    return `${this.char} (${this.keyCode}, ${this.charCode})[${modifiers.join(', ')}]`;
  }

  log() { console.log(this.toString()); }

  notify() { lively.notify(this.toString()); }

}

export default function keyInfo(evt) {
  return new KeyInfo(evt);
}
