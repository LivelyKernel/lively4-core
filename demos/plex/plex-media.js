import Morph from 'src/components/widgets/lively-morph.js';
import Strings from 'src/client/strings.js'

// move to html
function registerAttributeObservers(obj) {
  obj._attrObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {  
      if(mutation.type == "attributes") { 
        var methodName = "on" + Strings.toUpperCaseFirst(mutation.attributeName) + "Changed"
        if (obj.methodName) {
          obj.methodName(
            mutation.target.getAttribute(mutation.attributeName),
            mutation.oldValue)
        }        
      }
    });
  });
  obj._attrObserver.observe(obj, { attributes: true });  
}

export default class PlexMedia extends Morph {

  async initialize() {
    registerAttributeObservers(this);
    this.render()
  }
  
  // #TODO generate this?
  get src() {
    return this.getAttribute("src")
  }
  set src(value) {
    return this.setAttribute("src", value)
  }

  onSrcChanged() {
    this.render()
  }

  async render() {
    if (!this.src || this.src == "") return;
    lively.notify("render")
    try {
      var media = await fetch(this.src, {
        method: "GET",
        headers: {
          "content-type": "application/json"
        }
      }).then(r => r.json())  
    } catch(e) {
      this.get("#media").innerHTML = "Error: " + e
      return
    }
    
    var mediaElement = this.get("#media");
    media.children.forEach(ea => {
      var dirElement = <div class={"directory " + ea.type} click={() => this.showDetails(dirElement, ea)}>
            {
              ea.thumb ? <img class="thumb" src={lively.swxURL("plex:/" + ea.thumb)}></img> : ""
            }<br />
            <span class="title">{ea.title}</span>
            
          </div>  
      mediaElement.appendChild(dirElement)    
    })
  }
  
  
  
  elementsInMyLine(elementInLine, container) {
    var pos = lively.getGlobalPosition(elementInLine)
    return Array.from(container.childNodes).filter(ea => {
      var eaPos = lively.getGlobalPosition(ea)
  
      return Math.abs(pos.y - eaPos.y) < 2
    })
  }
  
  showDetails(element, media) {
    lively.notify("details")
    if (this.details) this.details.remove();
    var lastElementInLine = _.last(this.elementsInMyLine(element, element.parentElement))
   
    this.details = <div class="details">{"Details for " + media.title}</div>
    element.parentElement.insertBefore(this.details, lastElementInLine.nextSibling); // insert after
  }
  

  async livelyExample() {
    this.setAttribute("src", "plex://library/sections/3/year/2000/")
  }
  
}