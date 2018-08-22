import foo from "https://lively-kernel.org/lively4/lively4-jens/demos/javascript/hello.js"

debugger
for(let x0 = 0;x0 < 5; x0++) {
  x0;
  x0 += 1
}
for(var x0 = 0;x0 < 5; x0++) {
  x0;
  x0 += 1
}


var y =8;
for(var x in window) {
  
  console.log("x: " + x)
  y += x
  x = 42;
}

for(var x2 of Object.keys(window)) {
  
  console.log("x2: " + x2)
  y += x2
  x2 = 42;
}

(async () => {
  for await (var x3 of Object.keys(window)) {

    console.log("x3: " + x3)
    y += x3
    x3 = 42;
  }
})()

for(let x4 in window) {
  
  console.log("x4: " + x4)
  y += x4
  x4 = 42;
}
