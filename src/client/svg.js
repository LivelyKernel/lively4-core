import {pt} from 'src/client/graphics.js';

/*
 * Kitchensink for all SVG manipulation utilities
 */

export default class SVG {
  
   static getPathVertices(p) {
    return p.getAttribute("d").split(/(?=[A-Za-z] +)/).map( ea => {
      console.log("ea " + ea)
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
  
}

