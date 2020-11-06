import Parser from 'src/external/bibtexParse.js';
import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js'
import Strings from 'src/client/strings.js'  
import Bibliography from 'src/client/bibliography.js';
/*MD
# Lively Bibtex

![](lively-bibtex.png){style="width:350px"}

MD*/


export default class LivelyBibtexEditor extends Morph {
  async initialize() {
    
    this.setAttribute("tabindex", 0) // just ensure focusabiltity
    this.windowTitle = "LivelyBibtexEditor";
    this.registerButtons()
    lively.html.registerKeys(this, "Bibtex")
    
    // change indicator will observe changes in HTML, but "getContent" will check for plausibility....
    this.get('#content-change-indicator').getContent = () => this.toBibtex()
    this.get('#details-change-indicator').getContent = () => this.detailsToJSON()

    await this.updateView()
    
    if (this.merge) {
      this.onMergeButton()
    }
    
    this.addEventListener("copy", evt => this.onCopy(evt), true);
    this.addEventListener("cut", evt => this.onCut(evt), true);
    this.addEventListener("paste", evt => this.onPaste(evt), true);

    this.addEventListener("click", evt => this.onClick(evt));
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
  
  isEditingCells() {
    return this.table.isEditingCells()
  }
  
  
  onClick(evt) {
    var path = evt.composedPath()
    // we already have a focus here?
    if (!this.isEditingCells()) {
      if(this.detailsTable && path.includes(this.detailsTable)) {
        // nothing...
      } else {
        

        
        
        lively.focusWithoutScroll(this.get("#copyHack"))       
      }
    } 
    
  }
  
  
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
  
  
  get merge() {
    return this.getAttribute("merge")
  }

  set merge(url) {
    this.setAttribute("merge", url)
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
        if(key && ea.entryTags[key]) {
          row[key] = ea.entryTags[key]
        }
      }
      return row 
    })
    return flatEntries
  }

  
  flatEntryToBibtexEntry(ea) {
    var row = {
        citationKey: ea.citationKey, 
        entryType: ea.entryType, 
        entryTags: []
      } 
      for(var key of Object.keys(ea).sort()) {
        if (key !== "citationKey" 
            && key !== "entryType" 
            && key !== "entryTags"  
            && key && ea[key]) {
          row.entryTags[key] = ea[key]
        }
      }
    return row
  }
  
  flatEntriesToBibtexEntries(flatEntries) {
    return flatEntries.map(ea => {
      return this.flatEntryToBibtexEntry(ea) 
    })
  }
  
  flatEntriesToBibtex(flatEntries) {
    var entries = this.flatEntriesToBibtexEntries(flatEntries)
    return Parser.toBibtex(entries, false);
  }
  
  async loadEntries(url) {
    var source = await lively.files.loadFile(url)
    try {
      var flatEntries  = this.bibtexToFlatEntries(source)
    } catch(e) {
      lively.error("Could not load " + url)
      return
    }
    return flatEntries
  }

  async updateView() { 
    if (!this.src) return;
    this.get('#content').innerHTML = ""
    var table = await (<lively-table></lively-table>)
    this.table = table
    var flatEntries = await this.loadEntries(this.src)
    this.get('#content').appendChild(table)
    table.setFromJSO(flatEntries, true)
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
    this.table.setFromJSO(all, true)
    if (this.isMerging()) {
      this.colorMergeTable()
      this.colorDetailsTable()
    }
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
  
  isEditingDetails() {
    return lively.allParents(lively.activeElement()).includes(this.detailsTable)
  }
  
  selectedOrCurrentCells() {
    var cells = []
    if (this.table.selectedCells) {
      cells.push(...this.table.selectedCells)   
    } else if(this.currentCell) {
      cells.push(this.currentCells)
    }
    return cells    
  }
  
  selectedOrCurrentRows(){
    var rows = this.selectedOrCurrentCells()
      .map(ea => this.table.rowOfCell(ea))
      .uniq()
      .map(ea => this.table.rows()[ea])
    return rows
  }
  
  async onSave() {
    if (this.isMerging()) return lively.notify("Merge in process")
    if (this.isEditingDetails()) {
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
  
  
  sortByField(fieldName) {
    if (!this.table) return;
    var flatEntries = this.table.asJSO()
    flatEntries = flatEntries.sortBy(ea => ea[fieldName])
    this.table.setFromJSO(flatEntries, true)
    this.setDetailsEntry(null)
  }
  
  onSortByKeyButton() {
    this.sortByField("citationKey")
  }
  
  onSortByYearButton() {
    this.sortByField("year")
  }
  
  async onCancelButton() {
    var bibtex = await (<lively-bibtex src={this.src}></lively-bibtex>)
    this.parentElement.insertBefore(bibtex, this)
    bibtex.updateView()
    this.remove()
  }
  
  async onTableCellSelected(evt) {
    this.setDetailsEntry(this.selectedEntry())
    if (this.isMerging()) this.colorMergeTable()
  }
  
  async setDetailsEntry(entry) {
    this.get("#details").innerHTML = "" 
    if (entry) {
      var detailsTable = await (<lively-table></lively-table>)
      this.detailsTable = detailsTable
      this.get('#details').appendChild(detailsTable)
      var a = []
      if (this.isMerging()) {
        a.push(["", "A", "M", "B"])
        let original = this.originalEntries.find(ea => ea.citationKey == entry.citationKey) || {} 
        let other  = this.otherEntries.find(ea => ea.citationKey == entry.citationKey) || {}
        let allKeys = (Object.keys(original).concat(Object.keys(other)).uniq())
        for(let key of allKeys) {
          if (key == 0) {
          } else {
            a.push([key, original[key], entry[key], other[key]])
          }
        }
      } else {
        for(var key in entry) {
          if (key && entry[key]) {
            a.push([key, entry[key]])
          }
        }
      }
      
      this.detailsTable.addEventListener("finish-editing-cell", (evt) => this.onFinishDetailsEditingCell(evt))
      
      detailsTable.setFromArray(a)      
    }
    this.get('#details-change-indicator').reset()
    
    if (this.isMerging()) {
      this.colorDetailsTable()
    }
  }
  
  getDetailsEntry() {
    if (!this.detailsTable) return;
    var a = this.detailsTable.asArray()
    var entry = {}
    var column = this.isMerging() ? 2 : 1;
    for(var ea of a) {
      if (ea[0]) {
        entry[ea[0]] = ea[column]
      }
    }
    return entry    
  }
 
  onFinishEditingCell() {
    lively.notify("update details")
    this.setDetailsEntry(this.selectedEntry())
  }
  
  onFinishDetailsEditingCell() {    
    lively.notify("update table")
    this.applyDetails()
  }
  
  
  async onMergeButton() {
    var otherURL  = this.getAttribute("merge")
    if (!otherURL) {
      otherURL = await lively.prompt("merge other url", "")
      if (!otherURL) {
        return lively.notify("cannot merge without url")
      } else {
        this.merge = otherURL
      }
    }
    this.mergeOtherURL(otherURL)
  }
  
  
  onCombineButton() {
    var rows = this.selectedOrCurrentRows()
    if (rows.length != 2) {
      return lively.notify("select two rows (with CTRL+click)")
    }
    let flatEntries = rows.map(row => this.table.rowToJSO(row))
    
    flatEntries[0].citationKey = flatEntries[1].citationKey // #TODO merge relies on this...
    
    rows[1].remove() // don't need it any more
    
    this.mergeOtherEntries([flatEntries[1]])
    
    this.setDetailsEntry(flatEntries[0])
  }

  onFinishButton() { 
    this.finishMerge()
  }
  
  async onNewCitationKeyButton() {
    if (!this.detailsTable) return;
    
    var flatEntry = this.getDetailsEntry()
    if (!flatEntry) return
    var bibtexEntry = this.flatEntryToBibtexEntry(flatEntry)
    flatEntry.citationKey = Bibliography.generateCitationKey(bibtexEntry) 
    await this.setDetailsEntry(flatEntry)
    
    this.applyDetails()
  }
  
   onBrowseButton() {
    if (!this.detailsTable) return;
    var flatEntry = this.getDetailsEntry()
    if (!flatEntry) return
    lively.openBrowser("bib://"+ flatEntry.citationKey)
    
  }
  
  /*MD ## Copy and Paste MD*/
  onCopy(evt) {
    if (this.isEditingCells()) return
    if (this.detailsTable && lively.isActiveElement(this.detailsTable)) return   


    let source;
    let rows = this.selectedOrCurrentRows()  
    let flatEntries = rows.map(row => this.table.rowToJSO(row))
    let entries = this.flatEntriesToBibtexEntries(flatEntries)
    source = Parser.toBibtex(entries, false)
    
    evt.clipboardData.setData('application/bibtex', source);
    evt.clipboardData.setData('text/plain', source);
    evt.stopPropagation();
    evt.preventDefault();
  }
  
  onCut(evt) {
    if (this.isEditingCells()) return
    if (this.detailsTable && lively.isActiveElement(this.detailsTable)) return   

    lively.notify("on Cut")
    this.onCopy(evt);
    var rows = this.selectedOrCurrentRows()
    for(var row of rows) {
      row.remove()
    } 
  }

  onPaste(evt) {
    if (this.isEditingCells()) return
    if (this.detailsTable && lively.isActiveElement(this.detailsTable)) return   

    
    evt.stopPropagation();
    evt.preventDefault();
    
    lively.notify("ON PASTE")
    function insert(arr, index, newitems) {
      return [
        ...arr.slice(0, index),
        ...newitems,
        ...arr.slice(index)
      ]
    }


    var all = this.table.asJSO()
    let rowInsert;
    
    if (this.table.currentRowIndex) {
      rowInsert = this.table.currentRowIndex
    } else {
      rowInsert = all.length
      
    }
    var data = evt.clipboardData.getData('text/plain');
    
    try {
      var entries = this.bibtexToFlatEntries(data)
    } catch(e) {
      lively.error("could not pase bibtex: ", e)
      return 
    }
    
    
    var newentries = insert(all, rowInsert, entries)
    this.table.setFromJSO(newentries)

    lively.notify("new entries", "", 10, 
                  () =>lively.openInspector(newentries))
   
  }
  
  /*MD ## Merge MD*/
  
  isMerging() {
    return this.originalEntries && true 
  }
  
  
  async mergeOtherURL(otherURL) {
    if (this.isMerging()) throw new Error("Merge in process")
    if (!otherURL) throw new Error("missing other URL")
  
    var entries = await this.loadEntries(otherURL)
    return this.mergeOtherEntries(entries)
  }
  
  async mergeOtherEntries(entries) {
    this.originalEntries = this.table.asJSO()    
    this.otherEntries = entries

    
    var merged = []
    this.mergedEntries = merged 
    for(let ea of this.originalEntries) {
      let entry = Object.assign({"0": "A"}, ea)
      merged.push(entry)
    }
    for(let ea of this.otherEntries) {
      let entry = merged.find(originalEntry => originalEntry.citationKey == ea.citationKey) 
      if (entry) {
        entry[0] = "M"
        for (let key in ea) {
          if (ea[key] && !entry[key]) {
            entry[key] = ea[key]
          } 
        }
      } else {
        entry = Object.assign({"0": "B"}, ea)
        merged.push(entry)        
      }
      
      
    }
    this.table.setFromJSO(merged, true)
    this.setDetailsEntry(null)
      
    
    this.colorMergeTable()
    
    
    this.get("#saveButton").hidden = true
    this.get("#mergeButton").hidden = true
    this.get("#finishButton").hidden = false

  }

  colorMergeTable() {
    let colorA = "yellow"
    let colorB = "lightblue"
    let colorM = "orange"
    
    
    // #TODO this should be pulled into the table....
    let rows = this.table.rows() 
    let header = rows.shift()
    header = Array.from(header.querySelectorAll("th")).map(ea => ea.textContent)    
    var indexOf = {}
    for(let i in header) {
      indexOf[header[i]] = i
    }

    let mergedEntries = this.table.asJSO() 
    for(let row of rows) {
      
      let cells = row.querySelectorAll("td")
      
      
      var citationKey = cells[indexOf["citationKey"]].textContent     
      var a = this.originalEntries.find(ea => ea.citationKey == citationKey)
      var m = mergedEntries.find(ea => ea.citationKey == citationKey)
      var b = this.otherEntries.find(ea => ea.citationKey == citationKey)
      if (a && b) {
        cells[0].style.backgroundColor = colorM
      } else if (a) {
        cells[0].style.backgroundColor = colorA
      } else if (b) {
        cells[0].style.backgroundColor = colorB
      }
      for(let name of header) {
        let cell = cells[indexOf[name]]
        if (a && b) {
          if (a[name] != b[name] || a[name] != m[name]) {
            if (a[name] == m[name]) {
              cell.style.backgroundColor = colorA
            } else if (b[name] == m[name]) {
              cell.style.backgroundColor = colorB
            } else {
              cell.style.backgroundColor = colorM
            }
          } else {
              cell.style.backgroundColor = ""
          }
        }
      }
    }
  }
  
  colorDetailsTable() {
    if (!this.isMerging() || !this.detailsTable) return;
    
    let colorA = "yellow"
    let colorB = "lightblue"
    let colorM = "orange"
    
    
    let rows = this.detailsTable.rows() 
    let header = this.detailsTable.column(0).map(ea => ea.textContent)

    let columnTitles = rows[0].querySelectorAll("th")
    if (columnTitles[1]) columnTitles[1].style.backgroundColor = colorA;
    if (columnTitles[2]) columnTitles[2].style.backgroundColor = colorM;
    if (columnTitles[3]) columnTitles[3].style.backgroundColor = colorB;
    
    for(let row of rows) {      
      let cells = row.querySelectorAll("td")
      var a = cells[1]
      var m = cells[2]
      var b = cells[3]
      if (a && m && b) {
        
        if (a.textContent != m.textContent && b.textContent !== m.textContent) {
          m.style.backgroundColor = colorM
        } else if (a.textContent == m.textContent) {
          m.style.backgroundColor = colorA
        } else if (a.textContent == m.textContent) {
          m.style.backgroundColor = colorA
        } else if (b.textContent == m.textContent) {
          m.style.backgroundColor = colorB
        } 
      }
    }
  }
  
  
  async finishMerge() {
     if (!this.isMerging()) throw "not in merge mode"
    var merged = this.table.asJSO()
    var finished = merged.map(ea => {
      var f = ea.clone()
      delete f[0]
      return f
    })
    this.table.setFromJSO(finished, true)
    this.setDetailsEntry(null)
    
    delete this.originalEntries
    delete this.otherEntries
    
    
    this.get("#saveButton").hidden = false
    this.get("#mergeButton").hidden = false
    this.get("#finishButton").hidden = true
  }
  
  // livelySource() {
  //   return Array.from(this.querySelectorAll("lively-bibtex-entry")).map(ea => ea.textContent).join("")
  // }

  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.src = lively4url + "/demos/bibliographie/_incoming.bib"
    this.merge = lively4url + "/demos/bibliographie/_other.bib"
    this.style.overflow = "scroll"
  }
}