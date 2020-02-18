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
  
  var html = annotatedText.asHTML()

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


# Idea: Remember a reference to the target text per Annotation

And we could further allow to store annotations with different targets in one file. So instead
of storing just annotations line by line:

```javascript
{"from": 0, "to": 4, "name": "b"}
{"from": 10, "to": 15, "name": "i"}
```


```javascript
{"type": "Text", "id": "t5", "github": "adsf234" }
{"type": "Annotation", "target": "t5", "from": 0, "to": 4, "name": "b"}
{"type": "Annotation", "target": "t5", "from": 10, "to": 15, "name": "i"}
```

The annotations do not have to completely reference the text themselves but we can go through an indirection. By adding "Text" into the annotations list, that provide the targets for the annotations. Those text can than have to own means of coming up with an actual text. Maybe reference a github commit or contain a copy of the full text themselves? We need enough data to update old annotations for new versions of a Text. 

```javascript
{"type": "Text", "id": "t5", "github": "adsf234"}
{"type": "Annotation", "target": "t5", "from": 0, "to": 4, "name": "b"}
{"type": "Text", "id": "t6", "content": "Hello New World!" }
{"type": "Annotation", "target": "t6", "from": 12, "to": 17, "name": "i"}
```











