import Rectangle from './rectangle.js';
import Point from './point.js';

export default class Node {
  constructor(location = new Point(0, 0), size = new Point(300, 150)) {
    this.bounds = new Rectangle(location.x, location.y, size.x, size.y);
    
    console.log(this.bounds);
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
    if (this._beginDraw(renderContext)) {
      
      var canvasLocation = renderContext.camera.offset(this.bounds);
      renderContext.drawClipped(canvasLocation, this.bounds.size, () => {
        
        this._drawContent(renderContext, canvasLocation);
      });      
    }
    
    this._endDraw(renderContext);
  }
  
  _beginDraw(renderContext) {
    renderContext.canvasContext.save();
  }
  
  _drawContent(renderContext, canvasLocation) {
    // pure virtual definition
    // override this in order to draw your concrete node implemention
    throw new Error("cannot draw abstract node");
  }
  
  _endDraw(renderContext) {
    renderContext.canvasContext.restore();
    this._invalid = false;
  }
}