# Edit History

<script>
  import {visit, Parser, JavaScript, match} from 'src/client/tree-sitter.js';
  import { ChawatheScriptGenerator} from 'src/client/domain-code/chawathe-script-generator.js';


  let editor1 = await (<lively-code-mirror style="display:inline-block; width: 400px; height: 200px; border: 1px solid gray"></lively-code-mirror>)
  let editor2 = await (<lively-code-mirror style="display:inline-block; width: 400px; height: 200px; border: 1px solid gray"></lively-code-mirror>)


  var parser = new Parser();
  parser.setLanguage(JavaScript);
  var list = <ul></ul>

  // editor1.value =  `let a = 3 + 4`   
  editor1.value =  `var a = 3`   
  // editor2.value = `let a = 3 + 4\na++`      
  editor2.value = `{var a = 3}`      

  editor1.editor.on("change", (() => update()).debounce(500));
  editor2.editor.on("change", (() => update()).debounce(500));

  
  function update() {
      let tree1 = parser.parse(editor1.value);
      let tree2 = parser.parse(editor2.value );
      let mappings = match(tree1.rootNode, tree2.rootNode, 0, 100)
      var scriptGenerator = new ChawatheScriptGenerator()
      scriptGenerator.initWith(tree1.rootNode, tree2.rootNode, mappings) 

      scriptGenerator.generate()

      debugger

      list.innerHTML = ""
      
      for(let action of scriptGenerator.actions) {
        list.appendChild(<li>{action.type} {action.node && action.node.type} {action.pos}  {action.parent && action.parent.type}
            <button style="font-size:6pt" click={() => lively.openInspector(action)}>inspect</button>
          </li>)
      }
      
  }
  
  update()
  
  let pane = <div>
    {editor1}{editor2}
    {list}
  </div>
  
  
  pane
</script>