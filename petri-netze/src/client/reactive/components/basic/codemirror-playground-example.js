"enable aexpr"

let x = 2;
let y = 2;
let outerObj =  funct();
let a = {func() {return x}};
let b = {func() {return y}};

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

