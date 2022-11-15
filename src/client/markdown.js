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
// #TODO lively-script gets executed very often in this context!
import Markdown from "src/client/markdown.js"
Markdown.parseAndReplaceLatex(this.parentElement)    
</script>

MD*/
import Strings from "src/client/strings.js"
import _ from 'src/external/lodash/lodash.js' 

export default class Markdown {

  
  
  // #helper 
  static parseAndReplaceTextNode(ea, eaChild,  regex, func) {
    var s = eaChild.textContent
    var m;
    regex = new RegExp(regex)
    var replace = () => {
      m  = regex.exec(s)
      if (m) {
        var replacement = func(m, ea)
        if (replacement !== undefined) {
          if (_.isString(replacement)) {
            replacement = new Text(replacement)
          }
          
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
    var all = [element].concat(Array.from(element.querySelectorAll("*")))
    // lively.notify("parse " + all.length + " elements.")
    for(var ea of all) {
      // if (ea.localName == "code" || ea.localName == "pre") return; 
      try {
        // lively.showElement(ea)
        if (!ea.childNodes) continue; 
          
        for(var eaChild of ea.childNodes) {
          if (eaChild instanceof Text) {
            this.parseAndReplaceTextNode(ea, eaChild, regex, func)
          }
        }        
      } catch(e) {
        console.error(e)
      }
    }
  }

  static parseAndReplaceBibrefs(element) {
    
    this.parseAndReplace(element, /\@([A-Za-z_]+[0-9]+[A-Za-z_]*)/g, (m) => {
      var link = <a click={evt => {
        evt.preventDefault(); 
        evt.stopPropagation();
        lively.openBrowser("bib://" + m[1])
      }} >{m[1]}</a> // href={"bib://" +m[1]}
      return link 
    })
  }
  
  static parseAndReplaceLabels(element) {
    
    this.parseAndReplace(element, /\\label({[^}]+})?/g, (m, contextElement) => {
      if (contextElement.localName !== "p") return 
      
      var id = "undefined" // the id is allreay 
      var anchor = <a click={evt => {
      }} id={id}></a>
      return anchor 
    })
  }
  static parseAndReplaceMiscLatex(element) {
    this.parseAndReplace(element, /(\\[a-z]+({[^}]+})?(\[[^\]]+\])?)/g, (m, contextElement) => {
      if (contextElement.localName !== "p") return ""
      
      return <span class="stripped" latex={m[1]}></span> 
    })
  }
 
   static parseAndReplaceFigures(element) {
    var container = lively.query(element, "lively-container")
    var baseDir = container ? container.getDir() : ""
    this.parseAndReplace(element, /\\includegraphics\[[^\]]*\]{([^}]+)\}/g, (m) => <div><img src={baseDir + m[1]}></img></div>)
    this.parseAndReplace(element, /\\caption\[[^\]]*\]{([^}]+)\}/g, (m) => <div>Figure: {m[1]}</div>)
  }
  
  
  static parseAndReplaceListings(element) {
    var container = lively.query(element, "lively-container")
    var baseDir = container ? container.getDir() : ""
    this.parseAndReplace(element, /(?:^|\n)\/([^ ]+) "([^"]*)"/g, (m) => { 
      var pre = <pre>LOADING...</pre>
      var url = baseDir + m[1];
      var description = m[2];
      fetch(url).then(async r => {
        
        if (r.status == 200) {
          pre.textContent = await r.text()
        } else {
          pre.textContent = "Could not load " + url
        }
      })
      return <div>{pre}<p><b>Listing:</b> {description} </p></div> })
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
    this.parseAndReplace(element, /@fig:([A-Za-z0-9]+)/g, (m) => <a href={"#" +m[1]}>{m[1]}</a>)
    this.parseAndReplace(element, /\\(?:auto)?ref\{([^}]+)\}/g, (m) => <a href={"#" +m[1]}>{m[1]}</a>)
  }
  
  
  static parseAndReplaceHeadings(element) {
    this.parseAndReplace(element, /\\paragraph\{([^}]+)\}/g, (m) => <b>{m[1]}</b>)
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
    this.parseAndReplace(element, /((\^\[)|\])/g, (m) => {
      if (m[1] == "^[") {
        var footnote = {index: count++, content: "", id() {  return "footnote_" + this.index} }
        footnotes.push(footnote)
        let link = <sup><a href={"#" + footnote.id()}>{footnote.index}</a></sup>
        footnote.startNode = link
        stack.push(footnote)
        return link
      } else {
        let last = stack.pop()
        if (last) {
          var marker = document.createElement("b")
          marker.textContent = "END" + last.index
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
    return Strings.matchAll(/@([A-Za-z0-9_]+)/g, source).map(ea => ea[1])
  }
  
  static parseAndReplaceLatex(element) {
    // do it only once
    if (element._parsedLatex) {
      return
    } else {
      element._parsedLatex = true    
    }

    this.parseAndReplaceBibrefs(element)
    this.parseAndReplaceFootenotes(element)
    this.parseAndReplaceListings(element)
    this.parseAndReplaceFigures(element)
    this.parseAndReplaceFigureRefs(element)
    this.parseAndReplaceLabels(element)
    this.parseAndReplaceHeadings(element)
    this.parseAndReplaceMiscLatex(element)
  }
  
}




