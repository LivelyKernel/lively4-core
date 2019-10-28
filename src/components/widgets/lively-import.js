import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyImport extends Morph {
  async initialize() {
    var url = this.getAttribute("src")
    if (!url) return;
    var src = await fetch(url).then(r => r.text())
    this.shadowRoot.innerHTML = "" + src 
    var container = lively.query(this, "lively-container")
    if (container) {
      var dir = url.replace(/[^/]*$/,"")
      lively.notify("IMPORT DIR " + dir)
      lively.html.fixLinks(this.shadowRoot.childNodes, dir, 
        (path) => container.followPath(path))
    }
    await lively.components.loadUnresolved(this.shadowRoot, false, "lively-import", true);
  }
}
