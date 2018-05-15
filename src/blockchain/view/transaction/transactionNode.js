import Node from '../node.js';
import Point from '../point.js';

export default class TransactionNode extends Node {
  constructor(transaction, location, size = new Point(600, 30)) {
    super(location, size);
    this.transaction = transaction;
  }
  
  _beginDraw(renderContext) {
    super._beginDraw(renderContext);
    
    if (!this.transaction) {
      console.log("no transaction to draw");
      return false;
    }
    
    if (!renderContext.camera.collides(this.bounds)) {
      console.log("transaction node is not displayed");
      return false;
    }
    
    return true;
  }
  
  _drawContent(renderContext, canvasLocation) {
    this._drawHash(renderContext, canvasLocation);    
    this._drawBounds(renderContext, canvasLocation);
  }
  
  _drawHash(renderContext, canvasLocation) {
    var margin = renderContext.style.textMargin;
    var textLocation = canvasLocation.add(margin);
    var clippingSize = this.bounds.size.subtract(margin.x * 2, margin.y * 2);
    var text = this.transaction.hash.digest().toHex();
    var textHeight = renderContext.style.fontHeight;
    
    renderContext.canvasContext.font = renderContext.style.font;
    renderContext.canvasContext.fillStyle = renderContext.style.linkColor;
    var textWidth = renderContext.canvasContext.measureText(text).width;
    
    if (textWidth < clippingSize.x) {
      // center text horizontally
      textLocation = new Point(
        textLocation.x + clippingSize.x * 0.5 - textWidth * 0.5, 
        textLocation.y
      );
    }
    
    if (textHeight < clippingSize.y) {
      // center text vertically
      textLocation = new Point(
        textLocation.x,
        textLocation.y + clippingSize.y * 0.5 - textHeight * 0.5
      );
    }
    
    // draw text in a clipped environment
    // thus preventing the text from overflowing our bounds
    renderContext.drawClipped(textLocation, clippingSize, () => {
 
      renderContext.canvasContext.fillText(
        text,
        textLocation.x,
        textLocation.y + textHeight,
      );
    });
    
    // draw a separation line after the initial hash
    // thus, it looks like the hash is some kind of headline
    /*
    renderContext.canvasContext.beginPath();
    renderContext.canvasContext.fillStyle = renderContext.style.borderColor;
    renderContext.canvasContext.rect(
      canvasLocation.x,
      textLocation.y + margin.y + renderContext.style.fontHeight,
      this.bounds.width,
      renderContext.style.borderThickness
    );
    renderContext.canvasContext.fill();
    */
  }
  
  _drawBounds(renderContext, canvasLocation) {
    renderContext.canvasContext.beginPath();
    renderContext.canvasContext.lineWidth = renderContext.style.borderThickness;
    renderContext.canvasContext.strokeStyle = renderContext.style.borderColor;
    renderContext.canvasContext.rect(canvasLocation.x, canvasLocation.y, this.bounds.width, this.bounds.height);
    renderContext.canvasContext.stroke();
  }
}