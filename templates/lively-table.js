import Morph from './Morph.js';
import ContextMenu from 'src/client/contextmenu.js';

export default class LivelyTable extends Morph {
      
  initialize() {
    this.addEventListener("click", evt => this.onClick(evt))
    lively.html.registerKeys(this, "Table")
    //  this.setAttribute("tabindex", 0)
    
    this.addEventListener("copy", (evt) => this.onCopy(evt))
    this.addEventListener("cut", (evt) => this.onCut(evt))
    this.addEventListener("paste", (evt) => this.onPaste(evt))
  }
  

  livelyExample() {
    this.setFromArray([
      ['A','B','C','D','E'],
      ['First', 'Second', 'Third', 'Fourth',''],
      ['Hello', 'World','','',''],
      ['Foo', 'Bar','','','']])
  }

  rows() {
    return lively.array(this.querySelectorAll("tr"))
  }

  cells() {
    return this.rows().map(ea => this.cellsIn(ea))
  }

  cellsIn(row) {
    return lively.array(row.querySelectorAll("td,th"))
  }

  cellAt(columnIndex,rowIndex) {
    var row = this.rows()[rowIndex]
    if (!row) return undefined;
    return row.querySelectorAll("td,th")[columnIndex]
  }
  
  
  clearSelection() {
    if (this.currentCell) {
      this.currentCell.contentEditable = false
      this.currentCell.classList.remove("selected")
    }
    this.currentCell = undefined
    this.currentRow = undefined
    this.currentRowIndex = undefined
    this.currentColumnIndex = undefined
    this.currentColumn = undefined
    this.startCell = undefined
    this.startRowIndex = undefined
    this.startColumnIndex = undefined
    if (this.selectedCells) {
      this.selectedCells.forEach(ea => {
        ea.classList.remove("selected")
        ea.classList.remove("star-selection")
      })
    }
  }

  addSelectedCell(element) {
    if (!this.selectedCells) this.selectedCells = []
      if (this.selectedCells.indexOf(element) < 0) {
        this.selectedCells.push(element)
      }
      element.classList.add("selected")
  }

  removeSelectedCell(element) {
    if (!this.selectedCells) this.selectedCells = []
      this.selectedCells.push(element)
    this.selectedCells = this.selectedCells.filter( ea => ea !== element)
    element.classList.remove("selected")
  }

  selectCell(element, multipleSelection) {
    if (this.currentCell  && this.currentCell != element) {
      this.currentCell.contentEditable = false
      if (!multipleSelection)
        this.currentCell.classList.remove("selected")
    }
    if (!element.parentElement) return; // cell must be one of mine

    this.currentCell = element
    let rows = this.rows(),
      row = element.parentElement,
      rowCells = this.cellsIn(row)
    this.currentRow = element.parentElement
    this.currentRowIndex = rows.indexOf(row)
    this.currentColumnIndex = rowCells.indexOf(element)
    this.currentColumn = rows.map(ea => ea[this.currentColumnIndex])

    if (multipleSelection) {
      this.addSelectedCell( this.currentCell)
    } else {
      if (this.selectedCells) 
        this.selectedCells.forEach(ea => {
          ea.classList.remove("start-selection")
          ea.classList.remove("selected")
        });
      this.selectedCells = [this.currentCell]
      this.currentCell.classList.add("selected")
      this.startCell = this.currentCell
      this.startRowIndex = rows.indexOf(row)
      this.startColumnIndex = rowCells.indexOf(element)
      this.startCell.classList.add("start-selection")
      
    }
  }

  onClick(evt) {
    if (this.currentCell === evt.srcElement) {
      this.currentCell.contentEditable = true; // edit only on second click into selection
    } else {
      this.selectCell(evt.srcElement)
      this.focus()
    }    
  }

  changeSelection(columnDelta, rowDelta, removeSelection) {
    var cells = this.cells()
    
    let columnA = this.startColumnIndex,
      columnB = this.currentColumnIndex + columnDelta,
      columnMin = Math.min(columnA, columnB),
      columnMax = Math.max(columnA, columnB),
      rowA = this.startRowIndex,
      rowB = this.currentRowIndex + rowDelta,
      rowMin = Math.min(rowA, rowB),
      rowMax = Math.max(rowA, rowB)
    
    for(var rowIndex = rowMin; rowIndex <= rowMax; rowIndex++) {
      var row = cells[rowIndex]
      if (row) {
        for(var columnIndex = columnMin; columnIndex <= columnMax; columnIndex++) {
          var cell = row[columnIndex]
          // lively.showElement(cell)
          if (cell) {
            if (removeSelection) {
              this.removeSelectedCell(cell)
            } else {
              this.addSelectedCell(cell)
            }
          }
        }
      }
    }
  }


