import Morph from 'src/components/widgets/lively-morph.js';
import FileIndex from "src/client/fileindex.js";
import { pt } from 'src/client/graphics.js';

export default class LivelyGenericSearch extends Morph {
  get input() { return this.get('#input'); }
  get outer() { return this.get('#outer'); }
  get inner() { return this.get('#inner'); }
  get list() { return this.get('#list'); }
  
  // #TODO: mark as meta
  async initialize() {
    this.windowTitle = "LivelyGenericSearch";

    this.startSearching = (() => this.calculateListToShow()).throttle(300);
    this.setupInput();

    lively.html.registerKeys(this); // automatically installs handler for some methods

    this.addEventListener("focusout", () => this.close())
    this.addEventListener("click", evt => this.onClick(evt))
    this.init()
  }
    
  setupInput() {
    this.input.addEventListener("keyup", evt => {
      this.onKeyInput(evt);
    });
    this.input.addEventListener('input', evt => this.inputChanged(evt));
  }

  inputChanged(evt) {
    // lively.success('input is now ${this.input.value}', evt)
    this.startSearching()
  }
  
  close() {
    try {
      this.remove()
    } catch(e) {
      // no errors please..
    }
  }
  
  onKeyInput(evt) {
    const keyActions = new Map([
      [13, evt => {
        this.jumpToSelectedItem(evt);
        this.close();
      }], // ENTER
      [27, evt => this.close()], // ESCAPE
    ]);
    
    keyActions.getOrCreate(evt.keyCode, keyCode => evt => {})(evt);
  }
  
  onUpDown(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    const currentItem = this.get('.selected')
    if (!currentItem) { return; }
    
    const nextItem = currentItem.previousElementSibling || this.getAllSubmorphs('.item').last;
    if(!nextItem) { return; }
    
    currentItem.classList.remove('selected')
    nextItem.classList.add('selected')
  }
  onDownDown(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    
    const currentItem = this.get('.selected')
    if (!currentItem) { return; }
    
    var nextItem = currentItem.nextElementSibling || this.getAllSubmorphs('.item').first;
    if(!nextItem) { return; }
    
    currentItem.classList.remove('selected')
    nextItem.classList.add('selected')
  }
  
  async jumpToSelectedItem(evt) {
    this.jumpToItem(this.get('.selected'), evt)
  }
  
  async jumpToItem(item, evt) {
    if (!item) return
    lively.openBrowser(item.getAttribute('file'), !evt.shiftKey);
    this.close()
  }
  
  
  onClick(evt) {
    var item =  evt.composedPath().find(ea => ea.classList.contains("item"))
    this.jumpToItem(item, evt)
  }
  
  setFocus() {
    this.input.focus();
  }
  init() {
    lively.setPosition(this, pt(500, 100), 'fixed')
    this.files = this.getFiles();
    this.startSearching();
  }

  get searchRoots() {
    if (!this._roots) {
      this._roots = lively.preferences.get("ExtraSearchRoots") 
    } 
    return this._roots
  }
  
  async getFiles() {
    var result = [];
    await FileIndex.current().db.files.each(file => result.push(file));
    return result;
  }
  
  async calculateListToShow() {
    var pattern = this.input.value;
    var search = new RegExp(pattern, 'ig');

    const filteredFiles = (await this.files).filter(file => {
      if (file.url.startsWith(lively4url)) {
        const relativePath = file.url.replace(/.*\//ig, '');
        return relativePath.match(search);
      } else {
        var inSearchRoot = this.searchRoots.find(ea => file.url.startsWith(ea)) 
        if (inSearchRoot) {
          const relativePath = file.url.replace(/.*\//ig, '');
          return relativePath.match(search);
        }
        return false;
      }
    });
    
    const cutFiles = filteredFiles.slice(0, 50);
    this.updateList(cutFiles);
  }
  async updateList(filesToDisplay) {
    this.list.innerHTML = '';
    filesToDisplay = filesToDisplay.slice(0,50)
    
    filesToDisplay.forEach(file => {
      let name = file.url
      var inSearchRoot = this.searchRoots.find(ea => file.url.startsWith(ea)) 
      if (inSearchRoot) {
        name = name.replace(inSearchRoot, '')
      } else {
        name = name.replace(lively4url, '')        
      }
      
      if (this.input.value.length >= 3) {
        var regex = new RegExp(this.input.value, 'ig')
        var text = name;
        const realResult = [];
        var result;
        var realStart = 0
        var counter = 0
        while((result = regex.exec(text)) !== null) {
          var start = result.index
          var l = result[0].length

          var normal = <span>{text.substring(realStart, start)}</span>
          var highlight = <span style="color: red">{result[0]}</span>
              realResult.push(normal)
              realResult.push(highlight)
          realStart = start+l
          if (counter++ > 10) {break;}
        }
        realResult.push(<span>{text.substring(realStart, text.length)}</span>)


        this.list.appendChild(<div class="item" file={file.url}><span>{...realResult}</span></div>); 
      } else {
        this.list.appendChild(<div class="item" file={file.url}><span>{name}</span></div>); 
      }
    });
    const first = this.list.querySelector('.item')
    if (first) {
      first.classList.add('selected');
    }
  }
  
  // this method is autmatically registered through the ``registerKeys`` method
  onKeyDown(evt) {
    // lively.notify("Key Down: " + evt.charCode)
  }
  
  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    // whenever a component is replaced with a newer version during development
    // this method is called on the new object during migration, but before initialization
    this.input.value = other.input.value;
    this.input.focus();
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
}