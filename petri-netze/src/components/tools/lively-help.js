import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyHelp extends Morph {
  
  intitialize() {
    this.windowTitle = "Help"
  }
  
  
  getHelp(txt) {
     this.shadowRoot.querySelector("#helpContainer").src = "//devdocs.io/#q=" + txt;
  }
}