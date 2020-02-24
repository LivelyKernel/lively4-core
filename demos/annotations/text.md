# Text Example

Showcase for [annotations](edit:/src/client/annotations.js) #WorkInProgress

- [ ] allow marking text and add them to annotations file
- [ ] allow editing text and update position in annotations file
- [ ] merge different commits of text/annotation pairs


<script>
import {AnnotatedText, Annotation, default as AnnotationSet} from "src/client/annotations.js"

var container = lively.query(this, "lively-container");
(async () => {
  var base = container.getDir()
  var textURL = base + "/text.txt"
  var annotationsURL = base + "/text.txt.l4a"


  var text = await textURL.fetchText()
  var annotationSource = await annotationsURL.fetchText() // JSONL format

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

<script>
// #META #Example of Mini-Custom Editor, like in the first days of Lively4
(async () => {
  let textURL = "https://lively-kernel.org/lively4/lively4-jens/demos/annotations/text.txt"
  let annotationURL = "https://lively-kernel.org/lively4/lively4-jens/demos/annotations/text.txt.l4a"

  var editor = await (<lively-code-mirror style="width:800px; height:100px"></lively-code-mirror>)
  editor.mode = "text"
  var cm = editor.editor
  
  let text
  
  
  async function loadText() {
    text  = await AnnotatedText.fromURL(textURL, annotationURL)
    editor.value = text.text
    for(let ea of text.annotations) {
      ea.codeMirrorMark(cm)
    }
    lively.notify("loaded text")
  }
  await loadText()
  
  
  function markColor(color="yellow") {
    var from  = cm.indexFromPos(cm.getCursor("from"))
    var to  = cm.indexFromPos(cm.getCursor("to"))
  
    var annotation = new Annotation({from: from, to: to, name: "color", color: color})
    text.annotations.add(annotation)
    annotation.codeMirrorMark(cm)
   
  }
  
  async function saveText() {
    text.setText(editor.value) // annotatons are updated automatically...
  
    // #TODO, since we are in an editor session that supported annotations, we should extract the annotations 
    // back from code mirror, that saves us potentially unreliable "diff-match-patch" updating of index positions 
    // and can also handle copy and paste
    
    await text.saveToURL(textURL, annotationURL)
    lively.notify("saved text")
  }
  
    
  
  lively.sleep(1).then( () => cm.refresh()) // #hack... do force display?
  return <div>
          <div>
            <button click={evt=> loadText()}>load</button>
            <button click={evt=> saveText()}>save</button>
            <button click={evt=> markColor("lightblue")} style="color:lightblue">mark</button>
            <button click={evt=> markColor("yellow")} style="color:yellow">mark</button>
          </div>
          {editor}
        </div>
})()
</script>



# With Lively Editor

<script>

(async () => {
  var text = await AnnotatedText.fromURL(
    "https://lively-kernel.org/lively4/lively4-jens/demos/annotations/text.txt",
    "https://lively-kernel.org/lively4/lively4-jens/demos/annotations/text.txt.l4a")
    
  return text.toHTML()    
})()
</script>

<script>
// #META #Example of Mini-Custom Editor, like in the first days of Lively4
(async () => {                     
  let textURL = "https://lively-kernel.org/lively4/lively4-jens/demos/annotations/text.txt"
  let text;
  let annotationsURL;

  let lastText;// for merging

  var livelyEditor = await (<lively-editor style="width:800px; height:100px"></lively-editor>)
  livelyEditor.addEventListener("loaded-file", async evt => {
      textURL = livelyEditor.getURL()
      annotationsURL = textURL + ".l4a" // or something else...
        
      text  = await AnnotatedText.fromURL(textURL, annotationsURL)
      text.annotations.renderCodeMirrorMarks(cm)
      
      lastText = text.clone()
      
  })
  async function saveAnnotations() {
    text.setText(livelyEditor.getText())
    
    var response = await fetch(annotationsURL, {
      method: 'PUT', 
      body: text.annotations.toJSONL(),
      headers: {lastversion: text.annotations.lastVersion }
    })
    var newVersion = response.headers.get("fileversion");
    var conflictVersion = response.headers.get("conflictversion");  
    if (conflictVersion) {
        await solveAnnotationConflict(newVersion, conflictVersion)
    }
    text.annotations.renderCodeMirrorMarks(cm)
  }
  
  
  livelyEditor.addEventListener("saved-file", async evt => {
    saveAnnotations()
  })
  livelyEditor.addEventListener("solved-conflict", evt => {
    // we can ignore this, since it will be solved... by the editor
    lively.notify("TEXT CONFLICT " + evt.detail.version )
  })

  let solvingConflict;

  async function solveAnnotationConflict(newVersion, otherVersion) {
    // solveConflict
    if (solvingConflict) {
      lively.warn("prevent endless recursion in solving conflict?")
      return
    }
    
    lively.notify("CONFLICT " + otherVersion)
    
    var parentAnnotations = lastText.annotations
    var otherAnnotationsSource = await fetch(annotationsURL, {
      headers: { fileversion: otherVersion }
    }).then(r => r.text());
    var otherAnnotations = AnnotationSet.fromJSONL(otherAnnotationsSource)
  
    var myAnnotations = text.annotations
    
    // only when no text diff.....
    var mergedAnnotations =   myAnnotations.merge(otherAnnotations, parentAnnotations)
      
    text.annotations = mergedAnnotations
    text.annotations.renderCodeMirrorMarks(cm)
    text.annotations.lastVersion = otherVersion
    
    solvingConflict = true;
    let stats = {}
    try {
      await saveAnnotations()
    } finally {
      solvingConflict = false;
    }
  }

  livelyEditor.setURL(textURL)
  livelyEditor.loadFile()
  
  var cm = await livelyEditor.awaitEditor()
  
  function markColor(color="yellow") {
    var from  = cm.indexFromPos(cm.getCursor("from"))
    var to  = cm.indexFromPos(cm.getCursor("to"))  
    var annotation = new Annotation({from: from, to: to, name: "color", color: color})
    text.setText(livelyEditor.getText())
    text.annotations.add(annotation)
    annotation.codeMirrorMark(cm)
  }
  
  function clearAnnotations() {
    var from  = cm.indexFromPos(cm.getCursor("from"))
    var to  = cm.indexFromPos(cm.getCursor("to"))
  
    text.annotations.removeFromTo(from, to)
    text.annotations.renderCodeMirrorMarks(cm) 
  }  
     
  lively.sleep(1).then( () => cm.refresh()) // #hack... do force display?
  return <div>
          <div>
            <button click={evt=> markColor("lightblue")} style="color:lightblue">mark</button>
            <button click={evt=> markColor("yellow")} style="color:yellow">mark</button>
            <button click={evt=> clearAnnotations()} style="">clear</button>
          </div>
          {livelyEditor}
        </div>
})()
</script>






