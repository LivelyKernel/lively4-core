"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class CssReloadingTestWidget extends Morph {
  async initialize() {
    this.windowTitle = "CssReloadingTestWidget";
  }
}
