

function funcA() {
    var x;
    function funcB() {
        var y;
        function funcC() {
            var z;
            function funcD() {
                y = x;
                function funcE() {
                    x = z;
                }
            }
        }
    }
}

/*aexpr ignre*/
var x = 5, z = 42;

glob3 = glob = 'foo';
(glob = 42).toString();
x = glob + 4;
glob2 = x + 3;
z = x;
z = xGlobal;
func(glob);

var Rectangle2 = class {
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
var a = {b:1, fn() { return {}; }}
var c = {}
var y;
a.b += 15;
a.b = 15;
a.d **= i;

a.e = c.d;
a.b.c
y = z

// nested left side of assignment
a.b.c = y.z

// Mixin everything together
a.fn()[c.d] = 1


function xyz() {
    return x.y.z;
}

var foo = {
    bar: 42,
    onChange() {}
}
var r1 = new Rectangle2(0, 0, 10, 20),
    r2 = new Rectangle2(5, 10, 20, 30);

var axerp = function(...args) {
    args[0]();
    return args[1];
}
axerp(() => r1["area"](), foo)["onChange"](() => console["log"]('changed'));

var arr = [1,2,3];
arr[2]
console.log( foo == 2)
aexpr().onChange();

(function() {
    function aexpr() {}
    aexpr();
})();

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

 00> we did this by doing explicit checks on CallExpressions (with the callee being a MemberExpression)
 */
