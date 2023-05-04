"enable aexpr"



var o = {bar: 3}

var observer

function observeO(object) {
  if (observer) {
    observer.dispose()
  }
  
  observer = aexpr(() => {
    return object.bar
  }).onChange(() => {
    lively.notify("change: " + o.bar)
  })

}

observeO(o)




o.bar = 4


export function foo() {
  
}