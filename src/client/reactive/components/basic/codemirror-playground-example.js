"enable aexpr";

let x = 1;
let v = 1;

function foo(){
  return x
}
aexpr(() => {return foo()});
x = 2;