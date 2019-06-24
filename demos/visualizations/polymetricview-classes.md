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

  function ensureNode(data, path=[]) {
    if (path.length == 0) {
      return tree
    }
    var node = nodesMap.get(path.join("/"))
    if (!node) {
      node = data
      if (!node.children) node.children = []
      nodesMap.set(path.join("/"), node)
      var [parentName, ...parentPath] = path
      var parent = ensureNode({name: parentName, children: []}, parentPath)
      parent.children.push(node)
    }
    return node
  }
  
  classes.forEach(ea => ensureNode(ea, new URL(ea.url).pathname.split("/").reverse()))


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
  
  var treemap = await lively.create("d3-polymetricview")

  treemap.setData(tree)
  
  treemap.style.backgroundColor = "lightgray"
  
  // positioning hack.... we make our coordinate system much easier by this
  lively.setPosition(treemap, lively.pt(0,0))

  treemap.style.width = "3000px"
  treemap.style.height = "400px"
  
  div.appendChild(treemap)

  var colorScale = d3.scaleLinear()
      .range(['#aaccff', '#808080'])
      .domain([10, 1 * 355])
      .interpolate(d3.interpolateHcl);

  treemap.config({
      color(node) {
        if (!node.data || !node.data.index) return ""
        var days = moment.duration(now.diff(moment(node.data.index.modified))).asDays()
        
        return colorScale(days)
      },

      calcSize(node) {
        try {
          var size = node.data.end - node.data.start
          debugger
          if (size > 0) return size
          return 10
        } catch(e) {
          return 10
        }
      },

      width(node) {
        if (!node.data) return 10
        var size = Math.sqrt(this.calcSize(node))
        
        return size
      },

      height(node) {
        if (!node.data) return 10
        var size = Math.sqrt(this.calcSize(node))
        
        return size
     },
      
      onclick(node) {
        lively.openInspector(node.data)
      },

    })
  
  
  treemap.updateViz()

  return div
})()
</script>