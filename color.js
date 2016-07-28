import { num } from "lively.lang";
import { parse } from "./color-parser.js";

function floor(x) { return Math.floor(x*255.99) };

const rgbaRegex = new RegExp('\\s*rgba?\\s*\\(\\s*(\\d+)(%?)\\s*,\\s*(\\d+)(%?)\\s*,\\s*(\\d+)(%?)\\s*(?:,\\s*([0-9\\.]+)\\s*)?\\)\\s*');

export class Color {

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // class side
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  static random(min, max) {
    if (min === undefined) min = 0;
    if (max === undefined) max = 255;
    return Color.rgb(
      num.random(min, max),
      num.random(min, max),
      num.random(min, max));
  }

  static hsb(hue,sat,brt) {
    var s = sat,
      b = brt;
    // zero saturation yields gray with the given brightness
    if (sat == 0) return new Color(b,b,b);
    var h = hue % 360,
      h60 = h / 60,
      i = Math.floor(h60), // integer part of hue
      f = h60 - i, // fractional part of hue
      p = (1.0 - s) * b,
      q = (1.0 - (s * f)) * b,
      t = (1.0 - (s * (1.0 - f))) * b;

    switch (i) {
      case 0:  return new Color(b,t,p);
      case 1:  return new Color(q,b,p);
      case 2:  return new Color(p,b,t);
      case 3:  return new Color(p,q,b);
      case 4:  return new Color(t,p,b);
      case 5:  return new Color(b,p,q);
      default: return new Color(0,0,0);
    }
  }

  static wheel(n = 10) { return Color.wheelHsb(n,0.0,0.9,0.7); }

  static wheelHsb(n,hue,sat,brt) {
    // Return an array of n colors of varying hue
    var a = new Array(n),
      step = 360.0 / (Math.max(n,1));
    for (var i = 0; i < n; i++) {
      a[i] = Color.hsb(hue + i*step, sat, brt);
    }
    return a;
  }

  static rgb(r, g, b) { return new Color(r/255, g/255, b/255); }

  static rgbHex(colorHexString) {
    var colorData = this.parseHex(colorHexString);
    if (colorData && colorData[0] >= 0 && colorData[1] >= 0 && colorData[2] >= 0) {
      return new Color(colorData[0], colorData[1], colorData[2]);
    } else {
      return null;
    }
  }

  static rgba(r, g, b, a) {
    return new Color(r/255, g/255, b/255, a);
  }

  static fromLiteral(spec) {
    return new Color(spec.r, spec.g, spec.b, spec.a);
  }

  static fromTuple(tuple) {
    return new Color(tuple[0], tuple[1], tuple[2], tuple[3]);
  }

  static fromTuple8Bit(tuple) {
    return new Color(tuple[0]/255, tuple[1]/255, tuple[2]/255, tuple[3]/255);
  }

  static fromString(str) {
    if (!str || str === 'none') {
      return null;
    } else {
      return parse(str);
    }
  }

  static get rgbaRegex() { return rgbaRegex }

  static parse(str) {
    var color;
    if (!str || str === 'none') {
      return null;
    } else {
      color = parse(str);
      return [color.red(),color.green(),color.blue(),color.alpha()];
    }
  }

  static parseRGB(str) {
    // match string of the form rgb([r],[g],[b]) or rgb([r%],[g%],[b%]),
    // allowing whitespace between all components
    var match = str.match(this.rgbaRegex);
    if (match) {
      var r = parseInt(match[1]) / (match[2] ? 100 : 255);
      var g = parseInt(match[3]) / (match[4] ? 100 : 255);
      var b = parseInt(match[5]) / (match[6] ? 100 : 255);
      var a = match[7] ? parseFloat(match[7]) : 1.0;
      return [r, g, b, a];
    }
    return null;
  }

  static parseHex(colStr) {
    var rHex, gHex, bHex, str = '';
    for (var i = 0; i < colStr.length; i++) {
      var c = colStr[i].toLowerCase();
      if (c=='a' ||c=='b' ||c=='c' ||c=='d' ||c=='e' ||c=='f' ||c=='0' ||c=='1' ||
        c=='2' ||c=='3' ||c=='4' ||c=='5' ||c=='6' ||c=='7' ||c=='8' ||c=='9') {
        str += c;
      }
    }
    if (str.length == 6) {
      rHex = str.substring(0,2);
      gHex = str.substring(2,4);
      bHex = str.substring(4,6);
    } else if (str.length == 3) {
      // short form like #C00
      rHex = str.substring(0,1);
      rHex += rHex;
      gHex = str.substring(1,2);
      gHex += gHex;
      bHex = str.substring(2,3);
      bHex += bHex;
    }  else {
      return null
    }
    var r = parseInt(rHex, 16)/255,
      g = parseInt(gHex, 16)/255,
      b = parseInt(bHex, 16)/255;
    return [r, g, b];
  }

