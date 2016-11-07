
import Morph from './Morph.js';
import moment from "src/external/moment.js";

export default class VersionControl extends Morph {

  initialize() {
   
  }
  
  showVersions(url) {
    this.url= url
    var listNode = this.shadowRoot.querySelector("#list")
    fetch(url, {
      method: "OPTIONS",
      headers: {
        showversions: true
      }
    }).then(r => r.text()).then( text => {
      try {
        var json = JSON.parse(text);
      } catch(e) {
        lively.notify("[version control] could not parse " + url+"versions:" + e, text.slice(0,1000), 10, () => {
          lively.openWorkspace(text);
        }, "red");
        return 
      }
      if (!json.versions) {
        lively.notify("[version control] no versions found", text)
        return
      }
      listNode.innerHTML =""
      json.versions.forEach( ea => {
        if (!ea) return // guard for syntax fixing null in server..  
        var item = document.createElement("tr")
        item.innerHTML = "<td class='date'>" + moment(ea.date).format("YYYY-MM-DD hh:mm") + "</td><td>"+ ea.author + "</td><td>" + ea.comment + "</td>"
        listNode.appendChild(item)
        ea.toString = function() { return JSON.stringify(this)} // generic pretty print
        item.value = ea
        item.onclick = () => {
          this.selectItem(item)
        }
      }) 
    })
  }
  
  selectItem(item) {
    this.get("#preview").editor.setValue("")

    if (this.selectedItem) 
      this.selectedItem.classList.remove("selected");
    if (this.selectedItem !== item) { 
      this.selectedItem = item;
      this.selectedItem.classList.add("selected");
      this.selection = item.value;
      fetch(this.url, {
        headers: {
          fileversion: item.value.version
        }
      }).then( r => r.text()).then( text => {
        this.get("#preview").editor.setValue(text)
      })
      
      
    } else {
      this.selectedItem = null;
      this.selection = null
    }
  }

  livelyMigrate(obj) {
    this.showVersions(obj.url);
  }

}