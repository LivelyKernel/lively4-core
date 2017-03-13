
import Morph from "./Morph.js"
import {pt} from 'src/client/graphics.js'

export default class Dialog extends Morph {

  initialize() {
    lively.html.registerButtons(this)
    this.get("#prompt").addEventListener("keyup", (evt) => {
      if (evt.keyCode == 13) { // ENTER
        this.onPromptEntered(evt);
      }
    })
  }
  
  onClose() {
    debugger
    this.onCancel()
  }
  onOk() {
    this.resolve && this.resolve(true)
    this.remove()
  }
  
  onCancel() {
    this.resolve && this.resolve(false)
    this.remove()
  }
  
  onPromptEntered(evt) {
    this.resolve && this.resolve(true)
    this.remove()
  }
  
  async confirm(msg) {
    this.get("#message").innerHTML = msg
    return new Promise((resolve, reject) => {
      this.resolve = resolve
    })
  }

  static async dialog() {
    var dialog = document.createElement("lively-dialog")
    await lively.components.openInBody(dialog)
    
    // center in fixed 
    var bounds = dialog.getBoundingClientRect()
    lively.setPosition(dialog, 
      pt(window.innerWidth / 2 - bounds.width / 2, 
        window.innerHeight / 2 - bounds.height / 2))
    dialog.style.position = "fixed"
    
    return dialog
  }
  
  static async prompt(msg, value) {
    var dialog = await this.dialog()
    if (value !== undefined)
      dialog.get("#prompt").value = value
    
    dialog.get("#prompt").focus()
    var result = await dialog.confirm(msg)
    if (result == false) return undefined
    return  dialog.get("#prompt").value
  }

  static async confirm(msg) {
    var dialog = await this.dialog()
    dialog.get("#prompt").style.display = "none"
    return dialog.confirm(msg)  
  }
}