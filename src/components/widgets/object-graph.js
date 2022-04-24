
import Morph from 'src/components/widgets/lively-morph.js';
import ContextMenu from 'src/client/contextmenu.js';



export default class ObjectGraph extends Morph {
  async initialize() {
    this.windowTitle = "ObjectGraph";
  
    this.updateView()
  }
  
  async updateView() {
    
    this.get("#pane").innerHTML = ""
    this.get("#pane").appendChild(await this.createView())
  }

  ensureId(obj) {
      var id = this.objectToId.get(obj) 
      if (!id) {
        id = this.idcounter++
        this.objectToId.set(obj, id) 
      }
      return "n" + id
  }
  
  ensureNode(obj) {
      var id = this.ensureId(obj)
      var node = this.nodeMap.get(id)
      
      if (!node) {
        node = {
          obj: obj,
          out: []
        }
        this.nodeMap.set(id, node)
      }
      return node
  }
  
  collapseNode(graphNode) {
      graphNode.out = []
      graphNode.expanded = false
    }
    
    expandNode(graphNode) {
      var edgeNames = this.keys(graphNode.obj);
      if (edgeNames) {
        graphNode.out = edgeNames.map(ea => {
          try {
            var value = eval("graphNode.obj." + ea) // vs graphNode.obj[ea], the former allows complex keys
          } catch(e) {
            value = "!ERROR!"
          }
          
          return {
            // edge
            label: ea,
            target: this.ensureNode(value)
          }
        })
      }
      graphNode.expanded = true
    }
  
  
  keys(obj) {
    var keys = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(i) && !obj.__lookupGetter__(key) ) { //  
        keys.push(key);
      }
    }

    if (obj.childNodes) {
      for(var i=0; i< obj.childNodes.length; i++) {
        keys.push("childNodes[" + i + "]");
      }
    }

    if (obj.attributes) {
      for(var ea of obj.attributes) {
        keys.push(`getAttribute("${ea.name}")`);
      }
    }

    if (obj.parentElement) {
      keys.push(`parentElement`);
    }

    if (obj.shadowRoot) {
      keys.push(`shadowRoot`);
    }

    if (obj instanceof Text) {
      keys.push(`textContent`);
    }

    return keys;
  }

  
  dataToDot(graphNode) {
      this.edges = []
      this.nodes = []
      this.visited = new Set()
      
      this.visit(graphNode)
      return `digraph {
        graph [  splines="true"  overlap="false"  ];
        node [ style="solid"  shape="plain"  fontname="Arial"  fontsize="14"  fontcolor="black" ];
        edge [  fontname="Arial"  fontsize="8" ];

        ${this.edges.join(";")}
        ${this.nodes.join(";")}
      }`
  }
  
  
  visit(node) {
        if (this.visited.has(node)) return
        this.visited.add(node)
        var id = this.ensureId(node.obj)
        var obj = node.obj
        var name = ("" +obj)
        //this.nodes.push(id + `[label="${name}"]`)
        // this.nodes.push(id + `[label=<<TABLE><TR><TD>left</TD><TD>right</TD></TR></TABLE>>]`)
        
        if (obj instanceof Object) {
          name = obj.constructor.name
        }
        name = this.stripLabel(name)
        
        var inner = [name] 
        
        if (node.out) {
          node.out.forEach(eaOut => {
            var targetObj = eaOut.target.obj
            if (_.isObject(targetObj)) {
              if (targetObj instanceof Text) {
                // ignore TextNodes
              } else {
                this.edges.push(this.ensureId(node.obj) + " -> " + this.ensureId(targetObj) + `[ label="${eaOut.label}" ` 
                    +`fontcolor="${ eaOut.target.expanded ? "black" : "gray"}" `
                   +`color="${ eaOut.target.expanded ? "black" : "gray"}" `
                  + `]`)
                this.visit(eaOut.target)
              }
            
            } else {
              if (targetObj !== null) {
                if (["class","id", "name"].includes(eaOut.label)) {
                  inner.push(eaOut.label + ": " + this.stripLabel("" + targetObj))                 
                } else if (eaOut.label.match("getAttribute")) {
                  inner.push(eaOut.label.replace(/getAttribute/,"@").replace(/[()"]+/g,"") + ": " + this.stripLabel("" + targetObj))                 
                } else {
                  // #TODO show details on demand?
                  inner.push(this.stripLabel(eaOut.label) + ": " + this.stripLabel("" + targetObj)) 
                }
                
                
              }
            }
          })
        }
        this.nodes.push(id + `[shape="record" label="{ ${inner.join("|")}}" ` 
          +`fontcolor="${ node.expanded ? "black" : "gray"}" `
          +`color="${ node.expanded ? "black" : "gray"}"]`)
      }
  
  async createView() {
    if (!this.targetObject) {
      return <div>No targetObject</div>
    }
    
    
   var vis = await (<d3-graphviz></d3-graphviz>)
    
    vis.engine = "dot" 
    
    var menuItems = [
      ["graphviz engine", 
        ["dot", "neato", "fdp", "twopi", "circo"].map(ea => {
          return [ea,
            () => {
              vis.engine = ea  
              vis.setDotData(this.dataToDot(graph))
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
    
    this.nodeMap = new Map()
    this.objectToId = new Map()
    this.idcounter = 1;

    // not serializable graph structure...
    var graph =  this.ensureNode(this.targetObject)
 

    this.expandNode(graph)
    var dotData = this.dataToDot(graph)
    vis.config({
      onclick: (data, evt, element) => {
        // lively.showElement(element)
        if(evt.ctrlKey) {
          lively.openInspector({
            data: data,
            node: this.nodeMap.get(data.key),
            element: element
          })
        } else {
          var node = this.nodeMap.get(data.key)
          if (node) {
            if (node.out.length == 0) {
              this.expandNode(node)
            } else {
              this.collapseNode(node)
            }
          
          }
          lively.showElement(element, 300).innerHTML = ""
          vis.update(this.dataToDot(graph))    
        }
      }
    })    

    vis.setDotData(dotData)
    
    return vis    
  }
  
  
  stripLabel(str) {
    return str.replace(/([^A-Za-z0-9 _.,;:<>\/\[\]])/g," ").slice(0,50)
  }

  livelyMigrate(other) {
    
    this.targetObject = other.targetObject
  }
  
  async livelyExample1() {
    var obj = {name: "special"}
    this.targetObject = {name: "foo", children: [
      {name: "bar"},
      {name: "hello"},
      obj
    ]}
    obj.someReference = this.targetObject
    
    
    this.updateView()
    
  }
  
  async livelyExample() {
    this.targetObject = document.body
    
    
    this.updateView()
    
  }
  
  
}