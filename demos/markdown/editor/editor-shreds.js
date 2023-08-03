// first line
// second line
var a = 3

// third line
// fourth line


/*MD # Editor Shreds

- focus and keyboard events a challenge (with linked documents)
- focus and keyboard seems to work with separated documents
-
<script>
  var parentEditor = lively.query(this, "lively-code-mirror")
  var doc = parentEditor.editor.linkedDoc({from: 2, to: 3})
  // var doc = parentEditor.editor.linkedDoc()
  
  var editor = await (
    <lively-code-mirror mode="text/jsx" overscroll="contain" style="width:600px;height:300px">// hello ss</lively-code-mirror>)

  editor.editor.swapDoc(doc)
  
  editor
</script>
MD*/



