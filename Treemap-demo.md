# TreeMap Demo

Use ctrl + d to execute the code below!

<script>
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
  let attribute = configUI.querySelector("#attributeSelect").value;
  
  //reset displayed value inputs (/*TODO: faster way?*/)
  //[...configUI.querySelectorAll("#valueSelects select").options].forEach(o => o.style.display = "none");
  
  //todo: make generic value inputs
  switch (attribute) {
    case "setData":
      break;
    case "setColorScheme":
      //todo hideAllInputs()
      configUI.querySelector("#valueSelects #valueSelect-setColorScheme").style.display = "";
      break;
      
    case "setColorSteps":
      configUI.querySelector("#valueSelects #valueSelect-number").style.display = "";
      break;
      
    case "highlightByID":
      configUI.querySelector("#valueSelects #valueSelect-number").style.display = "";
      break;
      
    case "removeHighlightsByID":
      configUI.querySelector("#valueSelects #valueSelect-number").style.display = "";
      break;
      
    case "highlightByLabel":
      configUI.querySelector("#valueSelects #valueSelect-string").style.display = "";
      break;

    case "removeHighlightsByLabel":
      configUI.querySelector("#valueSelects #valueSelect-string").style.display = "";
      break;

    case "removeHighlights":
      break;
      
    case "setHighlightColor":
      configUI.querySelector("#valueSelects #valueSelect-color").style.display = "";
      break;

    case "setColorMapping":
      configUI.querySelector("#valueSelects #valueSelect-string").style.display = "";
      break;

    case "setWeightMapping":
      configUI.querySelector("#valueSelects #valueSelect-string").style.display = "";
      break;

    case "setHeightMapping":
      configUI.querySelector("#valueSelects #valueSelect-string").style.display = "";
      break;

    case "setChildrenMapping":
      configUI.querySelector("#valueSelects #valueSelect-string").style.display = "";
      break;

    case "setLabelMapping":
      configUI.querySelector("#valueSelects #valueSelect-string").style.display = "";
      break;

    case "displayTopWeightLabels":
      configUI.querySelector("#valueSelects #valueSelect-number").style.display = "";
      break;

    case "displayTopHeightLabels":
      configUI.querySelector("#valueSelects #valueSelect-number").style.display = "";
      break;
      
    case "displayTopColorLabels":
      configUI.querySelector("#valueSelects #valueSelect-number").style.display = "";
      break;

    case "displayExplicitLabels":
      configUI.querySelector("#valueSelects #valueSelect-number").style.display = "";
      break;

    case "showAllLabels":
      break;

    case "removeLabels":
      break;
  }
  
}

