import NetworkLayout from '../view/layouts/networkLayout.js';

export default class Controller {
  constructor(nodes = [], layouts = []) {
    this.nodes = nodes;
    this.layouts = layouts;
  }
  
  draw() {
    this.layouts.forEach(layout => {
      layout.draw();
    })
  }
  
  _nodesUpdated() {
    // this method will update all layouts for this controller
    // including a re-layouting and re-drawing
    // thus becoming slow eventually
    // ==> use with caution!
    this.layouts.forEach(layout => {
      layout.nodes = this.nodes;
    });
  }
  
  // TODO: add layout factory methods
  
  newNetworkLayout(renderContext) {
    var layout = new NetworkLayout(renderContext, this.nodes);
    this.layouts.push(layout);
    
    return layout;
  }
}