## Find Broken Links
[Broken Link](https://liv1234ely-kernel.org/) 
[Broken Link2](/qwertz/) 
[Working Link](/bootlog.md) 
[Working Link2](./../index.md) 

<script>
  import FileIndex from "src/client/fileindex-analysis.js"
  import d3 from "src/external/d3.v3.js" 

  (async () => { 
  var div = await lively.create("div")
  var d3table = await lively.create("lively-analysis-table")
  d3table.addEventListener('click', function(evt) {
   var tableRow = evt.path[1]
   console.log(tableRow.getAttribute('id')) 
  })
  
  var links = new Array()
  await  FileIndex.current().db.links.each((link) => {
    links.push({
      id: link.url,
      link: link.link,
      status: link.status,
      location: link.location,
      module: link.url
    })  
  })
  d3table.setData([
      {id: "1", column1: "1.1 value", column2: "1.2 value"},
      {id: "2", column1: "2.1 value", column2: "2.2 value"},
      {id: "3", column1: "3.1 value", column2: "3.2 value"},
    ])
  d3table.updateViz()
 
  
 /* var table = await lively.create("lively-table")
  var links = new Array()
   await  FileIndex.current().db.links.each((link) => {
    links.push({
      id: link.url,
      link: link.link,
      status: link.status,
      location: link.location,
      module: link.url
    })  

  })
  table.setFromJSO(links)
  table.addEventListener("mousedown", (evt) => {
    var tableRow = evt.path[1]
    var fileURL = tableRow.childNodes[3].innerHTML
    var link = tableRow.childNodes[0].innerHTML
    console.log(fileURL)
    console.log(link)
    let pattern = {       
        selection: link }
    lively.openBrowser(fileURL, true, pattern, undefined);
  })*/
  
  div.appendChild(d3table)
  return div
  
  })()
</script>