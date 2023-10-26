# Edit Domain Code

<script>
  import {visit, Parser, JavaScript, match, debugPrint} from 'src/client/tree-sitter.js';
  import { ChawatheScriptGenerator} from 'src/client/domain-code/chawathe-script-generator.js';
  import {treesitterVisit, parseQuery, DomainObject, TreeSitterDomainObject, LetSmilyReplacementDomainObject, ConstSmilyReplacementDomainObject} from 'src/client/domain-code.js';


  let editor1 = await (<lively-code-mirror style="display:inline-block; width: 400px; height: 200px; border: 1px solid gray"></lively-code-mirror>)
  let editor2 = await (<lively-code-mirror style="display:inline-block; width: 400px; height: 200px; border: 1px solid gray"></lively-code-mirror>)


  var parser = new Parser();
  parser.setLanguage(JavaScript);
  var list = <ul></ul>

  // editor1.value =  `let a = 3 + 4`   
  editor1.value =  `let a = 3`   
  // editor2.value = `let a = 3 + 4\na++`      
  editor2.value = `const a = 3`      

  editor1.editor.on("change", (() => update()).debounce(500));
  editor2.editor.on("change", (() => update()).debounce(500));

  
  async function update() {
      let sourceOriginal =   editor1.value
      let sourceNew =   editor2.value
      
      let root = TreeSitterDomainObject.fromSource(sourceOriginal)
      
      
      // editDiv.innerHTML = JSON.stringify(edit, undefined, 2)
      domain1.innerHTML = "DOMAIN1\n" + root.debugPrint()
      
      try {
        DomainObject.edit(root, sourceNew, undefined, {
          newAST(ast) {
            newtree.innerHTML = "TREESITTER2\n" + debugPrint(ast.rootNode)
          },
          actions(list) {
            actions.innerHTML = Array.from(list).map(ea => ea.type 
                + (ea.pos ? " pos: " + ea.pos : "")
                + " node: " + ea.node.type + " " + ea.node.id 
                + (ea.parent ? (" parent: " + ea.parent.type + " " + ea.parent.id) : "") 
                + (ea.other ? (" other: " + ea.other.type + " " + ea.other.id) : "") 
                + (ea.value ? " value: " + ea.value : "")
                ).join("\n")
          },
          log(s) {
            logList.appendChild(<div>{s}</div>)
          }
          
        })
        domain2.innerHTML = "DOMAIN2\n" + root.debugPrint()
      } catch(e) {
        domain2.innerHTML = ""
        domain2.appendChild(await (<lively-error>{e}</lively-error>))
      }
      
  }
  
  
  let actions = <div style="white-space:pre;font-family:monospace"></div>
  let domain1 = <div style="white-space:pre;font-family:monospace;display:inline-block;border:1px solid gray"></div>
  let domain2 = <div style="white-space:pre;font-family:monospace;display:inline-block;border:1px solid gray"></div>
  let newtree = <div style="white-space:pre;font-family:monospace;display:inline-block;border:1px solid gray"></div>
  let logList = <div style="white-space:pre;font-family:monospace;border:1px solid gray"></div>
  
  let pane = <div>
    {editor1}{editor2}
    {actions}
    {domain1}{newtree}{domain2}
    {logList}
  </div>
  
  update()
  
  pane
</script>