  navigateRelative(columnDelta, rowDelta, multipleSelection) {
    if (this.currentColumnIndex === undefined) return
    var cells = this.cells()
    if (multipleSelection) {
      this.changeSelection(-columnDelta, -rowDelta, true)

      this.changeSelection(columnDelta, rowDelta)
    } 
    var row = cells[this.currentRowIndex + rowDelta]
    if (!row) return
    var newCell = row[this.currentColumnIndex + columnDelta]
  
    if (newCell) {
        this.selectCell(newCell, multipleSelection)
    }
  }
  
  onEnterDown(evt) {
    if (evt.srcElement != this) return
    if (!this.currentCell) return
    
    var cell = this.currentCell
    this.clearSelection()
    this.selectCell(cell)
    this.currentCell.contentEditable = true
    this.currentCell.focus()
    
    // set text selection
    var range = document.createRange();
    var sel = window.getSelection();
    try {
      // #TODO find a more correct way to set selection.... 
      range.setStart(this.currentCell, 0);
      // I have problems setting this to the end... so lets go as far as we can in small steps
      for(var i=0; i <= this.currentCell.textContent.length; i++) {
        range.setStart(this.currentCell, i);
      }
    } catch(e) {
      
    }
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    
    evt.stopPropagation()
    evt.preventDefault()
  }

  onEscDown(evt) {
    if (!this.currentCell) return
    this.currentCell.contentEditable = false
    this.focus()
    evt.stopPropagation()
    evt.preventDefault()
  }


  onLeftDown(evt) {
    if (evt.srcElement != this) return
    this.navigateRelative(-1, 0, evt.shiftKey == true)
    evt.stopPropagation()
    evt.preventDefault()
  }

  onRightDown(evt) {
    if (evt.srcElement != this) return
    this.navigateRelative(1, 0, evt.shiftKey == true)
    evt.stopPropagation()
    evt.preventDefault()
  }

  onUpDown(evt) {
    if (evt.srcElement != this) return
    this.navigateRelative(0, -1, evt.shiftKey == true)
    evt.stopPropagation()
    evt.preventDefault()
  }

  onDownDown(evt) {
    if (evt.srcElement != this) return

    this.navigateRelative(0, 1, evt.shiftKey == true)
    evt.stopPropagation()
    evt.preventDefault()
  }


  asArray() {
    return lively.array(this.querySelectorAll("tr")).map(eaRow => {
      return lively.array(eaRow.querySelectorAll("td,th")).map(eaCell => eaCell.textContent)
    })
  }

  setFromArray(array) {
    this.innerHTML = "<table>" +
      array.map((row,rowIndex) => "<tr>" + 
        row.map(ea => 
          rowIndex == 0 ? // header 
            `<th>${ea}</th>` : 
            `<td>${ea}</th>`).join("")   
        +"</tr>").join("\n")
    + "</table>"
  }
  

  asCSV() {
    return this.asArray().map(eaRow => eaRow.join(";")).join("\n")
  }
  
  setFromCSV(csv, separator = ";") {
    var rows = csv.split("\n").map(line => {
      
      return line.split(separator)
    })
    this.setFromArray(rows)
  }

  asJSO() {
    var all = this.asArray()
    var header = all[0]
    return all.slice(1).map(row => {
      var obj = {}
      row.forEach((ea,index) => {
        var name= header[index]
        obj[name] = ea
      })
      return obj
    })
  }
  
  /*
   * set the contents of the table from a JSO where the keys of each object will become the header
   * example: [{a: 1, b: 2}, {a: 4, b: 5, c: 6}]
   */
  setFromJSO(jso) {
    var headers = []
    var rows = jso.map(obj => {
      // add headers that are introduced in that row
      Object.keys(obj).forEach(key => {
        if (headers.indexOf(key) < 0) {
          headers.push(key)        
        }
      })
      return headers.map(key => {
        return obj[key]
      })
    })  
    rows.unshift(headers)
    this.setFromArray(rows)
  }
  
  
  onCopy(evt) {
    if (!this.currentCell) return
    evt.clipboardData.setData('text/plain', this.currentCell.textContent);
    evt.stopPropagation()
    evt.preventDefault()
  }
  
  onCut(evt) {
    this.onCopy(evt)
    this.currentCell.textContent = ""
  }

  onPaste(evt) {
    if (!this.currentCell) return
    this.currentCell.textContent = evt.clipboardData.getData('text/plain');
    evt.stopPropagation()
    evt.preventDefault()
  }


  livelyMigrate(other) {
    this.querySelectorAll("td,th").forEach(ea => ea.classList.remove("selected"))
    var selection = this.cellAt(other.currenColumnIndex, other.currentRowIndex)
    if (selection) this.selectCell(selection)
  }

  header() {
    return this.asArray()[0]
  }
  

}
      

     
      