
/*MD 

## DLF Archive 

Example from <http://localhost:9005/Dropbox/Music/dlf/Querkoepfe/index.md>:

```javascript
    import DLFArchive from "demos/dlf-archive.js"

    var container  = lively.query(this, "lively-container")
    new DLFArchive("Querköpfe",  "Wed_2105_querkoepfe", container.getDir()).createView()
```


MD*/


import Strings from 'src/client/strings.js'

export default class DLFArchive {

  constructor(sendung, pattern, dirURL) {
    this.dirURL = dirURL
    this.sendung = sendung
    this.pattern = pattern
  }
  
  
  async loadDLFSendung(isoDate) {
    var tab = await fetch(`cached:http://localhost:9005/Dropbox/share/DLF/extract/${isoDate}.tab`).then(r => r.text()) 

    var programm = tab.split(/\n/g).map(ea => ea.split(/\t/))
    
    
    // deals with corona iregularities
    var programmCollection = programm.find(ea => ea[1] && ea[1].startsWith("Der Kultur-Abend"))
    if (programmCollection) {
      let div = <div></div>
      div.innerHTML = programmCollection[2]
      var subs = []
      var last = ["nothing","nothing", ""]
      for(var child of div.childNodes) {
        if (child.classList.contains("subDescription")) {
          var spans = child.querySelectorAll("span")
          last = [spans[0].textContent, spans[1].textContent, ""]
          subs.push(last)
        } else {
          last[2] += child.outerHTML + "\n"
        }
      }
      programm.push(...subs)    
    }

    var sendung = programm.filter(ea => ea[1] && ea[1].startsWith(this.sendung))[0]
    if (!sendung || !sendung[2]) return
    let div = <div></div>
    div.innerHTML = sendung[2]
    var p = div.querySelector("p")
    if (p) {
      return p.innerHTML.split(/<br>/)
    }
  }
  
  
  async loadProgramInfo(item) {
    var m = item.file.name.match(/(20\d\d-\d\d-\d\d)/)
    if (m && m[1]) {
      var isoDate = m[1]
    } else {
      return
    }
    var info = await this.loadDLFSendung(isoDate)
    return info  
  }
  
  
  async selectItem(item) {
    if (this.lastSelected) this.lastSelected.classList.remove("selected")
    item.classList.add("selected")
    this.lastSelected = item
    
    var info = await this.loadProgramInfo(item)
    if (!info) {
      this.details.innerHTML = "no details"
    } else {
      this.details.innerHTML = JSON.stringify(info)
      this.lastSelected.info = info
    }
    
  }

  onItemClick(evt, item) {
    
    this.selectItem(item)
      
    // if (item.classList.contains("selected")) {
    //   item.classList.remove("selected")
    // } else {
    //   item.classList.add("selected")
    // }
  }
  
  async newFilenameForItem(item) {
  
    if (!item.file) return
   
    var rawPattern = this.pattern
    
    var filename = item.file.name
    if (!filename.match(rawPattern)) {
      // lively.notify("file has already a custom name")
      return
    }
    
    if (!item.info) {
      item.info = await this.loadProgramInfo(item)
      if (!item.info) {
        console.log("could not load DLF program info for " + item.file)
        return
      }
    }


    var info = item.info
    var s = this.sendung 
    if (this.sendung == "Hörspiel") { // #TODO pull this out
      s += " - " + info[0]
    }
    s += " - " + info[1]
    if (info[2]) s += " - " + info[2]
    s = s.replace(/ /g, "_")
    s = s.replace(/[:.\/]/g, "_")
    s = s.replace(/[„"]/g,"")
    s = s.replace(/_+/g, "_")

    var newFilename = filename.replace(rawPattern, s)
    return newFilename
  }
  
  
  
  async onRenameButton(evt) {
    if (!this.lastSelected) return
    
    var newFilename = await this.newFilenameForItem(this.lastSelected)
    
    if (!newFilename) {
      lively.warn("could not generate new filename")
      return
    }
    this.lastSelected.newFilename = newFilename
    this.renameItem(this.lastSelected)
    // lively.warn("not implemented yet")
    
  }
  
  async renameItem(item, dontAsk) {
    if (!item.newFilename) return;
    
    var filename = item.file.name
  
    var fromURL = this.dirURL + encodeURI(filename)
    var toURL = this.dirURL + encodeURI(item.newFilename)

  
    if(!dontAsk && !await lively.confirm("rename " + filename + " -> " + item.newFilename  + " in " + this.dirURL)) {
      return "cancel"
    }  
    var resp = await lively.files.moveFile(fromURL, toURL)
    if (resp.status == 200) {
      item.innerHTML = item.newFilename
      delete item.newFilename 
    } else {
      item.style.backgroundColor = "red"
    }
  }
  
  async onPreviewButton() {
    for(var item of this.items) {
      var newFilename = await this.newFilenameForItem(item)
      if (newFilename) {
        item.newFilename = newFilename
        item.innerHTML = "rename " + item.file.name + " -> <b>" + newFilename + "</b>"
      } else {
        item.style.color = "gray"
      }
    } 
  }
  
  async onRenameAllButton() {
    for(var item of this.items) {
      await this.renameItem(item, true)
    } 
  }
  
  async createView() {
    var stats = await fetch(this.dirURL, {method: "OPTIONS"}).then(r => r.json())


    this.items = stats.contents
                  .sortBy(ea => ea.name)
                  .map(ea => {
                    var item = <li>{ea.name}</li>
                    item.file = ea
                    item.addEventListener("click", evt => this.onItemClick(evt, item))
                    return item
                  })

    var list = <ul id="list">{...this.items}</ul>
    var style = document.createElement("style") // #ISSUE style tags conflict with Markdown rewriting....
    style.innerHTML = `
      li.selected {
        background-color: lightgray
      }
      
      #pane {
        position: absolute;
        width: 100%;
        top: 200px;
        height: calc(100% - 200px);
        overflow: auto;

      }
      #buttons: {
       
      }
      
      
      #list {
      }
      
      h1, #buttons, #details {
        margin: 20px;
      }
      
    `
    this.details = <div id="details"></div>
    // #TODO relative positioning does not work with 100% calculations... 
    return <div style="position:absolute;top:0px; left:0px;width:100%; height:100%">
        {style}
        <h1>{this.sendung}</h1>
        <div id="buttons">
          <button click={evt => this.onRenameButton(evt)}>rename selected</button>
          <button click={evt => this.onPreviewButton(evt)}>preview all</button>
          <button click={evt => this.onRenameAllButton(evt)}>rename all</button>          

        </div>
        {this.details}
        <div id="pane">
          {list}
        </div>
      </div>
  }

}