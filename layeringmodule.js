import { layer, proceed, withLayers } from "../ContextJS-experimental/contextjs.js"
import { MyClass } from "./mymodule.js"

export function stuff() {
  return new MyClass()
}

export const L1 = layer('coptest-L1');
L1.refineClass(MyClass, {
  f() { return proceed() + 1 }
})

export function getL1() { return L1 }