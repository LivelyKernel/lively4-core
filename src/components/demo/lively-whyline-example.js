let obj = {v: {w: {x: "hurray"}}};
obj.v.w.x = obj ? "cool" : "oh no";
({["val"]: obj.prop} = {val: 1});
var boo, a, b;
([a, b, ...boo] = "abcdef");
({a, mojo: b} = {a: 1, mojo: 3});
 
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

