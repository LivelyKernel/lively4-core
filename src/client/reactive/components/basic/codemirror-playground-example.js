"enable aexpr"
function lol() {
  let x = 2;
  let y = 2;
  let a = {func() {return x}};
  let b = {func() {return y}};
  let outerObj = [funct()][0];

  function funct(){
    return a;
  }

  aexpr(()=> outerObj.func());

  x = 3; // <--
  a = {func: ()=> x + 1}; // <--
  a.func = ()=>x + 2; // <--
  outerObj = b; //<--
  y = 3; // <--

  // BOOOOOOOOOM
}
lol()


