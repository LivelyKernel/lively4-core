"use strict"
"enable aexpr"

/*MD ## Bindings MD*/
/*MD ### Immediate MD*/
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

/*MD ### Variables referencing functions (called) 1 MD*/
{
  let x = 0;
  let y = () => x * x;

  aexpr(() => y());
  
  x = 1; // <--
  y = () => x * x * x; // <--
}

/*MD ### Variables referencing functions (called) 2 MD*/
{
  let x = 0;
  let y = function foo() {return x}

  aexpr(() => y());
  
  x = 1; // <--
  y = () => x * x * x; // <--
}

/*MD ### Unclear function resolution MD*/
{
  let x = 0;
  let y = 0;
  let foo = Math.random() > 0.5
    ? function() { return x }
    : function() { return y };
  
  aexpr(() => foo());
  
  x = 1; // <--
  y = 1; // <--
}

/*MD ## Members MD*/
/*MD ### Immediate MD*/
{
  let obj = { x: 0 };

  aexpr(() => obj.x);

  obj.x = 1; // <--
}

/*MD ### Function result indirection MD*/
{
  let obj = { x: 0 };

  function foo() {
    return obj.x;
  }

  aexpr(() => foo());

  obj.x = 1; // <--
}

/*MD ### Function result indirection 2 MD*/
{
  let obj = { x: 0 };

  function bar() {
    return obj.x;
  }

  function foo() {
    return bar();
  }

  aexpr(() => foo());
  
  obj.x = 1; // <--
}


/*MD ### Function result indirection 3 MD*/
{
  let obj = { x: 0 };

  function baz() {
    return obj.x;
  }

  function bar() {
    return baz();
  }

  function foo() {
    return bar();
  }

  aexpr(() => foo());

  obj.x = 1; // <--
}

/*MD ### Circular function calls MD*/
{
  let obj = { shouldBeOdd: false };

  function parityHelper(x) {
    if (x === 0) return !obj.shouldBeOdd;
    if (x === 1) return obj.shouldBeOdd;
    return checkParity(x - 1);
  }

  function checkParity(x) {
    return parityHelper(x - 1);
  }

  aexpr(() => checkParity(10));
  
  obj.shouldBeOdd = true; // <--
}

/*MD ### Members referencing functions (uncalled) MD*/
{
  let x = 0;
  let obj = {
    y: () => x * x,
  }

  aexpr(() => obj.y);
  
  x = 1;
  obj.y = 1; // <--
}

/*MD ### Variables referencing functions (called) MD*/
{
  let x = 0;
  let obj = {
    y: () => x * x,
  }

  aexpr(() => obj.y());
  
  x = 1; // <--
  obj.y = () => x * x * x; // <--
}

/*MD ### Unclear function resolution MD*/
{
  let obj = {
    x: 0,
    y: 0,
  }
  
  let foo = Math.random() > 0.5
    ? function() { return obj.x }
    : function() { return obj.y };
  
  aexpr(() => foo());
  
  obj.x = 1; // <--
  obj.y = 1; // <--
}

/*MD ### Unclear object resolution MD*/
{
  let obj1 = { x: 0 };
  let obj2 = { x: 0 };
  let obj = Math.random() > 0.5 ? obj1 : obj2;
  
  aexpr(() => obj.x);

  obj1.x = 1; // <--
  obj2.x = 1; // <--
}

/*MD ### Redefined objects MD*/
{
  let obj = { x: 0 };
  
  aexpr(() => obj.x);

  obj = { x: 0 }; // <--
  obj.x = 1; // <--
}

/*MD ## Classes MD*/


/*MD ## Misc MD*/
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


