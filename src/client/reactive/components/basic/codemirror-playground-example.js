"enable aexpr";

// Alt-A to show hints!

let x = 0;
let y = 42;
let xbar;
{
  let x = 6;
}
x = 76;
{
  let a = 4;
let ae = aexpr(() => x+y);
  
}
ae.onChange(lively.notify);


let ae2 = aexpr(() => x+y+y), ae3 = aexpr(() => x+y);

dsadw
foo + bar
that.prepend(<span>dkljwldjw</span>)