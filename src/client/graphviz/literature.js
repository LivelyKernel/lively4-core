import { Panning } from "src/client/html.js"
import Graph from "./graph.js"
import { MiscPaper,  AlexPaper, Paper, LiteratureReference } from "src/client/literature.js"
import Literature from "src/client/literature.js"

/*MD
# Literature Graph

<browse://src/client/graphviz/literature.md>

MD*/

export default class LiteratureGraph extends Graph {

  async initialize(parameters = {}) {
    await super.initialize(parameters)

    this.papersByKey = {}

    // this.reference = LiteratureReference.fromAlexId("W2166901142") // default example, alexid for Krahn2009LWD
    // this.reference = LiteratureReference.fromBibtexKey("Siegmund2016PCP")
    this.reference = LiteratureReference.fromBibtexKey("Krahn2009LWD")
    
    
    if (parameters.key) {
      this.reference = LiteratureReference.fromAlexId(parameters.key)
    }

    if (parameters.ids) {
      
      
    }
    
    if (parameters.keys) {
      var paperIds = parameters.keys.split(",")
      this.references = paperIds.map(key => LiteratureReference.fromAlexId(key))
      var progress = await lively.showProgress("ensure alex papers");
      var count = 0
      for (var reference of this.references) {
        progress.value = count++/ this.references.length;
        let node = await this.ensureNode(reference)
        node.isRoot = true
      }
      progress.remove()
      this.reference = this.references[0]


      var allReferences = {}
      var allCitations = {}

      var tallyReferences = (reference) => {
        let key = reference.key
        if (!allReferences[key]) allReferences[key] = 0
        allReferences[key]++
      }
      var tallyCitations = (reference) => {
        let key = reference.key
        if (!allCitations[key]) allCitations[key] = 0
        allCitations[key]++
      }

      for (let node of this.nodes) {
        if (node.backwardReferences) {
          for (let reference of node.backwardReferences) {
            tallyReferences(reference)
          }
        }

        if (node.forwardReferences) {
          for (let reference of node.forwardReferences) {
            tallyCitations(reference)
          }
        }
      }

      // find interconnecting publications
      for (let key of Object.keys(allReferences)) {
        if ((allReferences[key] >= 1) && (allCitations[key] >= 1)) {
          await this.ensureNode(LiteratureReference.fromAlexId(key))
        } else {
          if ((allReferences[key] >= 5)) {
            await this.ensureNode(LiteratureReference.fromAlexId(key))
          }
        }
      }

      for (let node of this.nodes) {
        if (node.backwardReferences) {
          for (let reference of node.backwardReferences) {
            let other = this.nodes.find(ea => ea.reference.equals(reference))
            if (other) {
              this.connect(other, node)
            }
          }
        }

        if (node.forwardReferences) {
          for (let reference of node.forwardReferences) {
            let other = this.nodes.find(ea => ea.reference.equals(reference))
            if (other) {
              this.connect(node, other)
            }
          }
        }
      }
    } else {

      await this.ensureNode(this.reference)
    }
  }

  async ensureNode(reference) {
    var node = this.nodes.find(ea => ea.reference && ea.reference.equals(reference))
    if (!node) {
      node = { id: this.counter++, 
              referrences: [reference], 
              get reference() {
                return this.referrences[0]
              }, 
              forward: null, 
              back: null }
      await this.initializeNode(node)
      node.forwardReferences = await this.getForwardReferences(node)
      node.backwardReferences = await this.getBackwardReferences(node)

      this.nodes.push(node)
    }
    return node
  }


  connect(fromNode, toNode) {
    if (!fromNode.forward) fromNode.forward = []
    fromNode.forward.push(toNode)

    if (!toNode.back) toNode.back = []
    toNode.back.push(fromNode)
  }



  getBackwardReferencesCount(node) {
    return (node.paper && node.paper.value.referenced_works_count) || "[]"
  }

  getForwardReferencesCount(node) {
    return (node.paper && node.paper.value.cited_by_count) || "[]"
  }

