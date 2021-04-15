# Annotations Through Markdown

- Problem: How to show Annotations in a Source file in a rendered product....
- Idea: We could try to find the same text?!

<script>
// every time we use editors in as content, we have to make sure the CTRL+S does not go outside!
this.parentElement.addEventListener("keydown", evt => {
  if (evt.key == "s" && evt.ctrlKey) {
    evt.stopPropagation()
    evt.preventDefault()
  }
})

var container = lively.query(this, "lively-container");
var url = container.getDir() + "example.md";
async function editFile(url) {
  var editor = await (<lively-editor></lively-editor>)
  editor.setURL(url)
  editor.loadFile()
  return editor
};
var editor = editFile(url)
editor
</script>

<script>
editFile(url + ".l4a")
</script>

<script>
// async function inspect(obj) {
//   if (obj && obj.then) {
//     obj = await obj
//   }
//   var inspector = await (<lively-inspector></lively-inspector>)
//   inspector.inspect(obj)
//   inspector.hideWorkspace()
//   return inspector
// };
// (async () => {
//   return inspect((await editor))
// })()
</script>


Challenge: See the red and blue annotations in the rendered markdown view:

<script>
import {AnnotatedText, Annotation, default as AnnotationSet} from "src/client/annotations.js"

var pane;

async function update() {
  var markdown = await (<lively-markdown></lively-markdown>)

  pane.querySelector("#target").innerHTML = ""
  pane.querySelector("#target").appendChild(markdown)

  debugger
  await markdown.setSrc(url)
  var annotatedText = await AnnotatedText.fromURL(url, url + ".l4a")
  

  var root = markdown.get("#content")
  var renderedText = root.textContent
  
  annotatedText.setText(renderedText)
  
  
  for(var ea of annotatedText.annotations) {
    ea.annotateInDOM(root)
  }
  
}



(async () => {
   
  update()
  pane = <div style="padding: 5px; background-color: lightgray">
    <button click={() => update()}>update</button>
    <div id="target"></div></div>
  
  return pane
})()
</script>


