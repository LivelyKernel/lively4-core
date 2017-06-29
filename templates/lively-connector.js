import Morph from './Morph.js';
import SVG from "src/client/svg.js"
import DelayedCall from 'src/client/delay.js'
 
export default class LivelyConnector extends Morph {
 
  get isConnector() {
    return true
  }
 
  initialize() {
    this.fromElement = lively.elementByID(this.getAttribute("fromElement"))
    this.toElement = lively.elementByID(this.getAttribute("toElement"))
    this.connect(this.fromElement, this.toElement)
    
    this.resetBoundsDelay = new DelayedCall()
    this.resetBoundsDelay.delay = 500

  } 

  livelyExample() {
    var a = document.createElement("div")
    a.style.backgroundColor = "red"
    a.textContent = "a"
    lively.setExtent(a, pt(100,100))
    lively.setPosition(a, pt(100,100))

    var b = document.createElement("div")
    b.style.backgroundColor = "blue"
    b.textContent = "b"
    lively.setExtent(b, pt(100,100))
    lively.setPosition(b, pt(300,100))

    var container = document.createElement("div")
    this.parentElement.appendChild(container)
    container.appendChild(a)
    container.appendChild(this)
    container.appendChild(b)
    
    this.connect(a, b) 
  }
 

/*
   * Simple Path Based Connector.... should we make this a template? #TODO
   */
   updationPathConnection(c, a, selectorA, b, selectorB) {
      var p = c.shadowRoot.querySelector("path#path")
      

      var offset = lively.getGlobalPosition(c)
      var v = SVG.getPathVertices(p)

      if (a) {
        var p1 = lively.getGlobalBounds(a).expandBy(1)[selectorA]()
        v[0].x1 = p1.x - offset.x
        v[0].y1 = p1.y - offset.y
      }
      
      if (b) {
        var p2 = lively.getGlobalBounds(b).expandBy(1)[selectorB]()
        v[1].x1 = p2.x - offset.x
        v[1].y1 = p2.y - offset.y
      }
      
      SVG.setPathVertices(p,v)
      // svg.resetBounds(c, p)
  }
  
   updateConnector() {
    var path = this
    var b1 = lively.getGlobalBounds(path.fromElement || path); // path is fallback...
    var b2 = lively.getGlobalBounds(path.toElement || path)
    
    var dist = b1.center().subPt(b2.center())
    var selectorA, selectorB;
    if (Math.abs(dist.x) > Math.abs(dist.y)) {
      if (b1.center().x > b2.center().x) {
        selectorA = "leftCenter"
        selectorB = "rightCenter";
      }  else {
        selectorA = "rightCenter";
        selectorB = "leftCenter"
      }
    } else {
      if (b1.center().y > b2.center().y) {
        selectorA = "topCenter"
        selectorB = "bottomCenter";
      }  else {
        selectorA = "bottomCenter"
        selectorB = "topCenter";

      }
    }
    
    this.updationPathConnection(path, path.fromElement, selectorA, path.toElement, selectorB)
    this.resetBoundsDelay && this.resetBoundsDelay.call(() => {
      this.resetBounds()
    })
  }
  
  observePositionChange(a, obervername, cb) {
    if (!a) return
    var c = this
    if (c[obervername]) { 
      c[obervername].disconnect()
    };
    c[obervername] = new MutationObserver((mutations, observer) => {
        mutations.forEach(record => {
          if (record.target == a && record.attributeName == "style") {
            cb()
          }
        })
    });
    c[obervername].observe(a, {
      childList: false, 
      subtree: false, 
      characterData: false, 
      attributes: true});
  }
  
  connect(a, b) {
    this.connectFrom(a, false)
    this.connectTo(b)
  }
  
  connectFrom(a, doNotUpdate) {
    if (!a) return
    this.setAttribute("fromElement", lively.ensureID(a))
    this.fromElement = a
    this.observePositionChange(a,  "fromObjectObserver", () => this.updateConnector())
  
    if (!doNotUpdate)
      this.updateConnector(); // just don't do it twice
  }
  
  connectTo(b, doNotUpdate) {
    if (!b) return
    this.toElement = b
    this.setAttribute("toElement", lively.ensureID(b))
    this.observePositionChange(b,  "toObjectObserver", () => this.updateConnector())
    if (!doNotUpdate)
      this.updateConnector(); // just don't do it twice
  }

  disconnect() {
    this.disconnectFromElement()
    this.disconnectToElement()
  }
  
  disconnectFromElement() {
    if (this.fromObjectObserver) {
      this.fromObjectObserver.disconnect()
    }
    this.fromElement = null
  }
  
   disconnectToElement() {
    if (this.toObjectObserver) {
      this.toObjectObserver.disconnect()
    }
    this.toElement = null
  }
  
  getPath() {
    return this.shadowRoot.querySelector("path#path")
  }
  
  pointTo(p) {
    this.disconnectToElement()
    var path = this.getPath()
    var v = SVG.getPathVertices(path)
    v[1].x1 = p.x
    v[1].y1 = p.y
    var v = SVG.setPathVertices(path, v)
  }
  
  resetBounds() {
    var svg = this.get("#svg")
    SVG.resetBounds(svg, this.getPath())
    lively.setExtent(this, lively.getExtent(svg))
    var pos = lively.getPosition(svg)
    lively.moveBy(this, pos)
    lively.setPosition(svg, pt(0,0))
  }
  
  
  livelyMigrate(other) {
    // this.fromElement = other.fromElement
    // this.toElement = other.toElement
    // this.connect(this.fromElement, this.toElement)
  }

}