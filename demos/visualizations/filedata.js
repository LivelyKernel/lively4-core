import FileIndex from "src/client/fileindex.js"
import files from "src/client/files.js"
// import moment from "src/external/moment.js";

import { walkTreeData } from "src/components/d3/d3-component.js"

export async function loadedModulesData(url) {

  var urlMap = new Map()
  var idCounter = 1

  // var now = Date.now()
  var tree = await files.fileTree(url)

  walkTreeData(tree, d => {
    d.id = idCounter++
    urlMap.set(d.url, d)
  })

  // connect our dababase entries with visualization data nodes
  await FileIndex.current().db.files.each(eaFile => {
    var d = urlMap.get(eaFile.url)
    if (d) {
      d.index = eaFile
      d.size = Number(d.index.size)
      d.label = d.name
    }
  })

  var relations = []
  Object.values(System.loads).forEach(load => {
    var sourceNode = urlMap.get(load.key)
    if (sourceNode) {
      sourceNode.load = load;
    }

    load.dependencies.forEach((dependency) => {
      var depKey = System.normalizeSync(dependency, load.key)
      var targetNode = urlMap.get(depKey)
      if (!sourceNode || !targetNode) {
        if (!sourceNode)
          console.log("could not find node" + load.key)
        if (!targetNode)
          console.log("could not find node" + depKey)
      } else {
        // console.log("add relation " + sourceNode.id + " -> " + targetNode.id)
        relations.push({
          source: sourceNode.id,
          target: targetNode.id,
        })
      }
    })
  })

  walkTreeData(tree, d => {
    d.hidden = !(d.name.match(/\.js$/) && d.load)
  })

  return {
    nodes: tree,
    relations: relations
  }
}
