import { Panning } from "src/client/html.js"
import Graph from "./graph.js"
import { AlexPaper, Paper } from "src/client/literature.js"
import Literature from "src/client/literature.js"

/*MD
# Literature Graph

<browse://src/client/graphviz/literature.md>

MD*/

export default class LiteratureGraph extends Graph {

  async initialize(parameters = {}) {


    await super.initialize(parameters)


    this.papersByKey = {}

    this.key = "W2166901142" // default example, alexid for Krahn2009LWD


    if (parameters.key) {
      this.key = parameters.key
    }


    if (parameters.keys) {
      var paperIds = parameters.keys.split(",")
      this.keys = paperIds
      var progress = await lively.showProgress("ensure alex papers");
      var count = 0
      for (var key of this.keys) {
        progress.value = count++/ this.keys.length;
        let node = await this.ensureNode(key)
        node.isRoot = true
      }
      progress.remove()
      this.key = this.keys[0]


      var allReferences = {}
      var allCitations = {}

      var tallyReferences = (key) => {
        if (!allReferences[key]) allReferences[key] = 0
        allReferences[key]++
      }
      var tallyCitations = (key) => {
        if (!allCitations[key]) allCitations[key] = 0
        allCitations[key]++
      }

      for (let node of this.nodes) {
        if (node.backwardKeys) {
          for (let key of node.backwardKeys) {
            tallyReferences(key)
          }
        }

        if (node.forwardKeys) {
          for (let key of node.forwardKeys) {
            tallyCitations(key)
          }
        }
      }

      // find interconnecting publications
      for (let key of Object.keys(allReferences)) {
        if ((allReferences[key] >= 1) && (allCitations[key] >= 1)) {
          await this.ensureNode(key)
        } else {
          if ((allReferences[key] >= 5)) {
            await this.ensureNode(key)
          }
        }
      }

      for (let node of this.nodes) {
        if (node.backwardKeys) {
          for (let key of node.backwardKeys) {
            let other = this.nodes.find(ea => ea.key == key)
            if (other) {
              this.connect(other, node)
            }
          }
        }

        if (node.forwardKeys) {
          for (let key of node.forwardKeys) {
            let other = this.nodes.find(ea => ea.key == key)
            if (other) {
              this.connect(node, other)
            }
          }
        }
      }
    } else {

      await this.ensureNode(this.key)
    }
  }

  async ensureNode(key) {
    var node = this.nodes.find(ea => ea.key == key)
    if (!node) {
      node = { id: this.counter++, key: key, forward: null, back: null }
      await this.initializeNode(node)
      node.forwardKeys = await this.getForwardKeys(node)
      node.backwardKeys = await this.getBackwardKeys(node)

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


  async expand(node, direction = "forward", getMethodName = "getForwardKeys") {

    // #TODO uncomment
    if (node.paper && node.paper.isPreview) {
      // load the actual paper and replace placeholder
      await this.loadPaper(node)
    }
    return super.expand(node, direction, getMethodName)
  }

  getBackwardKeysCount(node) {
    return (node.paper && node.paper.value.referenced_works_count) || "[]"
  }

  getForwardKeysCount(node) {
    return (node.paper && node.paper.value.cited_by_count) || "[]"
  }

  async initializeNode(node, preview) {
    // this.details.style.display = ""
    // var start = performance.now()
    // this.details.innerHTML = "Loading " + node.key
    // lively.setPosition(this.details, lively.pt(0,0))
    if (!node.key) return
    var paper = this.papersByKey[node.key]
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
    // this.details.innerHTML = "Loaded " + node.paper.key + " in " + ( performance.now() - start)
  }

  fixId(id) {
    return id.replace("https://openalex.org/", "")
  }

  async loadPaper(node, preview) {
    if (!node) return
    node.paper = await AlexPaper.getId(node.key)
    this.papersByKey[node.key] = node.paper
    var papers = []
    var referencesAndCitations = []
    
    if (preview) return;
    
    // we load the citations and references for the papers, so we know where to connect it...
    if (node.paper.value && node.paper.value.referenced_works) {
      let ids = node.paper.value.referenced_works
        .map(ea => ea.match(/https:\/\/openalex.org\/(.*)/))
        .filter(ea => ea)
        .map(m => this.fixId(m[1]))
      node.paper._referenced_works_ids = ids

      // #TODO do we actually need to load the preview versions, now or could we do it on expand?
      await this.loadPreviewPapers(ids)
    }
    if (node.paper.value.cited_by_api_url) {
      var url = node.paper.value.cited_by_api_url.replace("https://api.openalex.org/", "alex://data/") +
        "&select=id"
      var results = await Literature.fetchAllPages(url)
      let ids = results.map(ea => this.fixId(ea.id))
      node.paper._citations_ids = ids
      await this.loadPreviewPapers(ids)
    }
  }


  async expand(node, direction = "forward", getMethodName = "getForwardKeys") {
    if (node[direction + "Expanded"]) {
      return this.collapse(node, direction)
    }

    if (node.paper.isPreview) {
      await this.loadPaper(node)
    }


    node[direction] = []
    var keys = await this[getMethodName](node)

    // now, we load shallow versions of the papers in bulk, so that we don't trigger a full load in ensureNode
    // await this.loadPreviewPapers(keys)
    var progress = await lively.showProgress("expand " + direction + " (" + keys.length + ")")
    var progressCounter = 0
    for (let ea of keys) {
      progress.value = progressCounter++/ keys.length
      node[direction].push(await this.ensureNode(ea))
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
    // lively.openBrowser("bib://" + node.key, false)

    this.details.innerHTML = ""
    var paperElement = await (
      <literature-paper alexid={node.paper.alexid} mode="short" open="browse"></literature-paper>)
    paperElement.updateView()
    this.details.style.display = ""
    this.details.appendChild(paperElement)
    lively.setClientPosition(this.details, lively.getClientBounds(element.parentElement).bottomLeft())
  }

  onSecondClick(evt, node, element) {
    // lively.openInspector(node)
    // lively.openBrowser("bib://" + node.key, false)
  }

  async getForwardKeys(node) {
    if (!node || !node.paper || !node.paper._citations_ids) return []
    return node.paper._citations_ids
  }

  async getBackwardKeys(node) {
    if (!node || !node.paper || !node.paper._referenced_works_ids) return []
    return node.paper._referenced_works_ids
  }


  // #important
  async update() {
    var node = await this.ensureRootNode()

    // if only one root node, lets exand it
    // if (!this.keys) {
    //   await this.expandForward(node)
    //   await this.expandBack(node)
    // } 
    await this.render()
  }
}
