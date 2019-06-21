# Links

<lively-import src="_navigation.html"></lively-import>

<script>
  import FileCache from "src/client/fileindex.js"
  import Paths from "src/client/paths.js"
  
  var container = lively.query(this, "lively-container");
  (async () => {
    var table = await lively.create("table", this)
    
    var update = document.createElement("button");
    update.addEventListener("click", async () => {
      try {
        await FileCache.current().updateAllLinks()
      } catch(e) {
        lively.notify("Error while analyzing links", e)
      }
      updateTable()
      lively.notify("updated all links")
    });
    update.innerHTML = "update";

    var button = document.createElement("button");
    var sorted = false
    button.addEventListener("click", () => {
      sorted = !sorted
      updateTable(sorted)
    });
    button.innerHTML = "sort";
    
    var data
    var updateTable = async (sorted) => {
      table.innerHTML = ""
      var files = (await FileCache.current().db.links.toArray());
      data = files
          .filter(ea => ea.url.match(lively4url)) // only show local files...
          // .slice(0,100) // #DEV
    
      data = data.sortBy(ea => ea.url)
    
      if (sorted) {
        data = data.sortBy(ea => ea.status)
      }

      data.forEach(ea => {
        var base = ea.url.replace(/[^/]*$/,"")
        var normalized = Paths.normalizePath(ea.link, ea.url)
        var color = ""
        if (ea.status == "broken") color = "color:red"
        
        var row = <tr >
            <td>{ea.status}</td>
            <td>{ea.location}</td>
            <td><a href={ea.url}>{ea.url.replace(lively4url, "")}</a></td>
            <td><a style={color} href={normalized}>{ea.link.replace(lively4url, "")}</a></td>
          </tr>
            // <td><a href={normalized}>{normalized}</a></td>
        table.appendChild(row)
        lively.html.fixLinks([row], base, (path) => {lively.openBrowser(path)});
      })
    }
    
    updateTable()
    
    var div = document.createElement("div")
    div.appendChild(update)
    div.appendChild(button)
    div.appendChild(table)
    return div
  })()
</script>
