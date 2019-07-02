# Home Object Soup Analysis

<div>
url <input style="width:500px" id="url" value=""><br>
limit <input id="limit">
</div>

<script>
  const MAX_ELEMENTS = 20000

  import moment from "src/external/moment.js";  
  import Strings from 'src/client/strings.js'  
  import Colors from "src/external/tinycolor.js"
  import d3 from "src/external/d3.v5.js"
  import beautify from "src/client/js-beautify/beautify.js"
  import {GroupMap} from "src/client/collections.js"

  import {key} from "./home.js" // #Bug #TODO, Home as the default class is undefined in this list...
  import Home from "./home.js" // and here not
  
  import ScriptApp from "./scriptapp.js"
  
  class ObjectAnalysis extends ScriptApp {

    static async create(ctx) {
      // var url = "livelyfile:///object-storage.zip"
      var url = "http://localhost:9005/Desktop/object-storage.zip"
      this.home = new Home(url)
      var home = this.home
      this.ctx = ctx
  
      this.get("input#url").value = this.url
      var limitElement = this.get("input#limit")
      limitElement.value = MAX_ELEMENTS
      
      var urlElement = this.get("input#url")
      urlElement.value = home.url
      urlElement.addEventListener("change", async function(evt) {
        home.url = this.value
        lively.notify('HOME ' + home.url )
        await home.updateData()
        updateTable() // on Enter
      });
    
      
      function linkToFilename(link) {
        return linkToFilenameMap.get(link)
      }

      var classColors = new Map()
     
      this.home.objectLimit = limitElement.value
      await this.home.updateData()

      this.tablesElement = <div id="tables"></div>
      await this.updateTables()

      var style = document.createElement("style")
      style.textContent = `
        td.comment {
          max-width: 300px
        }
        div#root {
          overflow: visible;
        }
      `
      var div = document.createElement("div")
      div.id = "root"
      
      div.appendChild(style)
      div.appendChild(<div>
        <button click={async (evt) => {
          lively.notify("reset")
          this.tables.innerHTML = ""
          await this.home.reset();
          await this.home.updateData()
          await this.updateTables()
        }}>reset</button>
        <button click={async (evt) => {
          this.tables.innerHTML = ""
          await this.home.updateData()
          await this.updateTables()
        }}>update</button>
        {this.tablesElement}
      </div>)
      return div
    }

    static async addTableFromDataCB(title, array) {
      var table = await (<lively-table></lively-table>)
      table.setFromJSO(array)
      this.tables.push(<div><h2>{title}</h2>{table}</div>)
    }


    static async updateTables() {
      this.tables = []
      var tables = this.tables

      function genClass(ea) {
        if (ea && ea._class == "CreativeWork") {
          var result =ea._class 
          if (ea.additionalState && ea.additionalState.publicationtype) {
            result += "." + ea.additionalState.publicationtype
          }
          // if (ea.additionalState && ea.additionalState.tags) {
          //   for(var eaTag of ea.additionalState.tags) {
          //     result += "." + eaTag            
          //   }
          // }
          return result  
        }
        return (ea && ea._class)  || "undefined"
      }

      this.byClass = _.groupBy(this.home.all, ea => genClass(ea))
      this.byTag = new GroupMap()
      for(var ea of this.home.all) {
          if (ea.additionalState && ea.additionalState.tags) {
            var tags = ea.additionalState.tags
            if (_.isString(tags)) {
              this.byTag.add(tags, ea)
            } else {
              for(var eaTag of tags) {
                if (eaTag && eaTag.split) {
                  eaTag.split(/;/).forEach(eaSubTag => {
                    if (eaSubTag == "b") {
                      debugger
                    }
                    this.byTag.add("" + eaSubTag, ea)
                  })
                } else {
                   this.byTag.add("" + eaTag, ea)
                }

              }
            }
          }
      }

      for(var ea of this.home.all) {
         this.home.extractRelations(ea)
      }
      var relationsByKind = _.groupBy(this.home.relations, ea => ea.kind)
      var relationsHistogram = Object.keys(relationsByKind)
          .map(key => ({name: key, count: relationsByKind[key].length}))
          // .filter(ea => ea.count > 1)
          .sortBy(ea => ea.count)
          .reverse()

      await this.addTableFromDataCB("Relations", relationsHistogram)

      await this.addTableFromDataCB("Classes", Object.keys(this.byClass).map(ea => 
        ({name: ea, instances: this.byClass[ea].length})))
      await this.addTableFromDataCB("Tags", 
        this.byTag
          .map((key, values) => ({name: key, count: values.size}))
          .filter(ea => ea.count > 10)
          .sortBy(ea => ea.count)
          .reverse())

      await this.printClassExcerps()

      this.tablesElement.innerHTML = ""
      this.tables.forEach(ea => {
        this.tablesElement.appendChild(ea)
      })
    }

    static addKeyValuePrintObject(value) {
      const maxPrintKeyLength = 100
      return ("" + JSON.stringify(value)).slice(0, maxPrintKeyLength)
    }

    static addKeyValue(row, key, value) {
      if (value instanceof Array) {
        for(var i=0; i< value.length; i++) {
          row[key +"_" +i] = this.addKeyValuePrintObject(value[i])
        }
      } else {
        row[key] = this.addKeyValuePrintObject(value)
      }
    }

    static async printClassExcerps() {
      for(var eaClassName of Object.keys(this.byClass)) {
        var allInstances = this.byClass[eaClassName]
        await this.addTableFromDataCB("Sample Objects of " + eaClassName, allInstances.slice(0,5).map( ea => {
            var row = {}
            if(!ea) return row
            var datum = this.home.dataByUUID.get(ea.uuid);
            if (datum.links) {
              row._linksCount = datum.links.length
            }
            for(var key of Object.keys(ea)) {
              this.addKeyValue(row, key, ea[key])
            }
            if (ea.additionalState) {
              Object.keys(ea.additionalState).forEach(key => {
                this.addKeyValue(row, key, ea.additionalState[key])
              })
              delete row.additionalState
            }
            return row
          }))
      }      
    }
  }
  ObjectAnalysis.create(this)
</script>