

// #TODO following line seems not to work
// importxxxxx {foo} from './a.js'

import {foo, FooClass} from 'test/a.js'


function bar3() {
  return "b does somthing with a's:" + foo() + " and" + FooClass.foo()
}

var c = 3


bar3


