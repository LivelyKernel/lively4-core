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

let test = { a: 1 };
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

// Test block tracking when there is no user-defined block
function fun() {
  for(;outerSum > 1; outerSum--) console.log(outerSum);

  let num = 5;
  if(num > 2) console.log(num)

  switch(num) {
    case 1:
    case 2:
      console.log("little");
      break;
    default:
      console.log("large");
  }
}/* Examples: {"probes":[{"location":[31,2,31,10]},{"location":[33,4,33,12]},{"location":[42,5,42,8]}],"sliders":[{"location":[30,0,30,3]},{"location":[32,2,32,5]}],"examples":[{"location":[38,9,38,12],"id":"e259-552c-02ee","name":"Some Example","values":{},"instanceId":"0"}],"replacements":[],"instances":[]} */