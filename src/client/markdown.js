/*MD # Markdown  MD*/


/*MD ## Ebedded Latex MD*/
/*MD 
<style>* { background-color: lightgray }</style>

### Example

![TestFigure](../../media/drawio "A figure created with drawio.")

And look also at Figure @fig:TestFigure

```javascript
var a = "hello"
```
This is a reference to a paper [@Rein2016LLP] and this is a footnote^[https://d3js.org/]. 

<script>
import Markdown from "src/client/markdown.js"
Markdown.parseAndReplaceLatex(this.parentElement)
</script>

MD*/
import Strings from "src/client/strings.js"


export default class Markdown {

  
  
  // #helper 
  static parseAndReplaceTextNode(ea, eaChild,  regex, func) {
    var s = eaChild.textContent
    var m = s.match(regex) 
    if (m) {
      ea.insertBefore(new Text(s.slice(0, m.index )), eaChild)
      var replacement = func(m)
      ea.insertBefore(replacement, eaChild)
      var rest = new Text(s.slice(m.index + m[0].length, s.length))
      ea.insertBefore(rest, eaChild)
      eaChild.remove()
      this.parseAndReplaceTextNode(ea, rest,  regex, func) // go on with the rest...
    }
  }
  
  
  // #helper 
  static parseAndReplace(element, regex, func) {
    element.querySelectorAll("*").forEach(ea => {
      ea.childNodes.forEach(eaChild => {
        if (eaChild instanceof Text) {
          this.parseAndReplaceTextNode(ea, eaChild, regex, func)
        }
      })
    })
  }

  static parseAndReplaceBibrefs(element) {
    this.parseAndReplace(element, /\@([A-Za-z0-9]+)/, (m) => {
      var link = <a click={evt => {
        evt.preventDefault(); 
        lively.openBrowser(link.href)
      }} href={"bib://" +m[1]}>{m[1]}</a>
      return link 
    })
  }
  
  
  static parseAndReplaceFigureRefs(element) {
    element.querySelectorAll("lively-drawio").forEach(ea => {
      var title = <div class="figuretitle"><a id={ea.getAttribute("alt")}></a><b>Figure {ea.getAttribute("alt")}. </b>{ea.getAttribute("title")}</div>
      ea.parentElement.appendChild(title)
    })
    
    // late parse and convert latex figure references
    this.parseAndReplace(element, /@fig:([A-Za-z0-9]+)/, (m) => <a href={"#" +m[1]}>{m[1]}</a>)
  }
    
  static parseAndReplaceFootenotes(element) {
    var count = 1
    var footnotes = []
    // #TODO what about markup in that markup?: ^[*Exposé* shows an overview ]
    this.parseAndReplace(element, /(\^\[([^\]]*?)\])/, (m) => {
      var footnote = {index: count++, content: m[2], id() {  return "footnote_" + this.index} }
      footnotes.push(footnote)
      var link = <sup><a href={"#" + footnote.id()}>{footnote.index}</a></sup>
      return link
    })
    
    if (footnotes.length > 0) {
      var footnotesDiv = <div><h3>Footnotes</h3><ol>{...footnotes.map(ea => <li><a id={ea.id()}></a>{ea.content}</li>)}</ol></div>
      element.appendChild(footnotesDiv)
    }

  }
  
    
      /*MD
<style>* {background-color:lightgray}</style>
```javascript
Markdown.extractReferences(`Hello @Foo1981HHC World\nggg @Bar2019X`)
```
<script>
  import Markdown from 'src/client/markdown.js';
  <pre>{eval(this.parentElement.querySelector("code").textContent)}</pre>
</script>
  MD*/
  
  static extractReferences(source) {
     return Strings.matchAll(/@([A-Z][a-z]+[0-9][0-9][0-9][0-9][A-Z])/, source).map(ea => ea[1])
  }
  
  static parseAndReplaceLatex(element) {
    this.parseAndReplaceFigureRefs(element)
    this.parseAndReplaceBibrefs(element)
    this.parseAndReplaceFootenotes(element)
  }
  
}




