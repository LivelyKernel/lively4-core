

export default class FileRenameWorkspace { 

  constructor() {
    this.url = "http://localhost:9005/media/Movies/_incoming/"
  }

  async loadFiles(recursive=false) { 
    this.recursive = recursive
    var stats = (await fetch(this.url, {
            method: "OPTIONS",
            headers: {
              filelist: recursive
            }
          }).then(r => r.json()))

    this.originalFiles = stats.contents.map(ea => ea.name).sort() 
    this.workspace.value = this.originalFiles.join("\n") 
  } 

   async renameFiles() { 
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
    }

    if (await lively.confirm(<div>
          <b>{"Modify " + actions.length + " files?"}</b>
            <ul>{...actions.map(ea => <li>{ea.from.replace(/.*\//,"")} -> <b>{ea.to.replace(/.*\//,"")}</b></li>)}</ul>
          </div>, dialog => dialog.style.width = "1000px")) { 
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
    await this.loadFiles(this.recursive) } } 

  
  async create(container) { 
    this.workspace = await (<lively-code-mirror mode="plain" 
                              style="border: 1px solid gray; width:800px;height:600px"></lively-code-mirror>) 
    this.baseInput = <input style="width:600px" input={(evt => this.url = this.baseInput.value).debounce(500)} value={this.url} ></input> 

    var view = <div id="RenameFilesWorkspace"> 
          <div> 
            <button click={() => this.loadFiles()}>load</button> 
            <button click={() => this.loadFiles(true)}>load recursive</button> 
            <button click={() => this.renameFiles()}>rename</button> 
          </div> 
          {this.baseInput} 
          {this.workspace} 
        </div> 
      
      view.model = this // for debugging return view
      return view
    } 
  }
  
  
  // new FileRenameWorkspace().create(lively.query(this, "lively-container"))
/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[]} */