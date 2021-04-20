import Parser from 'src/external/bibtexParse.js';
import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js'
import {Paper} from 'src/client/literature.js'
import Bibliography from "src/client/bibliography.js"

/*MD
# Lively Bibtex

![](lively-bibtex.png){style="width:350px"}

MD*/


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
    this.registerButtons()
  }
  
  selectedEntries() {
    return Array.from(this.querySelectorAll("lively-bibtex-entry.selected"))
  }
  
  async importEntries(entries) {
    
    var source = entries.map(ea => ea.textContent).join("\n")
      
    return Paper.importBibtexSource(source)
  }
  
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
      var entries = this.selectedEntries()
      if (entries.length == 0) {
        entries = evt.composedPath().filter(ea => ea.localName == "lively-bibtex-entry")
      }
      if (entries.length == 0) return // nothing selected or clicked on
      
      evt.stopPropagation();
      evt.preventDefault();
      var menu = new ContextMenu(this, [
        ["generate key", () => {
          entries.forEach(ea => {
            var entry = ea.value
            var key = Bibliography.generateCitationKey(entry)
            if (key) {
              entry.citationKey = Bibliography.generateCitationKey(entry)
              ea.value = entry              
            } else {
              lively.warn("Bibtex: Could net gernerate key for", ea.toBibtex())
            }
          })   
        }],
        ["generate key and replace all occurences", () => {
          entries.forEach(ea => {
            var entry = ea.value
            var oldkey = ea.value.citationKey
            var key = Bibliography.generateCitationKey(entry)
            if (key) {
              entry.citationKey = Bibliography.generateCitationKey(entry)
              ea.value = entry
              
             lively.openComponentInWindow("lively-index-search").then(comp => {
              comp.searchAndReplace(oldkey, key)
              lively.setExtent(comp.parentElement, lively.pt(1000, 700));
              comp.focus();
            });
              
            } else {
              lively.warn("Bibtex: Could net gernerate key for", ea.toBibtex())
            }
          })   
        }], 
        ["import", () => {
            this.importEntries(entries)
        }],    
        ["remove", () => {
            entries.forEach(ea => {
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
    if (window.getSelection().toString().length > 0) return
    var data = this.selectedEntries().map(ea => ea.textContent).join("")
    evt.clipboardData.setData('text/plain', data);   
    evt.stopPropagation()
    evt.preventDefault()
  }
  
  onCut(evt) {
    if (this.isEditing()) return;
    if (window.getSelection().toString().length > 0) return
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
      var beforeEntry = this.findEntryInPath(evt.composedPath())
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
    // don't interfere with selection
    if (window.getSelection().toString().length > 0) return 
    if (this.isEditing()) return;
    // var oldScroll
    var entry = this.findEntryInPath(evt.composedPath())
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
    if (!this.src) {
      var source = this.textContent 
      this.innerHTML = ""
      return this.setBibtex(source)      
    }
    this.innerHTML = ""
    source = await fetch(this.src).then(res => res.text());
    return this.setBibtex(source)
  }
  
  async setBibtex(source) {
    try {
      var json= Parser.toJSON(source);    
    } catch(e) {
      this.innerHTML = "" + e
    }
    for(var ea of json) {
      await this.appendBibtexEntry(ea)
    }
  }

  toBibtex() {
    var bibtex = ""
    for(var ea of this.querySelectorAll("lively-bibtex-entry")) {
      bibtex += ea.innerHTML
    }
    return bibtex
  }
  
  async onSaveButton() {
    var bibtex = this.toBibtex()
    if (!this.src) throw new Error("BibtexEditor src missing" )
    lively.files.saveFile(this.src, bibtex)
      .then(() => lively.success("saved bibtex", this.src, 5, 
                                  () => lively.openBrowser(this.src)))
  }

  async onEditButton(evt) {
    
    
    if (this.style.position) {
      var pos = lively.getPosition(this)
      var extent = lively.getExtent(this)  
    }
    var editor = await (<lively-bibtex-editor></lively-bibtex-editor>)
    if (this.src) {
      editor.setAttribute("src", this.src)
    } else {
      editor.textContent = this.textContent
    }
    if (evt.shiftKey) {
      var win = await (<lively-window>{editor}</lively-window>)
      document.body.appendChild(win)
      editor.updateView()
      this.remove()
      if (pos) {
        lively.setPosition(win, pos)
        // lively.setExtent(win, extent)
      }
    } else {
     this.parentElement.insertBefore(editor, this)  
      editor.updateView()
      this.remove()
      if (pos) {
        lively.setPosition(editor, pos)
        lively.setExtent(editor, extent)
      }
    }
     
    
  }
  
  livelySource() {
    return Array.from(this.querySelectorAll("lively-bibtex-entry")).map(ea => ea.textContent).join("")
  }

  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.src = lively4url + "/demos/bibliography/_incoming.bib"
    this.style.overflow = "scroll"
  }
  
  
}