# Methods

<lively-import src="_navigation.html"></lively-import>

Auto-generated list of taggedFiles found in (browser-local) files data-base.

<script>
  import FileIndex from "src/client/fileindex.js"
  import Paths from "src/client/paths.js"
  import moment from "src/external/moment.js";  
  import diff from 'src/external/diff-match-patch.js';

  var dmp = new diff.diff_match_patch();
  
  var container = lively.query(this, "lively-container");
  (async () => {
    var table = await lively.create("table", this)
    
    var update = document.createElement("button");
    update.addEventListener("click", async () => {
      try {
        await FileIndex.current().updateAllLinks()
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
      var lastVersion
      method.changes
        .sortBy(ea => moment(ea.date).format("YYYY-MM-DD hh:mm:ss"))
        .forEach(ea => {
          var li = <li>{ea.action} {ea.commitId} <a href={ea.date} click={(evt => {
            evt.preventDefault()
            selectMethodVersion(method, ea, li)
          })}>{
             moment(ea.date).format("YYYY-MM-DD hh:mm:ss")
          }</a><div class="details"></div></li>
          element.appendChild(li)
        })
      
    }
    
    var selectMethodVersion = function(method, version, li) {
      var details = li.querySelector(".details")
      if (details.textContent == "") {
        details.textContent  = version.source
        if (version.action == "modified") {
          var diff1 = dmp.diff_main(version.previousSource, version.source);
          dmp.diff_cleanupSemantic(diff1)
          details.innerHTML = dmp.diff_prettyHtml(diff1)      
        }      
      } else {
        details.textContent = ""
      }
      
     
    }
    
    var updateTable = async (sorted) => {
      table.innerHTML = ""

      var versionsTable = FileIndex.current().db.versions
      versions = await versionsTable.toArray()
      
      // #FastFeedback #Pattern Reduce working set to get faster feedback #Example
      // versions = versions.filter(ea => ea.url.toString().match("/files.js"))
      
      groups = _.groupBy(versions, ea => (ea.static ? "static " : "") +(ea.kind) + " "+ ea.class + ">>" + ea.method)
      data = Object.keys(groups).map(ea => ({
          methodOfClass: ea, 
          count: groups[ea].length, 
          changes: groups[ea]
        }))
        
      if (sorted) {
        data = data.sortBy(ea => ea.count).reverse()
      }

      // data = data.slice(0,1000)


      data.forEach(ea => {
        var row = <tr >
            <td><a href={ea.methodOfClass} click={(evt) => {
              evt.preventDefault()
              if (evt.shiftKey) {
                lively.openBrowser(ea.changes[0].url, true)
                // lively.openInspector(ea)
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