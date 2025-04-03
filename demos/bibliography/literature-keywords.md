<script>
  import FileIndex from "src/client/fileindex.js"
  import Literature from "src/client/literature.js"
  import Bibliography from 'src/client/bibliography.js'
  

  var files = await FileIndex.current().db.files.filter(ea =>  ea.keywords &&  ea.url.match(/keywords$/)).toArray()
  
  var keywords = {}
  
  for(let ea of files) {
    debugger
    for(let keyword of ea.keywords) {
      var list = keywords[keyword] || []  
      list.push(ea)
      keywords[keyword] = list
    }
  }
  
  

  var result =<div>
    <h1>Keywords</h1>
    <div>{... 
       Object.keys(keywords)
          .map(ea => ({keyword: ea, files: keywords[ea]}))
          .filter(ea => ea.files.length > 1)
          .sortBy(ea => ea.files.length)
          .reverse()
        .map( ea => <span><a title={ea.files.map(ea => ea.bibkey).join(" ")} style={"font-size:" + ((ea.files.length * 0.4)  + 5) + "pt" } href={ "keyword://" + ea.keyword.replace(/#/,"")}>{ea.keyword}</a> </span> )
    }</div>;
  </div> 
  lively.html.fixLinks([result], undefined, path => lively.openBrowser(path)); 
  result
</script>