function onAddAttribute() {
  let attribute = configUI.querySelector("#attributeSelect").value;
  console.log(attribute)
  //todo move value selection to different cases and target the respective input type  
  switch (attribute) {
    case "setData": {
      editor2.value = editor2.value + `
// you can remove any of the mappings if you don't want to override them
this.setData({
  data: yourData,
  weightAttributeName: yourWeightAttribute,
  heightAttributeName: yourHeightAttribute,
  colorAttributeName: yourColorAttribute,
  labelAttributeName: yourLabelAttribute
});`;
      break;
    }
    
    case "setColorScheme": {
      let value = configUI.querySelector(`#valueSelect-setColorScheme`).value;
      editor2.value = editor2.value + `
this.setColorScheme("${value}");`;
      treemap.setColorScheme(value);
      break;
    }
      
    case "setColorSteps": {
      //todo insert actual color steps?
      let value = configUI.querySelector(`#valueSelect-number`).value;
      editor2.value = editor2.value + `
this.setColorSteps(${value});`;
      treemap.setColorSteps(Number(value));
      break;
    }
      
    case "highlightByID": {
      //todo insert actual IDs?
      let value = configUI.querySelector(`#valueSelect-number`).value;
      editor2.value = editor2.value + `
this.highlightByID([${value}]);`;
      treemap.highlightByID([Number(value)]);
      break;
    }
      
    case "removeHighlightsByID": {
      //TODO insert actual highlights?
      let value = configUI.querySelector(`#valueSelect-number`).value;
      editor2.value = editor2.value + `
this.removeHighlightsByID([${value}]);`;
      treemap.removeHighlightsByID([Number(value)]);
      break;
    }
      
case "highlightByLabel": {
      //todo insert actual labels?
        //TODO ensure only one label -> fix by using select with all available labels
      let value = configUI.querySelector(`#valueSelect-string`).value;
      editor2.value = editor2.value + `
this.highlightByLabel(["${value}"]);`;
      treemap.highlightByLabel([`${value}`]);
      break;
    }

    case "removeHighlightsByLabel": {
      //TODO insert actual highlights?
      //TODO ensure only one label -> fix by using select with all available labels
      let value = configUI.querySelector(`#valueSelect-string`).value;
      editor2.value = editor2.value + `
this.removeHighlightsByLabel(["${value}"]);`;
      treemap.removeHighlightsByLabel([`${value}`]);
      break;
    }

    case "removeHighlights": {
      editor2.value = editor2.value + `
this.removeHighlights();`;
      treemap.removeHighlights();
      break;
    }
      
    case "setHighlightColor": {
      //todo check if value is a hex string
      let value = configUI.querySelector(`#valueSelect-color`).value;
      editor2.value = editor2.value + `
this.setHighlightColor("${value}");`;
      treemap.setHighlightColor(value);
      break;
    }

    case "setColorMapping": {
      let value = configUI.querySelector(`#valueSelect-string`).value;
      editor2.value = editor2.value + `
this.setColorMapping("${value}");`;
      treemap.setColorMapping([value);
      break;
    }

    case "setWeightMapping": {
      let value = configUI.querySelector(`#valueSelect-string`).value;
      editor2.value = editor2.value + `
this.setWeightMapping("${value}");`;
      treemap.setWeightMapping([value);
      break;
    }

    case "setHeightMapping": {
      let value = configUI.querySelector(`#valueSelect-string`).value;
      editor2.value = editor2.value + `
this.setHeightMapping("${value}");`;
      treemap.setHeightMapping(value);
      break;
    }

    case "setChildrenMapping": {
      let value = configUI.querySelector(`#valueSelect-string`).value;
      editor2.value = editor2.value + `
this.setChildrenMapping("${value}");`;
      treemap.setChildrenMapping(value);
      break;
    }
      
    case "setLabelMapping": {
      let value = configUI.querySelector(`#valueSelect-string`).value;
      editor2.value = editor2.value + `
this.setLabelMapping("${value}");`;
      treemap.setLabelMapping(value);
      break;
    }

    case "displayTopWeightLabels": {
      //todo insert actual maximum?
      let value = configUI.querySelector(`#valueSelect-number`).value;
      editor2.value = editor2.value + `
this.displayTopWeightLabels(${value});`;
      treemap.displayTopWeightLabels(Number(value));
      break;
    }

    case "displayTopHeightLabels": {
      //todo insert actual maximum?
      let value = configUI.querySelector(`#valueSelect-number`).value;
      editor2.value = editor2.value + `
this.displayTopHeightLabels([${value}]);`;
      treemap.displayTopHeightLabels(Number(value));
      break;
    }
      
    case "displayTopColorLabels": {
      //todo insert actual maximum?
      let value = configUI.querySelector(`#valueSelect-number`).value;
      editor2.value = editor2.value + `
this.displayTopColorLabels(${value});`;
      treemap.displayTopColorLabels(Number(value));
      break;
    }

    case "displayExplicitLabels": {
      //todo insert actual labels?
      let value = configUI.querySelector(`#valueSelect-string`).value;
      editor2.value = editor2.value + `
this.displayExplicitLabels(["${value}"]);`;
      treemap.displayExplicitLabels([`${value}`]);
      break;
    }

    case "showAllLabels": {
      editor2.value = editor2.value + `
this.showAllLabels();`;
      treemap.showAllLabels();
      break;
    }

    case "removeLabels": {
      editor2.value = editor2.value + `
this.removeLabels();`;
      treemap.removeLabels();
      break;
    }

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
      <option value="setData">set data</option>
      <option value="setColorSteps">set color steps</option>
      <option value="highlightByID">highlight by ID</option>
      <option value="removeHighlightsByID">remove highlights by ID</option>
      <option value="removeHighlightsByLabel">remove highlights by label</option>
      <option value="removeHighlights">remove all highlights</option>
      <option value="setHighlightColor">set highlight color</option>
      <option value="setColorMapping">set color mapping</option>
      <option value="setWeightMapping">set weight mapping</option>
      <option value="setHeightMapping">set height mapping</option>
      <option value="setChildrenMapping">set children mapping</option>
      <option value="setLabelMapping">set label mapping</option>
      <option value="displayTopWeightLabels">display top n weight labels</option>
      <option value="displayTopHeightLabels">display top n height labels</option>
      <option value="displayTopColorLabels">display top n color labels</option>
      <option value="displayExplicitLabels">display explicit labels</option>
      <option value="showAllLabels">show all labels</option>
      <option value="removeLabels">remove all labels</option>
    </select>
    
    <div id="valueSelects" style="position:relative;">
      <select id="valueSelect-setColorScheme" style="display: none"></select>
      <input id="valueSelect-number" type="number" min="0" style="display: none"/>
      <input id="valueSelect-string" style="display: none"/>
      <input id="valueSelect-color" type="color" style="display: none"/>
      
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
});

//insert color scheme options
import { TreemapColorSchemes } from "src/components/tools/lively-treemap.js";
let colorSchemeSelect  = configUI.querySelector("#valueSelects #valueSelect-setColorScheme");
Object.values(TreemapColorSchemes).forEach(colorScheme => colorSchemeSelect.add(new Option(colorScheme, colorScheme)));

</script>

