/*MD # Lively File 

![](lively-file.png){height=100px}

MD*/

import Morph from "src/components/widgets/lively-morph.js"
import ContextMenu from 'src/client/contextmenu.js'
import Mimetypes from 'src/client/mimetypes.js'
import {getTempKeyFor} from 'utils'
import {LivelyFile} from "src/client/poid.js"
import html from  'src/client/html.js'

export default class File extends Morph {
  initialize() {
    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);     
    this.updateView(this.name)
    this.draggable = true;
    this.addEventListener("dragstart", evt => this.onDragStart(evt))
    this.addEventListener("click", evt => this.onClick(evt))
    this.addEventListener("dblclick", evt => this.onDoubleClick(evt))    
    this.get("#item-name").addEventListener("click", evt => this.onNameClick(evt))
    html.registerAttributeObservers(this);
  }
  
  connectedCallback() {
    this.updateView(this.name)
  }

  onClick(evt) {
    if (evt.shiftKey) {
      // add and remove to a selection
      if (this.classList.contains("selected")) {
        this.classList.remove("selected")        
      } else {
        this.classList.add("selected")  
      }
    } else {
      // select one
      this.parentElement.querySelectorAll("lively-file").forEach(ea => {
        ea.classList.remove("selected")
      })
      this.classList.add("selected")        
    }
  }
  
  async onDoubleClick() {
    var comp = await lively.openBrowser(LivelyFile.fileToURI(this), false)
    comp.hideNavbar() 
  }
  
  onNameClick(evt) {
    if (this.classList.contains("selected")) {
      var nameField = this.get("#item-name")
      nameField.setAttribute("contenteditable", true)
      nameField.focus()
      evt.preventDefault()
      evt.stopPropagation()

      
      lively.removeEventListener("name", nameField)
      lively.addEventListener("name", nameField, "blur", () => {
        this.renameFile(nameField.textContent)
        nameField.setAttribute("contenteditable", false);
      })
      
    }
  }
  
  async onDragStart(evt) {
    var tmpKey = getTempKeyFor(this)
    evt.dataTransfer.setData("lively/element", tmpKey)
    
    this.lastDragOffset  = lively.getClientPosition(this).subPt(lively.getPosition(evt))
    
    
    let url = lively.files.tempfile(), // #Problem, we need to tell the server syncronously about that temp file...
        // because, this does not work (no sync web requests allowed...) we have to find another solution
        // #Idea all GET requests on temp files will block wait on an actual file (maybe with a timeout)
      name = this.name,
      mimetype = Mimetypes.mimetype(lively.files.extension(this.name));
    evt.dataTransfer.setData("DownloadURL", `${mimetype}:${name}:${url}`); // #TODO or make other drop places aware of DownloadURL
  
    // oh, shit... just because we want to be able to drag it to the desktop
    var contents = await fetch(this.url).then(r => r.blob())
    lively.files.saveFile(url, contents)
  }
  
  async setAsBackground() {
    lively.files.setURLAsBackground(
          `https://lively4/scheme/livelyfile//${encodeURIComponent(this.name)}`)
  }

  onContextMenu(evt) {
    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();
      var items = [
          ...(["browse", "edit"].map(ea => [ea, async () => {
            var comp = await lively.openBrowser("livelyfile://#" + this.name, ea == "edit")
            comp.hideNavbar() 
          }]))
      ]
      if (lively.files.isPicture(this.name)) {
        items.push(["set as background", () => this.setAsBackground()])
      }
      var menu = new ContextMenu(this, items);
      
      
      
      menu.openIn(document.body, evt, this);
      return true;
    }
  }

  
  updateView(value) {
    if (!value) return
    this.get('#item-name').innerHTML = value
    if (value.match(/\.(md)|(txt)$/)) {
      this._setIcon('fa-file-text-o') 
    } else if (value.match(/\.(png)|(jpeg)$/)) {
      this._setIcon('fa-file-picture-o')
    } else if (value.match(/\.(html)|(js)|(json)$/)) {
      this._setIcon('fa-file-code-o')
    } else if (value.match(/\.(mkv)|(mov)|(mp4)$/)) {
      this._setIcon('fa-film')
    } else if (value.match(/\.(mp3)$/)) {
      this._setIcon('fa-audio')
    } else {
      this._setIcon('fa-file-o') 
    }
    
  }
  
  set name(value) {
    this.setAttribute("name", value)
    this.updateView(value)
  }
 
  onIdChanged(value) {
    lively.notify("id changed " + value)
    this.updateView(value)  
  }
  
  get name() {
    return this.getAttribute('name')
  }

  renameFile(name) {
    this.name = name
  }
  
  set url(value) {
    this.setAttribute("url", value)
  }
  
  get url() {
    return this.getAttribute('url')
  }
  
  async setContent(data, contenttype) {
    if (data instanceof Blob) {
      var dataURL = await lively.files.readBlobAsDataURL(data)
      console.log("data: ", dataURL)
      this.url = dataURL
    } else {
      this.url = `data:${contenttype || "text/plain" };base64,` + btoa(data);
    }
  }

  set type(value) {
    switch(value) {
      case 'directory':
        this._setIcon('fa-folder')
        break
      default:
        this._setIcon('fa-file-o')
    }
  }

  _setIcon(iconClass) {
    this.get('#item-icon').classList.add(iconClass);
  }
  
  livelyExample() {
    this.name = "hello-world-foo.md"    
  }
  
  
}
