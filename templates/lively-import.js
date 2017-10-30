import Morph from './Morph.js';

export default class LivelyImport extends Morph {
  async initialize() {
    var url = this.getAttribute("src")
    if (!url) return;
    var src = await fetch(url).then(r => r.text())
    this.shadowRoot.innerHTML = "" + src 
  }
}
