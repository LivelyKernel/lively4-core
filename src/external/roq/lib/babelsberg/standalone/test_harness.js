window.GlobalErrors = [];
window.runcount = 0;

Array.prototype.equals = (function (otherArray) {
    var array = this;
    // Returns true iff each element in `array` is equal (`==`) to its
    // corresponding element in `otherArray`
    var len = array.length;
    if (!otherArray || len !== otherArray.length) return false;
    for (var i = 0; i < len; i++) {
      if (array[i] && otherArray[i] && array[i].equals && otherArray[i].equals) {
        if (!array[i].equals(otherArray[i])) {
          return false;
        } else {
          continue;
        }
      }
      if (array[i] != otherArray[i]) return false;
    }
    return true;
});

Object.subclass("TestCase", {
    assert: function (bool, msg) {
        if (!bool) {
            throw new Error("Assertion failed " + msg);
        }
    },
    assertEquals: function (left, right, msg) {
        if (!left == right) {
            throw new Error("Expected " + left + " and " + right + " to be equal. " + msg);
        }
    },
    assertEqualsEpsilon: function(a, b, msg) {
        var eps = 0.01;
        if (Math.abs(a-b) <= eps) return;
        if (a == b) return;
        this.assert(false, (msg ? msg : '') + ' (' + a +' != ' + b +')');
    },
    runAll: function () {
        for (var l in this) {
            if (l.match(/^test/)) {
                var p = this[l];
                if (typeof(p) == "function") {
                    try {
                        console.log(l);
                        window.runcount += 1;
                        this.setUp && this.setUp();
                        p.apply(this);
                        this.tearDown && this.tearDown();
                    } catch (e) {
                      window.GlobalErrors.push(e.stack);
                        console.error(e);
                    }
                }
            }
        }
    }
});

lively.Point = function(x, y) {
                this.x = x || 0;
                this.y = y || 0;
                return this;
};
lively.Point.prototype = {
    addPt: function(p) {
        return new lively.Point(this.x + p.x, this.y + p.y);
    },
    subPt: function(p) {
        return new lively.Point(this.x - p.x, this.y - p.y);
    },
    equals: function(p) {
        return this.eqPt(p);
    },
    eqPt: function(p) {
        return this.x == p.x && this.y == p.y;
    },
    leqPt: function(p) {
        return this.x <= p.x && this.y <= p.y;
    },
    scaleBy: function(scaleX, scaleYOrUndefined) {
        return new lively.Point(this.x * scaleX, this.y * (scaleYOrUndefined||scaleX));
    },
    toString: function() {
        return "Point<" + this.x + ", " + this.y + ">";
    },
    copy: function() {
        return new lively.Point(this.x, this.y);
    }
};

Object.subclass("lively.morphic.Slider", {
    initialize: function(/* ignored */) {
        this.val = 0;
    },
    getValue: function() {
        return this.val;
    },
    setValue: function(val) {
        return this.val = val;
    }
});

Object.subclass("lively.morphic.Text", {
    initialize: function(ignored, string) {
                this.textString = string || "";
    },
    getTextString: function() {
        return this.textString;
    },
    setTextString: function(string) {
        return this.textString = string;
    }
});

lively.pt = window.pt = (function (x, y) {
    return new lively.Point(x,y);
});

window.rect = (function() {});

Object.subclass("Color", {
    initialize: function(r, g, b, a) {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.a = a || (a === 0 ? 0 : 1);
    },
    equals: function(other) {
        if (!other) return false;
        return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
    }
});

Object.extend(Color, {
        rgb: function(r, g, b) {
            return new Color(r/255, g/255, b/255);
        }
});

Object.subclass("lively.morphic.Morph", {
        initialize: function(x, y /* ... ignored */) {
                this.position = pt(x, y);
        },
        setPosition: function(pos) {
                return this.position = pos;
        },
        getPosition: function() {
                return this.position;
        }
});
Object.extend(lively.morphic.Morph, {
        makeRectangle: function(x, y /* ... ignored */) {
                return new lively.morphic.Morph(x, y);
        },
        makeCircle: function(point /* ... ignored */) {
                return new lively.morphic.Morph(point.x, point.y);
        }
});

(function() {
        var temp = window.alert;
        window.alert = function() {
                console.log.apply(console, arguments);
        };
        window.alert.original = temp;
})();

(function(global) {
        global.assert = global.assert || function assert(bool) {
            if(!bool) {
                throw "assertion failed";
            }
        };
})(this);

Object.subclass('lively.ide.BrowserPanel', {
    addMorph: function() {}
});

Object.subclass('lively.morphic.CodeEditor', {
    initialize: function(unused, src) {
        this.textString = src;
        this.owner = new lively.ide.BrowserPanel();
    },
    doSave: function() {
    }
});
