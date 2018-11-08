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


async function loadData()
{
  let json = fetch('https://api.granor.de/easywash?roomId=5015')
        .then(function(response) {
          let foo = response
          return foo
      });
  return json;
}



let data = loadData();

