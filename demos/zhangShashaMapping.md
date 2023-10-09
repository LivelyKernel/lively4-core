# ZhangShasha Mapping

<script>

  import { visit, Parser, JavaScript, addMapping} from 'src/client/tree-sitter.js';
  import { mapping as zhangShashaMapping } from "src/external/tree-edit-distance/zhang-shasha.js"
  import { qGramsDifference } from "utils"

  let editor1 = await (<lively-code-mirror style="display:inline-block; width: 400px; height: 200px; border: 1px solid gray"></lively-code-mirror>)
  let editor2 = await (<lively-code-mirror style="display:inline-block; width: 400px; height: 200px; border: 1px solid gray"></lively-code-mirror>)


  var parser = new Parser();
  parser.setLanguage(JavaScript);
  var vis = await (<treesitter-matches></treesitter-matches>)

  // editor1.value =  `let a = 3 + 4`   
  editor1.value =  `let a = 3`   
  // editor2.value = `let a = 3 + 4\na++`      
  editor2.value = `{let a = 2+4}`      

  editor1.editor.on("change", (() => update()).debounce(500));
  editor2.editor.on("change", (() => update()).debounce(500));

  let treedistMatrix  = []
  let operationsMatrix = []
  let table = <table></table>
  let operationsList = <div></div>
  
  
  function update() {
    vis.tree2 = parser.parse(editor2.value );
    vis.tree1 = parser.parse(editor1.value);
    var mappings = []
    
    function label(node) {
      
      if (node.children &&  node.children.length === 0) {
        return node.text
      }
      return node.type
    }

    
    
    let zsMappings = zhangShashaMapping(vis.tree1.rootNode, vis.tree2.rootNode,
      function children(node) { return node.children },
      function insertCost() { return 1 },
      function removeCost() { return 1 },
      function updateCost(from, to) {

      
        if (from.type === to.type) {
          var cost = qGramsDifference(label(from), label(to), 2)
          if (isNaN(cost)) {
            throw new Error("qGramsDifference went wrong" )
          }
          return cost
        } else {
          return 1
        }
      }, function debugInfo(operations, treedist, LR_keyroots1, LR_keyroots2) {
        debugger
        operationsMatrix = operations
        treedistMatrix =  treedist
      });
    debugger
    
    for (let candidate of zsMappings) {
      if (candidate.t1 && candidate.t2) {
        mappings.push({ node1: candidate.t1, node2: candidate.t2 })
      }
    }
    
    vis.matches = mappings
    
    // lively.openInspector(vis.matches)
    
    table.textContent = ""
    
    
    
    debugger
    for(let i in treedistMatrix) {
      let row = treedistMatrix[i]
      let tr = <tr></tr>
    
      for(let j in row) {
        let ea = row[j]
        let operations = operationsMatrix[i][j]
        tr.appendChild(<td click={ () => {
          operationsList.textContent = ""
          operations.forEach(ea => operationsList.appendChild(<span style="padding:2px">{ea.type}</span>))
        }}>{ea}</td>)
      }
      table.appendChild(tr)
    }
    
    vis.update()
  }
  

  
  
  update()
  
  let pane = <div>
    {editor1}{editor2}
    {operationsList}
    {table}
    {vis}
  </div>
  
  
  pane
</script>