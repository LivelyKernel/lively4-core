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
    var m
    var replace = () => {
      m  = regex.exec(s)
      if (m) {
        var replacement = func(m)
        if (replacement) {
          ea.insertBefore(new Text(s.slice(0, m.index )), eaChild)
          ea.insertBefore(replacement, eaChild)
          var rest = new Text(s.slice(m.index + m[0].length, s.length))
          ea.insertBefore(rest, eaChild)
          eaChild.remove()
          this.parseAndReplaceTextNode(ea, rest,  regex, func) // go on with the rest...
        } else {
          if (regex.lastIndex) {
            replace()  
          }
        }              
      }
    }
    replace()
  }
  
  
  // #helper 
  static parseAndReplace(element, regex, func) {
    element.querySelectorAll("*").forEach(ea => {
      // if (ea.localName == "code" || ea.localName == "pre") return; 
      ea.childNodes.forEach(eaChild => {
        if (eaChild instanceof Text) {
          this.parseAndReplaceTextNode(ea, eaChild, regex, func)
        }
      })
    })
  }

  static parseAndReplaceBibrefs(element) {
    this.parseAndReplace(element, /\@([A-Za-z]+[0-9][A-Z]+)/, (m) => {
      var link = <a click={evt => {
        evt.preventDefault(); 
        lively.openBrowser(link.href)
      }} href={"bib://" +m[1]}>{m[1]}</a>
      return link 
    })
  }
  
  
  static parseAndReplaceFigureRefs(element) {
    element.querySelectorAll("lively-drawio").forEach(ea => {
      var name = ea.getAttribute("alt")
      if (name && name !== null) {
        var titleString = ea.getAttribute("title")
        if (titleString == null) titleString = "" 
        var title = <div class="figuretitle"><a id={ea.getAttribute("alt")}></a><b>Figure {ea.getAttribute("alt")}. </b>{titleString}</div>
        ea.parentElement.appendChild(title)        
      }
    })
    
    // late parse and convert latex figure references
    this.parseAndReplace(element, /@fig:([A-Za-z0-9]+)/, (m) => <a href={"#" +m[1]}>{m[1]}</a>)
  }
                         
  static allNodesBetween(startNode, endNode) {
    var nodes = [] 
    var node = startNode
    while(node && node != endNode) {
      if (node !== startNode) nodes.push(node)
      node = node.nextSibling
    }
   
    return nodes
  }
    
  static parseAndReplaceFootenotes(element) {
    var count = 1
    var footnotes = []
    // #TODO what about markup in that markup?: ^[*Exposé* shows an overview ]
    /*MD <browse://../Lively4DevelopmentExperience/content/Discussion.md> MD*/
    
    var stack = []
    
    // hacky hacky hack hack hack!
    this.parseAndReplace(element, /((\^\[)|])/, (m) => {
      if (m[1] == "^[") {
        var footnote = {index: count++, content: "", id() {  return "footnote_" + this.index} }
        footnotes.push(footnote)
        var link = <sup><a href={"#" + footnote.id()}>{footnote.index}</a></sup>
        footnote.startNode = link
        stack.push(footnote)
        return link
      } else {
        var last = stack.pop()
        if (last) {
          var marker = <b>XXXX</b>
          last.endNode = marker
          return marker
        }
      }
      
    })
      
    footnotes.forEach(ea => {
      if (ea.startNode && ea.endNode) {
        var region = this.allNodesBetween(ea.startNode, ea.endNode)
        ea.content = <span>{...region}</span> // will get removed...
        ea.endNode.remove() // ged rid of the marker
      }     
      
    })
    
    if (footnotes.length > 0) {
      var footnotesDiv = <div><h3>Footnotes</h3><ol>{...footnotes.map(ea => <li><a id={ea.id()}></a>{ea.content}</li>)}</ol></div>
      element.appendChild(footnotesDiv)
    }

  }
  
    
      /*MD
<style>* {background-color:lightgray}</style>
```javascript
// we have to "quote" the @ because we are still in markdown... and replacing those references
Markdown.extractReferences(`Hello @`+`Foo1981HHC World\nggg @`+`Bar2019X`)
```
<script>
  import Markdown from 'src/client/markdown.js';
  <pre>Result:{eval(this.parentElement.querySelector("code").textContent)}</pre>
</script>
  MD*/
  
  static extractReferences(source) {
    return Strings.matchAll(/@([A-Z][a-z]+[0-9][0-9][0-9][0-9][A-Z]+)/g, source).map(ea => ea[1])
  }
  
  static parseAndReplaceLatex(element) {
    this.parseAndReplaceFigureRefs(element)
    this.parseAndReplaceBibrefs(element)
    this.parseAndReplaceFootenotes(element)
  }
  
}




