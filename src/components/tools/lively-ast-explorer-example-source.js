var a = 3 + 2 + 4 + 5
var b = 4

function foo(a,b) {
  let c = a + b;
  c = a + b + a;
  for (var i = 0; i < 4; i++) {
    if(i == 1){
      c += c + (i * c)
    }
    else{
      c = c + (i * c)
    }
  }
  return c
}

var avg = foo(a, b)
