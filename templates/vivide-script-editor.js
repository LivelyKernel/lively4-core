import Morph from 'src/components/widgets/lively-morph.js';

export default class VivideScriptEditor extends Morph {
  async initialize() {
    this.windowTitle = "VivideScriptEditor";
    
    for(var i = 0; i < 4; i++) {
      let cm = await lively.create("lively-code-mirror");
      cm.setOption('viewportMargin', 7);
      this.appendChild(cm);
    }
    lively.notify("123")
    this.appendChild(<button>s</button>)
  }
}