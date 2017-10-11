// #DragAndDrop 
import {pt} from 'src/client/graphics.js';
import generateUUID from './uuid.js';

export default class DragAndDrop {
  
  
  static load() {
    console.log("register body drag and drop")
    lively.removeEventListener("DragAndDrop", document)
    lively.addEventListener("DragAndDrop", document, "dragover", evt => this.onDragOver(evt))
    lively.addEventListener("DragAndDrop", document, "drop", evt => this.onDrop(evt)) 
  }
  
  static onDragOver(evt) {
    evt.preventDefault()
  }

  static onDrop(evt) {
    console.log("drop on body")
    debugger
    evt.preventDefault();
    var target = document.body
    var files = evt.dataTransfer.files;
    if (files.length > 0) {
      Array.from(files).forEach(file => {
        var reader = new FileReader();
        reader.onload = (event) => {
          var img = document.createElement("img")
          img.src = event.target.result.replace(/^data\:image\/png;/,"data:image/png;name=" + file.name +";")
          img.classList.add("lively-content")
          target.appendChild(img)
          lively.setGlobalPosition(img, pt(evt.clientX, evt.clientY))
        }; // data url!
        reader.readAsDataURL(file);        
      })
    } else {
      console.log("drop text")
      var data = evt.dataTransfer.getData("text");

      if (data.match(/^data\:image\/png/)) {
        debugger
        var img = document.createElement("img") 
        img.src = data
        img.classList.add("lively-content")
        target.appendChild(img)
        lively.setGlobalPosition(img, pt(evt.clientX, evt.clientY))        
        
      } else {
        var link = document.createElement("a") 
        link.href = data
        link.textContent = data.replace(/.*\//,"")
        link.classList.add("lively-content")
        // #TODO make this bevior persistant?
        link.onclick = (evt) => {
          evt.preventDefault()
          lively.openBrowser(data);
          return true
        }
        target.appendChild(link)
        lively.setGlobalPosition(link, pt(evt.clientX, evt.clientY))        
      }
      
      
    }
  } 
}

DragAndDrop.load()