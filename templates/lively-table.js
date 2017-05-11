import Morph from './Morph.js';
import ContextMenu from 'src/client/contextmenu.js';

export default class LivelyTable extends Morph {
      
  initialize() {
    this.setupExample()
    this.addEventListener("click", evt => this.onClick(evt))
  }


  setupExample() {
    this.innerHTML = `<table><tr><th>First</th><th>Second</th></tr>
<tr><td>Hello</td><td>World</td></tr>
<tr><td>Foo</td><td>Bar</td></tr></table>`
  }

  onClick(evt) {
   if (this.selectedCell  && this.selectedCell != evt.srcElement) {
     this.selectedCell.contentEditable = false
   }
   
   this.selectedCell = evt.srcElement
   this.selectedCell.contentEditable = true
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
    return this.asArray().map(eaRow => eaRow.join("; ")).join("\n")
  }
  
  asJSON() {
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
  
  header() {
    return this.asArray()[0]
  }
  

}
      

     
      