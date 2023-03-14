# TreeMap Size


<script>

(async () => {
  var url = lively4url + "/src/client/"
  var tree = await lively.files.fileTree(url)
  
  
  
  var div = await lively.create("div")
  div.style.position = "relative"
  div.style.width = "800px"
  div.style.height = "800px"
  
  var treemap = await lively.create("d3-treemap")
  treemap.setTreeData(tree)
  var d3 = treemap.d3
  div.appendChild(treemap)
  

  function visit(d, cb) {
    cb(d)
    d.children && d.children.forEach(ea => visit(ea,cb))
  }

  var maxSize = 0
  visit(treemap.treeData, ea => {
    if(ea.size) {
      maxSize = Math.max(maxSize, Number(ea.size))
    }
  })

  var color = d3.scaleLinear().domain([1,maxSize])
        .interpolate(d3.interpolateHcl)
        .range([d3.rgb("#FFFFFF"), d3.rgb('#3A3A3A')]);

  treemap.dataColor = function(d) {
    return color(d.data.size)
  }


  lively.sleep(0).then(() => 
    treemap.updateViz()
  )


  return div
})()
</script>