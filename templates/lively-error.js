import Morph from './Morph.js';

import Files from 'src/client/files.js'

export default class LivelyError extends Morph {
  
  initialize() {
    
    this.update()
  }

  set stack(s) {
    this.setAttribute("stack", s)
    this.update()
  }

  get stack() {
    return this.getAttribute("stack")
  }

  update() {
    var stack = this.getAttribute("stack")
    if(!stack) return;
        
    stack.split("\n").forEach( line => {
      let lineSpan = document.createElement("span") 
      var m = line.match(/(.*?)\(?(https?:\/\/.*:[0-9]+:[0-9]+)/)
      if (m) {
        var call = m[1]
        var ref = Files.parseSourceReference(m[2])
        lineSpan.textContent = call
        var link = document.createElement("a")
        link.textContent = ref.url.replace(lively4url, "") + "\n"
        link.href = ref.url
        link.addEventListener("click", (evt) => {
          evt.preventDefault()
          lively.openBrowser(ref.url, true, ref)
          return true
        })
        
        lineSpan.appendChild(link)
      } else {
        lineSpan.textContent = "" + line + "\n"
      }
      this.get("#stack").appendChild(lineSpan)
    })
  }
  
  attachedCallback() {
  }

  livelyMigrate(other) {

  }
  
}
      

     
      