import Rectangle from './rectangle.js';
import Point from './point.js';

export default class Node {
  constrcutor(location, size) {
    if (location == null) {
      location = new Point(0, 0);
    }
    
    if (size == null) {
      size = new Point(300 ,150);
    }
    
    this.bounds = new Rectangle(location.x, location.y, size.x, size.y);
    this.parents = [];
    this.children = [];
    this._invalid = true;
  }
  
  isInvalid() {
    return this._invalid;
  }
  
  invalidate() {
    // indicates, that this node needs to be drawn again
    this._invalid = true;
    return this;
  }
  
  onClick(relativePosition) {
    // abstract on click method
    // override in order to handle click events
  }
  
  draw(renderContext) {
    // pure virtual definition
    // override this in order to draw your concrete node implemention
    throw new Error("cannot draw abstract node");
  }
}