
export default class extends HTMLElement {
  createdCallback() {
    
    ////  this.root = this.createShadowRoot();
    this.root = this.shadowRoot
    //var div = document.createElement("div")
    // this.shadowRoot.appendChild(div)

    this.shadowRoot.innerHTML = `<link rel=stylesheet href="../codemirror/lib/codemirror.css">
       <link rel=stylesheet href="../codemirror/addon/dialog/dialog.css">`
   
      // .querySelector("#code-mirror-container")
    this.cm = new CodeMirror(this.shadowRoot, {
      value: "one\ntwo\nthree four five\ntwo\n",
      extraKeys: {"Ctrl-F": "search"}
    })
  }
}