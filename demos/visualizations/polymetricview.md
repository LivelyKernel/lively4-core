# PolymetricView

<script>
import FileIndex from "src/client/fileindex.js"
import files from "src/client/files.js"
import moment from "src/external/moment.js";

(async () => {
 
   var now = Date.now()
  
  var url = lively4url + "/demos/"
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
  
  var treemap = await lively.create("d3-polymetricview")

  treemap.setData(tree)
  
  treemap.style.backgroundColor = "lightgray"
  
  // positioning hack.... we make our coordinate system much easier by this
  lively.setPosition(treemap, lively.pt(0,0))

  treemap.style.width = "3000px"
  treemap.style.height = "400px"
  
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
            node.data.height = (Math.sqrt(node.data.size) / 2)
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