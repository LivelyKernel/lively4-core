const obj = { a: 2, b:3 };

locals;

function foo() {
  var locals = 42;
  console.log(locals);
}

function bar() {
  let y;

  console.log(locals);

  function blub() {
    var x;
    return (() => locals)();
  }

  if (obj) {
    let v;
  }
}