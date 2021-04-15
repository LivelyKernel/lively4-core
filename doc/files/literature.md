# Literature


## Papers

<script>
  import FileCache from "src/client/fileindex.js"

  (async () => {
    var files = await FileCache.current().db.files
      .filter(ea => ea.bibkey && ea.name.match(/\.pdf$/)).toArray();
      
    var entries = await FileCache.current().db.bibliography
      .filter(ea => ea.key).toArray();
    
    var keys = new Set()
    
    files.forEach(ea => keys.add(ea.key))
    entries.forEach(ea => keys.add(ea.key))

    function printCollection(collection) {
      return <ul>{... 
        collection.map(paper => {
          if (paper.file) {
            var filelink = <a style="color:gray" click={(evt) => {
                              if (evt.shiftKey) {
                                lively.openInspector(paper) // #Example #ExplorationPattern #ForMarcel build way into object inspector into UI
                              } else {
                                if (paper.file) lively.openBrowser(paper.file.url)
                              }
                            }
                          }>{paper.file.name}</a> 
          }
          if (paper.entry && paper.entry.keywords) {
            var keywords = <span class="keywords">{... paper.entry.keywords.map(ea => ea + " ")}</span>
          }

          return <li>
              <a click={() => lively.openBrowser("bib://" + paper.key)}>{
                "[" + paper.key +  "]"  }</a>
              {filelink || ""} {keywords || ""}
              </li> 
        }) }</ul>
    }



    function printYear(year) {
      return <div>
              <h3>{year}</h3>
              {printCollection(papersByYear[year])}
            </div>
    }
    
    let style = document.createElement("style")
    style.textContent = `
      .keywords {
        font-size: 9pt;
        color: lightgray;
      }
    `

    let papersByYear = Array.from(keys).map(key => {
        let file = files.find(ea => ea.bibkey == key)
        let entry = entries.find(ea => ea.key == key)
        return {key, file, entry}    
      }).groupBy(file => file.entry && file.entry.year)

  return <div>{style}
      <h2>By Year</h2>  
      {... Object.keys(papersByYear).map(year => printYear(year) )}
    </div>
  })()
</script>



## Bibliographies

<script>
  import FileCache from "src/client/fileindex.js"

  (async () => {
    var files = await FileCache.current().db.files
      .filter(ea => ea.name.match(/\.bib$/)).toArray();
    return <ul>{... files.map(ea => {
      return <li>
          <a style="color:gray" click={(evt) => {
              if (evt.shiftKey) {
                lively.openInspector(ea) // #Example #ExplorationPattern #ForMarcel build way into object inspector into UI
              } else {
                lively.openBrowser(ea.url)
              }
            }
          }>{ea.name}</a>
          </li> 
    }) }</ul>
  })()
</script>
