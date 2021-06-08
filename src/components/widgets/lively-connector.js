import Morph from 'src/components/widgets/lively-morph.js';
import SVG from "src/client/svg.js"
import {pt} from 'src/client/graphics.js';
import {debounce} from "utils"

export default class LivelyConnector extends Morph {
 
  get isConnector() { return true; }

  initialize() {
    
    this.resetBoundsDelay = (() => {
      this.resetBounds()
    })::debounce(500)

    this.loadVertices() // if not connected

    this.fromElement = lively.elementByID(this.getAttribute("fromElement"), lively.findWorldContext(this))
    this.toElement = lively.elementByID(this.getAttribute("toElement"), lively.findWorldContext(this))
   
    
    this.connect(this.fromElement, this.toElement, false)
    
    
    this.withAttributeDo("stroke", (color) => {
      this.stroke = color
    })
    
    this.withAttributeDo("stroke-width", (width) => {
     this.strokeWidth = width
    })
  } 
  
  get stroke() {
    return this.getPath().getAttribute("stroke")
  }

  set stroke(c) {
    this.setAttribute("stroke", c)
    return this.shadowRoot.querySelectorAll("path").forEach(ea =>
      ea.setAttribute("stroke", c))
  }

  get strokeWidth() {
    return this.getPath().getAttribute("stroke-width")
  }

  set strokeWidth(w) {
    this.setAttribute("stroke-width", w)
    return this.getPath().setAttribute("stroke-width", w)
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
 
  indicateError() {
    this.style.backgroundColor = "red";
    this.style.minWidth = "50px"
    this.style.minHeight = "50px"    
  }

  /*
   * Simple Path Based Connector.... should we make this a template? #TODO
   */
  updationPathConnection(c, a, selectorA, b, selectorB) {
    var p = c.shadowRoot.querySelector("path#path")
    if (!p) {
      this.indicateError()
      return 
    }
    var offset = lively.getGlobalPosition(c)
    var v = SVG.getPathVertices(p)
    if (a) {
      var p1 = lively.getGlobalBounds(a).expandBy(0)[selectorA]() // no, extent because no arrow head
      v[0].x1 = p1.x - offset.x
      v[0].y1 = p1.y - offset.y
    }
    if (b) {
      var p2 = lively.getGlobalBounds(b).expandBy(1)[selectorB]() // The arrow head goes into the object
      v[1].x1 = p2.x - offset.x
      v[1].y1 = p2.y - offset.y
    }
    SVG.setPathVertices(p,v)
    // svg.resetBounds(c, p)
  }
  
  updateConnector(keepbounds) {
    var path = this
    var b1 = lively.getGlobalBounds(path.fromElement || path);
    var b2 = lively.getGlobalBounds(path.toElement || path)
    
    
    if (b1.width == 0 && b1.height == 0 && b1.x == 0 && b1.y == 0) {
      // STOP something went wrong... the browser rendering is not ready!
      return
    }
    
    
    var dist = b1.center().subPt(b2.center())
    var selectorA, selectorB;
    if (Math.abs(dist.x) > Math.abs(dist.y)) {
      if (b1.center().x > b2.center().x) {
        selectorA = "leftCenter"
        selectorB = "rightCenter"
      }  else {
        selectorA = "rightCenter"
        selectorB = "leftCenter"
      }
    } else {
      if (b1.center().y > b2.center().y) {
        selectorA = "topCenter"
        selectorB = "bottomCenter"
      }  else {
        selectorA = "bottomCenter"
        selectorB = "topCenter"
      }
    }
    this.updationPathConnection(path, path.fromElement, selectorA, path.toElement, selectorB)
    if (!keepbounds) {
      this.resetBoundsDelay()
    }
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
  
  connect(a, b, doNotUpdate) {
    this.connectFrom(a, false)
    this.connectTo(b, doNotUpdate)
  }
  
  connectFrom(a, doNotUpdate, keepbounds) {
    if (!a) return
    this.setAttribute("fromElement", lively.ensureID(a))
    this.fromElement = a
    this.observePositionChange(a,  "fromObjectObserver", () => this.updateConnector())
    if (!doNotUpdate)
      this.updateConnector(keepbounds); // just don't do it twice
  }
  
  connectTo(b, doNotUpdate, keepbounds) {
    if (!b) return
    this.toElement = b
    this.setAttribute("toElement", lively.ensureID(b))
    this.observePositionChange(b,  "toObjectObserver", () => this.updateConnector())
    if (!doNotUpdate)
      this.updateConnector(keepbounds); // just don't do it twice
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
  
  getVertices() {
    return SVG.getPathVertices(this.getPath())
  }

  setVertices(vertices) {
    return SVG.setPathVertices(this.getPath(), vertices)
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
  
  saveVertices() {
    var vertices = this.getVertices()
    this.setAttribute("x1", vertices[0].x1)
    this.setAttribute("y1", vertices[0].y1)
    this.setAttribute("x2", vertices[1].x1)
    this.setAttribute("y2", vertices[1].y1)
  }

  loadVertices() {
    var vertices = this.getVertices()
    
    var x1 = this.getAttribute("x1")
    if (x1 !== null) { vertices[0].x1 = x1}
    var y1 = this.getAttribute("y1")
    if (y1 !== null) { vertices[0].y1 = y1}

    var x2 = this.getAttribute("x2")
    if (x2 !== null) { vertices[1].x1 = x2}
    var y2 = this.getAttribute("y2")
    if (y2 !== null) { vertices[1].y1 = y2}

    this.setVertices(vertices)
  }

  livelyPrepareSave() {
    this.saveVertices()
  }

  livelyMigrate(other) {
    // this.fromElement = other.fromElement
    // this.toElement = other.toElement
    // this.connect(this.fromElement, this.toElement)
  }

  livelyHalo() {
    return {
      configureHalo(halo) {
        halo.setHandleVisibility(true);
        
        let path = this.getPath();
        // halo.get("lively-halo-drag-item").style.visibility= "hidden"
        halo.ensureControlPoint(path, 0, true);
        halo.ensureControlPoint(path, 1, true);
      },
      dragBehaviorMove(halo, evt, pos) {}
    };
  }
}