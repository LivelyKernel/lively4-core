
import Morph from 'src/components/widgets/lively-morph.js';

export default class LivelyChangeIndicator extends Morph {
  async initialize() {
    this.contentChangedDelay = (() => {
      this.update()
    }).debounce(1000)
  }
  
  // override this method to customize it! 
  getContent() {
    var element = this.getTargetElement()
    return element && element.innerHTML
  }
  
  getContext() {
    return this.parentNode
  }
  
  getTargetElement() {
    var element = this.getContext()
    return element && element.querySelector("#" + this.target)
  }
  
  get target() {
    return this.getAttribute("target") || "content"
  }
  
  attachedCallback() {
    if(this.getTargetElement()) {
      this.startObserving()  
    }
  }
  
  startObserving() {
    if (this.mutationObserver) this.mutationObserver.disconnect()
    var element = this.getTargetElement()
    if (!element) return
    this.mutationObserver = new MutationObserver((mutations, observer) => {
        this.onMutation(mutations, observer)
    });
    this.mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true});
  }
  
  onMutation(mutations) {
    mutations.forEach(record => {
      var indicator = this
      if (indicator ) {
        indicator.style.backgroundColor = "rgb(250,250,0)";
      }
      this.contentChangedDelay()
    })
  }
  
  update() {
    var source = this.getContent()
    if (source !== this.lastContent) {
      this.contentChanged = true    
    } else {
      this.contentChanged = false
    }
    this.updateChangeIndicator()
  }
  
  reset() {
    this.lastContent  =  this.getContent();
    this.contentChanged = false
    this.updateChangeIndicator()
  }
  
  updateChangeIndicator() {
    var indicator = this
    if (indicator && this.contentChanged) {
      indicator.style.backgroundColor = "rgb(220,30,30)";
    } else {
      indicator.style.backgroundColor = "rgb(200,200,200)";
    }
  }
  
  async livelyExample() {
    var parent = this.parentElement
    var pane = <div>
          {this}
          <div id="content" contentEditable="true">Hello</div>
        </div>
    parent.appendChild(pane)
    this.reset()
  }
}