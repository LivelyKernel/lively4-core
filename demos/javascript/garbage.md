# Collecting Garbage? We need an Reference Index!


```javascript
var all 

window.document.constructor

function keys(obj) {
  // return Object.getOwnPropertyNames(obj)
  
  var descriptors = Object.getOwnPropertyDescriptors(obj)
  return Object.getOwnPropertyNames(obj)
    .filter(ea => !ea.get && !ea.set)
    .filter(ea => !(obj === window && ea == "localStorage"))
  
  // var k = []
  // try {
  //   for(let a in obj) {
  //     if (obj.hasOwnProperty(a)) {
  //       k.push(a)
  //     }
  //   }
  //   if (obj && obj.constructor && !k.includes("constructor")) {
  //     k.push("constructor")
  //   }
  // } catch(e) {
  //   // ...
  // };
  // return k
}

function gather(obj) {
  if (!obj) return // undefined et all
  if (all.has(obj)) {
    return
  } else {
    if (obj !== undefined && !obj.__isMeta__) {
      all.add(obj)
      keys(obj).forEach(key => {
        var next = obj[key]
        try {
          gather(next)
        } catch(e) {
          // console.log("could not gather: ", next)
        }
      })
    }
  }
}



var nodes
function nodeForObject(obj, key) {
  var node = nodes.get(obj)
  if (!node) {
    try {
      var name = (key ? key + ": ": "") + obj.toString()
    } catch(e) {
      name = "<unprintable>"
    }
    node = {
      __isMeta__: true,
      name: "" + key,
      title: name,
      size: name.length
    }
    nodes.set(obj, node)     
  }
  return node
}

function childrenDo(obj, func) {
  keys(obj).forEach(key => {
    try {
      var other = obj[key]
    } catch(e) {
      // console.warn("could not index ", ea, key)
    }
    if (other !== undefined) {
      func(other, key)
    }
    
  })
}

function graphToTree(obj, visited=new Set(), key) {
  if (!all.has(obj)) return; // stay in set...
  if (!visited.has(obj)) {
    if (visited.size > 5500) return
    var node = nodeForObject(obj, key)
    visited.add(obj)
    console.log("visited " + visited.size)
    childrenDo(obj, (ea, key) => {
      var other = graphToTree(ea, visited, key)
      if (other) {
        if (!node.children) {
          node.children = []
        }
        console.log("add " + other.name)
        node.children.push(other)
      }
    })     
  }
  return node
}

/*
all= new Set()
all.__isMeta__ = true
gather(window)

all.size
*/


keys(window.constructor.prototype.constructor.prototype)

 

var index = new Map()
index.__isMeta__ = true



/*
  nodes = new Map();
  nodes.__isMeta__ = true;

  var result = graphToTree(window)
  that = $morph("treemap")
  that.dataTitle = function(d) { return d.title}
  delete that.dataName
  that.dataName = function(d) { return  d.name.split(/(?=[A-Z][^A-Z])/g);}

  that.setTreeData(result)
*/




```