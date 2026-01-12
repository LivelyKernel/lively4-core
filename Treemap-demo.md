# TreeMap Demo





<script>


var treemap = await (<lively-treemap style="position: relative;"></lively-treemap>);

lively.sleep(100).then(ea => {
  treemap.onExtentChanged();
})

var editor = await (<lively-code-mirror style="opsition: relative;"></lively-code-mirror>)
editor.setDoitContext(treemap);
editor.value = "// Use ctrl + d to execute the code below!\n\n" + 
  "import Files from 'src/client/files.js';\n" +
  "const weight = \"size\";\n" +
  "const height = \"size\";\n" +
  "const color = \"size\";\n" +
  "const label = \"name\";\n" +
  "const componentData = await Files.fileTree(\"src/components\");\n" +
  "const toolsData = await Files.fileTree(\"src/components/tools\");\n" +
  "this.setData({\n" +
  "\tdata: toolsData,\n" +
    "\tweightAttributeName: weight,\n" +
    "\theightAttributeName: height,\n" +
    "\tcolorAttributeName: color,\n" +
    "\tlabelAttributeName: label\n" +
    "});"

var table = await (<lively-table style="position: relative;"></lively-table>);

var ui  =
  <div>
      <button style="position: relative;" click={() => lively.notify("hi")}>Execute</button>
      {treemap}
      {editor}
      {table}     
  </div>
  
ui
</script>

