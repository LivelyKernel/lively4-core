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
  
  let test = { a: 1, b: 2 };
  test.b = 4;
  test = { a: 1 };
  
  // Track loop variables
  let fact = 1;
  for(let i = 1; i < 5; i++) {
    fact *= i;
    let asdf = [1,2,i];
  }
}

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
}/* Examples: {"probes":[{"location":[6,5,6,8]},{"location":[17,6,17,10]},{"location":[18,2,18,6]},{"location":[19,2,19,6]},{"location":[24,4,24,8]},{"location":[25,8,25,12]},{"location":[52,4,52,7]},{"location":[53,0,53,3]},{"location":[54,0,54,3]}],"sliders":[{"location":[23,2,23,5]}],"examples":[{"location":[2,9,2,12],"id":"e259-552c-02ee","name":"Some Example","values":{},"instanceId":"0"},{"location":[2,9,2,12],"id":"c085-7e6f-8f34","name":"","values":{},"instanceId":"0"}],"replacements":[],"instances":[]} */