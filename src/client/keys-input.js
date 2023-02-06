/* global input */

import { extend } from 'src/client/lang/utils.js';

const CONTEXT = 'key-state';

extend(KeyboardEvent.prototype, {

  get ctrlRight() { return !!self.input.key('ControlRight'); },
  get shiftRight() { return !!self.input.key('ShiftRight'); },
  get altRight() { return !!self.input.key('AltRight'); },

});

class KeyInput {
  
  constructor() {
    this._resetStates()
  }
  
  /*MD ## querying state key MD*/
  // #TODO: bind actions to keys
  state(action) {
    throw new Error('not yet implemented')
  }
  
  key(code) {
    return !!this._keys[code]
  }
  
  allKeys() {
    return Object.keys(input._keys)
  }

  /*MD ## writing key state MD*/
  _setKey(code, state) {
    if (state) {
      this._keys[code] = true
    } else {
      delete this._keys[code]
    }
  }
  
  _resetStates() {
    this._keys = {}
  }
  
  /*MD ## hooks MD*/
  static setKeyState(e, state) {
    self.input._setKey(e.code, state)
  }

  static onKeydown(e) {
    this.setKeyState(e, true);
  }

  static onKeyup(e) {
    this.setKeyState(e, false);
  }

  static onFocus(e) {
    self.input._resetStates();
  }

  // #important
  static load() {
    self.input = new this();
    
    const options = {
      capture: true,
      passive: true
    };
    
    lively.removeEventListener(CONTEXT);
    lively.addEventListener(CONTEXT, document, "keydown", ::this.onKeydown, options);
    lively.addEventListener(CONTEXT, document, "keyup", ::this.onKeyup, options);
    lively.addEventListener(CONTEXT, window, 'focus', ::this.onFocus, options);
  }
}

KeyInput.load();