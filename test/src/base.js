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
a.b = c.d
c(c, "bar")
let r1 = new Rectangle(0, 0, 10, 20),
    r2 = new Rectangle(5, 10, 20, 30);

aexpr(() => r1["area"](), locals)["onChange"](() => console["log"]('changed'));

var arr = [1,2,3];
arr[2]

/*
 // currently not supported is the following scenario
 var obj = {
 x: 42,
 fn: function() {
 return this.x
 }
 }
 function getter(o,p) { return o[p]; }

 // when we have a CallExpression as parent of the MemberExpression, the this reference is bound implicitly
 obj.fn() // 42
 // also working fine
 obj["fn"]() // 42
 // however, with the current implementation we loose the this reference when wrapping just the inner MemberExpression
 getter(obj, "fn")() // undefined
 */
