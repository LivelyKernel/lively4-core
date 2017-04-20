
/* Little Window Layout Helper */


import {pt, rects, Intersection} from "src/client/graphics.js"


export default class Layout {
  
  static getCenter(nodes) {
    return nodes.reduce((sum, ea) => sum.addPt(lively.getGlobalPosition(ea)), pt(0,0)).scaleBy(1/nodes.length)
  }
  
  static expandUntilNoIntersectionsToBottomLeft(windows, maxiterations) {
    if (maxiterations === undefined) maxiterations = 100;
    var i=0
    do {
      i++
      var intersections = Intersection.windows(windows)
      intersections.forEach(ea => {
        var obj
        if (ea.intersection.width > ea.intersection.height) {
          if (lively.getGlobalPosition(ea.a).y > lively.getGlobalPosition(ea.b).y)
            obj = ea.a
          else
            obj = ea.b
          lively.moveBy(obj, pt(0, ea.intersection.height + 10))
        } else {
          if (lively.getGlobalPosition(ea.a).x > lively.getGlobalPosition(ea.b).x)
            obj = ea.a
          else
            obj = ea.b
          lively.moveBy(obj, pt(ea.intersection.width + 10, 0))
        }
      })
    } while(intersections.length > 0 && i < maxiterations)
  }
  
  
  static expandUntilNoIntersectionsToBottomLeft(windows, maxiterations) {
    if (maxiterations === undefined) maxiterations = 100;
    var i=0
    do {
      i++
      var intersections = Intersection.windows(windows)
      intersections.forEach(ea => {
        var obj
        if (ea.intersection.width > ea.intersection.height) {
          if (lively.getGlobalPosition(ea.a).y > lively.getGlobalPosition(ea.b).y)
            obj = ea.a
          else
            obj = ea.b
          lively.moveBy(obj, pt(0, ea.intersection.height + 10))
        } else {
          if (lively.getGlobalPosition(ea.a).x > lively.getGlobalPosition(ea.b).x)
            obj = ea.a
          else
            obj = ea.b
          lively.moveBy(obj, pt(ea.intersection.width + 10, 0))
        }
      })
    } while(intersections.length > 0 && i < maxiterations)
  }
  
  static expandUntilNoIntersectionsExplosion(windows, maxiterations) {
    if (maxiterations === undefined) maxiterations = 10;
    var center = this.getCenter(windows)
    lively.showPoint(center)
    var i=0
    do {
      i++
      var intersections = Intersection.windows(windows)
      intersections.forEach(ea => {
        var dista = center.dist(ea.a)
        var distb = center.dist(ea.b)
        var obj = dista > distb ? ea.a : ea.b; 
        var direction = lively.getGlobalPosition(obj).subPt(center).normalized()
        var delta = direction.scaleBy(50) // #TODO I am to dumb to calculate the real length and keep the direction... so just go for it
        lively.showPath([lively.getGlobalPosition(obj), lively.getGlobalPosition(obj).addPt(delta)])
        lively.moveBy(obj, delta)
      })
    } while(intersections.length > 0 && i < maxiterations)
  }
  
  // just for development and testing
  static randomizeContentPosition(node) {
    var extent = lively.getExtent(node)
    node.childNodes.forEach(ea => lively.setPosition(ea, pt(Math.random()* extent.y, Math.random() * extent.x)))
  }
  
}


// // Live Feedback
// if (that) {
//   Layout.randomizeContentPosition(that)
//   setTimeout(() => {
//     Layout.expandUntilNoIntersectionsToBottomLeft(lively.array(that.childNodes))
//   }, 500)
// }

