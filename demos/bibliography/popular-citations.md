<script>
  import FileIndex from "src/client/fileindex.js"
  import Literature from "src/client/literature.js"
  import Bibliography from 'src/client/bibliography.js'
  

  var entries = await FileIndex.current().db.bibliography.toArray()
  debugger
  var citations = {}
  
  for(let ea of entries) {
    var bibkey  = Bibliography.urlToKey(ea.url)
    if (bibkey) {
      var list = citations[ea.key] || []  
      list.push(bibkey)
      citations[ea.key] = list      
    }
  }
  
  var result =<div>
    <h1>Citations</h1>
    <div>{... 
       Object.keys(citations)
          .map(ea => ({key: ea, citations: citations[ea]}))
          .filter(ea => ea.citations.length > 1)
          .sortBy(ea => ea.citations.length)
          .reverse()
        .map( ea => <span><a 
                            title={ea.citations.map(ea => ea).join(" ")} 
                            style={"font-size:" + ((ea.citations.length * 0.4)  + 5) + "pt" } 
                            href={ "bib://" + ea.key}>{ea.key}</a> 
                    </span> )
    }</div>;
  </div> 
  lively.html.fixLinks([result], undefined, path => lively.openBrowser(path)); 
  result
</script>