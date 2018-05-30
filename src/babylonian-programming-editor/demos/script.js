// Try out replacement
let celcius = prompt();
let fahrenheit = celcius * 9/5 + 32;

// Track loop variables
let fact = 1;
for(let i = 1; i < 50; i++) {
  fact *= i;
}

// Some object tests
var obj = {
  a: 1,
  b: 2
}
obj.c = 4
delete obj.a;

let test = { a: 1, b: 2 };
test.b = celcius;
test = { a: 1 };

// Array test
let arr = [2, 5, 7];
arr.push(42);
arr.pop()

// Nested loops
let outerSum = 0;
let innerSum = 0;
for(let i = 0; i < 5; i++) {
  outerSum += i;
  for(let j = 0; j < 3; j++) {
    innerSum += j;
  }
}/* Examples: {"probes":[{"location":[3,4,3,14]},{"location":[8,10,8,11]},{"location":[12,4,12,7]},{"location":[16,0,16,3]},{"location":[17,7,17,10]},{"location":[19,4,19,8]},{"location":[21,0,21,4]},{"location":[25,0,25,3]},{"location":[34,4,34,12]}],"sliders":[{"location":[33,2,33,5]}],"examples":[],"replacements":[{"location":[2,14,2,22],"value":"120"}],"instances":[]} */