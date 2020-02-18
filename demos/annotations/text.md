# Text Example

Showcase for [annotations](edit:/src/client/annotations.js) #WorkInProgress

- [ ] allow marking text and add them to annotations file
- [ ] allow editing text and update position in annotations file
- [ ] merge different commits of text/annotation pairs


<script>
import {AnnotatedText, AnnotationSet} from "src/client/annotations.js"

var container = lively.query(this, "lively-container");
(async () => {
  var base = container.getDir()
  var textURL = base + "/text.txt"
  var annotationsURL = base + "/text.txt.l4a"


  var text = await textURL.fetchText()
  var annotationSource = await annotationsURL.fetchText() // JSONL format

  debugger
  var annotatedText = new AnnotatedText(text, annotationSource)
  
  var html = annotatedText.toHTML()

  var textPre = document.createElement("pre")
  textPre.textContent = text

  var annotationsPre = document.createElement("pre")
  annotationsPre.textContent = annotationSource

  var markupPre = document.createElement("pre")
  markupPre.textContent = html
  
  var rendered = <div style="white-space: pre;"></div>
  rendered.innerHTML = html
  
  return <div>
    <h4>Text:</h4> {textPre}
    <h4>Annotations:</h4> {annotationsPre}
    <h4>Gernerated Markup:</h4> {markupPre}
    <h4>Rendered:</h4>
    {rendered}
  </div>
})()

</script>

# From File

<script>

(async () => {
  var text = await AnnotatedText.fromURL(
    "https://lively-kernel.org/lively4/lively4-jens/demos/annotations/text.txt",
    "https://lively-kernel.org/lively4/lively4-jens/demos/annotations/text.txt.l4a")
    
  return text.toHTML()    
})()
</script>






