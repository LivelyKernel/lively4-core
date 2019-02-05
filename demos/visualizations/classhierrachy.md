# Class Hierarchy


<script>
import ContextMenu from 'src/client/contextmenu.js';

(async () => {
   var vis = await (<d3-graphviz style="background:gray; width:2200px; height: 2800px"></d3-graphviz>)
    
    vis.engine = "dot" 
    
    var menuItems = [
      ["graphviz engine", 
        ["dot", "neato", "fdp", "twopi", "circo"].map(ea => {
          return [ea,
            () => {
              vis.engine = ea  
              vis.setDotData(dataToDot(graph))
            }
          ]
        })
      ]
    ]
    
    vis.addEventListener("contextmenu",  evt => {
      ContextMenu.openIn(document.body, evt, this, undefined, menuItems);
      evt.stopPropagation();
      evt.preventDefault();
    });

    // vis.engine = "circo"
    
    var classes = []
    Object.keys(Object.getOwnPropertyDescriptors(window)).map(ea => {
      var obj = window[ea]
      try {
        if (ea.match(/^[A-Z]/) && obj instanceof Function) {
          classes.push(obj)
        }    
      } catch(e) {
        // don't care
      }
    })

    var nodeMap = new Map()
    var objectToId = new Map()
    var idcounter = 1;
    function ensureId(obj) {
      var id = objectToId.get(obj) 
      if (!id) {
        id = idcounter++
        objectToId.set(obj, id) 
      }
      return "n" + id
    }
    // not serializable graph structure...
    // var root = HTMLElement.__proto__
    
    var root = HTMLElement
    //.__proto__.__proto__.__proto__
    
    // var root = SVGElement
    
    // var root = SVGGeometryElement
    
    
    
    
    var subClasses = classes.filter(ea => root.isPrototypeOf(ea))
    
    var graph =  ensureNode(root)
    
    function ensureNode(obj) {
      var id = ensureId(obj)
      var node = nodeMap.get(id)
      
      if (!node) {
        node = {
          obj: obj,
          out: []
        }
        nodeMap.set(id, node)
      }
      return node
    }
    
    subClasses.forEach(ea => {
      var obj = ea
      
      var node = ensureNode(obj)
      
      node.expanded = true
      if (obj.__proto__) {
        var parentNode = ensureNode(obj.__proto__)
        parentNode.out.push( {
            // edge
            label: "subclass",
            target: node
          })
        parentNode.expanded = true
      }
    })

    
    function collapseNode(graphNode) {
      graphNode.out = []
      graphNode.expanded = false
    }
    
    function expandNode(graphNode) {
      var edgeNames = keys(graphNode.obj);
      if (edgeNames) {
        graphNode.out = edgeNames.map(ea => {
          try {
            var value = eval(ea) // global lookup
          } catch(e) {
            value = "!ERROR!"
          }
          
          return {
            // edge
            label: ea,
            target: ensureNode(value)
          }
        })
      }
      graphNode.expanded = true
    }

    
    
    // function expandNode(graphNode) {
    //   var children = graphNode.obj.childNodes
    //   if (children) {
    //     graphNode.out = _.map(children, ea => {
    //       return {
    //         obj: ea,
    //         out: []
    //       }
    //     }).filter(ea => ! (ea.obj instanceof Text))
    //   }
    // }


    expandNode(graph)


    // customize range here...
    function keys(obj) {
      var keys = [];


      // keys.push("__proto__")
      
      classes.filter(ea => ea.__proto__ === obj).forEach(ea => {
        keys.push(ea.name)
      })
      
      
      // if (obj.prototype) {
      //   Object.keys(obj.prototype).forEach(key => {
      //     keys.push("" + key); 
      //   })
      // }
      
//       if (obj.attributes) {
//         for(var ea of obj.attributes) {
//           keys.push(`getAttribute("${ea.name}")`);
//         }
//       }
      
//       if (obj.parentElement) {
//         keys.push(`parentElement`);
//       }
    
      return keys;
    }

    function stripLabel(str) {
      return str.replace(/([^A-Za-z0-9 _.,;:<>\/\[\]])/g," ").slice(0,50)
    }

    function dataToDot(graphNode) {
      var edges = []
      var nodes = []
      var visited = new Set()
      function visit(node) {
        if (visited.has(node)) return
        visited.add(node)
        var id = ensureId(node.obj)
        var obj = node.obj
        var name = ("" +obj)
        //nodes.push(id + `[label="${name}"]`)
        // nodes.push(id + `[label=<<TABLE><TR><TD>left</TD><TD>right</TD></TR></TABLE>>]`)
        
        if (obj instanceof Object) {
          name = obj.constructor.name
        }
        if (obj instanceof Function) {
          name = obj.name 
        }

        name = stripLabel(name)
        
        var inner = ["<b>" + name + "</b>"] 
        
        if (node.out) {
          node.out.forEach(eaOut => {
            var targetObj = eaOut.target.obj
            if (_.isObject(targetObj)) {
              if (targetObj instanceof Text) {
                // ignore TextNodes
              } else {
                edges.push(ensureId(node.obj) + " -> " + ensureId(targetObj) + `[  ` // label="${eaOut.label}" 
                    +`fontcolor="${ eaOut.target.expanded ? "black" : "gray"}" `
                   +`color="${ eaOut.target.expanded ? "black" : "gray"}" `
                  + `]`)
                visit(eaOut.target)
              }
            
            } else {
              if (targetObj !== null) {
                if (["class","id", "name"].includes(eaOut.label)) {
                  inner.push(eaOut.label + ": " + stripLabel("" + targetObj))                 
                } else if (eaOut.label.match("getAttribute")) {
                  inner.push(eaOut.label.replace(/getAttribute/,"@").replace(/[()"]+/g,"") + ": " + stripLabel("" + targetObj))                 
                } else {
                  // #TODO show details on demand?
                  inner.push(stripLabel(eaOut.label)) // + ": " + stripLabel("" + targetObj)) 
                }
                
                
              }
            }
          })
          
          if(node.obj.prototype) {
          
            Object.keys(node.obj.prototype).forEach(key => {
              inner.push("" + key)
            })
            // inner.push("HOHOH")
          }
          
        }
        // <U><TABLE><TR><TD>hello${inner.join("<br>")}</TD></TR></U>
        nodes.push(id + `[shape="plaintext" label=< <TABLE  border="0" cellborder="1" cellspacing="0">
          ${inner.map(ea => "<TR><TD>" + ea + "</TD></TR>").join("\n")} 
          </TABLE>> ` 
          +`fontcolor="${ node.expanded ? "black" : "gray"}" `
          +`color="${ node.expanded ? "black" : "gray"}"]`)
      }
      visit(graphNode)
      return `digraph {
        rankdir = TD;
        graph [  splines="ortho"  overlap="false"  ];
        node [    fontname="Arial"  fontsize="14"  fontcolor="black" ];
        edge [ dir="back" arrowhead=none fontname="Arial"  fontsize="8" ];

        ${edges.join(";")}
        ${nodes.reverse().join(";")}
      }`
    }
    
    
    var dotData = dataToDot(graph)
    vis.config({
      onclick(data, evt, element) {
        // lively.showElement(element)
        if(evt.ctrlKey) {
          lively.openInspector({
            data: data,
            node: nodeMap.get(data.key),
            element: element
          })
        } else {
          var node = nodeMap.get(data.key)
          if (node) {
            if (node.out.length == 0) {
              expandNode(node)
            } else {
              collapseNode(node)
            }
          
          }
          lively.showElement(element, 300).innerHTML = ""
          vis.update(dataToDot(graph))    
        }
      }
    })    

    vis.setDotData(dotData)
    
    return vis
  })()
</script>