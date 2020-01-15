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

export default class Markdown {

  static parseAndReplaceFigureRefs(element) {
    element.querySelectorAll("lively-drawio").forEach(ea => {
      var title = <div class="figuretitle"><a id={ea.getAttribute("alt")}></a><b>Figure {ea.getAttribute("alt")}. </b>{ea.getAttribute("title")}</div>
      ea.parentElement.appendChild(title)
    })
    // late parse and convert latex figure references
    element.querySelectorAll("*").forEach(ea => {
      ea.childNodes.forEach(eaChild => {
        if (eaChild instanceof Text) {
          var s = eaChild.textContent
          var m = s.match(/@fig:([A-Za-z0-9]+)/)
          if (m) {
            var replacement =  <span>{s.slice(0, m.index )}<a href={"#" +m[1]}>{m[1]}</a>{s.slice(m.index + m[0].length, s.length)}</span>
            ea.replaceChild(replacement, eaChild)

          }
        }
      })

    })
  }

  static parseAndReplaceBibrefs(element) {
    element.querySelectorAll("*").forEach(ea => {
      ea.childNodes.forEach(eaChild => {
        if (eaChild instanceof Text) {
          var s = eaChild.textContent
          var m = s.match(/\[\@([A-Za-z0-9]+)\]/)
          if (m) {
            var link = <a click={evt => {
              evt.preventDefault(); 
              lively.openBrowser(link.href)
            }} href={"bib://" +m[1]}>{m[1]}</a>
            var replacement =  <span>{s.slice(0, m.index )}[{link}]{s.slice(m.index + m[0].length, s.length)}</span>
            ea.replaceChild(replacement, eaChild)
          }
        }
      })
    })
  }
  static parseAndReplaceFootenotes(element) {
    var count = 1
    var footnotes = []
    element.querySelectorAll("*").forEach(ea => {
      ea.childNodes.forEach(eaChild => {
        if (eaChild instanceof Text) {
          var s = eaChild.textContent
          var m = s.match(/(\^\[([^\]]*?)\])/) // 
          if (m) {
            lively.notify("M " + m)
            var footnote = {index: count++, content: m[2], id() {  return "footnote_" + this.index} }
            var link = <a href={"#" + footnote.id()}>{footnote.index}</a>

            var replacement =  <span>{s.slice(0, m.index )}<sup>{link}</sup>{s.slice(m.index + m[0].length, s.length)}</span>
            ea.replaceChild(replacement, eaChild)

            footnotes.push(footnote)
          }
        }
      })
    })

    if (footnotes.length > 0) {
      var footnotesDiv = <div><h3>Footnotes</h3><ol>{...footnotes.map(ea => <li><a id={ea.id()}></a>{ea.content}</li>)}</ol></div>
      element.appendChild(footnotesDiv)
    }

  }

  static parseAndReplaceLatex(element) {
    this.parseAndReplaceFigureRefs(element)
    this.parseAndReplaceBibrefs(element)
    this.parseAndReplaceFootenotes(element)
  }
  
}




