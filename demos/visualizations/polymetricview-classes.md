# Complexity View?

<script>

import FileCache from "src/client/fileindex.js"

import FileIndex from "src/client/fileindex.js"
import files from "src/client/files.js"
import moment from "src/external/moment.js";
import d3 from "src/external/d3.v5.js"

(async () => {
  var now = moment(Date.now())
  var url = lively4url + "/demos/"
  var tree = {
    children: []
  }
  
  var classes = await FileCache.current().db.classes.toArray();
  classes = classes
    .filter(ea => ea.url.match(lively4url)) // only show local files...
    .filter(ea => ea.url.match("src/client/")) // only some aspects

  var nodesMap = new Map()

  function addNode(node) {
    var parent = ensureNode(node.url.replace(lively4url, "").split("/").reverse())
    parent.children.push(node)
  }

  function ensureNode(path) {
    if (path.length == 0) {
      return tree
    }
    var key = path.join("/")
    var node = nodesMap.get(key)
    if (!node) {
      console.log("add " + key)
      var [parentName, ...parentPath] = path
      node = {
        name: parentName, 
        url: lively4url + path.reverse().join("/"),
        children: []
      }
      nodesMap.set(key, node)
      var parent = ensureNode(parentPath)
      parent.children.push(node)
    }
    return node
  }
  
  classes.forEach(ea => addNode(ea) )


  function visit(d, cb) {
    cb(d)
    d.children && d.children.forEach(ea => visit(ea,cb))
  }

  var urlMap = new Map()
  visit(tree, ea => urlMap.set(ea.url, ea))
  
  // connect our dababase entries with visualization data nodes
  await FileIndex.current().db.files.each(ea => {
    var d = urlMap.get(ea.url)
    if (d) {
      d.index = ea
    }
  })
  
  var div = await lively.create("div")
  div.style.position = "relative"
  
  var treeviz = await lively.create("d3-polymetricview")
  // var treeviz = await lively.create("d3-radialtree")

  treeviz.setData(tree)
  
  treeviz.style.backgroundColor = "lightgray"
  
  // positioning hack.... we make our coordinate system much easier by this
  lively.setPosition(treeviz, lively.pt(0,0))

  treeviz.style.width = "3000px"
  treeviz.style.height = "400px"
  
  div.appendChild(treeviz)

  var minSize = 150

  var colorScale = d3.scaleLinear()
      .range(['#aaccff', '#808080'])
      .domain([10, 1 * 355])
      .interpolate(d3.interpolateHcl);

  treeviz.config({
      color(node) {
        if (!node.data || !node.data.index) return "gray"
        var days = moment.duration(now.diff(moment(node.data.index.modified))).asDays()
        
        return colorScale(days)
      },

      calcSize(node) {
        try {
          var size = node.data.end - node.data.start
          if (size > 0) return size
          return minSize
        } catch(e) {
          return minSize
        }
      },

      width(node) {
        if (!node.data) return minSize
        var size = Math.sqrt(this.calcSize(node))
        
        return size
      },

      height(node) {
        if (!node.data) return minSize
        var size = Math.sqrt(this.calcSize(node))
        
        return size
     },
      
      onclick(node, evt) {
      
        if (evt.shiftKey && node.data.url) {
          lively.openBrowser(node.data.url, true)  
        } else {
          lively.openInspector(node.data)
        }
      },

    })
  
  
  treeviz.updateViz()

  return div
})()
</script>