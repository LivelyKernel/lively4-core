import { pt } from 'src/client/graphics.js';
import generateUUID from './uuid.js';
import { debounce } from "utils";

export function applyDragCSSClass() {
  this.addEventListener('dragenter', evt => {
    this.classList.add("drag");
  }, false);
  this.addEventListener('dragleave', evt => {
    this.classList.remove("drag");
  }, false);
  this.addEventListener('drop', evt => {
    this.classList.remove("drag");
  });
}

function appendToBodyAt(node, evt) {
  document.body.appendChild(node);
  lively.setGlobalPosition(node, pt(evt.clientX, evt.clientY));
}

const TEMP_OBJECT_STORAGE = new Map();
export function getTempKeyFor(obj) {
  const tempKey = generateUUID();
  TEMP_OBJECT_STORAGE.set(tempKey, obj);
  
  // safety net: remove the key in 10 minutes
  setTimeout(() => removeTempKey(tempKey), 10 * 60 * 1000);

  return tempKey;
}
export function getObjectFor(tempKey) {
  return TEMP_OBJECT_STORAGE.get(tempKey);
}
export function removeTempKey(tempKey) {
  TEMP_OBJECT_STORAGE.delete(tempKey);
}

//class DataTransferItemHandler {
//  handle() {
//    
//  }
//}

export default class DragAndDrop {
  
  static removeListeners() {
    lively.removeEventListener("DragAndDrop", document)
    lively.removeEventListener("DropOnDocument", document)
  }
  
  static load() {
    lively.addEventListener("DragAndDrop", document, "dragover", ::this.onDragOver)
    lively.addEventListener("DragAndDrop", document, "drop", ::this.onDrop)
    
    this.handlers = [
      ['text/uri-list image', (evt, dt) => {
        if(!dt.types.includes("text/uri-list")) { return false; }
        const urlString = evt.dataTransfer.getData("text/uri-list");
        if (!urlString.match(/^data\:image\/png/)) { return false; }
        
        var img = <img class="lively-content" src={urlString}></img>;
        appendToBodyAt(img, evt);

        return true;
      }],
      
      ['javascript/object', (evt, dt) => {
        if(!dt.types.includes("javascript/object")) { return false; }
        const tempKey = dt.getData("javascript/object");
        
        lively.openInspector(getObjectFor(tempKey), pt(evt.clientX, evt.clientY));
        removeTempKey(tempKey);

        return true;
      }],
      
      ['text/uri-list general', (evt, dt) => {
        if(!dt.types.includes("text/uri-list")) { return false; }
        const urlString = evt.dataTransfer.getData("text/uri-list");

        const link = <a class="lively-content" href={urlString} click={evt => {
          // #TODO make this bevior persistent?
          evt.preventDefault();
          lively.openBrowser(urlString);
          return true;
        }}>
          {urlString.replace(/.*\//,"")}
        </a>;
        appendToBodyAt(link, evt);
        
       return true;
      }],
      ['text/html', (evt, dt) => {
        if(!dt.types.includes("text/html")) { return false; }

        const htmlString = evt.dataTransfer.getData("text/html");
        const div = <div></div>;
        div.innerHTML = htmlString;
        appendToBodyAt(div, evt);

        return true;
      }],
      ['text/plain', (evt, dt) => {
        if(!dt.types.includes("text/plain")) { return false; }
        
        const text = evt.dataTransfer.getData("text/plain");
        const p = <p>{text}</p>;
        appendToBodyAt(p, evt);

        return true;
      }],
    ];
  }
  
  static onDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
  }

  static handleFiles(evt) {
    const files = evt.dataTransfer.files;

    if(files.length === 0) { return false; }

    lively.notify(`Dropped ${files.length} file(s).`);
    Array.from(files)
      // handle only .png files for now
      .filter(file => {
        const isPNG = file.name.toLowerCase().endsWith(".png");
        if(!isPNG) {
          lively.warn(`Did not handle file ${file.name}`);
        }
        return isPNG;
      })
      .forEach(file => {
        const reader = new FileReader();
        reader.onload = event => {
          const dataURL = event.target.result.replace(/^data\:image\/png;/, `data:image/png;name=${file.name};`);
          const img = <img class="lively-content" src={dataURL}></img>;
          appendToBodyAt(img, evt);
        };
        reader.readAsDataURL(file);
      });
    return true;
  }
  
  static async onDrop(evt) {
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
      if(this.handlers.find(([name, handler]) => handler(evt, dt))) {
        return;
      }
    }
    
    lively.warn("Dragged content contained neighter files nor items");
  }
}

export function __unload__() {
  DragAndDrop.removeListeners();
}

DragAndDrop.load()