import { pt } from 'src/client/graphics.js';
import { debounce, through, asDragImageFor, getObjectFor, removeTempKey } from "utils";
import { letsScript } from 'src/client/vivide/vivide.js';

export function applyDragCSSClass() {
  this.addEventListener('dragenter', evt => this.classList.add("drag"), false);
  this.addEventListener('dragleave', evt => this.classList.remove("drag"), false);
  this.addEventListener('drop', evt => this.classList.remove("drag"));
}

function appendToBodyAt(node, evt) {
  dropOnDocumentBehavior.openAt(node, evt)
  // document.body.appendChild(node);
  // lively.setGlobalPosition(node, pt(evt.clientX, evt.clientY));
}


//class DataTransferItemHandler {
//  handle() {
//    
//  }
//}

class DropOnBodyHandler {
  constructor(mimeType, handler) {
    this.mimeType = mimeType;
    this.handler = handler;
  }
  
  handle(evt) {
    const dt = evt.dataTransfer;
    if(!dt.types.includes(this.mimeType)) { return false; }
    
    const element = this.handler(dt.getData(this.mimeType));
    if(element) {
      if(element.then) {
        element.then( r => {
          appendToBodyAt(r, evt);  
        })
      } else {
        appendToBodyAt(element, evt);
      }
      return true;
    } else {
      return false;
    }
  }
}

// drop and a dragged html element into a container
export class DropElementHandler {
  constructor(container, customHandler) {
    this.container = container;
    if (customHandler) {
      this.handleElement = customHandler
    }
  }
  
  handleElement(element, evt) {
    this.container.appendChild(element)
    lively.setGlobalPosition(element, lively.getPosition(evt))
    if (element.lastDragOffset) {
      lively.moveBy(element, element.lastDragOffset)
    }
  }
  
  handle(evt) {
    const dt = evt.dataTransfer
    if(!dt.types.includes("lively/element")) { return false }
    const tempKey = dt.getData("lively/element")
    const element = getObjectFor(tempKey)
    if (!element) return false
    
    this.handleElement(element, evt)
    
    removeTempKey(tempKey)
    return true
  }
  
  static handle(evt, container, cb) {
    new this(container, cb).handle(evt)
  }
}

