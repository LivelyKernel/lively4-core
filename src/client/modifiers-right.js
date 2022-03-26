
import { extend } from 'src/client/lang/utils.js';

extend(KeyboardEvent.prototype, {

  get ctrlRight() { return !!window.ControlRight; },
  get shiftRight() { return !!window.ShiftRight; },
  get altRight() { return !!window.AltRight; },

  // #TODO: this is more than 'right' modifiers now
  get f1() { return !!window.F1; },
  get f2() { return !!window.F2; },
  get f3() { return !!window.F3; },
  get f4() { return !!window.F4; },
  get f5() { return !!window.F5; },
  get f6() { return !!window.F6; },
  get f7() { return !!window.F7; },
  get f8() { return !!window.F8; },
  get f9() { return !!window.F9; },
  get f10() { return !!window.F10; },
  get f11() { return !!window.F11; },
  get f12() { return !!window.F12; },
  get f13() { return !!window.F13; },
  get f14() { return !!window.F14; },
  get f15() { return !!window.F15; },
  get f16() { return !!window.F16; },
  get f17() { return !!window.F17; },
  get f18() { return !!window.F18; },
  get f19() { return !!window.F19; },
  get f20() { return !!window.F20; },
  get f21() { return !!window.F21; },
  get f22() { return !!window.F22; },
  get f23() { return !!window.F23; },
  get f24() { return !!window.F24; },

});

export default class ModifiersRight {

  static get context() {
    return "modifiers right";
  }

  static setRightModifierState(e, state) {
    if (e.code === 'ControlRight') {
      window.ControlRight = state;
    } else if (e.code === 'ShiftRight') {
      window.ShiftRight = state;
    } else if (e.code === 'AltRight') {
      window.AltRight = state;
    } else if ([
      'ControlRight',
      'ShiftRight',
      'AltRight',
      'F1',
      'F2',
      'F3',
      'F4',
      'F5',
      'F6',
      'F7',
      'F8',
      'F9',
      'F10',
      'F11',
      'F12',
      'F13',
      'F14',
      'F15',
      'F16',
      'F17',
      'F18',
      'F19',
      'F20',
      'F21',
      'F22',
      'F23',
      'F24'].includes(e.code)) {
      window[e.code] = state;
    }
  }

  static onKeydown(e) {
    this.setRightModifierState(e, true);
  }
  static onKeyup(e) {
    this.setRightModifierState(e, false);
  }

  static load() {
    const options = {
      capture: true,
      passive: true
    };
    lively.removeEventListener(this.context);
    lively.addEventListener(this.context, document, "keydown", ::this.onKeydown, options);
    lively.addEventListener(this.context, document, "keyup", ::this.onKeyup, options);
  }
}

ModifiersRight.load();