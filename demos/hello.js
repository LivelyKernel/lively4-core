var a = 3
var b = 4


function foo(a,b) {
  var c = (a + b) / 2 
  return c
}

var avg = foo(a,b)

var sum = 0
for(var i=0; i < 5; i++) {
  sum += i
}

function count(list) {
  if (list.length === 0) {
    return 0
  }
  list.pop()
  return count(list) + 1
}

var result = count([1,2,3,2345,234,234,23,4,23,4])
