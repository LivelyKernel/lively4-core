let u = {v: {w: {x: "hurray"}}};
u.v.w.x// = "oh no";
//var a = 3;
//var b = a + 2;
var boo;
var {a, mojo: b} = {a: 1, mojo: 3};
let [j, k, ...l] = "abcdef";
//let obj = {};
//({["val"]: obj.prop} = {val: 1});

if (a < 0) {
  a--
} else if (a == 0) {
  a *= a;
} else {
  a++
}

function foo(a,b) {
  let c = a + b;
  for (var i = 0; i < 2; i++) {
    if (c < 1000) {
      c += c + i * c
    } else {
      c = c - 1000
      return c
    }
  }
  return;
}

foo(a, b)
let d = a + b