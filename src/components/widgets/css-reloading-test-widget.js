"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';

export default class CssReloadingTestWidget extends Morph {
  async initialize() {
    this.windowTitle = "CssReloadingTestWidget";

    const color = [`green`, `blue`, `red`, `yellow`, `black`].sample();
    this.style.setProperty("--my-color", `5px dashed ${color}`);
  }
}