import Point from './point.js';


export default class Layout {
  constructor(renderContext, nodes = []) {
    this._renderContext = renderContext;
    this._nodes = nodes;
    
    this._renderContext.canvas.addEventListener("click", event => this._canvasOnClick(event), false);
  }
  
  get renderContext() {
    return this._renderContext;
  }
  
  get nodes() {
    return this._nodes;
  }
  
  set nodes(nodes = []) {
    this._nodes = nodes;
    this._placeNodes();
    this.draw();
  }
  
  addNode(node) {
    this.nodes.push(node);
    this._placeNodes();
    this.draw();
  }
  
  draw() {
    this.renderContext.beginFrame();
    
    this._drawNodes();
    this._drawNodeConnections();
    
    this.renderContext.endFrame();
  }
  
  _placeNodes() {
    // pure virtual definition
    // override this in order to draw your concrete node implemention
    throw new Error("cannot place nodes in an abstract layout");
  }
  
  _drawNodes() {
    this.nodes.forEach(node => {
      node.draw(this.renderContext);
    })
  }
  
  _drawNodeConnections() {
    // abstract implementation
    // override, in order to draw node connections
  }
  
  _canvasOnClick(event) {
    var clickPosition = new Point(event.offsetX, event.offsetY);
    
    // do *NOT* use this.nodes.forEach
    // this is, because we want to exit the loop as early as possible
    for (var i = 0; i < this.nodes.length; i++) {
      if (!this.nodes[i].bounds.contains(clickPosition)) {
        continue;
      }
      
      this.nodes[i].onClick(this.nodes[i].bounds.internalLocation(clickPosition));
      break;
    }
  }
}