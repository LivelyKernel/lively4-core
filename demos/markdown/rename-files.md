# Rename Files Workspace
<script>

class FileRenameWorkspace { 



static get url() { return this.baseInput.value } 

static set url(url) { this.baseInput.value = url } 

static async loadFiles() { 
  var stats = await lively.files.stats(this.url) 
  this.originalFiles = stats.contents.map(ea => ea.name).sort() 
  this.workspace.value = this.originalFiles.join("\n") 
} 

static async renameFiles() { 
  var newFiles = this.workspace.value.split("\n") 
  var actions = [] 
  for(var i=0; i < newFiles.length; i++) { 
    var newFile = newFiles[i] 
    var oldFile = this.originalFiles[i] 
    if (newFile.length == 0) {
      actions.push({action: "delete", from: oldFile, to: newFile, base: this.url})     
    } else if (newFile != oldFile) { 
      actions.push({action: "rename", from: oldFile, to: newFile, base: this.url}) 
    } 
  }; 

  
  if (await lively.confirm("Modify " + actions.length + " files?" + JSON.stringify(actions))) { 
    for(var action of actions) { 
      var fromURL = action.base + action.from 
      var toURL = action.base + action.to 
      if (action.action == "rename") {
        await lively.files.moveFile(fromURL, toURL) 
      }
      if (action.action == "delete") {
        await fetch(fromURL, {method: "DELETE"}) 
      }
    } 
  await this.loadFiles() } } 

  static async create(container) { 
    this.workspace = await (<lively-code-mirror mode="plain" style="border: 1px solid gray; width=600px;height:300px"></lively-code-mirror>) 
    this.baseInput = <input style="width:600px" value="http://localhost:9005/media/Movies/_incoming/"></input> 
      var view = <div id="RenameFilesWorkspace"> 
        <div> <button click={() => this.loadFiles()}>load</button> 
        <button click={() => this.renameFiles()}>rename</button> </div> 
          {this.baseInput} 
          {this.workspace} 
        </div> 
      view.model = this // for debugging return view
      return view
    } 
  } 
  FileRenameWorkspace.create(lively.query(this, "lively-container"))
</script>