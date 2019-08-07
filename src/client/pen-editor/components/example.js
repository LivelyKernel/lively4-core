// Line comment
/*
 * Block comment
 */

({
  get foo() {},
  bar: 42,
  baz,
  [bar + foo]: 17
});

// `123 ${hello + world} 
// d

// #basic
// ${world}
// wd`;
42;
world;
true;false;
this + "a string";

/he(l.)o/ig;
[1,, 3, ...arr];

switch (hello + world) {
  case 42:
    foo();
    break;
  case value2:
    bar();
  default:
    // Anweisungen werden ausgeführt,
    // falls keine der case-Klauseln mit expression übereinstimmt
    break;
}
// #imports
import 'utils';
import { uuid as genUUID, shake } from 'utils';
import { uuid } from 'utils';
import * as utilsNamespace from 'utils';
import utilsDefault from 'utils';

1, 2, 3;

// #while
while (3 < 2) {
  lively.notify('while statement');
}

~i;

// error handling
try {
  throw new Error('expected');
} catch (e) {
  42;
} finally {
  17;
}
const hello = 42;
let world = hello * 17 + 38 / foo,
    baz;
arr.map(thing => thing.prop);
arr.map(thing => thing.method());
function* yieldAll(...arr) {
  yield arr[0];
  yield* arr;
}
let fn = async function (a, b) {
  return a + b;
};

class Being {
  set [hello + 2](value) {}
}
class Person extends Being {
  static async new(name) {
    return new Person(name);
  }

  constructor() {}
  *sfcd() {}
  get sfcd() {
    super.sfcd();
  }
}

foo;
bar;
bar2 += foo - bar.baz.blub(43, ...arr);
// var x = 3 + /* inline comment */4; // Line comment2
// x.toString();
// x['toString'];
myLabel: {
  Promise.resolve(42).then((n1, n2) => {
    n1++;
    return n1 + n2;
  });
}