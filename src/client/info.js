

export default class Info {
  
  static showModuleInfo() {
    lively.openComponentInWindow("lively-table").then(table => {
      table.style.overflow = "scroll"
      
      var url = lively4url + "/src/client"
      lively.files.statFile(url)
        .then(r => JSON.parse(r).contents)
        .then(files => {
          files.forEach(ea => {
            ea.dependencies = lively.findDependedModules(url + "/" + ea.name).map( dep => {
              return dep.replace(/.*\//,"")
            })
          })
          table.setFromJSO(files)    
        })
    })
  }
  
  
}