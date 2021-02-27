## 2021-02-26
*Author: @JensLincke*



## Some #ScriptEvolution, Example: #PDF Outline Extraction

A little script that produces the outline of a paper using some regular expressions.

### First Version

Requires Halo interaction to "select" the right parent element in the PDF.

```javascript
that.querySelectorAll("div")
  .map(ea => ea.textContent)
  .filter(ea => ea.match(/^\s*[0-9][0-9\.]*\s+[A-Z]/))
  .join("\n")
```

### Second Version

Does not require Halo interaction, since it searches the PDF itself.

```javascript
var pdf = lively.findAllElements(ea => ea.localName == "lively-pdf", true)[0]
pdf.get("#container").querySelectorAll("div")
  .map(ea => ea.textContent)
  .filter(ea => ea.match(/^\s*[0-9][0-9\.]*\s+[A-Z]/))
  .join("\n")
```

### Third Version

Moved into the [PDF component](edit://src/components/widgets/lively-pdf.js)

```javascript
export default class LivelyPDF extends Morph {
  initialize() {
    // ...
    this.addEventListener('contextmenu',  evt => this.onContextMenu(evt), false);

  }
  
  onContextMenu(evt) {
     if (!evt.shiftKey) {
      evt.stopPropagation();
      evt.preventDefault();

       var menu = new ContextMenu(this, [
         ["show outline", async () => {
           var workspace = await lively.openWorkspace(this.extractOutline())
          workspace.parentElement.setAttribute("title","Outline")
          workspace.mode = "text"
        }]]);
       menu.openIn(document.body, evt, this);
        return true;
      }
  }
  
  extractOutline() {    
    return this.get("#container").querySelectorAll("div")
      .map(ea => ea.textContent)
      .filter(ea => ea.match(/^\s*[0-9][0-9\.]*\s+[A-Z]/))
      .join("\n")
  }
  // ... 
}
```

On ChoRyu_2014_JavascriptModuleSystemExploringTheDesignSpace_.pdf this produces:

```
1.    Introduction
2014 ACM 978-1-4503-2772-5/14/04. . . $15.00.
2.    Design Issues in the JavaScript Module System
2.1    Import and Export Declarations
2.2    Name Conflict Resolution
2.3    Prototypes of Module Instance Objects
3.   Formalization of the JavaScript Module System
3.1    JavaScript Module System
3.2    Formal Specification of the Design Issues
3.3    Validity Properties of the JavaScript Module System
4. Implementation of the JavaScript Module System
5.    Related Work
6.    Conclusion
262 Edition 6).
```

It contains some garbage but since I can copy it into my notes it is very useful. 



### Future Version

This script uses patterns to find the outline, but shouldn't there be some PDF build in outlines?

