import Parser from 'src/external/bibtexParse.js';
import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js'
import Strings from 'src/client/strings.js'  

/*MD
# Lively Bibtex

![](lively-bibtex.png){style="width:350px"}

MD*/


export default class LivelyBibtexEditor extends Morph {
  async initialize() {
    
    this.setAttribute("tabindex", 0) // just ensure focusabiltity
    this.windowTitle = "LivelyBibtexEditor";
    this.updateView()
    this.registerButtons()
    lively.html.registerKeys(this, "Bibtex")
    
    // change indicator will observe changes in HTML, but "getContent" will check for plausibility....
    this.get('#content-change-indicator').getContent = () => this.toBibtex()
    this.get('#details-change-indicator').getContent = () => this.detailsToJSON()

  }
 
//   checkForContentChanges() {
    
//     var source = this.toBibtex()
//     if (source !== this.lastBibtex) {
//       this.contentChanged = true    
//     } else {
//       this.contentChanged = false
//     }
//     this.updateChangeIndicator()
//   }
  
  
  onKeyDown(evt) {
    if (evt.ctrlKey && evt.key == "s") {
      evt.stopPropagation()
      evt.preventDefault()
      this.onSave()
    }
  }
  
  selectedEntries() {
    return Array.from(this.querySelectorAll("lively-bibtex-entry.selected"))
  }
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();
      return 
    }
  }
  

  
  isEditing() {
    return this.currentEntry && (this.currentEntry.getAttribute("mode") == "edit")
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

  fixKeyCases(json) {
    return json.map(ea => {
      var result = ({citationKey: ea.citationKey, entryType: ea.entryType, entryTags: {}})
      if (ea.entryTags) {
        for(var key in ea.entryTags) {
          result.entryTags[key.toLowerCase()] = ea.entryTags[key]
        }
      }
      return result
    })
  }

  bibtexToFlatEntries(source) {
    var json = Parser.toJSON(source);
    var entries = this.fixKeyCases(json)      
    var flatEntries = entries.map(ea => {
      var row = {citationKey: ea.citationKey, entryType: ea.entryType} 
      for(var key in ea.entryTags) {
        row[key] = ea.entryTags[key]
      }
      return row 
    })
    return flatEntries
  }

  
  flatEntriesToBibtex(flatEntries) {
    var entries = flatEntries.map(ea => {
      var row = {citationKey: ea.citationKey, entryType: ea.entryType, entryTags: []} 
      for(var key in ea) {
        if (key !== "citationKey" && key !== "entryType" && key !== "entryTags"  && key && ea[key]) {
          row.entryTags[key] = ea[key]
        }
      }        
      return row 
    })
    return Parser.toBibtex(entries, false);
  }

  async updateView() { 
    if (!this.src) return;
    this.innerHTML = ""
    var source = await fetch(this.src).then(res => res.text());
    try {
      var flatEntries  = this.bibtexToFlatEntries(source)
    } catch(e) {
      this.get('#content').innerHTML = "" + e
      return
    }
    this.get('#content').innerHTML = ""
    var table = await (<lively-table></lively-table>)
    this.table = table
    this.get('#content').appendChild(table)
    table.setFromJSO(flatEntries)
    this.setDetailsEntry(null)
    this.get("lively-change-indicator").reset()
    table.addEventListener("cell-selected", (evt) => this.onTableCellSelected(evt))
    // table.addEventListener("start-editing-cell", (evt) => this.onStartEditingCell(evt))
    table.addEventListener("finish-editing-cell", (evt) => this.onFinishEditingCell(evt))
  }
  
  selectedEntry() {
    return this.table.asJSO()[this.table.currentRowIndex - 1]
  }
  
  applyDetails() {
    var entry = this.getDetailsEntry()
    if (!entry) return
    var all = this.table.asJSO()
    all[this.table.currentRowIndex - 1] = entry
    this.table.setFromJSO(all)   
  }
  
  toBibtex() {
    var flatEntries = this.table.asJSO()
    var bibtex = this.flatEntriesToBibtex(flatEntries)
    return bibtex
  }
  
  detailsToJSON() {
    var entry = this.getDetailsEntry()
    return entry && JSON.stringify(entry)      
  }
  
  async onSave() {
    if (lively.allParents(lively.activeElement()).includes(this.detailsTable)) {
      this.applyDetails()
    } else {
      this.setDetailsEntry(this.selectedEntry())
    }
    if (!this.table) return
    
    try {
      var bibtex = this.toBibtex()
      Parser.toJSON(bibtex) // just try to parse it again  
    } catch(e) {
      lively.error("BibtexEditor", "Could not save because of rror: " + e)
      return
    }
    if (!this.src) throw new Error("BibtexEditor src missing" )
    await lively.files.saveFile(this.src, bibtex)
    lively.success("saved bibtex", this.src, 5, 
                                 () => lively.openBrowser(this.src))
    
    this.get('#content-change-indicator').reset()
    this.get('#details-change-indicator').reset()

  }
  
  onSaveButton() {
    this.onSave()
  }
  
  async onCancelButton() {
    var bibtex = await (<lively-bibtex src={this.src}></lively-bibtex>)
    this.parentElement.insertBefore(bibtex, this)
    bibtex.updateView()
    this.remove()
  }
  
  async onTableCellSelected(evt) {
    // this.table.selectRow(this.table.currentRowIndex)
    
    this.setDetailsEntry(this.selectedEntry())
  }
  
  async setDetailsEntry(entry) {
    this.get("#details").innerHTML = "" 
    if (entry) {
      var detailsTable = await (<lively-table></lively-table>)
      this.detailsTable = detailsTable
      this.get('#details').appendChild(detailsTable)
      var a = []
      for(var key in entry) {
        if (key) {
          a.push([key, entry[key]])
        }
      }
      detailsTable.setFromArray(a)      
    }
    this.get('#details-change-indicator').reset()
  }
  
  

  getDetailsEntry() {
    if (!this.detailsTable) return;
    var a = this.detailsTable.asArray()
    var entry = {}
    for(var ea of a) {
      if (ea[0]) {
        entry[ea[0]] = ea[1]
      }
    }
    return entry    
  }
 
  onFinishEditingCell() {
    this.applyDetails()
  }
  
  
  livelySource() {
    return Array.from(this.querySelectorAll("lively-bibtex-entry")).map(ea => ea.textContent).join("")
  }

  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.src = lively4url + "/demos/bibliographie/_incoming.bib"
    this.style.overflow = "scroll"
  }
  
  
  
  
}