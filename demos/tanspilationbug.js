export class Foo {
  static greet() {
    return "Hi"
  }
}
export function greet() {
  return Foo.greet()
}