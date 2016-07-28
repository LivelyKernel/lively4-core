import { num, string, grid } from "lively.lang";
import { cssLengthToPixels } from "./convert-css-length.js";

export class Point {

  static ensure(duck) {
    return duck instanceof Point ?
      duck : new Point(duck.x, duck.y);
  }

  static polar(r, theta) {
    // theta=0 is East on the screen,
    // increases in counter-clockwise direction
    return new Point(r * Math.cos(theta), r * Math.sin(theta));
  }

  static random(scalePt) {
    return new Point(num.randomSmallerInteger(scalePt.x), num.randomSmallerInteger(scalePt.y));
  }

  static fromLiteral(literal) {
    return pt(literal.x, literal.y);
  }

  static fromTuple(tuple) { return pt(tuple[0], tuple[1]); }

  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  get isPoint() { return true }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // accessing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  getX() { return this.x; }
  getY() { return this.y; }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // arithmetic
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  toFixed(val) {
    return new Point(this.x.toFixed(val), this.y.toFixed(val))
  }

  addPt(p) {
    return new Point(this.x + p.x, this.y + p.y);
  }

  addXY(dx, dy) {
    return new Point(this.x + dx, this.y + dy);
  }

  midPt(p) {
    return new Point((this.x + p.x) / 2, (this.y + p.y) / 2);
  }

  subPt(p) {
    return new Point(this.x - p.x, this.y - p.y);
  }

