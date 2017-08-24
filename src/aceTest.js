function foo() {
  lively.notify(this.bar);
}

let obj = {
  bar: 42
}
lively.notify("foo")
obj::foo()
