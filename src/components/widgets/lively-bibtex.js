import Parser from 'src/external/bibtexParse.js';
import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js'

export default class LivelyBibtex extends Morph {
  async initialize() {
    
    this.setAttribute("tabindex", 0) // just ensure focusabiltity
    this.windowTitle = "LivelyBibtex";
    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);  
    this.addEventListener("click", evt => this.onClick(evt))
    this.addEventListener("drop", this.onDrop);
    this.addEventListener("copy", (evt) => this.onCopy(evt))
    this.addEventListener("cut", (evt) => this.onCut(evt))
    this.addEventListener("paste", (evt) => this.onPaste(evt))
    this.updateView()
  }
  
  selectedEntries() {
    return Array.from(this.querySelectorAll("lively-bibtex-entry.selected"))
  }
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();
      var menu = new ContextMenu(this, [
            ["remove", () => {
                this.selectedEntries().forEach(ea => {
                  ea.remove()
                })   
            }]
        ]);
      menu.openIn(document.body, evt, this);
      return 
    }
  }
  
  onCopy(evt) {
    if (this.isEditing()) return;
    var data = this.selectedEntries().map(ea => ea.textContent).join("")
    evt.clipboardData.setData('text/plain', data);   
    evt.stopPropagation()
    evt.preventDefault()
  }
  
  onCut(evt) {
    if (this.isEditing()) return;
    this.onCopy(evt)
    this.selectedEntries().forEach(ea => ea.remove())
  }

  async onPaste(evt) {
    if (this.isEditing()) return;
    var scroll = this.scrollTop
    var data = evt.clipboardData.getData('text');
    var entries = this.parseEntries(data)
    this.selectedEntries().forEach(ea => ea.classList.remove("selected"))

    if (entries) {
     for (var ea of entries) {
      var entryElement = await this.appendBibtexEntry(ea)
      entryElement.classList.add("selected")
      if (this.currentEntry) this.insertBefore(entryElement, this.currentEntry)
     } 
    }
    await lively.sleep(0)
    this.scrollTop = scroll
  }

  parseEntries(source) {
    try {
      return Parser.toJSON(source);  
    } catch(e) {
      lively.notify("Bibtex could not parse: " + source) 
    }
  }
  
  isEditing() {
    return this.currentEntry && (this.currentEntry.getAttribute("mode") == "edit")
  }
  
  async onDrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    var source = evt.dataTransfer.getData("text");
    var value = this.parseEntries(source)
    if (value) {
      value = value[0]
      var beforeEntry = this.findEntryInPath(evt.path)
      var newEntry = await this.appendBibtexEntry(value)
      if (beforeEntry) this.insertBefore(newEntry, beforeEntry)
    }
    
  }
  
  get src() {
    return this.getAttribute("src")
  }

  set src(url) {
    this.setAttribute("src", url)
    this.updateView()
  }
  
  findEntryInPath(path) {
    return path.find(ea => ea.tagName == "lively-bibtex-entry".toUpperCase())
  }
  
  onClick(evt) {
    if (this.isEditing()) return;
    // var oldScroll
    var entry = this.findEntryInPath(evt.path)
    if (!entry) return;
    this.select(entry, evt.shiftKey)
    
    if (entry.getAttribute("mode") != "edit") {
      lively.focusWithoutScroll(this.get("#copyHack"))
    }
  }
  
  select(entry, keepSelection) {
    if (this.currentEntry && !keepSelection) {
      this.currentEntry.classList.remove("selected") 
    }
    if (this.currentEntry === entry) {
      this.currentEntry = null      
    } else {
      entry.classList.add("selected")
      this.currentEntry = entry
    }    
  }
  
  async appendBibtexEntry(value) {
    var entry = await (<lively-bibtex-entry></lively-bibtex-entry>)
    entry.value = value
    this.appendChild(entry)
    return entry
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
      await this.appendBibtexEntry(ea)
    }
  }
  
  livelySource() {
    return Array.from(this.querySelectorAll("lively-bibtex-entry")).map(ea => ea.textContent).join("")
  }

  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.src = "https://lively-kernel.org/lively4/overleaf-cop18-promises/references.bib"
    this.style.overflow = "scroll"
  }
  
  
}