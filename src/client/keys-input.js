/* global input */

import { extend } from 'src/client/lang/utils.js';

extend(self, {

  get ctrlRight() { lively.warn('ControlRight not defined in window'); },
  get shiftRight() { lively.warn('ShiftRight not defined in window'); },
  get altRight() { lively.warn('AltRight not defined in window'); },
  get f1() { lively.warn('F1 not defined in window'); },
  get f2() { lively.warn('F2 not defined in window'); },
  get f3() { lively.warn('F3 not defined in window'); },
  get f4() { lively.warn('F4 not defined in window'); },
  get f5() { lively.warn('F5 not defined in window'); },
  get f6() { lively.warn('F6 not defined in window'); },
  get f7() { lively.warn('F7 not defined in window'); },
  get f8() { lively.warn('F8 not defined in window'); },
  get f9() { lively.warn('F9 not defined in window'); },
  get f10() { lively.warn('F10 not defined in window'); },
  get f11() { lively.warn('F11 not defined in window'); },
  get f12() { lively.warn('F12 not defined in window'); },
  get f13() { lively.warn('F13 not defined in window'); },
  get f14() { lively.warn('F14 not defined in window'); },
  get f15() { lively.warn('F15 not defined in window'); },
  get f16() { lively.warn('F16 not defined in window'); },
  get f17() { lively.warn('F17 not defined in window'); },
  get f18() { lively.warn('F18 not defined in window'); },
  get f19() { lively.warn('F19 not defined in window'); },
  get f20() { lively.warn('F20 not defined in window'); },
  get f21() { lively.warn('F21 not defined in window'); },
  get f22() { lively.warn('F22 not defined in window'); },
  get f23() { lively.warn('F23 not defined in window'); },
  get f24() { lively.warn('F24 not defined in window'); },
});

extend(KeyboardEvent.prototype, {

  get ctrlRight() { return !!self.input.key('ControlRight'); },
  get shiftRight() { return !!self.input.key('ShiftRight'); },
  get altRight() { return !!self.input.key('AltRight'); },

  get f1() { return !!self.input.key('F1'); },
  get f2() { return !!self.input.key('F2'); },
  get f3() { return !!self.input.key('F3'); },
  get f4() { return !!self.input.key('F4'); },
  get f5() { return !!self.input.key('F5'); },
  get f6() { return !!self.input.key('F6'); },
  get f7() { return !!self.input.key('F7'); },
  get f8() { return !!self.input.key('F8'); },
  get f9() { return !!self.input.key('F9'); },
  get f10() { return !!self.input.key('F10'); },
  get f11() { return !!self.input.key('F11'); },
  get f12() { return !!self.input.key('F12'); },
  get f13() { return !!self.input.key('F13'); },
  get f14() { return !!self.input.key('F14'); },
  get f15() { return !!self.input.key('F15'); },
  get f16() { return !!self.input.key('F16'); },
  get f17() { return !!self.input.key('F17'); },
  get f18() { return !!self.input.key('F18'); },
  get f19() { return !!self.input.key('F19'); },
  get f20() { return !!self.input.key('F20'); },
  get f21() { return !!self.input.key('F21'); },
  get f22() { return !!self.input.key('F22'); },
  get f23() { return !!self.input.key('F23'); },
  get f24() { return !!self.input.key('F24'); },

});

class KeyInput {
  
  constructor() {
    this._resetStates()
  }
  
  /*MD ## querying state key MD*/
  // #TODO: not yet implemented
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
    
    const context = 'key-state';
    lively.removeEventListener(context);
    lively.addEventListener(context, document, "keydown", ::this.onKeydown, options);
    lively.addEventListener(context, document, "keyup", ::this.onKeyup, options);
    lively.addEventListener(context, window, 'focus', ::this.onFocus, options);
    
    lively.addEventListener(context, document, "keydown", evt => {
      // debug output?
      // lively.notify(input.allKeys())
    }, options);
  }
}

KeyInput.load();