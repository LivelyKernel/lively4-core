"enable aexprs";

// Line comment
/*
 * Block comment
 */

export { foo, bar };
export { foo23 } from "mod";
export var foo12 = 1;
export { we as foo242 } from "bar";
export default 1;
export * from "mod";

for (let x of [1, 2, 3]) {
  console.log(x);
}
for (x of [1, 2, 3]) {
  console.log(x);
}

null;

({
  f({ a, c = 42, x: y = z }, [d,, f = 42, ...g]) {},
  *[fo](a = 2 + 3) {
    yield a;
  },
  set foo(a) {
    return a + b;
  },
  async fooo(a, ...b) {
    return a + b;
  },
  bar: 43,
  baz,
  [bar + foo]: 17
});

// `123 ${hello + world} 
// d

// #basic
// ${world}
// wd`;
4232222.3;
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

"another directive";

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
    [baz, baz2, { xx },, ...xxx] = blubdiblub;
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

  get element() {
    return this.get('#id');
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