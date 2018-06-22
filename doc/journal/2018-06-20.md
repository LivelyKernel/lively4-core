## 2018-06-20


### Widgets in Code Mirror

Our own little [moonchild](https://github.com/harc/moonchild) ;-)

```javascript
// in code mirror class
  setup() {
  // ...
  editor.on("change", (() => this.checkSyntax())::debounce(500))
  // ...
  }
 
  checkSyntax() {
    if (this.isJavaScript) {
      this.wrapImports();
    }
    // ...
  }

  wrapWidget(name, from, to) {
    var widget = document.createElement("span")
    widget.style.whiteSpace = "normal"
    var promise = lively.create(name, widget)
    promise.then(comp => {
      comp.style.display = "inline"
      comp.style.backgroundColor = "rgb(250,250,250)"
      comp.style.display = "inline-block"
      comp.style.minWidth = "20px"
      comp.style.minHeight = "20px"
    })
    var marker = this.editor.doc.markText(from, to, {
      replacedWith: widget
    }); 
    promise.then(comp => comp.marker = marker)
    
    return promise
  }


  async wrapImports() {
    // dev mode
    if(this !== window.that) {
      return;
    }
    var regEx = new RegExp("import", "g");
    do {
      var m = regEx.exec(this.value);
      if (m) {
        var from = m.index 
        var to = m.index + m[0].length 
        var editor = this.editor
        await this.wrapWidget("span", this.editor.posFromIndex(from), 
                              this.editor.posFromIndex(to)).then(div => { 
          div.style.backgroundColor = "rgb(240,240,240)"
          div.innerHTML = "import"
          div.appendChild(<button click={e => {
                if (div.marker) {
                  var range = div.marker.find()
                  lively.warn("hello " + JSON.stringify(range))
                  editor.replaceRange("import Foo", range.from, range.to) // @Stefan, your welcome! ;-)
                }
                
                
              }}>Click me</button>)
        })

      }
    } while (m);
  }
  
```


- "**doc.markText(from: {line, ch}, to: {line, ch}, ?options: object) → TextMarker**
  Can be used to mark a range of text with a specific CSS class name. from and to should be {line, ch} objects. <br>
  [...] **replacedWith**: Element
  Use a given node to display this range. Implies both collapsed and atomic. The given DOM node must be an inline element (as opposed to a block element).<br>
  
  [...] The method will return an object that represents the marker (with constructor CodeMirror.TextMarker), which exposes three methods: clear(), to remove the mark, find(), which returns a {from, to} object (both holding document positions), indicating the current position of the marked range, or undefined if the marker is no longer in the document, and finally changed(), which you can call if you've done something that might change the size of the marker (for example changing the content of a replacedWith node), and want to cheaply update the display."  <https://codemirror.net/doc/manual.html>

- "**doc.replaceRange(replacement: string, from: {line, ch}, to: {line, ch}, ?origin: string)**
Replace the part of the document between from and to with the given string. from and to must be {line, ch} objects. to can be left off to simply insert the string at position from. When origin is given, it will be passed on to "change" events, and its first letter will be used to determine whether this change can be merged with previous history events, in the way described for selection origins." <https://codemirror.net/doc/manual.html>

