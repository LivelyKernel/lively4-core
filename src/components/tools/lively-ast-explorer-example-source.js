// l: foo;
// () => foo.bar + foo.baz;

class X {
  method() {
    // var foo = 42;
    // () => {
    //   foo;
    // }
    // if (false) foo.bar
    // while (false) foo
    // for (let x of [1,2]) foo.bar;
    (baz) => foo.bar + 42 + baz
  }
}
