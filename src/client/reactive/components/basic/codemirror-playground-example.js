"enable aexpr";

let x = 1;
let v = 1;

function foo(){
  return x
}
aexpr(() => foo());
x = 2;