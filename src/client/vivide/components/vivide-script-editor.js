import Morph from 'src/components/widgets/lively-morph.js';

export default class VivideScriptEditor extends Morph {
  async initialize() {
    this.windowTitle = "VivideScriptEditor";
    
    for(var i = 0; i < 8; i++) {
      let cm = await lively.create("lively-code-mirror");
      cm.setOption('viewportMargin', Infinity);
      cm.value = `Editor(${i})`;
      this.appendChild(cm);
    }
    this.appendChild(<button>s</button>)
  }
}