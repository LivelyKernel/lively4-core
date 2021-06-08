import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyImport extends Morph {
  async initialize() {
    lively.html.registerAttributeObservers(this)
    this.update()
  }
      
  async onSrcChanged() {
    this.update()
  }
  
  async update() {
    let url = this.getAttribute("src")
    if (!url) return;
    let src = await fetch("cached:" + url).then(r => r.text())
    
    if (url !== this.getAttribute("src")) return; // check if we are still on the same url...
    
    /*MD ## #TODO support markdown beside HTML    
see [appendMarkdown](edit://src/components/tools/lively-container.js#appendMarkdown)
    MD*/
    this.shadowRoot.innerHTML = "" + src 
    let container = lively.query(this, "lively-container")
    if (container) {
      let dir = url.replace(/[^/]*$/,"")
      lively.html.fixLinks(this.shadowRoot.childNodes, dir, 
        (path) => container.followPath(path))
    }
    await lively.components.loadUnresolved(this.shadowRoot, false, "lively-import", true);
    
    lively.clipboard.initializeElements(this.shadowRoot.querySelectorAll("*"))
    this.dispatchEvent(new CustomEvent("content-loaded"));
  }
  
  
}
