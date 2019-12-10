"enable aexpr";

// Alt-A to show hints!

let x = 1;
let y = 2;
y = 42;
x = 3;

{
  let x = 4;
  y = 4;
  aexpr(() => x + y);
  x = 42;
  y = 3;
}

foo();

x = 42;
y = 13;