  subXY(dx, dy) {
    return new Point(this.x - dx, this.y - dy);
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // transforming
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  scaleBy(scaleX, scaleYOrUndefined) {
    return new Point(this.x * scaleX, this.y * (scaleYOrUndefined||scaleX));
  }

  scaleByPt(scalePt) {
    return new Point(this.x * scalePt.x, this.y * scalePt.y);
  }

  negated() {
    return new Point(-this.x, -this.y);
  }

  inverted() {
    return new Point(1.0 / this.x, 1.0 / this.y);
  }

  invertedSafely() {
    return new Point(this.x && 1.0 / this.x, this.y && 1.0 / this.y);
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // comparing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  lessPt(p) {
    return this.x < p.x && this.y < p.y;
  }

  leqPt(p) {
    return this.x <= p.x && this.y <= p.y;
  }

  eqPt(p) {
    return this.x == p.x && this.y == p.y;
  }

  equals(p) {
    return this.x == p.x && this.y == p.y;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // instance creation
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  withX(x) { return pt(x, this.y); }

  withY(y) { return pt(this.x, y); }

  copy() { return new Point(this.x, this.y); }

  minPt(p, acc) {
    if (!acc) acc = new Point(0, 0);
    acc.x = Math.min(this.x, p.x);
    acc.y = Math.min(this.y, p.y);
    return acc;
  }

  maxPt(p, acc) {
    if (!acc) acc = new Point(0, 0);
    acc.x = Math.max(this.x, p.x);
    acc.y = Math.max(this.y, p.y);
    return acc;
  }

  random() { return Point.random(this); }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // point functions
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  normalized() {
    var r = this.r();
    return pt(this.x / r, this.y / r);
  }

  fastNormalized() {
    var r = this.fastR();
    return pt(this.x / r, this.y / r);
  }

  dotProduct(p) {
    return this.x * p.x + this.y * p.y
  }

  matrixTransform(mx, acc) {
    // if no accumulator passed, allocate a fresh one
    if (!acc) acc = pt(0, 0);
    acc.x = mx.a * this.x + mx.c * this.y + mx.e;
    acc.y = mx.b * this.x + mx.d * this.y + mx.f;
    return acc;
  }

  matrixTransformDirection(mx, acc) {
    // if no accumulator passed, allocate a fresh one
    if (!acc) acc = pt(0, 0);
    acc.x = mx.a * this.x + mx.c * this.y;
    acc.y = mx.b * this.x + mx.d * this.y;
    return acc;
  }

  griddedBy(grid) {
    return pt(this.x - (this.x % grid.x), this.y - (this.y % grid.y))
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // geometry computation
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  roundTo(quantum) {
    return new Point(num.roundTo(this.x, quantum), num.roundTo(this.y, quantum));
  }

  dist(p) {
    var dx = this.x - p.x,
        dy = this.y - p.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  distSquared(p) {
    var dx = this.x - p.x,
        dy = this.y - p.y;
    return dx * dx + dy * dy;
  }

  nearestPointOnLineBetween(p1, p2) {
    if (p1.x == p2.x) return pt(p1.x, this.y);
    if (p1.y == p2.y) return pt(this.x, p1.y);
    var x1 = p1.x,
        y1 = p1.y,
        x21 = p2.x - x1,
        y21 = p2.y - y1,
        t = (((this.y - y1) / x21) + ((this.x - x1) / y21)) / ((x21 / y21) + (y21 / x21));
    return pt(x1 + (t * x21), y1 + (t * y21));
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // polar coordinates
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  r() {
    // Polar coordinates (theta=0 is East on screen, and increases in CCW
    // direction
    return Math.sqrt(this.x*this.x + this.y*this.y);
  }

  fastR() {
    // actually, r() might be faster...
    var a = this.x * this.x + this.y * this.y;
    var x = 17;
    for (var i = 0; i < 6; i++)
    x = (x + a / x) / 2;
    return x;
  }

  theta() { return Math.atan2(this.y, this.x); }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // converting
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  asRectangle() { return new Rectangle(this.x, this.y, 0, 0); }

  extent(ext) { return new Rectangle(this.x, this.y, ext.x, ext.y); }

  extentAsRectangle() { return new Rectangle(0, 0, this.x, this.y) }

  lineTo(end) { return new Line(this, end); }

  toTuple() { return [this.x, this.y]; }

  toLiteral() { return {x: this.x, y: this.y}; }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // debugging
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  toString() {
    return string.format("pt(%1.f,%1.f)", this.x, this.y);
  }

  inspect() { return JSON.stringify(this); }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // serialization
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  __serialize__() {
    return {__expr__: this.toString(), bindings: {pt: "lively.graphics/geometry-2d.js"}}
  }
}


export class Rectangle {

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // factory methods
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  static fromAny(ptA, ptB) {
    return rect(ptA.minPt(ptB), ptA.maxPt(ptB));
  }

  static fromLiteral(literal) {
    return new Rectangle(literal.x, literal.y, literal.width, literal.height);
  }

  static fromTuple(tuple) {
    return new Rectangle(tuple[0], tuple[1], tuple[2], tuple[3]);
  }

  static unionPts(points) {
    var min = points[0],
        max = points[0];

    // starts from 1 intentionally
    for (var i = 1; i < points.length; i++) {
      min = min.minPt(points[i]);
      max = max.maxPt(points[i]);
    }

    return rect(min, max);
  }

  static ensure(duck) {
    return duck instanceof Rectangle ?
      duck : new Rectangle(duck.x, duck.y, duck.width, duck.height);
  }

  static fromElement(element) {
    // FIXME
    if (Object.isFunction(element.getBoundingClientRect)) {
      var b = element.getBoundingClientRect();
      return rect(b.left, b.top, b.width, b.height);
    } else if (element.namespaceURI == "http://www.w3.org/1999/xhtml") {
      var x = cssLengthToPixels(element.style.left || "0px"),
          y = cssLengthToPixels(element.style.top || "0px"),
          width = cssLengthToPixels(element.style.width || "0px"),
          height = cssLengthToPixels(element.style.hieght || "0px");
      return new Rectangle(x, y, width, height);
    }
    if (element.namespaceURI == "http://www.w3.org/2000/svg") {
      return new Rectangle(element.x.baseVal.value, element.y.baseVal.value,
        element.width.baseVal.value, element.height.baseVal.value);
    }
    throw new Error('Cannot create Rectangle from ' + element);
  }

  static inset(left, top, right, bottom) {
    if (top === undefined) top = left;
    if (right === undefined) right = left;
    if (bottom === undefined) bottom = top;
    return new Rectangle(left, top, right - left, bottom - top);
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  //  initialize
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  get corners() { return ["topLeft","topRight","bottomRight","bottomLeft"]; }
  get sides() { return ["leftCenter","rightCenter","topCenter","bottomCenter"]; }

  constructor(x, y, w, h) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = w || 0;
    this.height = h || 0;
  }

  get isRectangle() { return true }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // accessing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  getX() { return this.x; }
  getY() { return this.y; }
  getWidth() { return this.width; }
  getHeight() { return this.height; }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // instance creation
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  copy() {
    return new Rectangle(this.x, this.y, this.width, this.height);
  }

  toFixed(val) {
    return new Rectangle(this.x.toFixed(val), this.y.toFixed(val), this.width.toFixed(val), this.height.toFixed(val));
  }

  withWidth(w) {
    return new Rectangle(this.x, this.y, w, this.height)
  }

  withHeight(h) {
    return new Rectangle(this.x, this.y, this.width, h)
  }

  withX(x) {
    return new Rectangle(x, this.y, this.width, this.height)
  }

  withY(y) {
    return new Rectangle(this.x, y, this.width, this.height)
  }

  withExtent(ext) {
    return new Rectangle(this.x, this.y, ext.x, ext.y);
  }

  withTopLeft(p) {
    return Rectangle.fromAny(p, this.bottomRight())
  }

  withTopRight(p) {
    return rect(p.addXY(-this.width,0), p.addXY(0, this.height));
  }

  withBottomRight(p) {
    return Rectangle.fromAny(p, this.topLeft())
  }

  withBottomLeft(p) {
    return Rectangle.fromAny(p, this.topRight())
  }

  withLeftCenter(p) {
    return new Rectangle(p.x, this.y, this.width + (this.x - p.x), this.height)
  }

  withRightCenter(p) {
    return new Rectangle(this.x, this.y, p.x - this.x, this.height)
  }

  withTopCenter(p) {
    return new Rectangle(this.x, p.y, this.width, this.height + (this.y - p.y))
  }

  withBottomCenter(p) {
    return new Rectangle(this.x, this.y, this.width, p.y - this.y)
  }

  withCenter(p) {
    return new Rectangle(p.x-this.width/2,p.y-this.height/2,this.width,this.height);
  }

  insetBy(d) {
    return new Rectangle(this.x + d, this.y + d, this.width - (d * 2), this.height - (d * 2));
  }

  insetByPt(p) {
    return new Rectangle(this.x + p.x, this.y + p.y, this.width - (p.x * 2), this.height - (p.y * 2));
  }

  grid(rows, cols) {
    var w = this.width / cols, h = this.height / rows;
    return grid.mapCreate(rows, cols, function(i, j) {
      return new Rectangle(w*j, h*i, w, h); });
  }

  divide(relativeRects) {
    // takes an array of rectangles specifying the relative parts to divide
    // this by. Example:
    // rect(0,0,100,50).divide([rect(0.2,0,0.3,0.5)])
    //   === [rect(20,0,30,25)]
    var orig = this;
    return relativeRects.map(function(relRect) {
      return rect(orig.x + orig.width*relRect.x,
                orig.y + orig.height*relRect.y,
                orig.width*relRect.width,
                orig.height*relRect.height); });
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // converting
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  toTuple() {
    return [this.x, this.y, this.width, this.height];
  }

  lineTo(otherRect) {
    var center1 = this.center(),
      center2 = otherRect.center(),
      lineBetween = center1.lineTo(center2),
      start = this.lineIntersection(lineBetween)[0],
      end = otherRect.lineIntersection(lineBetween)[0];
    return start && end && start.lineTo(end);
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // comparing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  equals(other) {
    if (!other) {
      return false;
    }
    return this.x == other.x && this.y == other.y && this.width == other.width && this.height == other.height;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // debugging
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  inspect() { return JSON.stringify(this); }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // accessing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  topLeft() {
    return new Point(this.x, this.y)
  }

  topRight() {
    return new Point(this.maxX(), this.y)
  }

  bottomRight() {
    return new Point(this.maxX(), this.maxY())
  }

  bottomLeft() {
    return new Point(this.x, this.maxY())
  }

  leftCenter() {
    return new Point(this.x, this.center().y)
  }

  rightCenter() {
    return new Point(this.maxX(), this.center().y)
  }

  topCenter() {
    return new Point(this.center().x, this.y)
  }

  bottomCenter() {
    return new Point(this.center().x, this.maxY())
  }

  extent() {
    return new Point(this.width, this.height);
  }

  center() {
    return new Point(this.x + (this.width / 2), this.y + (this.height / 2))
  }

  topEdge() { return new Line(this.topLeft(), this.topRight()); }

  bottomEdge() { return new Line(this.bottomLeft(), this.bottomRight());  }

  leftEdge() { return new Line(this.topLeft(), this.bottomLeft());  }

  rightEdge() { return new Line(this.topRight(), this.bottomRight());  }

  edges() {
    return [this.topEdge(),
        this.rightEdge(),
        this.bottomEdge(),
        this.leftEdge()];
  }

  allPoints() {
    // take rectangle as discrete grid and return all points in the grid
    // rect(3,4,2,3).allPoints() == [pt(3,4),pt(4,4),pt(3,5),pt(4,5),pt(3,6),pt(4,6)]
    // if you want to convert points to indices use
    // var w = 5, h = 7; rect(3,4,2,3).allPoints().map(function(p) { return p.y * w + p.x; }) == [23,24,28,29,33,34]
    var x = this.x, y = this.y, w = this.width, h = this.height, points = [];
    for (var j = y; j < y+h; j++)
      for (var i = x; i < x+w; i++)
        points.push(pt(i,j));
    return points;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // testing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  isNonEmpty(rect) {
    return this.width > 0 && this.height > 0;
  }

  containsRect(r) {
    return this.x <= r.x && this.y <= r.y && r.maxX() <= this.maxX() && r.maxY() <= this.maxY();
  }

  intersects(r) {
    return this.intersection(r).isNonEmpty();
  }

  containsPoint(p) {
    return this.x <= p.x && p.x <= this.x + this.width && this.y <= p.y && p.y <= this.y + this.height;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // transforming
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  translatedBy(d) {
    return new Rectangle(this.x + d.x, this.y + d.y, this.width, this.height);
  }

  scaleByRect(r) {
    // r is a relative rect, as a pane spec in a window
    return new Rectangle(
    this.x + (r.x * this.width), this.y + (r.y * this.height), r.width * this.width, r.height * this.height);
  }

  scaleRectIn(fullRect) {
    // return a relative rect for this as a part of fullRect
    return new Rectangle((this.x - fullRect.x) / fullRect.width, (this.y - fullRect.y) / fullRect.height, this.width / fullRect.width, this.height / fullRect.height);
  }

  expandBy(delta) {
    return this.insetBy(0 - delta);
  }

  translateForInclusion(other) {
    var x = other.x,
      y = other.y,
      r = x + other.width,
      b = y + other.height;
    if (r > this.right()) x -= r - this.right();
    if (b > this.bottom()) y -= b - this.bottom();
    if (x < this.x) x = this.x;
    if (y < this.y) y = this.y;
    return rect(x,y, other.width, other.height);
  }

  transformRectForInclusion(other) {
    var topLeft = this.topLeft().maxPt(other.topLeft()),
      newBottomRight = topLeft.addPt(other.extent()),
      innerBottomRight = this.bottomRight().minPt(newBottomRight);
    return rect(topLeft, innerBottomRight);
  }

  insetByRect(r) {
    return new Rectangle(this.x + r.left(), this.y + r.top(), this.width -
        (r.left() + r.right()), this.height - (r.top() + r.bottom()));
  }

  outsetByRect(r) {
    return new Rectangle(this.x - r.left(), this.y - r.top(), this.width +
        (r.left() + r.right()), this.height + (r.top() + r.bottom()));
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // relations
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  intersection(rect) {
    var nx = Math.max(this.x, rect.x);
    var ny = Math.max(this.y, rect.y);
    var nw = Math.min(this.x + this.width, rect.x + rect.width) - nx;
    var nh = Math.min(this.y + this.height, rect.y + rect.height) - ny;
    return new Rectangle(nx, ny, nw, nh);
  }

  union(r) {
    return rect(this.topLeft().minPt(r.topLeft()), this.bottomRight().maxPt(r.bottomRight()));
  }

  lineIntersection(line) {
    return this.edges()
      .map(function(edge) { return edge.intersection(line); })
      .filter(ea => !!ea);
  }

  dist(rect) {
    var p1 = this.closestPointToPt(rect.center());
    var p2 = rect.closestPointToPt(p1);
    return p1.dist(p2);
  }

  relativeToAbsPoint(relPt) {
    return new Point(
    this.x + this.width * relPt.x, this.y + this.height * relPt.y)
  }

  closestPointToPt(p) {
    // Assume p lies outside me; return a point on my perimeter
    return pt(Math.min(Math.max(this.x, p.x), this.maxX()), Math.min(Math.max(this.y, p.y), this.maxY()));
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // properties
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  maxX() {
    return this.x + this.width;
  }

  maxY() {
    return this.y + this.height;
  }

  realWidth() {
    return this.x < 0 ? -this.x + this.width : this.width
  }

  realHeight() {
    return this.y < 0 ? -this.y + this.height : this.height
  }

  area() { return this.width * this.height; }

  randomPoint() {
    return Point.random(pt(this.width, this.height)).addPt(this.topLeft());
  }

  constrainPt(pt) {
    return pt.maxPt(this.topLeft()).minPt(this.bottomRight());
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // SVG interface
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // modeled after the CSS box model: http://www.w3.org/TR/REC-CSS2/box.html
  left() {
    return this.x;
  }

  right() {
    return this.maxX();
  }

  top() {
    return this.y;
  }

  bottom() {
    return this.maxY();
  }

  toInsetTuple() {
    return [this.left(), this.top(), this.right(), this.bottom()];
  }

  toAttributeValue(d) {
    var d = 0.01,
      result = [this.left()];
    if (this.top() === this.bottom() && this.left() === this.right()) {
      if (this.top() === this.left()) result.push(this.top());
      } else result = result.concat([this.top(), this.right(), this.bottom()]);
      return result.invoke('roundTo', d || 0.01);
  }

  toLiteral() {
    return {x: this.x, y: this.y, width: this.width, height: this.height};
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // part support
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  partNamed(partName) {
    return this[partName].call(this);
  }

  withPartNamed(partName,newValue) {
    return this[this.setterName(partName)].call(this, newValue);
  }

  setterName(partName) {
    return "with" + partName[0].toUpperCase() + partName.slice(1);
  }

  partNameNear(partNames,p,dist) {
    var partName = this.partNameNearest(partNames,p);
    return (p.dist(this.partNamed(partName)) < dist) ? partName : null;
  }

  partNameNearest(partNames, p) {
    var dist = 1.0e99,
      partName = partNames[0];

    for (var i=0; i<partNames.length; i++) {
      var partName = partNames[i],
        pDist = p.dist(this.partNamed(partName));
      if (pDist < dist) {var nearest = partName; dist = pDist}
    }

    return nearest;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // printing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  toString() {
    return string.format("rect(%s,%s,%s,%s)", this.x, this.y, this.width, this.height);
  }
  
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // serialization
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  __serialize__() {
    return {__expr__: this.toString(), bindings: {rect: "lively.graphics/geometry-2d.js"}}
  }
}


export class Transform {

  get exp() { return 0.0001; /*precision*/ }

  constructor(duck) {
    // matrix is a duck with a,b,c,d,e,f, could be an SVG matrix or a
    // Lively Transform
    // alternatively, its a combination of translation rotation and scale
    if (duck) {
      if (duck instanceof Point) {
        var delta = duck,
          angleInRadians = arguments[1] || 0.0,
          scale = arguments[2];
        if (scale === undefined) { scale = pt(1.0, 1.0); }
        this.a = this.ensureNumber(scale.x * Math.cos(angleInRadians));
        this.b = this.ensureNumber(scale.y * Math.sin(angleInRadians));
        this.c = this.ensureNumber(scale.x * - Math.sin(angleInRadians));
        this.d = this.ensureNumber(scale.y * Math.cos(angleInRadians));
        this.e = this.ensureNumber(delta.x);
        this.f = this.ensureNumber(delta.y);

        // avoid inaccurate translations in Chrome
        if (this.a > 1) this.a = Math.round(this.a*Math.pow(10,2))/Math.pow(10,2);
        if (this.d > 1) this.d = Math.round(this.d*Math.pow(10,2))/Math.pow(10,2);
      } else {
        this.fromMatrix(duck);
      }
    } else {
      this.a = this.d = 1.0;
      this.b = this.c = this.e = this.f = 0.0;
    }
  }

  get isTransform() { return true }

  copy() { return new Transform(this); }

  fromMatrix(mx) {
    this.a = this.ensureNumber(mx.a);
    this.b = this.ensureNumber(mx.b);
    this.c = this.ensureNumber(mx.c);
    this.d = this.ensureNumber(mx.d);
    this.e = this.ensureNumber(mx.e);
    this.f = this.ensureNumber(mx.f);
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // accessing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  getRotation() { // in degrees
    // Note the ambiguity with negative scales is resolved by assuming
    // scale x is positive
    var r = num.toDegrees(Math.atan2(-this.c, this.a));

    // don't bother with values very close to 0
    return Math.abs(r) < this.eps ? 0 : r;
  }

  getScale() {
    // Note the ambiguity with negative scales and rotation is resolved by assuming scale x is positive
    var a = this.a, c = this.c, s = Math.sqrt(a * a + c * c);

    // don't bother with values very close to 1
    return Math.abs(s - 1) < this.eps ? 1 : s;
  }

  getScalePoint() {
    // Note the ambiguity with negative scales and rotation is resolved by
    // assuming scale x is positive
    var a = this.a,
      b = this.b,
      c = this.c,
      d = this.d,
      sx = Math.sqrt(a * a + c * c),
      r =   Math.atan2(-c, a), // radians
      // avoid div by 0
      sy = (Math.abs(b) > Math.abs(d)) ? b / Math.sin(r) : d / Math.cos(r);
    return pt(sx, sy);
  }

  getTranslation() { return pt(this.e, this.f); }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // testing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  isTranslation() {
    // as specified in:
    // http://www.w3.org/TR/SVG11/coords.html#InterfaceSVGTransform
    return (this.a==1 && this.b==0 && this.c==0 && this.d==1)
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // converting
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  toSVGAttributeValue() {
    var delta = this.getTranslation(),
      attr = "translate(" + delta.x + "," + delta.y +")",
      theta = this.getRotation(),
      sp = this.getScalePoint();

    if (theta != 0.0) attr += " rotate(" + this.getRotation()  +")"; // in degrees
    if (sp.x != 1.0 || sp.y != 1.0)   attr += " scale(" + sp.x + "," + sp.y + ")";

    return attr;
  }

  toCSSValue(bounds) {
    var attr = '', delta = this.getTranslation();

    attr += "translate(" + delta.x.toFixed(2) + "px," + delta.y.toFixed(2) +"px)";

    if (bounds) {
      // FIXME this is to fix the rotation...!
      var offsetX = bounds.width / 2;
      var offsetY = bounds.height / 2;
      attr += " translate(" + offsetX.toFixed(2) + "px," + offsetY.toFixed(2) +"px)";
    }

    var theta = this.getRotation();
    if (theta != 0.0) attr += " rotate("
        + this.getRotation().toFixed(2) +"deg)";

    if (bounds) {
      // FIXME this is to fix the rotation...!
      var offsetX = bounds.width / 2;
      var offsetY = bounds.height / 2;
      attr += " translate(" + (offsetX * -1).toFixed(2) + "px," + (offsetY * -1).toFixed(2) +"px)";
    }

    var sp = this.getScalePoint();
    if (sp.x != 1.0 || sp.y != 1.0) {
      attr += " scale(" + sp.x.toFixed(2) + "," + sp.y.toFixed(2) + ")";
    }

    return attr;
  }

  toCSSTransformString() {
    var rot = this.getRotation(), scale = this.getScale();
    return `translate(${this.e}px,${this.f}px) rotate(${rot}deg) scale(${scale},${scale})`;
  }

  toString() { return this.toCSSTransformString(); }

  toMatrix() { return this.copy(); }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // transforming
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  transformPoint(p, acc) { return p.matrixTransform(this, acc); }

  transformDirection(p, acc) {
    return p.matrixTransformDirection(this, acc);
  }

  matrixTransformForMinMax(pt, minPt, maxPt) {
    var x = this.a * pt.x + this.c * pt.y + this.e,
      y = this.b * pt.x + this.d * pt.y + this.f;
    if (x > maxPt.x) maxPt.x = x;
    if (y > maxPt.y) maxPt.y = y;
    if (x < minPt.x) minPt.x = x;
    if (y < minPt.y) minPt.y = y;
  }

  transformRectToRect(r) {
    var minPt = pt(Infinity, Infinity),
      maxPt = pt(-Infinity, -Infinity);
    this.matrixTransformForMinMax(r.topLeft(), minPt, maxPt);
    this.matrixTransformForMinMax(r.bottomRight(), minPt, maxPt);
    if (this.isTranslation()) return rect(minPt, maxPt);

    this.matrixTransformForMinMax(r.topRight(), minPt, maxPt);
    this.matrixTransformForMinMax(r.bottomLeft(), minPt, maxPt);
    return rect(minPt, maxPt);
  }


  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // matrix operations
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  preConcatenate(t) {
    var m = this.matrix_ || this.toMatrix();
    this.a =  t.a * m.a + t.c * m.b;
    this.b =  t.b * m.a + t.d * m.b;
    this.c =  t.a * m.c + t.c * m.d;
    this.d =  t.b * m.c + t.d * m.d;
    this.e =  t.a * m.e + t.c * m.f + t.e;
    this.f =  t.b * m.e + t.d * m.f + t.f;
    this.matrix_ = this.toMatrix();
    return this;
  }

  invert() {
    var m = this.copy();

    var det = m.a * m.d - m.c * m.b,
      invdet = 1/det;

    this.a =  m.d * invdet;
    this.b = -m.b * invdet;
    this.c = -m.c * invdet;
    this.d =  m.a * invdet;
    this.e =  (m.c * m.f - m.e * m.d) * invdet;
    this.f = -(m.a * m.f - m.b * m.e) * invdet;

    return this;
  }

  inverse() {
    var matrix = this.matrix_ || this.toMatrix();
    var result = new this.constructor(matrix);
    result.invert();
    return result;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // helper
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  ensureNumber(value) {
    // note that if a,b,.. f are not numbers, it's usually a
    // problem, which may crash browsers (like Safari) that don't
    // do good typechecking of SVGMatrix properties
    if (isNaN(value)) { throw new Error('not a number');}
    return value;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // serialization
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  __serialize__() {
    return {
      __expr__: `new Transform({a: ${this.a}, b: ${this.b}, c: ${this.c}, d: ${this.d}, e: ${this.e}, f: ${this.f}})`,
      bindings: {Transform: "lively.graphics/geometry-2d.js"}
    }
  }

}

export class Line {

  static fromCoords(startX, startY, endX, endY) {
    return new Line(pt(startX, startY), pt(endX, endY));
  }

  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  get isLine() { return true }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // accessing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  sampleN(n) {
    // return n points that are collinear with this and are between
    // this.start and this.end
    n = n || 10;
    var vector = this.end.subPt(this.start),
      stepPt = vector.scaleBy(1/n),
      result = [];
    for (var i = 0; i <= n; i++) {
      result.push(this.start.addPt(stepPt.scaleBy(i)))
    }
    return result;
  }

  sample(length) {
    return this.sampleN(this.length() / length);
  }

  length() {
    return this.start.dist(this.end);
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // testing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  equals(otherLine) {
    if (!otherLine) return false;
    return this.start.eqPt(otherLine.start) && this.end.eqPt(otherLine.end);
  }

  includesPoint(p, unconstrained) {
    // test whether p is collinear with this.start, this.end
    // constrained: p also needs to be on segment between start, end
    var x1 = this.start.x,
      y1 = this.start.y,
      x2 = this.end.x,
      y2 = this.end.y,
      x3 = p.x,
      y3 = p.y,
      collinear = ((x2 - x1) * (y3 - y1)) - ((x3 - x1) * (y2 - y1)) === 0;
    if (unconstrained || !collinear) return collinear;
    var xMin = Math.min(x1, x2),
        yMin = Math.min(y1, y2),
        xMax = Math.max(x1, x2),
        yMax = Math.max(y1, y2);
    return xMin <= x3 && x3 <= xMax && yMin < y3 && y3 <= yMax;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // intersection
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  intersection(otherLine, unconstrained) {
    // constrained: intersection has to be between start/ends of this and
    // otherLine
    // http://en.wikipedia.org/wiki/Line-line_intersection
    //       .. (x1, y1)
    //         ..              ..... (x4,y4)
    //           ..    ........
    // (x3,y3) .....X..
    //    .....      ..
    //                 ..  (x2, y2)
    var eps = 0.0001,
        start1 = this.start,
        end1 = this.end,
        start2 = otherLine.start,
        end2 = otherLine.end,
        x1 = start1.x,
        y1 = start1.y,
        x2 = end1.x,
        y2 = end1.y,
        x3 = start2.x,
        y3 = start2.y,
        x4 = end2.x,
        y4 = end2.y;

    var x = ((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4)),
        y = ((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));

    // are lines parallel?
    if (x === Infinity || y === Infinity) return null;

    if (!unconstrained) {
      if (!num.between(x, x1, x2, eps)
      ||  !num.between(y, y1, y2, eps)
      ||  !num.between(x, x3, x4, eps)
      ||  !num.between(y, y3, y4, eps)) return null;
    }

    return pt(x,y);
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // debugging
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  toString() {
    return string.format('Line((%s,%s), (%s,%s))',
                this.start.x, this.start.y,
                this.end.x, this.end.y)
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // serialization
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  __serialize__() {
    return {
      __expr__: `Line.fromCoords(${this.start.x}, ${this.start.y}, ${this.end.x}, ${this.end.y})`,
      bindings: {Line: "lively.graphics/geometry-2d.js"}
    }
  }

}

export function rect(arg1, arg2, arg3, arg4) {
  // arg1 and arg2 can be location and corner or
  // arg1/arg2 = location x/y and arg3/arg4 = extent x/y
  var x, y, w, h;
  if (typeof arg1 === 'number') {
    x = arg1, y = arg2, w = arg3, h = arg4
  } else {
    x = arg1.x; y = arg1.y;
    w = arg2.x - x; h = arg2.y - y;
  }
  return new Rectangle(x, y, w, h);
}

export function pt(x, y) { return new Point(x, y); }
