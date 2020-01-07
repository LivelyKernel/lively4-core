"enable aexpr";

let x = 1;
let v = 1;

function foo(){
  let tmp = 0;

  x;
  return tmp;
}
aexpr(() => {return foo()});
aexpr(() => {return foo()});

x = 2;
v = 1;
x = 5;