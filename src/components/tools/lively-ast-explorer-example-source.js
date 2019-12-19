const get = {
  get() {
    return "expect";
  }
};
// Jens 
Object.defineProperty({ a: 1 }, 'expect', get);

// old stuff still works
let obj = { a: 1 };
aexpr(() => obj.a).onChange(() => lively.notify(1));
obj.a = 2;

// arrays work if not in local scope
let arr = [];
aexpr(() => arr.last).onChange(() => lively.notify(2));
arr.push(8);

// sets dont work -- or do they 
let s = new Set();
aexpr(() => s.size).onChange(() => lively.notify(3));
s.add(1);

// map dont work -- mhh
let m = new Map();
aexpr(() => m.size).onChange(() => lively.notify(4));
s.add(1);
