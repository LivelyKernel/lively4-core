import Morph from 'src/components/widgets/lively-morph.js'
import ContextMenu from 'src/client/contextmenu.js'
import components from "src/client/morphic/component-loader.js"



let LOGGING_ENABLED=false
var widgetCounter = 0

export default class PersistentCodeWidget extends Morph {
  
  initialize() {
    this.id = widgetCounter++
    this.mutationObserver = new MutationObserver(m => { this.onContentChanged(m) });
    let config = {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    };
    this.mutationObserver.observe(this.contentRoot, config);
    this.isUpdating = false
    
    this.addEventListener("blur", evt => this.onBlur(evt))
    this.addEventListener("focusout", evt => this.onFocusOut(evt))
    this.addEventListener("click", evt => this.onClick(evt))
    
    
    lively.html.registerKeys(this, "CodeWidget", this)
    // this.addEventListener("keydown", evt => this.onKeyDown(evt))
    // this.addEventListener("keyup", evt => this.onKeyUp(evt))
    // this.addEventListener("keypress", evt => this.onKeyPress(evt))
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);
    
    
    // #Research implications for source - widget projection
    // (A) continous update of source... so that copy paste works e.g. push down changes to source
    // (B) updating source only as needed, e.g. when saving ... or maybe just before copy and paste
    this.continousUpdate = false 
    
    
    this.updateEmptyIndicator()
  }
  
  // #Problem code mirror removes and adds wigets a lot, which messes with the focus
  connectedCallback() {
    lively.removeEventListener("PersitentCodeWidget", document.body)
    lively.addEventListener("PersitentCodeWidget", document.body, "pointerdown", evt => this.onBodyPointerDown(evt))    
    // this.log("attached")
  }

  disconnectedCallback() {
    lively.removeEventListener("PersitentCodeWidget", document.body)
    // this.log("detachedC")
  }

  onBodyPointerDown(evt) {
    // this.log("stop keeping focus")
    this.lastActiveElement = null // don't mess with focus any more
  }
  
  
  async onKeyDown(evt) {
    evt.stopPropagation()
    
    this.log("keydown " + evt.key)
    
    if (evt.ctrlKey && evt.key === "s") {
      evt.preventDefault()
      
      this.log("onSave, but fist updateSource")
      await this.updateSource()
      this.log("UPDATE succsessful")
      
      let container = lively.query(this, "lively-container");  
      if (container) {

        this.log("THEN and save to file")
        container.onSave()
      } else {
        this.log("no container found")
      }
    }
    
    
    // evt.preventDefault()
    //     return false
  }
  
//   onKeyPress(evt) {
//     evt.stopPropagation()
//     // evt.preventDefault()
    
//     return false
//   }
  
