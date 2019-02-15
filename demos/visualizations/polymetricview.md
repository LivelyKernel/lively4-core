# PolymetricView

<script>
import FileIndex from "src/client/fileindex.js"
import files from "src/client/files.js"
import moment from "src/external/moment.js";


import d3 from "src/external/d3.v3.js"

(async () => {
 
   var now = Date.now()
  
  var url = lively4url + "/src/client/"
  var tree = await files.fileTree(url)

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
  div.style.width = "2000px"
  div.style.height = "800px"
  
  var treemap = await lively.create("d3-polymetricview")

  treemap.setData(tree)
  
  treemap.style.backgroundColor = "lightgray"
  
  // positioning hack.... we make our coordinate system much easier by this
  lively.setPosition(treemap, lively.pt(0,0))

  treemap.style.width = "100%"
  treemap.style.height = "100%"
  
  div.appendChild(treemap)


  treemap.config({
      color(node) {
        if (!node.data) return ""
        return `hsl(10, 0%,  ${node.data.size / 100}%)`
      },

      width(node) {
        if (node.data.width === undefined) {
          if (node.data.size) {
            node.data.width = Math.sqrt(node.data.size) / 2
          } else {
            node.data.width = 30
          }
        } 
        return  node.data.width
      },

      height(node) {
        if (node.data.height === undefined) {
          if (node.data.size) {
            node.data.height = node.data.size / (Math.sqrt(node.data.size) / 2)
          } else {
            node.data.height = 30
          }
        } 
        return  node.data.height
     },
      
      onclick(node) {
        lively.openInspector(node.data)
      },

    })
  
  
  treemap.updateViz()

  return div
})()
</script>