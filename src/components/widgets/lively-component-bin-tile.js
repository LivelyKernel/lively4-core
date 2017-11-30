import Morph from 'src/components/widgets/lively-morph.js';
import componentLoader from 'src/client/morphic/component-loader.js';
import preferences from 'src/client/preferences.js';
import ContextMenu from 'src/client/contextmenu.js';
import {pt} from 'src/client/graphics.js';

export default class ComponentBinTile extends Morph {

  initialize() {
    // this.addEventListener('click', evt => this.onClick(evt))
    this.addEventListener('dragstart', evt => this.onDragStart(evt))
    this.addEventListener('drag', evt => this.onDrag(evt))
    this.addEventListener('dragend', evt => this.onDragEnd(evt))
    this.addEventListener('keyup', evt => this.onKeyUp(evt))
    this.draggable = true;
    this.setAttribute("tabindex", 0)
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
  }

  configure(config) {
    this.config = config; 
    this.setComponentName(config.name);
    var thumbnailName = config.template.replace(/html$/,"png")

    lively.components.searchTemplateFilename(thumbnailName).then( url => {
      if (url) {
        this.setThumbnail(url)
      }
    })
    
    this.setTooltip(config.description);
    this.htmlTag = config["html-tag"];
  }
  
  onContextMenu(evt) {      
    if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();

      var menu = new ContextMenu(this, [
          ["move", () => this.onMoveComponent(evt) ],
      ]);
      menu.openIn(document.body, evt, this);
      return true;
    }
  }

  setThumbnail(path) {
    this.get('img').src = path;
  }

  getThumbnailPath() {
    return this.get('img').src
  }

  setTooltip(string) {
    this.get('img').title = string;
  }

  setComponentName(name) {
    this.get('p').innerHTML = name;
  }

  setBin(componentBin) {
    this.componentBin = componentBin;
  }
  
  async onClick(evt) {
    var comp  = await this.createComponent(evt);
  } 
  
  setupComponent(comp) {
    if (comp.livelyExample) comp.livelyExample()
  }

  
  createComponent(evt) {
    var worldContext = document.body
    var comp = componentLoader.createComponent(this.htmlTag);
    this.component = comp;
    var pos = lively.getGlobalPosition(this)

    if (!this.componentBin || this.componentBin.inWindow()) {
      return componentLoader.openInWindow(comp).then(win => {
        // var pos = lively.findPositionForWindow(worldContext)
        lively.setGlobalPosition(comp.parentElement, pos)
        // lively.hand.startGrabbing(win, evt)

        this.setupComponent(comp)
        comp.parentElement.remove()

        return comp.parentElement
      })
      // return componentLoader.openInWindow(comp).then(() => {
      //   return comp
      // })
    } else {
      return componentLoader.openInBody(comp).then( () => {
        this.setupComponent(comp)
        lively.setGlobalPosition(comp, pos.subPt(lively.getExtent(comp).scaleBy(0.5)))
        // lively.hand.startGrabbing(comp, evt)
      })
    }
  }
  
  async onDragStart(evt) {
    var img = document.createElement("img")
    img.src = this.getThumbnailPath()    
    evt.dataTransfer.setDragImage(img, 0, 0); 

    this.dragTargetPromise = this.createComponent()
    this.dragTarget = await this.dragTargetPromise
  }
  
  onDrag(evt) {
    if (this.dragTarget && evt.clientX) {
      lively.setGlobalPosition(this.dragTarget, pt(evt.clientX - 300, evt.clientY - 10))
    } 
  }
  
  async onDragEnd(evt) {
    // Do nothing... 
    if (this.dragTargetPromise) {
      var target = await this.dragTargetPromise
      document.body.appendChild(target) 
      lively.setGlobalPosition(target, pt(evt.clientX - 300, evt.clientY - 10))
     
    }
    
  }

  async onKeyUp(evt) {
    if (event.keyCode == 13) { // ENTER
      var comp  = await this.createComponent();
      var bounds = this.componentBin.getBoundingClientRect()
      lively.setPosition(comp, pt(bounds.left, bounds.top))
      this.componentBin.close()
      comp.focus()
  
    }
  } 

  async onMoveComponent(evt) {
    var url = await lively.components.searchTemplateFilename(this.config.template);
    if (!url) {
      lively.notify("could  not find url")
    }
    var newUrl = await lively.prompt("Move component?", url);
    if (newUrl && newUrl !== url) {
      lively.notify("Move to " + newUrl);
      
      await lively.files.moveFile(url, newUrl)
      
      var jsUrl = url.replace(/html$/, "js")
      var newJsUrl = newUrl.replace(/html$/, "js")
      if(await lively.files.existFile(jsUrl)) {
        await lively.files.moveFile(jsUrl, newJsUrl)
      }
      
      var pngUrl = url.replace(/html$/, "png")
      var newPngUrl = newUrl.replace(/html$/, "png")
      if(await lively.files.existFile(pngUrl)) {
        await lively.files.moveFile(pngUrl, newPngUrl)
      }
    }
  }
  
  
  livelyExample() {
    this.style.width = "150px"
    this.style.height = "150px"
    this.configure({
      name: "ball",
      template: "lively-ball.html",
      "html-tag": "lively-ball"
    }) 
  }
  
  livelyMigrate(other) {
    this.configure(other.config)
  }
  
  
}