  async initializeNode(node, preview) {
    // this.details.style.display = ""
    // var start = performance.now()
    // this.details.innerHTML = "Loading " + node.reference.key
    // lively.setPosition(this.details, lively.pt(0,0))
    if (!node.reference) return
    var paper = this.papersByKey[node.reference.key]
    if (paper) {
      node.paper = paper
    } else {
      try {
        await this.loadPaper(node, preview)
      } catch (e) {
        console.warn("Error while loading Paper " + e, node)
        return
      }
    }
    
    // for MiscPapers
    if (paper && paper.load) await paper.load()
    
    // this.details.innerHTML = "Loaded " + node.paper.key + " in " + ( performance.now() - start)
  }

  fixId(id) {
    return id.replace("https://openalex.org/", "")
  }

  async loadPaper(node, preview) {
    if (!node) return
    var alexid = node.reference.alexid
    if (alexid) {
      node.paper = await AlexPaper.getId(alexid)
    } else {
      node.paper = new MiscPaper(node.reference)
      await node.paper.load()
      
      // maybe do this in the LiteratureReference
      // changed my mind... after loading I found out that I am a proper paper...
      if (node.paper.alexid) {
        node.paper = await AlexPaper.getId(node.paper.alexid)
      } else if(node.paper.title) {
        var search = node.paper.title
        if (node.paper.year) search = node.paper.year + " " + search
        var json = await fetch("http://swacopilot:9020/works/search?q=" + search).then(r => r.json()) 
        if(json.results.length == 1) { // we are lucky
          node.paper = await new AlexPaper(json.results[0])     
          node.references.push(LiteratureReference.fromAlexId(node.paper.alexid))
        }
        
        
      }
      
    }
    this.papersByKey[node.reference.key] = node.paper
    var papers = []
    var referencesAndCitations = []
    
    if (preview) return;
    
    await node.paper.ensureCrossRefs()
    
    if (node.paper.referenced_works_refs) {
      
      
    }
    
    // #TODO do we actually need to load the preview versions, now or could we do it on expand?
    await this.loadPreviewPapers(node.paper.referenced_works_ids)
    await this.loadPreviewPapers(node.paper.cited_by_works_ids)
    
  }


  
//     async expand(node, direction = "forward", getMethodName = "getForwardKeys") {

//     // #TODO uncomment
//     if (node.paper && node.paper.isPreview) {
//       // load the actual paper and replace placeholder
//       await this.loadPaper(node)
//     }
//     return super.expand(node, direction, getMethodName)
//   }

  async expand(node, direction = "forward", getMethodName = "getForwardReferences") {
    if (node[direction + "Expanded"]) {
      return this.collapse(node, direction)
    }

    if (node.paper.isPreview) {
      await this.loadPaper(node)
    }

    node[direction] = []
    var references = await this[getMethodName](node)

    // now, we load shallow versions of the papers in bulk, so that we don't trigger a full load in ensureNode
    // await this.loadPreviewPapers(references.map(ref => ref.alexid))
    var progress = await lively.showProgress("expand " + direction + " (" + references.length + ")")
    var progressCounter = 0
    for (let reference of references) {
      progress.value = progressCounter++/ references.length
      node[direction].push(await this.ensureNode(reference))
    }
    progress.remove()
    node[direction + "Expanded"] = true
  }

  
  async loadPreviewPapers(ids) {
    let idsToLoad = ids.filter(ea => !this.papersByKey[ea]);

    if (idsToLoad.length > 0) {
      let papers = await Literature.fetchAlexPapersPreviews(idsToLoad)
      papers.forEach(ea => {
        let shortId = this.fixId(ea.alexid);
        if (!this.papersByKey[shortId]) this.papersByKey[shortId] = ea;
      });

      // lively.notify("loadPreviewPapers " + ids.length + " (" + idsToLoad.length + " -> " + papers.length + ")");

    } else {
      lively.notify("All preview papers already loaded.");
    }
  }


  getLabel(node) {
    return (node.paper.key || "").replace(/[^A-Za-z0-9]/g, "")
  }

  getTooltip(node) {
    return node.paper.title
  }

