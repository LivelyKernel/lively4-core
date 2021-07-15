# History

<lively-import src="_navigation.html"></lively-import>

<script>

import FileIndex from "src/client/fileindex.js"
import moment from "src/external/moment.js";
import AnsiColorFilter from "src/external/ansi-to-html.js"
 
class ChangeHistory {

  static thinTable(table) {
    var currentRow = []
    for(let tr of table.querySelectorAll("tr")) {
      var tds = tr.querySelectorAll("td")
      debugger
      for(let i=0; i < tds.length; i++) {
        var td = tds[i]
        if (currentRow[i] == td.textContent) {
          td.textContent = ""
        } else {
          currentRow[i] = td.textContent
        }
      }
    }
    return table
  }

  static async createView() {
    const lastMonths = 12
    
    var livelySync = await (<lively-sync></lively-sync>)
    livelySync.setRepository(lively4url.replace(/.*\//,""))
        
    var allhistory = await FileIndex.current().db.history.toArray()
    let history = allhistory.filter(ea => !ea.comment.match("AUTO-COMMIT"))
    
    var byAuthor = history.groupBy(ea => ea.author)
    var byMonth = history.groupBy(ea => moment(ea.modified).format("YYYY-MM"))

    // Object.keys(byAuthor).map(ea => [byAuthor[ea].length, ea]).sortBy(ea => ea[0]).reverse()
    var details = <div id="details"></div>

     var style = document.createElement("style")
      style.textContent = `

      div#details {
        position: absolute;
        font-family: monospace;
        white-space: pre;
        font-size: 8pt;
        background-color: lightgray;
        border: 1px solid gray;
        padding: 5px;
      }
      `

      let div = <div click={
          () => {
            details.innerHTML = ""
            lively.setPosition(details, lively.pt(0,0))
          }
    
        }>{style}{details}
        <button click={ async () => {
          await FileIndex.current().updateAllVersions()
          lively.success("history loaded")
        }}>load history</button>
        <h3>Last {lastMonths} Months</h3>
          {... Object.keys(byMonth)
         .sort().map(ea => [byMonth[ea].length, ea,byMonth[ea]]).reverse().slice(0,lastMonths)
         .map(ea => <li><h3>{ea[1]}</h3> 
         {
        this.thinTable(<table style="width:1200px">{...
          ea[2].sortBy(entry => moment(entry.modified).toISOString()).reverse()
                .map(entry => <tr>
                       <td style="width:200px">{moment(entry.modified).format("YYYY-MM-DD HH:MM")}</td>
                       <td style="width:200px">{entry.author}</td>
                       <td class="link" style="width:200px"><a href="xxx" click={async (evt) => {
                           evt.stopPropagation()
                           evt.preventDefault()
                           details.innerHTML = await livelySync.gitControl("show", undefined, {
                              gitcommit: entry.version,
                              gitusecolor: "true",
                            }).then(text => {
                              return livelySync.linkifyFiles(new AnsiColorFilter().toHtml(text.replace(/</g, "&lt;")))
                            })

                            lively.setGlobalPosition(details, lively.getPosition(evt))
                       
                           // lively.openInspector(entry)}
                         }
                       }>{entry.version}</a></td>
                       <td style="width:300px"> <a href={entry.url} click={async (evt) => {
                           evt.stopPropagation()
                           evt.preventDefault()
                           lively.openBrowser(entry.url, false)
                         }
                       }>{entry.name}</a></td>
                       <td>{entry.comment}</td></tr>)}
              </table>)
       }
            </li>)
  }</div>
  
    return div
  }
}

ChangeHistory.createView()
</script>