  static get black()         { return black         }
  static get almostBlack()   { return almostBlack   }
  static get white()         { return white         }
  static get gray()          { return gray          }
  static get red()           { return red           }
  static get green()         { return green         }
  static get yellow()        { return yellow        }
  static get blue()          { return blue          }
  static get purple()        { return purple        }
  static get magenta()       { return magenta       }
  static get pink()          { return pink          }
  static get turquoise()     { return turquoise     }
  static get tangerine()     { return tangerine     }
  static get orange()        { return orange        }
  static get cyan()          { return cyan          }
  static get brown()         { return brown         }
  static get limeGreen()     { return limeGreen     }
  static get darkGray()      { return darkGray      }
  static get lightGray()     { return lightGray     }
  static get veryLightGray() { return veryLightGray }


  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // instance side
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  get isColor() { return true }

  constructor(r, g, b, a) {
    this.r = r || 0;
    this.g = g || 0;
    this.b = b || 0;
    this.a = a || (a === 0 ? 0 : 1);
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // accessing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  grayValue() {
    return (this.r + this.g + this.b) / 3;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // comparing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  equals(other) {
    if (!other) return false;
    return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // transforming
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  darker(recursion) {
    var result = this.mixedWith(Color.black, 0.5);
    return recursion > 1  ? result.darker(recursion - 1) : result;
  }

  lighter(recursion) {
    if (recursion == 0)
      return this;
    var result = this.mixedWith(Color.white, 0.5);
    return recursion > 1 ? result.lighter(recursion - 1) : result;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // printing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  toString() {
    return this.a === 1 ?
      "rgb(" + floor(this.r) + "," + floor(this.g) + "," + floor(this.b) + ")" :
      this.toRGBAString();
  }

  toRGBAString() {
    function floor(x) { return Math.floor(x*255.99) };
    return "rgba(" + floor(this.r) + "," + floor(this.g) + "," + floor(this.b) + "," + this.a + ")";
  }

  toHexString() {
    function floor(x) { return Math.floor(x*255.99) };
    function addLeadingZero(string){
      var s = string;
      while (s.length < 2) {
        s = '0' + s;
      }
      return s;
    }
    return addLeadingZero(floor(this.r).toString(16)) +
        addLeadingZero(floor(this.g).toString(16)) +
        addLeadingZero(floor(this.b).toString(16));
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // converting
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  toTuple() {
    return [this.r, this.g, this.b, this.a];
  }
  toTuple8Bit() {
    return [this.r*255, this.g*255, this.b*255, this.a*255];
  }
  toHSB() {
    var max = Math.max(this.r, this.g, this.b),
      min = Math.min(this.r, this.g, this.b),
      h, s, b = max;
    if (max == min) {
      h = 0;
    } else if (max == this.r) {
      h = 60 * (0 + ((this.g - this.b) / (max - min)));
    } else if (max == this.g) {
      h = 60 * (2 + ((this.b - this.r) / (max - min)));
    } else if (max == this.b) {
      h = 60 * (4 + ((this.r - this.g) / (max - min)));
      h = (h + 360) % 360;
    }
    s = max == 0 ? 0 : (max - min) / max;
    return [h, s, b];
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // instance creation
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  withA(a) {
    return new Color(this.r, this.g, this.b, a);
  }

  mixedWith(other, proportion) {
    // Mix with another color -- 1.0 is all this, 0.0 is all other
    var p = proportion,
      q = 1.0 - p;
    return new Color(this.r*p + other.r*q, this.g*p + other.g*q, this.b*p + other.b*q, this.a*p + other.a*q);
  }

  // FIXME: invert sounds like mutation, versus createInverse or similar
  invert() {
    return Color.rgb(255 * (1 - this.r), 255 * (1 - this.g), 255 * (1 - this.b));
  }


  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // serialization
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  __serialize__() {
    return {
      __expr__: "Color." + this.toString(),
      bindings: {Color: "lively.graphics/color.js"}
    }
  }

}

// well-known colors
export const black         = new Color(0,0,0),
             almostBlack   = Color.rgb(64, 64, 64),
             white         = new Color(1,1,1),
             gray          = new Color(0.8,0.8,0.8),
             red           = new Color(0.8,0,0),
             green         = new Color(0,0.8,0),
             yellow        = new Color(0.8,0.8,0),
             blue          = new Color(0,0,0.8),
             purple        = new Color(1,0,1),
             magenta       = new Color(1,0,1),
             pink          = Color.rgb(255,30,153),
             turquoise     = Color.rgb(0,240,255),
             tangerine     = Color.rgb(242,133,0),
             orange        = Color.rgb(255,153,0),
             cyan          = Color.rgb(0,255,255),
             brown         = Color.rgb(182,67,0),
             limeGreen     = Color.rgb(51,255,0),
             darkGray      = Color.rgb(102,102,102),
             lightGray     = Color.rgb(230,230,230),
             veryLightGray = Color.rgb(243,243,243);
