## 2019-06-07 A lot of #drawio

 - [Figure 1](../../figures/figure1.xml)

## Some Simple DrawIO Text Editor

<script>
(async () => {
  var result = await lively.create("div")
  
  var editor = await lively.create("lively-code-mirror")
  lively.setExtent(editor, lively.pt(600,400))
  var inspector = await lively.create("lively-inspector")
  lively.setExtent(inspector, lively.pt(600,400))
  lively.setPosition(inspector, lively.pt(600,0))
  
  var drawio = lively.query(this, "lively-drawio")
  await editor.loaded
  editor.editor.setOption("mode", "xml")
  editor.value = await drawio.getSource(true)
  
  editor.addEventListener("keydown", async (evt) => {
    var char = String.fromCharCode(evt.keyCode || evt.charCode);
    if ((evt.ctrlKey || evt.metaKey /* metaKey = cmd key on Mac */) && char == "S") {
      await drawio.setSource(editor.value)
      
      drawio.updateGraphModel()
      
      evt.stopPropagation();
      evt.preventDefault();
    }
  })

  async function updateGraphModel() {
    var doc = await drawio.getGraphModel()
    inspector.inspect(doc.documentElement)  
  }
  updateGraphModel()


  return  (<div style="position: relative; border: 1px solid blue">{editor}{inspector}</div>)
})()
</script>

<div style="border: 2px solid gray">
<lively-drawio src="drwaio2.xml"></lively-drawio>
</div>

---

This looks like this:


![](drawio_source_editor.png)