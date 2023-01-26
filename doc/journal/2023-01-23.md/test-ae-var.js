"enable aexpr"

var log = s => console.log(s)

export function setLog(func) {log = func}


var a = "hello"
var changes = 0

// count the name changes
aexpr(() => {
  return a
}).onChange(() => {
  log('changed a')
  changes++
})


 //

export function reset() {
  a = "hello"
  changes = 0
}

export function run() {
  log("a=" + a)
  log(changes)
  a = "foo " + Date.now()
  log("a=" + a)
  log(changes)
}



run()