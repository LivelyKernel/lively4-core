## 2020-04-28 #PDF Annotations again
*Author: @JensLincke*


This time it looks for the first open PDF... and more carefully matches the selected text. 

- [lively-pdf](edit://src/components/widgets/lively-pdf.js)

```javascript
var pdfComponent = Array.from(lively.allElements(true)).find(ea => ea.localName == "lively-pdf")
var view = pdfComponent.get("#viewerContainer")
var result = []

view.querySelectorAll(".page").forEach(page => {
  var textLayer = page.querySelector(".textLayer")
  var annotations = page.querySelectorAll(".annotationLayer")
  
  annotations.forEach(annotation => {
    var div = annotation.querySelector("div")
    if (!div) return
    var b = lively.getClientBounds(div)
    var jso = {content: ""}
    result.push(jso)
    textLayer.querySelectorAll("div")
      .filter(ea => {
        return lively.getClientBounds(ea).intersects(b.insetBy(1))
      })
      .forEach(ea => {
        jso.content += (ea.textContent + " ")
    })    
  })  
})
result
```

### Idea: Edit Persistent #PDF Level #Annotations

Problem: Annotations on PDF are only stable for one version of a PDF file.

- a) annotations done by different people cannot be shown in one pdf
- b) annotation across multiple versions of a pdf file cannot be shown in one pdf
- c) annotation of a pdf file cannot be shown in source code

By anchoring annotation to the textual content and by assuming that the textual content of latex / markdown source code is the same as the output pdf, we could transfer annotations both from the pdf to the source code and vice versa and even do so when some content changes. 

Caveat: 
- all bets are off if the pdf is heavily compiled e.g. input text is not linearly mapable to output text of pdf,
- and when the annotations target a text that is heavily edited or deleted




