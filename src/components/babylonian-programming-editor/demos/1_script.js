// Try out replacement
let celcius = 24;
let fahrenheit = celcius * 9/5 + 32;

// Track loop variables
let fact = 1;
for(let i = 1; i < 5; i++) {
  fact *= i;
}

// See dead code
if(celcius < 15) {
  console.log("It's cold");
} else {
  console.log("It's warm");
}

// Some object tests
var obj = {
  a: 1,
  b: 2
}
obj.c = 4
delete obj.a;

let test = { a: 1 };
test = { a: 1 };

// Array test
let arr = [2, 5, 7];
arr.push(42);

arr.pop()

/* Examples: {"probes":[{"location":[12,3,12,10]},{"location":[8,2,8,6]},{"location":[19,4,19,7]},{"location":[23,0,23,3]},{"location":[24,7,24,10]},{"location":[26,4,26,8]},{"location":[27,0,27,4]},{"location":[30,4,30,7]},{"location":[31,0,31,3]},{"location":[33,0,33,3]}],"sliders":[{"location":[7,0,7,3]}],"examples":[],"replacements":[],"instances":[]} */