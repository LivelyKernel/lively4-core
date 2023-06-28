## 2023-06-27 New SystemJS 6.14

*Author: @JensLincke*

- [ ] 1. get transpile to work
- [X] 2. unload modules -> reload
- [ ] 2.1 delete does not clear cache.... which cache is not clear
- [ ] 3. see module dependencies

## Load SystemJS beside the old one

```javascript
var source = await fetch("http://localhost:9005/lively4-core/src/external/systemjs/system.6.14.js").then(r => r.text())


window.SystemJSOld = window.SystemJS



{
window.xy = window.SystemJS

eval(`
delete window.SystemJS
delete window.System
`)
try {
  
  let r = eval(source)

  window.SystemJS6 = window.System
} finally {
  window.SystemJS = window.SystemJSOld // and weak COP again
  window.System = window.SystemJSOld // and weak COP again
  
}

window.SystemJS6
window.System

}

```

## Try it out

```javascript
SystemJS6.delete



SystemJS6.import("http://localhost:9005/lively4-core/demos/systemjs/bar.js?6")

// hack: get Registry... there is only on object hidden...
function getRegistry() {
  return this[Object.getOwnPropertySymbols(this)[0]]
}

SystemJS6::getRegistry()["http://localhost:9005/lively4-core/demos/systemjs/bar.js?6"]

SystemJS6.delete("http://localhost:9005/lively4-core/demos/systemjs/bar.js?6")
```


## Minimal Module

<edit://demos/systemjs/bar.js>

```javascript
// throw new Error("X")

(function(System, SystemJS) {
    System.register([], function(_export, _context) {
        return {
            setters: [],
            execute: async function() {
                console.log("I was here again!")
                
                var bar = await Promise.resolve(43)
              
                
                _export("bar", bar)
            }
        };
    });
}
)(SystemJS6, SystemJS6);
```
