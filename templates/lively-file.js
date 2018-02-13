import Morph from "src/components/widgets/lively-morph.js"
import ContextMenu from 'src/client/contextmenu.js'

export default class File extends Morph {
  initialize() {
    this.addEventListener('contextmenu', evt => this.onContextMenu(evt), false);     
    this.updateView(this.name) 
  }
  
  onContextMenu(evt) {
    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();
      var menu = new ContextMenu(this, [
            ["browse", () => lively.openBrowser("element://#" + this.name)]
          ]);
      menu.openIn(document.body, evt, this);
      return true;
    }
  }
  
  updateView(value) {
    if (!value) return
    this.get('#item-name').innerHTML = value
    if (value.match(/\.(md)|(txt)$/))
      this._setIcon('fa-file-text-o')
    if (value.match(/\.(html)|(js)|(json)$/))
      this._setIcon('fa-file-code-o')
    if (value.match(/\.(mkv)|(mov)|(mp4)$/))
      this._setIcon('fa-film')
    if (value.match(/\.(mp3)$/))
      this._setIcon('fa-audio')
  }
  
  set name(value) {
    this.setAttribute("id", value)
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
    this.name = "foo.md"    
  }
  
  
}
