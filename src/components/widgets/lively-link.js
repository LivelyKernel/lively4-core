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
    html.registerAttributeObservers(this);
  }
  
  onClick() {
    if (this.classList.contains("selected")) {
      this.classList.remove("selected")        
    } else {
      this.classList.add("selected")  
    }
  }
  
  async onDoubleClick() {
    var comp = await lively.openBrowser(this.url, false)
    comp.hideNavbar() 
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
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();
      var menu = new ContextMenu(this, [
          ...(["browse", "edit"].map(ea => [ea, async () => {
            var comp = await lively.openBrowser("livelyfile://#" + this.name, ea == "edit")
            comp.hideNavbar() 
          }])),
          ["foo"]
      ]);
      menu.openIn(document.body, evt, this);
      return true;
    }
  }

  
  updateView() {
    var value = this.id
    this.get('#item-name').innerHTML = value

    if (this.url || this.url.match(/^plex:/)) {
      lively.notify("update...")
      fetch(this.url.replace(/\?.*/,"") + "?json").then(r => r.json()).then(json => {
        var media = json
        if (media.children.length == 1) {
          media =  media.children[0]
        }

        this.get("img").src = lively.swxURL("plex:/" + media.thumb)
        this.get("#item-name").innerHTML = 
          (media.title ?
            ("<b>" + media.parentTitle + "</b><br>" + media.title) :      
            ("" + media.title1 + "<br>"+ media.title2))
        // lively.openInspector(media)
      })
    }
    
  }
  
  set name(value) {
    this.setAttribute("id", value)
    this.updateView(value)
  }
 
  onIdChanged(value) {
    lively.notify("id changed " + value)
    this.updateView(value)  
  }
  
  get name() {
    return this.getAttribute('id')
  }

  set url(value) {
    this.setAttribute("url", value)
  }
  
  get url() {
    return this.getAttribute('url')
  }
  
  setContent(data) {
    this.url = "data:text/plain;base64," + btoa(data);
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
    this.url = "plex://library/sections/3/"
    this.name = "music"    
    this.updateView()
  }
  
  
}
