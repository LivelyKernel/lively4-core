// Try out replacement
let celcius = 24;
let fahrenheit = celcius * 9/5 + 32;

// Track loop variables
let fact = 1;
for(let i = 1; i < 5; i++) {
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
test.b = 4;
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

let i = 0;
while(i < 5) {
  i++;
}/* Examples: {"probes":[{"location":[34,4,34,12]},{"location":[20,0,20,4]},{"location":[40,2,40,3]}],"sliders":[{"location":[33,2,33,5]}],"examples":[],"replacements":[],"instances":[]} */