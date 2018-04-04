const obj = { a: 2, b: 3 };

({
  obj,
  foo,
  bar
});

function foo() {
  var locals = 42;
  console.log(locals);
}

function bar() {
  let y;

  console.log({
    blub,
    y,
    obj,
    foo,
    bar
  });

  function blub() {
    var x;
    return (() => ({
      x,
      blub,
      y,
      obj,
      foo,
      bar
    }))();
  }

  if (obj) {
    let v;
  }
}