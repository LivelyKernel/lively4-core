

import {foo, x} from "./cycldep1.js"


export function bar() {
  return foo() + 1
}

export function barrr() {
  return bar()
}