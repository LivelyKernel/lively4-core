# Pen-based Editor Web Components

<script>
import Strings from "src/client/strings.js"

async function actOfCreation() {
  const name = lively.query(this, '#ast-node-name').value

  if (name) {
    var FullName = name
    var componentName = FullName.kebabCase()

    async function copyTemplate(dir, component, type) {
      var filename = component + "." + type
      var classname = component.split(/-/).map(ea => Strings.toUpperCaseFirst(ea)).join("")
      var url = dir  + "/" + filename
      if (await lively.files.existFile(url)) {
        lively.notify("Could not create " + url + ", beacuse it already exists!")
      } else {
        var templatejs_src = await lively.files.loadFile(lively4url + "/src/client/pen-editor/components/template." + type)
        templatejs_src = templatejs_src.replace(/\$\$TEMPLATE_CLASS/g, classname);
        templatejs_src = templatejs_src.replace(/\$\$TEMPLATE_ID/g, component);
        await lively.files.saveFile(url, templatejs_src);
      }
    }

    const dir = lively4url + '/src/client/pen-editor/components';
    await copyTemplate(dir, componentName, 'js');
    await copyTemplate(dir, componentName, 'html');

    lively.openBrowser(dir + '/' + componentName + '.js', true);
  }

}

<span>
  <input id="ast-node-name" placeholder="AstNodeBooleanLiteral" value="CompoundNodeLiveScriptFunctionShorthand" style="width: 300px" />
  <button click={actOfCreation}>Create new node</button>
</span>;
</script>
<script>
    import ComponentCreator from "src/client/morphic/component-creator.js"
  var container  = lively.query(this, "lively-container")
  if(!container) throw new Error("Not inside lively container?");
  ComponentCreator.createUI(container)
</script>
  
<script>
  ComponentCreator.listComponentsUI(container)
</script>
  