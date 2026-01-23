# TreeMap Demo

Use ctrl + d to execute the code below!

<script>
import TreemapColorSchemes from "src/components/tools/lively-treemap.js"; //TODO

var treemap = await (<lively-treemap></lively-treemap>);

var editor1 = await (<lively-code-mirror style="position: relative;"></lively-code-mirror>)
editor1.setDoitContext(treemap);
editor1.value =
`import Files from 'src/client/files.js';

// #UserData
this.userData = await Files.fileTree("src/components/tools");

Object.keys(this.userData.children[0])
this.table.setFromJSO(this.userData.children);
`

var editor2 = await (<lively-code-mirror style="position: relative;"></lively-code-mirror>)
editor2.setDoitContext(treemap);
editor2.value =
`// #UserData -> #Visualization
this.setData({
	data: this.userData ,
	weightAttributeName: "size",
	heightAttributeName: "size",
	colorAttributeName: "size",
	labelAttributeName: "name"
});
`

var table = await (<lively-table style="position: relative;"></lively-table>);

treemap.table = table

async function onSave() {
  var notebook = {
    cells: [editor1.value, editor2.value]
  }
  await lively.files.saveFile(urlInput.value, JSON.stringify(notebook))
  lively.success("saved notebook")
}

async function onLoad() {
  
  var json = await lively.files.loadFile(urlInput.value)
  
  var notebook = JSON.parse(json)
  
  editor1.value = notebook.cells[0]
  editor2.value = notebook.cells[1]
  lively.success("loaded notebook")
}

function onSelectAttribute() {
  console.log(configUI.querySelector("#attributeSelect"))
  let attribute = configUI.querySelector("#attributeSelect").value;
  
  //reset displayed value inputs (/*TODO: faster way?*/)
  //[...configUI.querySelectorAll("#valueSelects select").options].forEach(o => o.style.display = "none");
  
  switch (attribute) {
    case "setColorScheme":
      console.log(configUI.querySelector("#valueSelects #valueSelect-setColorScheme"))
      configUI.querySelector("#valueSelects #valueSelect-setColorScheme").style.display = "";
      break;
      
    case "highlightByLabel":
      console.log(configUI.querySelector("#valueSelects #valueSelect-highlightByLabel"))
      configUI.querySelector("#valueSelects #valueSelect-highlightByLabel").style.display = "";
      break;
  }
  
}

function onAddAttribute() {
  let attribute = configUI.querySelector("#attributeSelect").value;
  let value = configUI.querySelector(`#valueSelect-${attribute}`).value;
  
  switch (attribute) {
    case "setColorScheme":
      editor2.value = editor2.value + `
this.setColorScheme("${value}");`;
      treemap.setColorScheme(value);
      break;
      
    case "highlightByLabel":
      editor2.value = editor2.value + `
this.highlightByLabel(["${value}"]);`;
      treemap.highlightByLabel([`${value}`]);
      break;
      
  }
}



let urlInput = <input id="url" style="width:600px"></input>
urlInput.value = lively4url + "/mynotebook.json"

var configUI =
  <div>
    Add Script Element
    <select id="attributeSelect" change={() => onSelectAttribute()}>
      <option disabled selected value="">Add a configuration element</option>
      <option value="setColorScheme">set color scheme</option>
      <option value="highlightByLabel">highlight by label</option>
    </select>
    
    <div id="valueSelects" style="position:relative;">
      <select id="valueSelect-setColorScheme" style="display: none">
        <option value="Reds">Reds</option>
        <option value="Greens">Greens</option>
      </select>

      <input id="valueSelect-highlightByLabel" style="display: none"/>
      <button style="position: relative"  click={() => onAddAttribute()}>+</button>

    </div>
  </div>

treemap.configUI = configUI
    
var ui  =
  <div>
      {urlInput}
      <button style="position: relative" click={() => onSave()}>save</button>
      <button style="position: relative" click={() => onLoad()}>load</button>
      <div>Data</div>
      
      {editor1}
      <div style="max-height:200px; overflow: auto">{table}</div>
      <div>Visualization</div>
      {configUI}
      {editor2}
      
      <div style="position:relative;  background: red; width: 800px; height: 600px"> {treemap}</div>
      
  </div>
  
ui
</script>

<script>
lively.sleep(100).then(ea => {
  treemap.onExtentChanged();
})


// execute standard script initially
import Files from 'src/client/files.js';
treemap.userData = await Files.fileTree("src/components/tools");
treemap.setData({
	data: treemap.userData ,
	weightAttributeName: "size",
	heightAttributeName: "size",
	colorAttributeName: "size",
	labelAttributeName: "name"
});</script>

