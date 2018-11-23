a++;

arr[1+2] += 5;

// Join Point Get/Set Local
var zxytf = 24;
zxytf += 2 + 1;
zxytf;

// Join Point Get/Set Global
globIdf = 1 + 2;
globIdf += 1 + 2;
// test: expect(globIdf = 3).to.equal(3);
globIdf;

// Join Point Call
func()
func(a, {b,c}, ...a, ...b);

// Join Point Call Member
func.call(a)
func[abc](3)

// Join Point Function Execution
function func17() {}
var func18 = function() {};
let func19 = (a=3) => {};

() => 42;
var xyzwv = {
  foo(a, b) {
    this
  arguments // TODO: this non-ArrowFunction is rewritten as arrow function, thus, the arguments reference does not work
  },
  bar: () => {
    //this // TODO: simply moving an arrow function with an existing `this` reference rewrites it!
  }
}
class classFunc {
  static foo() {}
  bar(s, a:Object=42, {c=42, d}, ...others) {
    let b = a + 2;
    
    return b;
  }
}

// Join Point New Operator
new Object(1,2); // TODO: why is Object (the local reference) not rewritten?
new Object2(1,2);

// others
/*
describe('Signal Logic', function() {

    it('one simple dataflow', () => {
        let a = 0;
        let s = aexpr(() => a)
        	.onChange(aa => s = aa)
            .onChange(function(aa) {s = aa})
            .getCurrentValue();

        expect(s).to.equal(0);

        a = 42;

        expect(s).to.equal(42);
        expect(s).to.equal(a);
    });
});
*/
imALabel: {}

function funcA() {
  var x;
  function funcB() {
    var y;
    function funcC() {
      if(42) {
      let z;
      function funcD() {
        y = x;
        function funcE() {
          x = z;
          x = z;
        }
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

class CLS {}
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
class supReactangle {
constructor() {
  super.area()
  super.area
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

/*var axerp = function(...args) {
    args[0]();
    return args[1];
}*/
//axerp(() => r1["area"](), foo)["onChange"](() => console["log"]('changed'));
//axerp(() => 1, foo);

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