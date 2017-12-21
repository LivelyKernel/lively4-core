import Morph from 'src/components/widgets/lively-morph.js';

export default class VivideScriptEditor extends Morph {
  async initialize() {
    this.windowTitle = "VivideScriptEditor";
    
    this.get('#content').appendChild((await lively.create("lively-code-mirror")));
    this.get('#content').appendChild((await lively.create("lively-code-mirror")));
    this.get('#content').appendChild((await lively.create("lively-code-mirror")));
    lively.notify("123")
    this.get('#content').appendChild(<button>s</button>)
  }
}