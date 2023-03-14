# Tree FileIndex Modification Time



<script>
// import FileIndex = await System.import("src/client/fileindex.js")
import FileIndex from "src/client/fileindex.js"
import files from "src/client/files.js"
import moment from "src/external/moment.js";
import d3 from "src/external/d3.v5.js"

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
  div.style.width = "800px"
  div.style.height = "800px"
  
  var treemap = await lively.create("d3-tree")
  treemap.setTreeData(tree)
  treemap.style.backgroundColor = "lightgray"
  
  // positioning hack.... we make our coordinate system much easier by this
  lively.setPosition(treemap, lively.pt(0,0))
  treemap.style.width = "100%"
  treemap.style.height = "100%"
  
  div.appendChild(treemap)


  var maxSize = 0
  visit(treemap.treeData, ea => {
    if(ea.size) {
      maxSize = Math.max(maxSize, Number(ea.size))
    }
  })

  // var color = d3.scaleLinear().domain([0,25])
  //       .interpolate(d3.interpolateHcl)
  //       .range([d3.rgb("#FFFFFF"), d3.rgb('#9A9A9A')]);

  var color = d3.scaleLinear().domain([0,365 / 2 ])
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb("#FFFFFF"), d3.rgb('#9A9A9A')]);



  treemap.dataColor = function(d) {
    // return color(d.data.index && d.data.index.tags ? d.data.index.tags.length : 0)
    if (d.data.index) {
      var time = moment(d.data.index.modified)
      var days = (now - time._d.getTime()) / 1000 / 60 / 60 / 24

      return color(days)
    }
  }
  
  treemap.dataClick = function(d) {
    lively.openInspector(d)
    
    // if (d.data && d.data.url) {
    //   lively.openBrowser(d.data.url)
    // }
  }

  
  lively.sleep(0).then(() => 
    treemap.updateViz()
  )
  return div
})()
</script>