  async onFirstClick(evt, node, element) {
    // lively.openBrowser("bib://" + node.reference.key, false)
    
    this.details.innerHTML = ""
    if (node.paper.alexid) {
      var paperElement = await (
        <literature-paper alexid={node.paper.alexid} mode="short" open="browse"></literature-paper>)  
      paperElement.updateView()
    } else if (node.paper.value && node.paper.value.id  && node.paper.value.type) {
      paperElement = await (
        <literature-paper id={node.paper.value.id} type={node.paper.value.type} mode="short" open="browse"></literature-paper>)  
      paperElement.updateView()
    } else {
      paperElement = <div>DEBUG: {JSON.stringify(node.paper)}</div>
    }
  
    this.details.style.display = ""
    this.details.appendChild(paperElement)
    lively.setClientPosition(this.details, lively.getClientBounds(element.parentElement).bottomLeft())
  }

  onSecondClick(evt, node, element) {
    // lively.openInspector(node)
    // lively.openBrowser("bib://" + node.reference.key, false)
  }

  async getForwardReferences(node) {
    if (!node || !node.paper || !node.paper.cited_by_works_ids) return []
    return node.paper.cited_by_works_ids.map(id => LiteratureReference.fromAlexId(id))
  }

  async getBackwardReferences(node) {
    if (!node || !node.paper) return []
    if (node.paper.referenced_works_refs) {
      

      return node.paper.referenced_works_refs
    }
    
    if (node.paper.referenced_works_ids) 
      return node.paper.referenced_works_ids.map(id => LiteratureReference.fromAlexId(id))
    
    return []
  }

  ensureRootNode() {
    return this.ensureNode(this.reference)
  }

  async dotSource() {
    var dotEdges = []
    var dotNodes = []
    for (let node of this.nodes) {
      var color = this.getColor(node)
      var fontsize = "12pt"
      
      if ((node.forward || (node.forwardReferences && node.forwardReferences.length == 0)) &&
        node.back || (node.backwardReferences && node.backwardReferences.length == 0)) {
        color = "black";
        fontsize = "12pt"
      }

      dotNodes.push(node.id + `[` +
        ` shape="Mrecord"` +
        ` label="{<B>  ${this.getBackwardReferencesCount(node)} | ${this.getLabel(node)} | <f>  ${this.getForwardReferencesCount(node)}}"` +
        ` tooltip="${this.getTooltip(node)}"` +
        ` fontsize="${fontsize}"` +
        ` style="filled"` +

        ` fontcolor="${color}"` +
        ` color="${color}"` +
        ` fillcolor="${node.isRoot ? "#F0F0FC" : "#FCFCFC"}"` +

        `]`)
      if (node.forward) {
        for (let other of node.forward) {
          if (this.getNode(other.id)) { // check if it is still there...
            let dotEdge = "" + node.id + " -> " + other.id + `[color="gray"]`
            if (!dotEdges.find(ea => ea == dotEdge)) {
              dotEdges.push(dotEdge)
            }
          }
        }
      }
      if (node.back) {
        for (let other of node.back) {
          if (this.getNode(other.id)) { // check if it is still there...
            let dotEdge = "" + other.id + " -> " + node.id + `[color="gray"]`
            if (!dotEdges.find(ea => ea == dotEdge)) {
              dotEdges.push(dotEdge)
            }
          }
        }
      }
    }

    return `digraph {
        rankdir=LR;
        graph [  
          splines="true"  
          overlap="false"  ];
        node [ style="solid"  shape="plain" fontname="Arial"  fontsize="14"  fontcolor="black" ];
        edge [  fontname="Arial"  fontsize="8" ];
        ${dotNodes.join(";\n")}
        ${dotEdges.join(";\n")}
      }`
  }

  async expandForward(node) {
    return this.expand(node, "forward", "getForwardReferences")
  }

  async expandBack(node) {
    return this.expand(node, "back", "getBackwardReferences")
  }

  // #important
  async update() {
    var node = await this.ensureRootNode()

    // if only one root node, lets expand it
    // if (!this.references) {
    //   await this.expandForward(node)
    //   await this.expandBack(node)
    // } 
    await this.render()
  }
}
