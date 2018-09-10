'enable aexpr';

class Rect {
  constructor(width=0, height=0) {
    this.width = width;
    this.height = height;
  }

  get aspectRatio() {
    return this.width / this.height;
  }

  set dimensions(value) {
    this.width = value.width;
    this.height = value.height;
  }

  get dimensions() {
    return {'width': this.width, 'height': this.height};
  }
}

let myRect = new Rect(16, 9);
aexpr(() => {return myRect.aspectRatio;}).onChange(v => lively.notify(v));
myRect.width = 1600;
myRect.height = 900;
myRect.dimensions = {'width': 160, 'height': 90};
