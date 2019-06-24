# PolymetricView

<script>
import FileIndex from "src/client/fileindex.js"
import files from "src/client/files.js"
import moment from "src/external/moment.js";
import d3 from "src/external/d3.v5.js"

var data

(async () => {
  var div = await lively.create("div", this)
  div.style = "width:400px; height:200px"

  var treemap = await lively.create("d3-polymetricview", div)
  treemap.style.width = "500px"
  treemap.style.height = "500px"
  
  div.appendChild(treemap)
  
  
   treemap.config({
      color(node) {
        return "red"
        if (!node.data) return ""
        return `hsl(10, 0%,  ${node.data.size / 100}%)`
      },
      
      width(node) {
        return 20
        if (node.data.width === undefined) {
          node.data.width = Math.random() * 200
        } 
        return  node.data.width
      },

      height(node) {
      return 20
        if (node.data.height === undefined) {
          node.data.height = Math.random() * 200
        } 
        return  node.data.height
      },
      
      onclick(node) {
        lively.openInspector(node)
      },
    })
  
  
  // data =  JSON.parse(await fetch(lively4url + "/src/components/demo/flare.json").then(r => r.text()))
  // treemap.setData(data)
  // treemap.livelyExample()
  
  treemap.setData({
      name: "classes",
      children: [
        {name: "class A", loc: 10, size: 10, children: [{name: "method A1", loc: 3, size: 3}, {name: "method A2", loc: 7, size: 7}]},
        {name: "class B", loc: 30, size: 30, children: [{name: "method B1", loc: 30, size: 30}]},
        {name: "class C", loc: 50, size: 50, children: [{name: "method C1", loc: 50, size: 50}]}
      ]
    })
  
  
  
  
  treemap.get("svg").style.overflow = "visible"
  
  
  
  return div
})()
</script>