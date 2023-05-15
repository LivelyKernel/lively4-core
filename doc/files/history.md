# History

<lively-import src="_navigation.html"></lively-import>

<script>

import FileIndex from "src/client/fileindex.js"
import moment from "src/external/moment.js";
import AnsiColorFilter from "src/external/ansi-to-html.js"
 
class ChangeHistory {

  constructor() {
    this.authorFilter = undefined
    this.lastMonths = 12
  }
  

  async createView() {
    
    
    this.livelySync = await (<lively-sync></lively-sync>)
    this.livelySync.setRepository(lively4url.replace(/.*\//,""))
        
    this.allhistory = await FileIndex.current().db.history.toArray()
    this.history = this.allhistory
                    .filter(ea => !ea.comment.match("AUTO-COMMIT"))
    
    this.filterLists()
    
    // Object.keys(byAuthor).map(ea => [byAuthor[ea].length, ea]).sortBy(ea => ea[0]).reverse()
    this.details = <div id="details"></div>

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
      
      #filterAuthor {
        width: 200px;
      }
      `
      this.authorList = await (<input-combobox value="" id="filterAuthor"></input-combobox>)
      this.authorList.setOptions(
        Object.keys(this.byAuthor)
          .sortBy(ea =>  this.byAuthor[ea].length)
          .reverse()
          .filter(ea => ea)
          .map(ea => ({value: ea, string: this.byAuthor[ea].length + " " + ea})))
      this.authorList.addEventListener("change", evt => this.onAuthorFilterChange(evt))
      
      this.pane = <div id="pane"></div>
      this.view = <div click={() => {
            this.details.innerHTML = ""
            lively.setPosition(this.details, lively.pt(0,0))
          }}>
          {style}
          {this.details}
          <button click={ async () => {
            await FileIndex.current().updateAllVersions()
            lively.success("history loaded")
          }}>load history</button>
          {this.authorList}
          {this.pane}
        </div>
    this.updateView()
    return this.view
  }
  
  filterLists() {
    this.byAuthor = this.history.groupBy(ea => ea.author)
    this.currentHistory = this.history.filter(ea => !this.authorFilter || ea.author.match(this.authorFilter) )
    this.byMonth = this.currentHistory.groupBy(ea => moment(ea.modified).format("YYYY-MM"))
  }
  
  updateView() {
    this.pane.innerHTML = ""
    this.pane.appendChild(<div>
      <h3>Last {this.lastMonths} Months</h3>{... 
        Object.keys(this.byMonth)
          .sort().map(ea => [this.byMonth[ea].length, ea, this.byMonth[ea]]).reverse().slice(0,this.lastMonths)
          .map(ea => 
            <div>
               <h3>{ea[1]}</h3> 
               {this.thinTable(this.tableFromEntries(ea[2]))}
            </div>)}
        }</div>)
  }
 
  async onAuthorFilterChange(evt) {
    this.authorFilter = this.authorList.value
    lively.notify("FILTER " + this.authorFilter)
    await this.filterLists()
    await this.updateView()
  }
  
  tableFromEntries(entries) {
    return <table style="width:1200px">{...
      entries.sortBy(entry => moment(entry.modified).toISOString()).reverse()
        .map(entry => <tr click={evt => {
          if (evt.shiftKey) {
            lively.openInspector(entry)
          }
        }}>
           <td style="width:200px">{moment(entry.modified).format("YYYY-MM-DD HH:MM")}</td>
           <td style="width:200px">{entry.author}</td>
           <td class="link" style="width:200px"><a href="xxx" click={async (evt) => {
               evt.stopPropagation()
               evt.preventDefault()
               this.details.innerHTML = await this.livelySync.gitControl("show", undefined, {
                  gitcommit: entry.version,
                  gitusecolor: "true",
                }).then(text => {
                  return this.livelySync.linkifyFiles(new AnsiColorFilter().toHtml(text.replace(/</g, "&lt;")))
                })

                lively.setClientPosition(this.details, lively.getPosition(evt))

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
        </table>
  
  }
  
  thinTable(table) {
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
  
}

new ChangeHistory().createView()
</script>
