// Try out replacement
let celcius = 24;
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
}
/* Examples: {"probes":[{"location":[3,4,3,14]}],"sliders":[],"examples":[],"replacements":[],"instances":[]} */