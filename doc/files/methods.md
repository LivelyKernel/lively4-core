# Methods

<lively-import src="_navigation.html"></lively-import>

Auto-generated list of taggedFiles found in (browser-local) files data-base.

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
    
    var versions, groups, topChanged;
    
    var selectMethod = function(method, row) {
      var element = row.querySelector(".methods")
      element.innerHTML = ""
      method.changes.forEach(ea => {
        var li = <li><a href={ea.date} click={(evt => {
          evt.preventDefault()
          selectMethodVersion(method, ea, li)
        })}>{ea.date}</a><div class="details"></div></li>
        element.appendChild(li)
      })
      
    }
    
    var selectMethodVersion = function(method, version, li) {
      var details = li.querySelector(".details")
      details.innerHTML = "" + version.source
      
    }
    
    var updateTable = async (sorted) => {
      table.innerHTML = ""

      var versionsTable = FileIndex.current().db.versions
      versions = await versionsTable.toArray()
      groups = _.groupBy(versions, ea => ea.class + ">>" + ea.method)
      data = Object.keys(groups).map(ea => ({
          methodOfClass: ea, 
          count: groups[ea].length, 
          changes: groups[ea]
        }))
        
      if (sorted) {
        data = data.sortBy(ea => ea.count).reverse()
      }

      data.forEach(ea => {
        var row = <tr >
            <td><a href={ea.methodOfClass} click={(evt) => {
              evt.preventDefault()
              if (evt.shiftKey) {
                lively.openInspector(ea)
              } else {
                selectMethod(ea, row)
              }

            }}>{ea.methodOfClass}</a><div class="methods"></div></td>
            <td>{ea.count}</td>
          </tr>
          table.appendChild(row)
      })
    }
    
    updateTable()
    
    var style = document.createElement("style")
    style.textContent = `
    div.details {
      font-family: monospace;
      white-space: pre;
    }
    `
    var div = document.createElement("div")
    div.appendChild(style)
    div.appendChild(update)
    div.appendChild(button)
    div.appendChild(table)
    return div
  })()
</script>