//   onKeyUp(evt) {
//     evt.stopPropagation()
//     // evt.preventDefault()
//     return false
//   }
  
  
  refocus() {
    if (!this.isUpdating) return
    if (this.lastActiveElement) {
      this.lastActiveElement.focus()
      if (this.lastSelection && this.lastRange) {
        // this.log("reset selection ", this.lastRange)
        this.lastSelection.removeAllRanges()
        this.lastSelection.addRange(this.lastRange)      
      }
    }
  }
  
  async onBlur(evt) {
    
    // this is evil... editing content editable text seems to be working that way... but it breaks other things...
    // this.refocus() 
    // await lively.sleep(0)
    // this.refocus() 
  }
  
  onClick(evt) {
    this.clearLog()
  }
  
  onFocusOut(evt) {
    // this.log("onFocusOut" + evt)
  }
  
  // #important
  onContextMenu(evt) { 
    if (!evt.shiftKey) {
        evt.stopPropagation();
        evt.preventDefault();
        var menu = new ContextMenu(this, [
              ["add drawing", async () => {
                var comp = await (<lively-drawboard class="lively-content"
                                    width="600px" height="300px" color="black" 
                                    pen-size="null"  style="background-color: rgb(255, 250, 205);" >
                                  </lively-drawboard>)
                this.contentRoot.appendChild(comp)
                                               }],
              ["add rectangle", async () => {
                var comp = await (<div class="lively-content" style="width: 100px; height: 100px;  border: 1px solid black; background-color: rgba(40, 40, 80, 0.5);" >
                                  </div>)
                this.contentRoot.appendChild(comp)
                                               }],
              ["add text", async () => {
                var comp = await (<div class="sketchy lively-text lively-content" contenteditable="true" style="width:100px; height:30px">text</div>)
                this.contentRoot.appendChild(comp)
                                               }],
            ]);
        menu.openIn(document.body, evt, this);
        return true;
      }
  }
  
  get contentRoot() {
    return this.get("#container-root")
  }
  
  set source(contentSource) {
    this._lastSource = contentSource
    this.contentRoot.innerHTML = contentSource
    components.loadUnresolved(this.contentRoot, false, "persistent-code-widget.js", true);
  }
  
  get source() {
    return this.contentRoot.innerHTML
  }
  
  onContentChanged(m) {
    if(this._lastSource == this.innerHTML) return // false alarm
    this.log("content changed", m)
    
    if (this.continousUpdate) {
      this.updateSource()
    }
    this.updateEmptyIndicator()
  }
  
  isEmpty() {
    // whitespace and meta-nodes do not count
    var result = true;
    for (let ea of this.contentRoot.childNodes){
      if (ea.isMetaNode) continue
      if (ea instanceof Text && ea.textContent.match(/^[ \n]*$/)) continue
      result = false
      break
    }
    return result
  }
  
  
  updateEmptyIndicator() {
    if (this.isEmpty()) {
      this.classList.add("empty") 
    } else {
      this.classList.remove("empty")
    }
  }
  
  updateChangeIndicator() {
    // this.log("update change indicator")
    
    var indicator = this.get("#changeIndicator")
    
    if (this.continousUpdate) {
      indicator.style.display = "block"
    } else {
      indicator.style.display = "none"
    }
    
    if (indicator && this.isUpdating) {
      indicator.style.backgroundColor = "rgb(220,30,30)";
    } else {
      indicator.style.backgroundColor = "rgb(200,200,200)";
    }
  }
  
  get  isUpdating() {
    return this._isUpdating
  }
  
  set isUpdating(b) {
    this._isUpdating = b
    this.updateChangeIndicator()
  }
  
  
  log(s) {
    if (!LOGGING_ENABLED) return
    // return // disable log
    var log = document.body.querySelector("#DevLog")
    if (!log) return
    log.appendChild(<li>{this.id} | {Date.now() - this.lastLog}: {s}</li>)
    log.scrollTop = log.scrollHeight - log.clientHeight;
    this.lastLog = Date.now()
  }
  
  clearLog() {
    var log = document.body.querySelector("#DevLog")
    if (!log) return
    log.innerHTML = ""
    log.style.overflow = "auto"
  }
  
  rememberFocus() {
    this.lastActiveElement = lively.activeElement()
    if (this.lastActiveElement && 
          !lively.allParents(this.lastActiveElement , undefined, true).includes(this)) {
      // this.log("somebody else focused...")  
      this.lastActiveElement = null // not my child!
    } else {
      // this.log("remember focus")  
      // lively.showElement(this.lastActiveElement)
      this.lastSelection = lively.getSelection()
      try {
        this.lastRange = this.lastSelection.getRangeAt(0)
      } catch(e) {
        // not all elements have a range
      }
      // #TODO the fucker grabs my focus.... 
    }
  }
  

  
  
  
  /*MD ## updateSource
  
Welcome to the most uggliest shitplace of code I have produced for a long time!
  - thanks async focus behavior! thanks content editable!
  - root problem: changing content triggers focus changes because we are taken out and put back into the world... and we loose the focus immediately
  - other factors such as longer runnig syntax checks play a role too
  
  MD*/
  /*MD 

"The is one of the most intricated pieces of code I have ever written. 
It really comes only second after my first failed attempt at rotating rectangles
and the uploading of worlds in a SummerWasted!" [@JensLincke]

MD*/
  
  /*MD ![](../../../doc/figures/persistent-code-widget.drawio) MD*/
  myCodeMirror() {
    return lively.query(this, "lively-code-mirror")
  }
  
  myWidget() {
    return lively.query(this, ".inline-embedded-widget")
  }
  
  updateRangePreSave() {
    this.replaceSource()
  }
  
  replaceSource() {    
    var widget = this.myWidget()
    if (!widget) return
    var marker = widget.marker
    if (!marker) return // nothing to do here
    var myrange =  marker.find() // this can change
    this.myCodeMirror().editor.replaceRange(""+"*PW " + this.source + " PW*"+"" , 
      {line:myrange.from.line, ch:myrange.from.ch + 1},
      {line:myrange.to.line, ch:myrange.to.ch - 1})
  }
  
  async updateSource(oldPromisedUpdate) {
    this.lastUpdate = Date.now()
    if (this.isUpdating) {
      this.anotherUpdateNeeded = true
      
      this.rememberFocus()
      this.log("CONTINUE ")
      return this.promisedUpdate
    }
    if (oldPromisedUpdate) {
      this.log("START again ")
    } else {
      this.promisedUpdate = new Promise(resolve => {
        this.resolveUpdate = resolve
      })      
    }
    
    this.isUpdating = true
    this.anotherUpdateNeeded = false
    this.log("wait a bit... ")
    if (!oldPromisedUpdate) {
      while(Date.now() - this.lastUpdate < 1000) {
        await lively.sleep(100) // maybe we wait a bit... before we save
      }      
    }
    
    this.log("... and save")    
    // #TODO defere.... update source if (this.isUpdating) 
    
    let codeMirror = this.myCodeMirror();  
    let mywidget = this.myWidget();
    if (!codeMirror || !mywidget || !mywidget.marker) return; // nothing to update in ...
    try {
      
      // we don't want to replace everything, but just the content and don't have code-mirror remove
      // this widget completely

      
      this.rememberFocus()
      
      if (this.lastActiveElement) {
        codeMirror.editor.setOption("readOnly", "nocursor")        
      }
  
      this.replaceSource()

      // this.keepSelection = true    

      if (this.lastActiveElement) {
        // #TODO we should have control over these circumstances....
        // syntax highlighting and spell checking are async and take a while
        // we should check if this is the case...
        await lively.sleep(1000)

        this.keepFocus = false
        this.lastActiveElement = null
        this.lastSelection = null
        this.lastRange = null
      }
      


     // if (lastActiveElement) {
     //   lively.showElement(lastActiveElement)
     //   lastActiveElement.focus()
     // }
    } finally {
      this.isUpdating  = false
      if (this.anotherUpdateNeeded) {
        this.log("update again!")
        await this.updateSource(this.promisedUpdate)
      } else {
        codeMirror.editor.setOption("readOnly", false)
        this.log("finished")
      }      
      if (this.resolveUpdate) {
        this.log("RESOLVE update" + (oldPromisedUpdate ? " again " : ""))  
        this.resolveUpdate()
      }
    }
    this.log("RETURN updateSource " + (oldPromisedUpdate ? " again " : ""))
    return this.promisedUpdate
  }
  
  livelyMigrate(other) {
    this.source = other.source
  }

  
}