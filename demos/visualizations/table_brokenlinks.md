## Find Broken Links

<script>
  import FileIndex from "src/client/fileindex-analysis.js"
  import d3 from "src/external/d3.v3.js" 

  (async () => { 
  var d3table = await lively.create("lively-analysis-table")
  var div = await lively.create("div")
  
  var links = new Array()
  let rowNumber = 1;
  await FileIndex.current().db.links.orderBy('location').reverse().each((link) => {
    links.push({
      id: link.url,
      No: rowNumber++,
      status: link.status,
      link: link.link,
      location: link.location,
      file: link.url 
    })
  })
  d3table.setData(links)
  d3table.updateViz()
  div.appendChild(d3table)
  
  
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
  
 
  return div
  
  })()
</script>