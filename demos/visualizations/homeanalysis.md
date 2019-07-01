# Home Object Soups...


<lively-import src="_navigation.html"></lively-import>

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





  function transformSTONToJS(source) {
    var source  =  source
      // .replace(/\n/g, "")
      .replace(/\{-\}/g, " - ")
      .replace(/(^|[^\\A-Za-z0-9_])([A-Za-z0-9_\-]+)\{/g, "$1{_class: '$2', ")
      .replace(/([,{\[] ?)#([A-Za-z0-9_\-]+)([:,\]])/g, "$1'$2'$3") 
      .replace(/([,{\[] ?)#([A-Za-z0-9_\-]+)([:,\]])/g, "$1'$2'$3")  // OH NO... use lookahead?
      .replace(/([: ])\@([0-9]+)/g, "$1'@$2'") 
      .replace(/OrderedCollection\[/g, "[") 
      .replace(/Set\[/g, "[")
      .replace(/\\\\/g, "\\")
      // `\\\\'`
    return "(" +source + ")"
  }
    
  
  function parseSTON(source) {
    if (!source) return {}
    var nil = undefined
    var DateAndTime = new Proxy({}, {
      get(target, key, receiver) {
        return moment(key)
      }
    })
    var Date = new Proxy({}, {
      get(target, key, receiver) {
        return moment(key)
      }
    })
    var UUID = new Proxy({}, {
      get(target, key, receiver) {
        return `${key}` 
      }
    })
    return eval(transformSTONToJS(source))
  }
  
  
  class ObjectGraph {

    static connectInput(element, initValue, update) {
      element.value = initValue
      element.addEventListener("change", function(evt) {
          update(this.value)
      })
    }
    
    static query(query) {
      return lively.query(this.ctx, query)
    }
    
    static async create(ctx) {
      this.ctx = ctx
  
      var url = "http://localhost:9005/Desktop/object-storage.zip"

      this.query("input#url").value = url
      var limitElement = this.query("input#limit")

      limitElement.value = MAX_ELEMENTS
      
      var urlElement = this.query("input#url")
      

      var limit = Number(limitElement.value)
      limitElement.addEventListener("change", function(evt) {
          limit = Number(this.value)
          updateTable() // on Enter
      });
      
      urlElement.addEventListener("change", function(evt) {
        url = this.value
        updateTable() // on Enter
      });

      window.SmalltalkHomeObjectsCache = window.SmalltalkHomeObjectsCache || new Map()
      var fileCache = window.SmalltalkHomeObjectsCache 
      
      
      window.SmalltalkHomeObjectsMap = window.SmalltalkHomeObjectsMap || new Map()
      var objectMap = window.SmalltalkHomeObjectsMap 
      
      function reset() {
        window.SmalltalkHomeObjectsCache = new Map()
        window.SmalltalkHomeObjectsMap = new Map()
      }
      
      
      // reset()
      
      var objects
      
      

      var linkToFilenameMap

      function linkToFilename(link) {
        return linkToFilenameMap.get(link)
      }

      function key(id) {
        if (!id) throw ("id missing")
        return "_" + id.replace(/.*\//,"").replace(/[^a-z0-9A-Z_]/g,"")
      }

      
      var classColors = new Map()
      
      
      var all = [];
   
      var dataByUUID = new Map()
   
      var updateData = async () => {
        objects = new Map()

        if (!zip) {
          var zip = window.SmalltalkHomeObjects
          var blob = await fetch(url).then(r => r.blob())
          zip = await JSZip.loadAsync(blob)
          window.SmalltalkHomeObjects = zip
        }
        var data  =  Object.keys(zip.files)
        
        linkToFilenameMap = new Map()
        data.forEach(ea => {
          var link = ea.replace(/.*\//,"").replace(/[^0-9A-Za-z]/g,"")
          linkToFilenameMap.set(link, ea)
        })

        var progress = await lively.showProgress("update");
        var total = data.length;
        var i=0
        var start = performance.now()
        
        var addObject = async (eaName) => {
          var ea = objectMap.get(eaName)
          if(!ea) {
            ea = {name: eaName, file: zip.files[eaName]}
            objectMap.set(eaName, ea)

            var contents = fileCache.get(eaName)
            if (!contents) {
              contents = await ea.file.async("string")
              fileCache.set(eaName, contents)            
            }

            ea.links = Strings.matchAll(/DomainObjectLink\{\#uuid\:UUID\['([A-Za-z0-9\-]+)'\]/g, contents).map(ea => ea[1])
            try {
              ea.object  = parseSTON(contents)
            } catch(e) {
              ea.error = e
              ea.transformed = transformSTONToJS(contents || "")
            }
            ea.contents = contents
          }

//           if (ea.links) { 
//             for(var link of ea.links) {
//               if (!objects.get(key(link))) {
//                 if (i < limitElement.value) {
//                   var filename = linkToFilename(link)
//                   if (filename) {
//                     // await addObject(filename))
//                   } else {
//                     console.log("could not find file for:" + link)
        
//                   }
//                 } else {
//                   unfinished=true   
//                 }
//               }
//             }            
//          }

          progress.value = i++ / total
          return ea
        }
        
        
        

        
        try {
          for(var eaName of data) {
            if (i > limitElement.value) break; 
            var ea = await addObject(eaName)
            if (!ea) continue;
            if (ea.object) {
              all.push(ea.object)
              dataByUUID.set(ea.object.uuid, ea)
            }
            // analysis.push({type: object.object && object.object._class})
          }
        } finally {
          progress.remove()
        }   
      }

      var tables = []
      async function addTableFromDataCB(title, array) {
        var table = await (<lively-table></lively-table>)
        table.setFromJSO(array)
        tables.push(<div><h2>{title}</h2>{table}</div>)
      }

      await updateData()
      
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

      
      var byClass = _.groupBy(all, ea => genClass(ea))
      var byTag = new GroupMap()
      for(var ea of all) {
          if (ea.additionalState && ea.additionalState.tags) {
            var tags = ea.additionalState.tags
            if (_.isString(tags)) {
              byTag.add(tags, ea)
            } else {
              for(var eaTag of tags) {
                if (eaTag && eaTag.split) {
                  eaTag.split(/;/).forEach(eaSubTag => {
                    if (eaSubTag == "b") {
                      debugger
                    }
                    byTag.add("" + eaSubTag, ea)
                  })
                } else {
                   byTag.add("" + eaTag, ea)
                }
                
              }
            }
          }
      }

      var relations  = []

      function extractRelations(object, sub=object, path=[]) {
        Object.keys(sub).forEach(key => {
          var target = sub[key] 
          if (_.isObject(target)) {
            if (target._class == "DomainObjectLink") {
              var other = dataByUUID.get(target.uuid)
              if (!other) {
                // console.warn("UUID reference not found " + target.uuid + " in " + object.uuid)
              } else {
                var kind = key
                if (_.isNumber(key) || key.match(/^[0-9]+$/)) {
                  kind = path[path.length - 1]       
                  if (_.isNumber(kind) || kind.match(/^[0-9]+$/)) {
                    // array in array #BUG in data.... @Patrick?
                    kind = path[path.length - 2]
                  }
                  
                } 
                var relation = { kind: kind, object: object, target: target}
                relations.push(relation)
                // console.log("relation", relation)
              }
            } else {
              extractRelations(object, target, path.concat([key]))
            }
          }
        })
      }
                            
      
      for(var ea of all) {
         extractRelations(ea)
      }
      var relationsByKind = _.groupBy(relations, ea => ea.kind)
      var relationsHistogram = Object.keys(relationsByKind)
          .map(key => ({name: key, count: relationsByKind[key].length}))
          // .filter(ea => ea.count > 1)
          .sortBy(ea => ea.count)
          .reverse()
      
      await addTableFromDataCB("Relations", relationsHistogram)



      await addTableFromDataCB("Classes", Object.keys(byClass).map(ea => ({name: ea, instances: byClass[ea].length})))
      await addTableFromDataCB("Tags", 
        byTag
          .map((key, values) => ({name: key, count: values.size}))
          .filter(ea => ea.count > 10)
          .sortBy(ea => ea.count)
          .reverse())
   
      function addKeyValuePrintObject(value) {
        const maxPrintKeyLength = 100
        return ("" + JSON.stringify(value)).slice(0,maxPrintKeyLength)
      } 
      
      function addKeyValue(row, key, value) {
        if (value instanceof Array) {
          for(var i=0; i< value.length; i++) {
            row[key +"_" +i]  =  addKeyValuePrintObject(value[i])
          }
        } else {
          row[key]  = addKeyValuePrintObject(value)
        }
      }
     
      async function printClassExcerps() {
        for(var eaClassName of Object.keys(byClass)) {
          var allInstances = byClass[eaClassName]
          await addTableFromDataCB("Sample Objects of " + eaClassName, allInstances.slice(0,5).map( ea => {
              var row = {}
              if(!ea) return row
              var datum = dataByUUID.get(ea.uuid);
              if (datum.links) {
                row._linksCount = datum.links.length
              }
              for(var key of Object.keys(ea)) {
                addKeyValue(row, key, ea[key])
              }
              if (ea.additionalState) {
                Object.keys(ea.additionalState).forEach(key => {
                  addKeyValue(row, key, ea.additionalState[key])
                })
                delete row.additionalState
              }
              return row
            }))
        }      
      } 
      
      
      await printClassExcerps()
      
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
        <button click={evt => {
          lively.notify("reset")
          reset();
          updateTable()
        }}>reset</button>
        <button click={evt => updateTable()}>update</button>
        <div id="tables">{...tables}</div>
      </div>)
      return div
    }
  }
  ObjectGraph.create(this)
</script>