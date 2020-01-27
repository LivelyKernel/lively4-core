function foo() {
  const x = () => {
    {
      x;
    }
  };
}

const x = 3 + 4;

{
  const x = 42;
  foo(x)
}

