"use strict"
"enable aexpr"

/*MD ### Binding MD*/
var x = 0; // <--

aexpr(() => x);

/*MD ### Function result indirection MD*/
var x = 0; // <--
function foo() {
  return x;
}

aexpr(() => foo());


/*MD ### Function result indirection 2 MD*/
var x = 0; // <--

function bar() {
  return x;
}

function foo() {
  return bar();
}

aexpr(() => foo());


/*MD ### Function result indirection 3 MD*/
var x = 0; // <--

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


/*MD ### Function result indirection 4 MD*/
var shouldBeOdd = false; // <--

function parityHelper(x) {
  if (x === 0) return !shouldBeOdd;
  if (x === 1) return shouldBeOdd;
  return checkParity(x - 1);
}

function checkParity(x) {
  return parityHelper(x - 1);
}
shouldBeOdd = true

aexpr(() => checkParity(10));


/*MD ### Unreturned function result MD*/
var x = 0; // <--
var y = 0;

function bar() {
  return y;
}

function foo() {
  bar(y);
  return x;
}

aexpr(() => foo());


/*MD ### Variable reference MD*/
var x = function(x) { return x * x }; // <--

aexpr(() => x);

/*MD Call MD*/
var x = function(x) { return x * x };

aexpr(() => x());