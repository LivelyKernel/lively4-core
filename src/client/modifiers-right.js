
import { extend } from 'src/client/lang/utils.js';

extend(KeyboardEvent.prototype, {
  
  get ctrlRight() {
    return !!window.ControlRight;
  },
  get shiftRight() {
    return !!window.ShiftRight;
  },
  get altRight() {
    return !!window.AltRight;
  }
  
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