"enable aexpr";

  let x = 0;
  let y = () => x * x;

  aexpr(() => y());
  
  x = 1; // <--
  y = () => x * x * x; // <--