import Morph from "src/components/widgets/lively-morph.js"

export default class FileBrowserItem extends Morph {
  initialize() {
    this.addEventListener('contextmenu', (evt) => {
      if (!evt.shiftKey) {
        evt.preventDefault();
        lively.openContextMenu(document.body, evt, this);
        evt.stopPropagation()
        evt.preventDefault()
        return true;
      }
    }, false);
     
  }
  
  set name(value) {
    this.get('#item-name').innerHTML = value.replace(/_/g,"_<wbr>").replace(/([a-z])([A-Z])/g,"$1<wbr>$2")
    if (value.match(/\.(md)|(txt)$/))
      this._setIcon('fa-file-text-o')
    if (value.match(/\.(html)|(js)|(json)$/))
      this._setIcon('fa-file-code-o')
    if (value.match(/\.(mkv)|(mov)|(mp4)$/))
      this._setIcon('fa-film')
    if (value.match(/\.(mp3)$/))
      this._setIcon('fa-audio')

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
    this.name = "foo.txt"
  }
  
}
