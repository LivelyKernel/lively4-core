"use strict"
"enable aexpr"

/*MD ### Binding MD*/
{
  let x = 0;

  aexpr(() => x);

  x = 1; // <--
}
/*MD ### Function result indirection MD*/
{
  let x = 0;
  
  function foo() {
    return x;
  }

  aexpr(() => foo());
  
  x = 1; // <--
}


/*MD ### Function result indirection 2 MD*/
{
  let x = 0;

  function bar() {
    return x;
  }

  function foo() {
    return bar();
  }

  aexpr(() => foo());
  
  x = 1; // <--
}


/*MD ### Function result indirection 3 MD*/
{
  let x = 0;

  function baz() {
    return x;
  }

  function bar() {
    return baz();
  }

  function foo() {
    return bar();
  }

  aexpr(() => foo());

  x = 1; // <--
}

/*MD ### Circular function calls MD*/
{
  let shouldBeOdd = false;

  function parityHelper(x) {
    if (x === 0) return !shouldBeOdd;
    if (x === 1) return shouldBeOdd;
    return checkParity(x - 1);
  }

  function checkParity(x) {
    return parityHelper(x - 1);
  }

  aexpr(() => checkParity(10));
  
  shouldBeOdd = true; // <--
}

/*MD ### Variables referencing functions (uncalled) MD*/
{
  let x = 0;
  let y = () => x * x;

  aexpr(() => y);
  
  x = 1;
  y = 1; // <--
}

/*MD ### Variables referencing functions (called) MD*/
{
  let x = 0;
  let y = () => x * x;

  aexpr(() => y());
  
  x = 1; // <--
  y = () => x * x * x; // <--
}

/*MD ### Irrelevance to expression result MD*/
{
  let x = 0;
  let y = 0;

  function bar() {
    return y;
  }

  function foo() {
    bar(y);
    return x;
  }

  aexpr(() => foo());
  
  x = 1; // <--
  y = 1;
}


