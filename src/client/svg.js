import {pt} from 'src/client/graphics.js';

/*
 * Kitchensink for all SVG manipulation utilities
 */

export default class SVG {
  
   static getPathVertices(p) {
    return p.getAttribute("d").split(/(?=[A-Za-z] +)/).map( ea => {
      var m = ea.split(/ +/)
      var pos = {c: m[0], x1: parseFloat(m[1]), y1: parseFloat(m[2]), toString: function() { return JSON.stringify(this)}}
      if (m[3]) {
        pos.x1 = parseFloat(m[3]);
        pos.y1 = parseFloat(m[4]);
        pos.x2 = parseFloat(m[1]);
        pos.y2 = parseFloat(m[2]);
      }
      return pos  
    })
  }
  
  static setPathVertices(p, vertices) {
    var s = vertices.map(ea => {
        var s = ea.c  
        if (typeof ea.x2 !== 'undefined') 
          s +=  " " + ea.x2 + " " + ea.y2 // first the helper points
        s += " " + ea.x1 + " " + ea.y1;
        return s 
      }).join(" ")
    p.setAttribute("d", s)
    return s
  }
  
  static resetBounds(svgElement, path) {
    var pos = lively.getPosition(svgElement)
    var bounds = svgElement.getBoundingClientRect()
    var bounds = svgElement.getBBox()
    var v = this.getPathVertices(path) 
    v.forEach(ea => {
      ea.x1 -= bounds.x
      ea.y1 -= bounds.y
    })
    lively.setPosition(svgElement, pos.addPt(pt(bounds.x, bounds.y)))
    this.setPathVertices(path, v)
    lively.setExtent(svgElement, pt(bounds.width, bounds.height))
  }
  
  /*
   * Simple Path Based Connector.... should we make this a template? #TODO
   */
  static updationPathConnection(c, a, selectorA, b, selectorB) {
      var p = c.querySelector("path#path")


      var offset = lively.getGlobalPosition(c)
      var v = this.getPathVertices(p)

      if (a) {
        var p1 = lively.getGlobalBounds(a)[selectorA]()
        v[0].x1 = p1.x - offset.x
        v[0].y1 = p1.y - offset.y
      }
      
      if (b) {
        var p2 = lively.getGlobalBounds(b)[selectorB]()
        v[1].x1 = p2.x - offset.x
        v[1].y1 = p2.y - offset.y
      }
      
      this.setPathVertices(p,v)
      this.resetBounds(c, p)
  }
  
  static updateConnector(path) {
    
    var b1 = lively.getGlobalBounds(path.fromElement)
    var b2 = lively.getGlobalBounds(path.toElement)
    
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
  }
  
  static observePositionChange(a, c, obervername, cb) {
    
    if (c[obervername]) c[obervername].disconnect()
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
  
  static connect(a, b, path) {
    this.connectFrom(path, a)
    this.connectTo(path, b)
    this.updateConnector(path)
  }
  
  static connectFrom(path, a) {
    path.fromElement = a
    this.observePositionChange(a, path, "fromObjectObserver", () => this.updateConnector(path))
  }
  
  static connectTo(path, b) {
    path.toElement = b
    this.observePositionChange(b, path, "toObjectObserver", () => this.updateConnector(path))
  }

  static disconnect(path) {
    if (path.fromObjectObserver) {
      path.fromObjectObserver.disconnect()
    }
    if (path.toObjectObserver) {
      path.toObjectObserver.disconnect()
    }
    path.fromElement = null
    path.toElement = null
  }
  
  
  
}

