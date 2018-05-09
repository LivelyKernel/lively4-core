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
/* Examples: {"probe":[{"loc":[7,0,7,3]},{"loc":[8,2,8,6]},{"loc":[12,3,12,10]}],"replacement":[{"loc":[6,11,6,12],"value":"20"}],"example":[]} */