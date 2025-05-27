<script>
  import FileIndex from "src/client/fileindex.js"
  import Literature from "src/client/literature.js"
  import Bibliography from 'src/client/bibliography.js'
  

  var markdownComp = lively.query(this, "lively-markdown")
  var parameters = markdownComp.parameters

  var files = await FileIndex.current().db.files.filter(ea =>  ea.url 
            && ea.url.match(/\.pdf$/)                
            // && ea.url.match(/\/Ramson/) 
            // && ea.url.match(/2000-09/)
            ).toArray()
  
  if (parameters.filter) {
    files = files.filter(ea => parameters.filter(ea))
  }
 
  
  
  
  var entries = await FileIndex.current().db.bibliography.filter(ea =>  ea.url 
            // && ea.url.match(/_hirschfeld/) 
            // && ea.url.match(/\/Ramson/) 
            // && ea.url.match(/2000-09/)
            ).toArray()
  
  var result = entries.map(ea => ea.key + " &lt;- " + Bibliography.urlToKey(ea.url)).join("<br>")
  

  
  var references = {}
  
  for(let ea of entries) {
    var bibkey  = Bibliography.urlToKey(ea.url)
    if (bibkey) {
      var list = references[bibkey] || []  
      list.push(ea.key)
      references[bibkey] = list      
    }
  }
  
  var result =<div style="position: absolute; width:100%; height: 100%; overflow: auto">
    <h1>References</h1>
    <table>{... 
       files.map(ea => ({file: ea, key: ea.bibkey, references: references[ea.bibkey] || [] }))
        .map( ea => <tr>
                   <td><button click={() => lively.openInspector(ea)}>debug</button></td>
                   <td><a href={ "" + ea.file.url.replace(/[^/]*$/, "_marker/" + ea.file.name.replace(/\.pdf/, "/"))}>{ea.file.name.slice(0,50)}</a></td>

                   <td><a 
                            href={ "bib://" + ea.key}>{ea.key}</a></td><td>{ea.references.length}</td>
                    </tr> )
    }</table>
  </div> 
  lively.html.fixLinks([result], undefined, path => lively.openBrowser(path)); 
  result
</script>