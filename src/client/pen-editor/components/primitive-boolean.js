"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class PrimitiveBoolean extends Morph {
  async initialize() {
    this.windowTitle = "PrimitiveBoolean";
  }
  get check() { return this.get('#check'); }

  get checked() { return !! this.check.checked; }
  set checked(v) {
    this.check.checked = v
    return v;
  }
}