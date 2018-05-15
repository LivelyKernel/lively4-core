import Node from '../node.js';
import Point from '../points.js';
import Rectangle from '../rectangle.js';

export default class TransactionNode extends Node {
  constructor(transaction, location, size) {
    super(location, size);
    this.transaction = transaction;
  }
  
  draw(renderContext) {
    console.log("transaction node: draw");
    if (!this.transaction) {
      console.log("no transaction to draw");
      return this;
    }
    
    if (!renderContext.camera.collides(this.bounds)) {
      console.log("transaction node is not displayed");
      return this;
    }
    
    var canvasLocation = renderContext.camera.offset(this.bounds);
    
    renderContext.canvasContext.save();
    this._drawHash(renderContext, canvasLocation);
    renderContext.canvasContext.restore();
    
    this._drawBounds(renderContext, canvasLocation);
  }
  
  _drawHash(renderContext, canvasLocation) {
    var margin = renderContext.style.textMargin;
    var textLocation = canvasLocation.add(margin);
    var textSize = this.bounds.size.subtract(margin.x * 2, margin.y * 2);
    var text = this.transaction.hash.digest().toHex();

    renderContext.canvasContext.beginPath();
    renderContext.canvasContext.rect(textLocation.x, textLocation.y, textSize.x, textSize.y);
    renderContext.canvasContext.clip();
    
    renderContext.canvasContext.font = renderContext.style.font;
    renderContext.canvasContext.fillStyle = renderContext.style.foreColor;
    renderContext.canvasContext.fillText(
      text,
      textLocation.x,
      textLocation.y
    );
  }
  
  _drawBounds(renderContext, canvasLocation) {
    renderContext.canvasContext.beginPath();
    renderContext.canvasContext.lineWidth = renderContext.style.borderThickness;
    renderContext.canvasContext.strokeStyle = renderContext.style.borderColor;
    renderContext.canvasContext.rect(canvasLocation.x, canvasLocation.y, this.border.width, this.border.height);
    renderContext.canvasContext.stroke();
  }
}