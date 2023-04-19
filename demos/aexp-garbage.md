 ## Basic Version

 
```javascript
var obj = {name: "sam"}
aexpr(() => obj.name).onChange(() => 
  lively.notify("name changed " + obj.name))

obj.name = "Sammy"
```

```
var obj = {name: "sam"}
var activeExpression = aexpr(() => obj.name)
activeExpression.onChange(() => 
  lively.notify("name changed " + obj.name))

obj.name = "Sammy"
```




```javascript
list[1] = undefined // delete reference to it.... 


let list = [{name: "sam"},{name: "bax"}]
for(let ea of list) {
  let activeExpression = aexpr(() => ea.name)
  activeExpression.onChange((newValue, expr) => {
    lively.notify("changed " + expr.lastValue + " to " + newValue)
  })
}

list[1].name = "Max"
```

## Problem: Garbage Collection of Active Expressions

What happens to the activeExpression created in the loop?

```

list[1] = undefined 

```
