"enable aexpr";

let x = 1;
let v = 1;

function foo(){
  let tmp = 0;
  v;
  x;
  return tmp;
}
aexpr(() => {return foo()});
aexpr(()=> v);

x=5;

v = 1;
x = 5;