const dropOnDocumentBehavior = {
  
  removeListeners() {
    lively.removeEventListener("dropOnDocumentBehavior", document);
  },
  
  load() {
    // #HACK: we remove listeners here, because this module is called three times (without unloading in between!!)
    this.removeListeners();
    lively.addEventListener("dropOnDocumentBehavior", document, "dragover", ::this.onDragOver);
    lively.addEventListener("dropOnDocumentBehavior", document, "drop", ::this.onDrop);
    
    this.handlers = [
      // lively elements
      new DropElementHandler(document.body),
      // {
      //   handle(evt) {
      //     const dt = evt.dataTransfer;
      //     if(!dt.types.includes("lively/element")) { return false; }
      //     const tempKey = dt.getData("lively/element");
      //     const element = getObjectFor(tempKey);
      //     if (!element) return false;
      //     document.body.appendChild(element)
      //     lively.setGlobalPosition(element, lively.getPosition(evt))
      //     if (element.lastDragOffset) {
      //       lively.moveBy(element, element.lastDragOffset)
      //     }
      //     removeTempKey(tempKey);
      //     return true;
      //   }
      // },
      // vivide list
      {
        handle(evt) {
          const dt = evt.dataTransfer;
          if(!dt.types.includes("vivide")) { return false; }
          if(!dt.types.includes("javascript/object")) { return false; }
          const dataTempKey = dt.getData("javascript/object");
          const data = getObjectFor(dataTempKey);
          const viewTempKey = dt.getData("vivide/source-view");
          const sourceView = getObjectFor(viewTempKey);
          getObjectFor
          letsScript(data, evt, sourceView);
          return true;
        }
      },

      // move a desktop item
      {
        handle(evt) {
          const dt = evt.dataTransfer;
          if(!dt.types.includes("desktop-icon/object")) { return false; }
          const tempKey = dt.getData("desktop-icon/object");
          const icon = getObjectFor(tempKey);
          removeTempKey(tempKey);

          const offset = dt.types.includes("desktop-icon/offset") ?
            JSON.parse(dt.getData("desktop-icon/offset")) :
            pt(0, 0);
          lively.setGlobalPosition(icon, pt(evt.clientX, evt.clientY).subPt(offset));
          return true;
        }
      },

      // knot/url to desktop item
      {
        handle(evt) {
          const dt = evt.dataTransfer;
          if(!dt.types.includes("knot/url")) { return false; }
          const knotURL = dt.getData("knot/url");

          lively.create('knot-desktop-icon')
            ::through(icon => lively.setGlobalPosition(icon, pt(evt.clientX, evt.clientY)))
            .then(icon => icon.knotURL = knotURL);

          return true;
        }
      },
      
      new DropOnBodyHandler('text/uri-list', urlString => {
        if (!urlString.match(/^data\:image\/png/)) { return false; }
        
        return <img class="lively-content" src={urlString}></img>;
      }),
      
      // open javascript/object in inspector
      {
        handle(evt) {
          const dt = evt.dataTransfer;
          if(!dt.types.includes("javascript/object")) { return false; }
          const tempKey = dt.getData("javascript/object");
          
          lively.openInspector(getObjectFor(tempKey), pt(
            evt.clientX,
            evt.clientY).subPt(lively.getGlobalPosition(document.body)));
          removeTempKey(tempKey);

          return true;
        }
      },

      new DropOnBodyHandler('text/uri-list', urlString => {
        if (!urlString.match(/^plex:\//)) { return false; }
        var existing = document.body.querySelector(`plex-link[src="${urlString}"]`)
        if (existing) {
          existing.remove()
        }
        lively.notify("dropped " + urlString)
        return <plex-link src={urlString}></plex-link>
      }),

      
      new DropOnBodyHandler('text/uri-list', urlString => {
        var link = <div class="lively-content"><a  href={urlString}>
          {urlString.replace(/\/$/,"").replace(/.*\//,"")}
        </a></div>;
        // register the event... to be able to remove it again...
        lively.addEventListener("link", link, "click", evt => {
          // #TODO make this bevior persistent?
          evt.preventDefault();
          evt.stopPropagation();
          lively.openBrowser(urlString);
          return true;
        })
        return link
      }),

      new DropOnBodyHandler('text/html', htmlString => {
        const div = <div></div>;
        div.innerHTML = htmlString;

        return div;
      }),

      new DropOnBodyHandler('text/plain', text => {
        return <p>{text}</p>;
      }),

      // just an ui interaction, no data
      {
        handle(evt) {
          return evt.dataTransfer.types.includes("ui/interaction");
        }
      }
    ];
  },
  
  openAt(node, evt) {  
    var target = this.lastDropTarget || document.body
    target.appendChild(node);
    lively.setGlobalPosition(node, pt(evt.clientX, evt.clientY));
    if (this.lastDropTargetHighlight) this.lastDropTargetHighlight.remove()
  },


  
  
  onDragOver(evt) {
    this.lastDropTarget = Array.from(evt.path).filter(ea => ea && ea.classList && ea.classList.contains("lively-content"))[0]
    if (this.lastDropTargetHighlight) this.lastDropTargetHighlight.remove()
    this.lastDropTargetHighlight = lively.showElement(this.lastDropTarget)
    
    evt.stopPropagation();
    evt.preventDefault();
  },

  handleFiles(evt) {
    const files = evt.dataTransfer.files;

    if(files.length === 0) { return false; }

    lively.notify(`Dropped ${files.length} file(s).`);
    Array.from(files).forEach(async (file) => {
        const extension = lively.files.extension(file.name)
        if (extension == "png") {
            // #Refactor #TODO use lively.files.readBlobAsDataURL
            const reader = new FileReader();
            reader.onload = event => {
              const dataURL = event.target.result.replace(/^data\:image\/png;/, `data:image/png;name=${file.name};`);
              const img = <img class="lively-content" src={dataURL}></img>;
              appendToBodyAt(img, evt);
            };
            reader.readAsDataURL(file); 
        } 
        // else if (extension == "html") {
        //   var source = await lively.files.readBlobAsText(file)
        //   lively.clipboard.pasteHTMLDataInto(source, document.body, false, lively.getPosition(evt));
        // } 
        else {          
          var item = await (<lively-file></lively-file>)
          item.classList.add("lively-content") // for persistence
          // #TODO check for existing "file"
          item.name = file.name
          this.openAt(item, evt);
          item.url = await lively.files.readBlobAsDataURL(file) 
        }
      });
    return true;
  },
  
  async onDrop(evt) {
    const dt = evt.dataTransfer;
    
    /*
    console.group("Drop Event on body");
    console.log(dt);
    console.log(`#files ${dt.files.length}`);
    console.log(Array.from(dt.items));
    lively.notify(Array.from(dt.types).join(" "));
    console.groupEnd();
    */

    evt.stopPropagation();
    evt.preventDefault();
    
    if(this.handleFiles(evt)) { return; }

    if(Array.from(dt.types).length > 0) {
      if(this.handlers.find(handler => handler.handle(evt))) {
        return;
      }
    }
    
    lively.warn("Dragged content contained neither files nor handled items");
  }
}

export function __unload__() {
  dropOnDocumentBehavior.removeListeners();
}

dropOnDocumentBehavior.load()