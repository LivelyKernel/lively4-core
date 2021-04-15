# Changes

<lively-import src="_navigation.html"></lively-import>


<div>
range :<input id="limitStart" > - <input id="limitEnd">
</div>

<script>
  import Paths from "src/client/paths.js"
  import moment from "src/external/moment.js"
  import diff from 'src/external/diff-match-patch.js'
  
  class ChangesApp {
    static async create(ctx) {
      var container = lively.query(ctx, "lively-container");
      var dmp = new diff.diff_match_patch();
      var url = lively4url + "/"

      var table = await lively.create("table", ctx)

      var params = container.getURL().searchParams
  
      var limitStart = params.get("limitStart") || 0 
      var limitEnd = params.get("limitEnd")|| 100

      function connectInput(element, initValue, update) {
        element.value = initValue
        element.addEventListener("change", function(evt) {
            update(this.value)
        })
      }
      connectInput(lively.query(ctx, "input#limitStart"), 
        limitStart, 
        value => {
            limitStart = Number(value)
            updateTable()
        })

      connectInput(lively.query(ctx, "input#limitEnd"), 
        limitEnd, 
        value => {
            limitEnd = Number(value)
            updateTable()
        })

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
        if (element.textContent == "") {
          element.textContent = JSON.stringify(change, null, 2)
        } else {
          element.textContent = ""
        }
      }

      var updateTable = async (sorted) => {
        table.innerHTML = ""

        // Fuck... some custom clever chaching logic? #TODO pull this out here!
        var useCached  = false;
        if (!lively.files.versionHistoriesLoaded) lively.files.versionHistoriesLoaded = new Map();
        var maxCacheTime = 1000 * 60 * 5; // 5min in ms
        var lastLoaded = lively.files.versionHistoriesLoaded.get(url)
        if (lastLoaded && ((Date.now() - lastLoaded)  < maxCacheTime)) {
          useCached = true
          lively.notify("use cached version history")
        } else {
          lively.files.versionHistoriesLoaded.set(url, Date.now())
          lively.notify("update version history")
        }

        versions = (await lively.files.loadVersions(url).then(r => r.json())).versions

        data = versions.filter(ea => ea && ea.version) // cleanup

        data = data.slice(0, 1000)

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
    }
  }
  ChangesApp.create(this)
</script>