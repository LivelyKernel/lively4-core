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



/* Examples: {"probes":[{"location":[12,3,12,10]},{"location":[8,2,8,6]},{"location":[6,4,6,8]},{"location":[19,4,19,7]},{"location":[23,0,23,3]},{"location":[24,7,24,10]}],"sliders":[{"location":[7,0,7,3]}],"examples":[],"replacements":[],"instances":[]} */