
/* Little Window Layout Helper */


import {pt, rect} from "src/client/graphics.js"
import Windows from "templates/lively-window.js"


export class Intersection {
  
  static rects(rects) {
    var intersections = []
    for(var i=0; i < rects.length; i++) {
      for(var j=i; j < rects.length; j++) {
        if (i !== j) {
          var intersection = rects[i].intersection(rects[j])
          if (intersection && intersection.width > 0 && intersection.height > 0)
            intersections.push(intersection)
        }
      }  
    }
    return intersections
  }
  
  static windows(windows) {
    
    var bounds = new Map()
    windows.forEach( ea => bounds.set(ea, lively.getGlobalBounds(ea)))
    var intersections = []
    for(var i=0; i < windows.length; i++) {
      for(var j=i; j < windows.length; j++) {
        if (i !== j) {
          
          var intersection = bounds.get(windows[i]).intersection(bounds.get(windows[j]))
          if (intersection && intersection.width > 0 && intersection.height > 0)
            intersections.push({intersection: intersection, a:windows[i], b: windows[i] })
        }
      }  
    }
    return intersections
  }

  static withWindows(obj, windows) {
    var intersections = []
    var objBounds = lively.getGlobalBounds(obj)
    for(var i=0; i < windows.length; i++) {
      if (windows[i] !== obj) {
        var intersection = lively.getGlobalBounds(windows[i]).intersection(objBounds)
        if (intersection && intersection.width > 0 && intersection.height > 0)
          intersections.push({intersection: intersection, element: windows[i], })
      }
    }
    return intersections
  }
  
  
}


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
    windows = windows || Windows.allWindows()

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
    windows = windows || Windows.allWindows()
    if (maxiterations === undefined) maxiterations = 200;
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
  
  /*
   * Move overlapping windows away until it does not touch any more
   */
  static makeLocalSpace(obj) {
    var intersections = Intersection.withWindows(obj, Windows.allWindows())
    var objCenter =   lively.getGlobalCenter(obj)
    var objBounds = lively.getGlobalBounds(obj)
    intersections.forEach(ea => {
      var other = ea.element
      var intersection
      while (
        (intersection = lively.getGlobalBounds(other).intersection(objBounds)) &&
        intersection.width > 0 && intersection.height > 0) {
        var otherCenter = lively.getGlobalCenter(other);
        var delta = otherCenter.subPt(objCenter).normalized().scaleBy(10)
        lively.moveBy(other, delta)
        lively.showPath([otherCenter, otherCenter.addPt(delta)])
      } 
    })
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

