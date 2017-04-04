/*
 * constructor(a, c, b, d, tx, ty)
 * [[a b tx],
 *  [c d ty],
 *  [0 0 1]]
 */
var AffineTransformation = function(a, c, b, d, tx, ty) {
    this.a = a;
    this.c = c;
    this.b = b;
    this.d = d;
    this.tx = tx;
    this.ty = ty;
};

// identity
AffineTransformation.Identity = new AffineTransformation(1, 0, 0, 1, 0, 0);

// copy
AffineTransformation.prototype.copy = function() {
    return new AffineTransformation(this.a, this.c, this.b, this.d, this.tx, this.ty);
};

// set
AffineTransformation.prototype.set = function(mat) {
    this.a = mat.a;
    this.c = mat.c;
    this.b = mat.b;
    this.d = mat.d;
    this.tx = mat.tx;
    this.ty = mat.ty;

    return this;
};

// toString
AffineTransformation.prototype.toString = function() {
    return '[[' + this.a + ', ' + this.b + ', ' + this.tx + '],\n [' +
        this.c + ', ' + this.d + ', ' + this.ty + '],\n [0, 0, 1]]';
};

AffineTransformation.prototype.translate = function(vector2) {
    return this.copy().translateSelf(vector2);
};

AffineTransformation.prototype.translateSelf = function(vector2) {
    this.tx += vector2.x * this.a + vector2.y * this.b;
    this.ty += vector2.x * this.c + vector2.y * this.d;
    return this;
};

AffineTransformation.prototype.rotate = function(angle, center) {
    return this.copy().rotateSelf(angle, center);
};

AffineTransformation.prototype.rotateSelf = function(angle, center) {
    angle *= Math.PI / 180;
    var x = center.x,
        y = center.y,
        cos = Math.cos(angle),
        sin = Math.sin(angle),
        tx = x - x * cos + y * sin,
        ty = y - x * sin - y * cos,
        a = this.a,
        b = this.b,
        c = this.c,
        d = this.d;
    this.a = cos * a + sin * b;
    this.b = -sin * a + cos * b;
    this.c = cos * c + sin * d;
    this.d = -sin * c + cos * d;
    this.tx += tx * a + ty * b;
    this.ty += tx * c + ty * d;
    return this;
};

AffineTransformation.prototype.scale = function(scale, center) {
    return this.copy().scaleSelf(scale, center);
};

AffineTransformation.prototype.scaleSelf = function(scale, center) {
    if (center)
        this.translate(center);
    this.a *= scale.x;
    this.c *= scale.x;
    this.b *= scale.y;
    this.d *= scale.y;
    if (center)
        this.translate(center.negative());
    return this;
};

// shear
AffineTransformation.prototype.shearSelf = function(shear, center) {
    if (center)
        this.translate(center);
    var a = this.a,
        c = this.c;
    this.a += shear.y * this.b;
    this.c += shear.y * this.d;
    this.b += shear.x * a;
    this.d += shear.x * c;
    if (center)
        this.translate(center.negative());
    return this;
};

// skew
AffineTransformation.prototype.skewSelf = function(skew, center) {
    var toRadians = Math.PI / 180,
        shear = new Vector2(Math.tan(skew.x * toRadians),
            Math.tan(skew.y * toRadians));
    return this.shearSelf(shear, center);
};

// concatenate
// this = this * mx
AffineTransformation.prototype.concatenateSelf = function(mx) {
    var a = this.a,
        b = this.b,
        c = this.c,
        d = this.d;
    this.a = mx.a * a + mx.c * b;
    this.b = mx.b * a + mx.d * b;
    this.c = mx.a * c + mx.c * d;
    this.d = mx.b * c + mx.d * d;
    this.tx += mx.tx * a + mx.ty * b;
    this.ty += mx.tx * c + mx.ty * d;
    return this;
};

// preConcatenate
// this = mx * this
AffineTransformation.prototype.preConcatenateSelf = function(mx) {
    var a = this.a,
        b = this.b,
        c = this.c,
        d = this.d,
        tx = this.tx,
        ty = this.ty;
    this.a = mx.a * a + mx.b * c;
    this.b = mx.a * b + mx.b * d;
    this.c = mx.c * a + mx.d * c;
    this.d = mx.c * b + mx.d * d;
    this.tx = mx.a * tx + mx.b * ty + mx.tx;
    this.ty = mx.c * tx + mx.d * ty + mx.ty;
    return this;
};

// isIdentity
AffineTransformation.prototype.isIdentity = function() {
    return this.a === 1 && this.c === 0 && this.b === 0 && this.d === 1
            && this.tx === 0 && this.ty === 0;
};

//transform(pt)
AffineTransformation.prototype.transform = function(vector) {
    var x = vector.x,
        y = vector.y;
    return new Vector2(
        x * this.a + y * this.b + this.tx,
        x * this.c + y * this.d + this.ty
    );
};

// TODO: move to num.utils?
var abs = Math.abs,
    EPSILON = 10e-12;
function isZero(val) {
    return abs(val) <= EPSILON;
};

// _getDeterminant
AffineTransformation.prototype._getDeterminant = function() {
    var det = this.a * this.d - this.b * this.c;
    return isFinite(det) && !isZero(det)
            && isFinite(this.tx) && isFinite(this.ty)
            ? det : null;
},

// inverted, getInverted -> invert
AffineTransformation.prototype.inverted = function() {
    var det = this._getDeterminant();
    if(!det) {
        throw "try to invert a singular matrix";
    }
    return det && new AffineTransformation(
        this.d / det,
        -this.c / det,
        -this.b / det,
        this.a / det,
        (this.b * this.ty - this.d * this.tx) / det,
        (this.c * this.tx - this.a * this.ty) / det);
},

// shiftless()=make tx and ty to 0
AffineTransformation.prototype.shiftless = function() {
    return new AffineTransformation(this.a, this.c, this.b, this.d, 0, 0);
},

// applyToContext
AffineTransformation.prototype.applyToContext = function(ctx) {
    ctx.transform(this.a, this.c, this.b, this.d, this.tx, this.ty);
};
