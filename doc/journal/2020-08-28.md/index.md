## 2020-08-28 Number Headings
*Author: @JensLincke*

### We need Headings

#### more and more

#### even more

### Here we go

<edit://src/client/html.js#numberHeadings>

```javascript
static numberHeadings(root, customCount=0) {
    var roots = []
    var parents = []
    var children = new WeakMap()
    var numbers = new WeakMap()
    var contents = root.querySelectorAll("h1,h2,h3,h4")
    
    function level(h) {
      return parseInt(h.localName.replace(/h/,""))
    }
    
    function numberChildren(node, array=[]) {
      numbers.set(node, array)
      var counter=1
      if (!children.get(node)) return
      for(var ea of children.get(node)) {
        if (customCount && (ea === roots.first)) {
          counter = customCount // start with custom counter
        }
        numberChildren(ea, array.concat([counter++]))
      }
    }

    for(let ea of contents) {

        var parent = parents.pop()
        while (parent && level(parent) >= level(ea)) {
          parent = parents.pop()
        }
        if (parent) {
          parents.push(parent)

          if (!children.get(parent)) children.set(parent, [])
          children.get(parent).push(ea)
        } else {
          roots.push(ea)
        }
        parents.push(ea)
      }
    debugger
    children.set(this, roots)
    numberChildren(this, [])

    for(let ea of contents) {
      ea.innerHTML = numbers.get(ea).join(".") + " " + ea.innerHTML
    }
  }  
```



<script>
lively.html.numberHeadings(lively.query(this, "#content"), 2)
</script>