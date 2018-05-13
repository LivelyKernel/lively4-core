
export default class Point {
  constructor(x, y) {
    this._x = x;
    this._y = y;
  }
  
  get x() {
    return this._x;
  }
  
  get y() {
    return this._y;
  }
  
  add(x, y) {
    if (y == null) {
      // x is a point
      return this.add(x.x, x.y);
    }
    
    return new Point(this.x + x, this.y + y);
  }
  
  subtract(x, y) {
    console.log("x = " + x);
    console.log("y = " + y);
    if (y == null) {
      // x is a point
      return this.subtract(x.x, x.y);
    }
    
    return this.add(-x, -y);
  }
}