// Try out replacement
let celcius = 24;
let fahrenheit = celcius * 9/5 + 32;

// Track loop variables
let fact = 1;
/*slider:*/for/*{}*/(let i = 1; i < 50; i++) {
  /*probe:*/fact/*{}*/ *= /*probe:*/i/*{}*/;
  if(i > 20) {
    console.log(/*probe:*/i/*{}*/)
    /*probe:*/i/*{}*/ += 2;
  }
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
/*slider:*/for/*{}*/(let i = 0; i < 5; i++) {
  /*probe:*/outerSum/*{}*/ += i;
  /*slider:*/for/*{}*/(let j = 0; j < 3; j++) {
    /*probe:*/innerSum/*{}*/ += j;
  }
}
/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */