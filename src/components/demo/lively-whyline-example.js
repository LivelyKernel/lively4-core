let u = {v: {w: {x: "hurray"}}};
u.v.w.x;
var a = 3;
var b = a + 4

function foo(a,b) {
  let c = a + b;
  for (var i = 0; i < 10; i++) {
    if (c < 1000) {
      c += c + i * c
    } else {
      c = c - 1000
      return c
    }
  }
  return c
}

foo(a, b)
let d = a + b