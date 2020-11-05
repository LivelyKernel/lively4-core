```javascript
var a = [{name: "joe", age: 3},{name: "foo", age:3},{name: "bar",age: 6},{name: "Richard", age: 19}]
var b = [{name: "joe full", age: 3},{name: "bar",age: 6},{name: "Richard", age: 20}]

var byName = {}
for(var ea of a ) {
  byName[ea.name] = ea
}


var byAge = {}

for(var ea of a ) {
  if (!byAge[ea.age]) {
    byAge[ea.age] = []
  }
  byAge[ea.age].push(ea)
}

byAge

byAge[3].map(ea => ea.name)

```


```javascript
// Vergleiche zwei Listen:

var a = [{name: "joe", age: 3},{name: "foo", age:3},{name: "bar",age: 6},{name: "Richard", age: 19}]
var b = [{name: "joe full", age: 3},{name: "bar",age: 6},{name: "Richard", age: 20}]

// Gesucht:

function compareLists(a, b, comp= ea => ea) {
  var inAandB = []
  var onlyInA = []
  var onlyInB = []


  for(var eaA of a) {
    var found = b.find(eaB => comp(eaB) == comp(eaA))
    if (found) {
      inAandB.push(eaA)
    } else {
      onlyInA.push(eaA)
    }
  }


  for(var eaB of b) {
    var found = a.find(eaA => comp(eaA) == comp(eaB))
    if (!found) {
      onlyInB.push(eaB)
    }
  }
  return {
    inAandB, onlyInA, onlyInB
  }  
}


compareLists(a,b, ea => ea.name)
```