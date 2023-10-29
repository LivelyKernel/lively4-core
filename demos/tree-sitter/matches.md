# Matches

<script>

  import {visit, Parser, JavaScript, match} from 'src/client/tree-sitter.js';

  let editor1 = await (<lively-code-mirror style="display:inline-block; width: 400px; height: 200px; border: 1px solid gray"></lively-code-mirror>)
  let editor2 = await (<lively-code-mirror style="display:inline-block; width: 400px; height: 200px; border: 1px solid gray"></lively-code-mirror>)


  var parser = new Parser();
  parser.setLanguage(JavaScript);
  var vis = await (<treesitter-matches></treesitter-matches>)

  // editor1.value =  `let a = 3 + 4`   
  editor1.value =  `class Test { 
  foo(i) { 
    if (i == 0) return "Foo!"
  } 
}`   
  // editor2.value = `let a = 3 + 4\na++`      
  editor2.value = `class Test { 
  foo(i) { 
    if (i == 0) return "Bar"
    else if (i == -1) return "Foo!"
  } 
}`      

  editor1.editor.on("change", (() => update()).debounce(500));
  editor2.editor.on("change", (() => update()).debounce(500));

  function update() {
    vis.tree2 = parser.parse(editor2.value );
    vis.tree1 = parser.parse(editor1.value);
    vis.matches = match(vis.tree1.rootNode, vis.tree2.rootNode, 0, 100)
    
    // lively.openInspector(vis.matches)
    
    vis.update()
  }
  
  update()
  
  let pane = <div>
    {editor1}{editor2}
    {vis}
  </div>
  
  
  pane
</script>