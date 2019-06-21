# Changes

<lively-import src="_navigation.html"></lively-import>


<script>
  import Paths from "src/client/paths.js"
  import moment from "src/external/moment.js";  
  import diff from 'src/external/diff-match-patch.js';
  
  var dmp = new diff.diff_match_patch();
  
  
  var url = lively4url + "/"
  
  
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

    var data   
    var versions, groups, topChanged;
    
    var selectChange = function(change, row) {
      var element = row.querySelector(".details")
      debugger
      if (element.textContent == "") {
        element.textContent = JSON.stringify(change, null, 2)
      } else {
        element.textContent = ""
      }
    }

    var updateTable = async (sorted) => {
      table.innerHTML = ""

      versions = (await lively.files.loadVersions(url, true).then(r => r.json())).versions

      data = versions.filter(ea => ea && ea.version) // cleanup
      
      data = data.slice(0, 100)
      
      
        
      if (sorted) {
        data = data.sortBy(ea => ea.count).reverse()
      }
      
      
      data.forEach(ea => {
        var row = <tr>
            <td class="version">
              <a id={ea.version} href={ea.version} click={(evt) => {
                evt.preventDefault()
                if (evt.shiftKey) {
                  lively.openInspector(ea)
                } else {
                  selectChange(ea, row)
                }
              }}>{ea.version}</a>
              <div class="details"></div>
            </td>
            <td class="parents">- {ea.parents}</td>
            <td class="date">{moment(ea.date).format("YYYY-MM-DD hh:mm:ss")}</td>
            <td class="author">{ea.author}</td>
            <td class="comment">{ea.comment}</td>
          </tr>
          
          /*

            */
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
    td.comment {
      max-width: 300px
    }
    `
    var div = document.createElement("div")
    div.appendChild(style)
    div.appendChild(table)
    return div
  })()
</script>