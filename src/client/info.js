

/*MD # Module Info

<script>
import Info from "src/client/info.js"
<button click={() => Info.showModuleInfo()}>Example</button>
</script>

MD*/

export default class Info {
  
  static showModuleInfo() {
    lively.openComponentInWindow("lively-table").then(table => {
      table.style.overflow = "scroll"
      
      var url = lively4url + "/src/client"
      lively.files.statFile(url)
        .then(r => JSON.parse(r).contents)
        .then(async files => {
          for(var ea of files) {
            ea.dependencies = await lively.findDependedModules(url + "/" + ea.name).map( dep => {
              return dep.replace(/.*\//,"")
            })
          }          
          table.setFromJSO(files)    
        })
    })
  }
  
  
}