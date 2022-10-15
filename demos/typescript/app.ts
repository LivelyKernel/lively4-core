import { foo } from './foo.ts'
import { bar } from './bar.js'

var a: boolean[] = [true];
var x: number = foo.bar
a[0] = x
a.push(x as boolean)

function bool() {
  return true
}

function pipe<T>(x: T): T {
  return x
}

function str(x: string) {
  
}

var xx = bool()
var xxx = pipe(xx)
str(xxx)

// var jsx = <foo-bar></foo-bar>

a.
