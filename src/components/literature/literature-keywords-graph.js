import LiteratureGraph from './literature-graph.js';
/*MD
#  Literature Keywords Graph



MD*/

export default class LiteratureKeywordsGraph extends LiteratureGraph {

  initialize() {
    super.initialize()
    this.windowTitle = "Literature Keywords Graph";   

  }

  
  getLabel(node) {
    if (node.object && node.object.key) return node.object.key
    return ("" + node.object).replace(/[^A-Za-z0-9]/g, "")
  }
  
  getTooltip(node) {
    var result = ""
    if (_.isString(node.object)) {
      var list = this.worksByKeyword.get(node.object)
      result += list.map(ea => ea.key).join(", ")

    }
    return result.slice(0, 1000)
  }


  nodeFor(object) {
    return this.nodes.find(ea => {
      if (object instanceof String) return ea.object == object
      return ea.object === object
    })
  }


  async ensureNode(object) {
    var node = this.nodeFor(object)
    if (!node) {
      node = { id: this.counter++, object: object }
      this.nodes.push(node)
    }
    return node
  }

  async onClick(evt, node, element) {
    if (evt.ctrlKey && evt.shiftKey) {
      lively.openInspector({ evt, node, element })
      return
    }
    
    this.details.style.display = ""
    this.details.innerHTML = ""
    
    var list = this.worksByKeyword.get(node.object)
    var links = list.map(ea => <span><a click={() => lively.openBrowser("bib://" + ea.key)}>{ea.key}</a> </span>)
    var div = <div>{...links}</div>
    this.details.appendChild(div)
    lively.setClientPosition(this.details, lively.getClientBounds(element.parentElement).bottomLeft())
  }


  async dotSource() {
    var dotEdges = []
    var dotNodes = []

    await this.analyzeGraph()
    
    for (let kw of this.keywords) {
      await this.ensureNode(kw)
    }  
    
    var kw2kw = []

    for (let kw of this.worksByKeyword.keys()) {
      for (let work of this.worksByKeyword.get(kw)) {
        for (let otherKw of work.keywords) {
          let from = this.nodeFor(kw).id
          let to = this.nodeFor(otherKw).id
          if (from != to) {
            kw2kw.push([from, to].sort().join("->"))
          }
          // dotEdges.push(this.nodeFor(kw).id  + " -> "  + this.nodeFor(otherKw).id)
        }
      }
    }

    this.usedNodeIds = new Set()

    var keywordPairs = _.toPairs(_.countBy(kw2kw))
    keywordPairs = keywordPairs.filter(ea => ea[1] > 2)
    for (let pair of keywordPairs) {
      pair[0].split("->").forEach(ea => this.usedNodeIds.add(ea));

      dotEdges.push(pair[0] + `[arrowhead=none, penwidth=${pair[1]}, color="#10101050" ]`) //  weight=${pair[1]}
    }


    for (let node of this.nodes) {
      if (this.usedNodeIds.has(node.id.toString())) {
        dotNodes.push(`${node.id}[label="${this.getLabel(node)}" fontsize="${this.worksByKeyword.get(node.object).length + 6}" tooltip="${this.getTooltip(node)}"]`)
      }
    }

    return `digraph {
      rankdir=LR;
      graph [  
        splines="true"  
      ];
      node [ 
        style="solid"  
        shape="plain" 
        fontname="Arial"  
        fontsize="14"  
        fontcolor="black" 
      ];
      edge [  
        fontname="Arial"  
        fontsize="8" 
      ];
      ${dotNodes.join(";\n      ")}
      ${dotEdges.join(";\n      ")}
    }`
  }

  
}
