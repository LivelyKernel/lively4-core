import Point from './point.js';

export default class Rectangle {
  constructor(x, y, width, height) {
    this.location = new Point(x, y);
    this.size = new Point(Math.abs(width), Math.abs(height)); 
  }
  
  get x() {
    return this.location.x;
  }
  
  set x(x) {
    this.location = new Point(x, this.location.y);
  }  
  
  get y() {
    return this.location.y;
  }
  
  set y(y) {
    this.location = new Point(this.location.x, y);
  }
  
  get width() {
    return this.size.x;
  }
  
  set width(width) {
    this.size = new Point(width, this.size.y);
  }
  
  get height() {
    return this.size.y;
  }
  
  set height(height) {
    this.size = new Point(this.size.x, height);
  }
  
  get left() {
    return Math.min(this.x, this.x + this.width);
  }
  
  get top() {
    return Math.min(this.y, this.y + this.height);
  }
  
  get right() {
    return Math.max(this.x, this.x + this.width);
  }
  
  get bottom() {
    return Math.max(this.y, this.y + this.height);
  }
  
  move(x, y) {
    this.location = this.location.add(x, y);
  }
  
  collides(rectangle) {
    if (rectangle.left >= this.right) {
      return false;
    }
    
    if (rectangle.top >= this.bottom) {
      return false;
    }
    
    if (rectangle.right <= this.left) {
      return false;
    }
    
    if (rectangle.bottom <= this.top) {
      return false;
    }
    
    return true;
  }
}