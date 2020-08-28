# SAP Graph Visualization

<script>
import ContextMenu from 'src/client/contextmenu.js';

(async () => {
   var vis = await (<d3-graphviz style="background:gray; width:2200px; height: 800px"></d3-graphviz>)
    
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
    var graph =  await ensureNode("sap://SalesOrders")
    
    
    async function ensureNode(url) {
      var id = ensureId(url)
      var node = nodeMap.get(id)
      
      if (!node) {
        var json = await fetch(url).then(r => r.json())
        node = {
          url: url,
          obj: json,
          out: []
        }
        nodeMap.set(id, node)
      }
      return node
    }
    
    function collapseNode(graphNode) {
      graphNode.out = []
      graphNode.expanded = false
    }
    
    async function expandNode(graphNode) {
      try {
        debugger
        var resp = await fetch(graphNode.url, {method: "OPTIONS"})
        if (resp.status != 200) return 
        var edges = (await resp.json()).contents;
      } catch(e) {
        console.log("[SAP Graph Vis] could not expand " + graphNode.url)
      }
        
        debugger
      if (edges) {
        // edges = edges.slice(0,10) // #ForDev
        graphNode.out = []
        for(var ea of edges) {
          graphNode.out.push({
            // edge
            label: "",
            target: await ensureNode(ea.href || (graphNode.url + "/" + ea.name))
          })
        }
      }
      graphNode.expanded = true
    }

    await expandNode(graph)


    

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
        var id = ensureId(node.url)
        var obj = node.obj
        var name = ("" +obj)
        //nodes.push(id + `[label="${name}"]`)
        // nodes.push(id + `[label=<<TABLE><TR><TD>left</TD><TD>right</TD></TR></TABLE>>]`)
        
       
        name = stripLabel(node.url)
        
        var inner = [name] 
        
        if (node.out) {
          node.out.forEach(eaOut => {
            var targetObj = eaOut.target.obj
            if (_.isObject(targetObj)) {
              if (targetObj instanceof Text) {
                // ignore TextNodes
              } else {
                edges.push(ensureId(node.url) + " -> " + ensureId(eaOut.target.url) + `[ label="${eaOut.label}" ` 
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
                  inner.push(stripLabel(eaOut.label) + ": " + stripLabel("" + targetObj)) 
                }
                
                
              }
            }
          })
        }
        nodes.push(id + `[shape="record" label="{ ${inner.join("|")}}" ` 
          +`fontcolor="${ node.expanded ? "black" : "gray"}" `
          +`color="${ node.expanded ? "black" : "gray"}"]`)
      }
      visit(graphNode)
      return `digraph {
        graph [  splines="true"  overlap="false"  ];
        node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
        edge [  fontname="Arial"  fontsize="8" ];

        ${edges.join(";")}
        ${nodes.join(";")}
      }`
    }
    
    
    var dotData = dataToDot(graph)
    vis.config({
      async onclick(data, evt, element) {
        // lively.showElement(element)
        if(evt.ctrlKey) {
          lively.openInspector({
            data: data,
            node: nodeMap.get(data.key),
            element: element
          })
        } else {
          debugger
          var node = nodeMap.get(data.key)
          if (node) {
            if (node.out.length == 0) {
              await expandNode(node)
            } else {
              collapseNode(node)
            }
            var h = lively.showElement(element, 300)
            h.innerHTML = ""
            h.style.borderColor = "green"
          } else {
            var h = lively.showElement(element, 300)
            h.innerHTML = ""
            h.style.borderColor = "blue"          
          }
          vis.update(dataToDot(graph))    
        }
      }
    })    

    vis.setDotData(dotData)
    
    return vis
  })()
</script>