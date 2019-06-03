import Morph from 'src/components/widgets/lively-morph.js';
import { applyDragCSSClass, DropElementHandler } from 'src/client/draganddrop.js';


export default class LivelyFolder extends Morph {
  async initialize() {
    this.windowTitle = "Folder";
    //this.addEventListener("drop", this.onDrop);

  }

  get name() {
    return this.getAttribute("name")
  }

  
  set name(string) {
    return this.setAttribute("name", string)
  }

  
  
//   async onDrop(evt) {
//     debugger
//     evt.preventDefault();
//     evt.stopPropagation();
        
//     // const files = evt.dataTransfer.files;
//     // let dir = lively.files.directory(this.url);
//     // if(files.length > 0 &&
//     //   await lively.confirm(`Copy ${files.length} file(s) into directory ${dir}?`)
//     // ) {
//     //   Array.from(files).forEach(async (file) => {
//     //     var newURL = dir + "/" + file.name;
//     //     var dataURL = await lively.files.readBlobAsDataURL(file)  
//     //     var blob = await fetch(dataURL).then(r => r.blob())
//     //     await lively.files.saveFile(newURL, blob)
//     //     this.show(newURL, ""); // #TODO blob -> text
//     //   });
//     //   return;
//     // }
    
//     if (DropElementHandler.handle(evt, this)
//     ) {
//       return;
//     }
       
// //     var data = evt.dataTransfer.getData("text");   
// //     var htmlData = evt.dataTransfer.getData("text/html");    
// //     if (data.match("^https?://") || data.match(/^data\:image\/png;/)) {
// //       this.copyFromURL(data);        
// //     } else if (htmlData) {
// //       data = evt.dataTransfer.getData();
// //       this.dropHTMLAsURL(htmlData)
// //     } else {
// //       console.log('ignore data ' + data);
// //     }
//   }
  
  async livelyExample() {
    // this customizes a default instance to a pretty example
    // this is used by the 
    this.name = "TestFolder"
    this.appendChild(await (<lively-file draggable="true" class="" name="foo.md" style="position: absolute; left: 0px; top: 10px;" url="data:application/octet-stream;base64,aGVsbG8="></lively-file>))
    this.appendChild(await (<lively-file draggable="true" class="" name="bar.js" style="position: absolute; left: 100px; top: 10px;" url="data:text/javascript;base64,aGVsbG8="></lively-file>))
  }
  
  
}