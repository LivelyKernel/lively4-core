import Parser from 'src/external/bibtexParse.js';
import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyBibtex extends Morph {
  async initialize() {
    this.windowTitle = "LivelyBibtex";
    this.updateView()
  }
  
  get src() {
    return this.getAttribute("src")
  }

  set src(url) {
    this.setAttribute("src", url)
    this.updateView()
  }
  
  async updateView() { 
    if (!this.src) return;
    this.innerHTML = ""
    try {
      var source = await fetch(this.src).then(res => res.text());
      var json= Parser.toJSON(source);    
    } catch(e) {
      this.innerHTML = "" + e
    }
    for(var ea of json) {
      var entry = await (<lively-bibtex-entry></lively-bibtex-entry>)
      entry.value = ea
      this.appendChild(entry)
    }
  }
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.src = "https://lively-kernel.org/lively4/overleaf-cop18-promises/references.bib"
    this.style.overflow = "scroll"
  }
  
  
}