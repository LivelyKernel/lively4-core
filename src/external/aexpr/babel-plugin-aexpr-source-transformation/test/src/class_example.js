class Rectangle {
  constructor(x, y, width, height) {
    this["x"] = x;
    this["y"] = y;
    this["width"] = width;
    this["height"] = height;
  }

  area() {
    return this["width"] * this["height"];
  }
}