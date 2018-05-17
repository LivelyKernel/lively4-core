import Layout from '../layout.js';
import Point from '../point.js';

export default class NetworkLayout extends Layout {
  constructor(renderContext, nodes = []) {
    super(renderContext, nodes);
  }
  
  _placeNodes() {
    var nextLocation = this.renderContext.camera.location;
    var size = this.renderContext.camera.size;
    var nodeMargin = new Point(50, 50);
    
    for (var i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      
      node.bounds.location = nextLocation;
      nextLocation = new Point(node.bounds.right + nodeMargin.x, 0);
      
      if (nextLocation.x >= size.x) {
        nextLocation = new Point(this.renderContext.camera.left, nextLocation.y + nodeMargin.y);
      }
    }
  }
}