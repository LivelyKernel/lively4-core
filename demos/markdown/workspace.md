# Workspace Example

This is an Example of a workspace embedded in HTML/Markdown that will persist it's code in browser local storage. 

<script>
import focalStorage from 'src/external/focalStorage.js';

class Pane {

  onDoIt() {
    this.saveText()
    this.workspace.tryBoundEval(this.workspace.value)
  }

  onReset() {
    this.workspace.value = this.defaultText()
    this.saveText()
  }


  defaultText() {
    return `this.log('hi')`
  }

  textStorageId() {
    return `markdown_workspace_example_code`
  }

  async loadText() {
    var loaded = await focalStorage.getItem(this.textStorageId())
    if (loaded) return loaded
    return this.defaultText() 
  }
  
  async saveText() {
    focalStorage.setItem(this.textStorageId(), this.workspace.value)
  }

  log(s) {
    this.logarea.value += s + "\n"
  }
  
  async create() {
    // #TODO #META style and pre tags are problematic in Markdown scripts
    var style = document.createElement("style") 
    style.textContent = `
      lively-code-mirror {
        border: 1px solid gray
      `
    var buttons = <div>
        <button click={() => {this.onDoIt()} }>DoIt</button>
        <button click={() => {this.onReset()} }>reset</button>    
      </div>
    this.workspace = await (<lively-code-mirror></lively-code-mirror>)
    this.workspace.value = await this.loadText()

    this.workspace.doitContext = this


    this.logarea = await (<lively-code-mirror mode="text/plain"></lively-code-mirror>)

    return <div style="padding: 10px; width:800px;">
      {style}
      <h4>Workspace</h4>
      {buttons}
      {this.workspace}
      <h4>Log</h4>
      {this.logarea}
    </div>
  }
}
new Pane().create()
</script>
