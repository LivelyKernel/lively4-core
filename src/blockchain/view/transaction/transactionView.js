import Point from 'src/blockchain/view/point.js';
import Rectangle from 'src/blockchain/view/rectangle.js';

const C_TEXT_MARGIN = new Point(20, 20);

export default class TransactionView {
  constructor(renderContext, transaction) {
    this._context = renderContext;
    this._collapsed = true;
    this._bounds = new Rectangle(0, 0, 300, 150);
    this._transaction = transaction;
  }
  
  get context() {
    return this._context;
  }
  
  set context(context) {
    this._context = context;
    this.draw();
  }
  
  get bounds() {
    return this._bounds;
  }
  
  set bounds(bounds) {
    this._bounds = bounds;
    this.draw();
  }
  
  get collapsed() {
    return this._collapsed;
  }
  
  set collapsed(collapsed) {
    this._collapsed = collapsed;
    this.draw();
  }
  
  get transaction() {
    return this._transaction;
  }
  
  set transaction(transaction) {
    this._transaction = transaction;
    this.draw();
  }
  
  draw() {
    console.log("drawing transaction: " + this._transaction.hash.digest().toHex());
    if (!this.context) {
      throw new Error("no render context");
    }
    
    if (!this.transaction) {
      console.log("no transaction to draw");
      return;
    }
    
    if (!this.context.camera.collides(this.bounds)) {
      console.log("transaction view not visible");
      // we are not within the camera
      return;
    }
    
    if (this.collapsed) {
      this._drawCollapsed();
    }
    else {
      this._drawExpanded();
    }
  }
  
  _drawCollapsed() {
    var heightOffset = this.bounds.top;
    
    heightOffset = this._drawHeadline(heightOffset);
  }
  
  _drawExpanded() {
    var heightOffset = this.bounds.top;
    
    heightOffset = this._drawHeadline(heightOffset);
  }
  
  _drawHeadline(heightOffset) {
    var headlineLocation = new Point(this.bounds.x, heightOffset)
                                .add(C_TEXT_MARGIN)
                                .subtract(this.context.camera.location);

    var headlineText = this.transaction.hash.digest().toHex();
    
    this.context.canvasContext.font = this.context.style.font;
    this.context.canvasContext.fillStyle = this.context.style.foreColor;
    this.context.canvasContext.fillText(
      headlineText,
      headlineLocation.x,
      headlineLocation.y
    );
    
    var headlineHeight = this.context.canvasContext.measureText(headlineText).height;    
    return heightOffset + Math.ceil(headlineHeight);
  }
}