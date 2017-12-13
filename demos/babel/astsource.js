"enable aexpr";

const obj = {
  x: 3,
  fn() {
    return this.x;
  }
},func = "fn";

const cl = console.log;
(cl(1), (cl(2), obj).x = (cl(3), obj).x + (cl(4), obj).x);