"enable aexpr"

let list = [{name: "sam"},{name: "bax"}]
for(let ea of list) {
  let activeExpression = aexpr(() => ea.name)
  activeExpression.onChange((newValue, expr) => {
    lively.notify("changed " + expr.lastValue + " to " + newValue)
  })
}

list[1].name = "Max"

list[1] = undefined // delete reference to it.... 

// but what happens to the activeExpression created in the loop?



export function foo() {
  
} 