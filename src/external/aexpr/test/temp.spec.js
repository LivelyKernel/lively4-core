const obj = {
  a: 42,
  fn() {
    return this.a;
  }
}

aexpr(()=>obj.fn()).onChange(val => lively.notify(val))
obj.a = 17;
lively.notify("FOO");