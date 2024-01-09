# Code Mirror Shards Sandblocks Proof of Concept

## Issues:

- [ ] (cursor in/out)
- [ ] keep focus while typing
- [X] hide line numbers
- [X] hide scrollbars
- [ ] update RegExp match while editing
- [ ] Stefan's hide indentation/whitespace issue in shards

## Probe Example

<script>

customElements.define(
    "probe-widget",
    class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.addEventListener("keyup", evt => {
          // evt.preventDefault()
          // evt.stopPropagation()
        })
        
        this.addEventListener("keydown", evt => {
          // evt.preventDefault()
          // evt.stopPropagation()
        })
        this.shadowRoot.innerHTML = `
          <div style="border: 1px solid gray">PROBE 
          <lively-code-mirror class="shard"></lively-code-mirror>
          <slot></slot></div>
        `;
      }
  })


  var outerLivelyCodeMirror = await (<lively-code-mirror></lively-code-mirror>)
  outerLivelyCodeMirror.value = `var a = probe(3 + 4)`


  var debugLivelyCodeMirror = await (<lively-code-mirror></lively-code-mirror>)
  debugLivelyCodeMirror.editor.swapDoc(outerLivelyCodeMirror.editor.linkedDoc())

  var regEx = new RegExp(/((probe\()(.*))\)/, "g");
  do {
    var m = regEx.exec(outerLivelyCodeMirror.value);
    if (m) {
      var from = m.index
      var to = m.index + m[0].length 
      
      
      var innerFrom = m.index + m[2].length 
      var innerTo = m.index + m[1].length       
      var editor = outerLivelyCodeMirror.editor

      var comp = await outerLivelyCodeMirror.wrapWidget("probe-widget", 
          editor.posFromIndex(from), 
          editor.posFromIndex(to))

      var innerLivelyCodeMirror = comp.shadowRoot.querySelector("lively-code-mirror")
          innerLivelyCodeMirror.editor.swapDoc(editor.linkedDoc())
      const opts = {collapsed: true, clearWhenEmpty: false, inclusiveLeft: false, inclusiveRight: true};
      innerLivelyCodeMirror.editor.getDoc().markText(editor.posFromIndex(-1), editor.posFromIndex(innerFrom), opts);
      innerLivelyCodeMirror.editor.getDoc().markText(editor.posFromIndex(innerTo), editor.posFromIndex(innerLivelyCodeMirror.value.length), opts);
      
    
      debugger
    }
  } while (m);

  (<div>{outerLivelyCodeMirror}DEBUG:{debugLivelyCodeMirror}</div>)
</script>