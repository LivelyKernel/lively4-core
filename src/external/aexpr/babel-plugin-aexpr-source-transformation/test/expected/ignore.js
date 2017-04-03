/*aexpr ignore*/

let a = { b: 1, fn() {
    return {};
  } };
var c = {};

a.b += 15;
a.nf(c);
a.e = c.d;