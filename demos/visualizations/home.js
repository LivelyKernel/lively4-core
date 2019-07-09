import moment from "src/external/moment.js"; 
import Strings from 'src/client/strings.js'

import _ from 'src/external/lodash/lodash.js'

export function key(id) {
  if (!id) throw ("id missing")
  return "_" + id.replace(/.*\//,"").replace(/[^a-z0-9A-Z_]/g,"")
}

export default class Home {
  
  constructor(url) {
    this.url = url
    
    window.SmalltalkHomeObjectsCache = window.SmalltalkHomeObjectsCache || new Map()
    window.SmalltalkHomeObjectsMap = window.SmalltalkHomeObjectsMap || new Map()

    
  }
  
  reset() {
    window.SmalltalkHomeObjectsCache = new Map()
    window.SmalltalkHomeObjectsMap = new Map()
    this.objectMap = window.SmalltalkHomeObjectsMap 
    this.fileCache = window.SmalltalkHomeObjectsCache
  }
  
  get zip() {
    return window.SmalltalkHomeObjects 
  }
  
  async updateData() {
    this.objects = new Map()

    this.fileCache = window.SmalltalkHomeObjectsCache 
    this.objectMap = window.SmalltalkHomeObjectsMap   
    
    this.dataByUUID = new Map()
    this.relations  = []
    
    this.counter = 0
    this.total = 1
    
    this.all = []
    this.objectLimit = undefined

    
    
    if (!zip) {
      var zip = window.SmalltalkHomeObjects
      var blob = await fetch(this.url).then(r => r.blob())
      zip = await JSZip.loadAsync(blob)
      window.SmalltalkHomeObjects = zip
    }
    var data  =  Object.keys(zip.files)

    this.linkToFilenameMap = new Map()
    data.forEach(ea => {
      var link = ea.replace(/.*\//,"").replace(/[^0-9A-Za-z]/g,"")
      this.linkToFilenameMap.set(link, ea)
    })

    this.progress = await lively.showProgress("update");
    this.total = data.length;

    var start = performance.now()


    try {
      for(var eaName of data) {
        if (this.objectLimit && (this.counter > this.objectLimit)) break; 
        var ea = await this.addObject(eaName)
        if (!ea) continue;
        if (ea.object) {
          this.all.push(ea.object)
          this.dataByUUID.set(ea.object.uuid, ea)
        }
        // analysis.push({type: object.object && object.object._class})
      }
    } finally {
      this.progress.remove()
    }   
  }
  
  
  async addObject (eaName) {
    var ea = this.objectMap.get(eaName)
    if(!ea) {
      ea = {name: eaName, file: this.zip.files[eaName]}
      this.objectMap.set(eaName, ea)

      var contents = this.fileCache.get(eaName)
      if (!contents) {
        contents = await ea.file.async("string")
        this.fileCache.set(eaName, contents)            
      }

      ea.links = Strings.matchAll(/DomainObjectLink\{\#uuid\:UUID\['([A-Za-z0-9\-]+)'\]/g, contents).map(ea => ea[1])
      try {
        ea.object  = this.parseSTON(contents)
      } catch(e) {
        ea.error = e
        ea.transformed = this.transformSTONToJS(contents || "")
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

    // #TODO COP?
    if (this.progress) {
      this.progress.value = this.counter++ / this.total
    }
    return ea
  }
  
  transformSTONToJS(input) {
    var output  =  input
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
    return "(" +output + ")"
  }
    
  
  parseSTON(source) {
    if (!source) return {}
    // define "global" variables for the next eval... (which will find them in its local scope)
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
    return eval(this.transformSTONToJS(source))
  }
  
  
  extractRelations(object, sub=object, path=[]) {
    Object.keys(sub).forEach(key => {
      var target = sub[key] 
      if (_.isObject(target)) {
        if (target._class == "DomainObjectLink") {
          var other = this.dataByUUID.get(target.uuid)
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
            this.relations.push(relation)
            // console.log("relation", relation)
          }
        } else {
          this.extractRelations(object, target, path.concat([key]))
        }
      }
    })
  }
  
}