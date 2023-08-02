# TreeSitter Experiments


<script>
await lively.loadJavaScriptThroughDOM("treeSitter", lively4url + "/src/external/tree-sitter/tree-sitter.js")


const Parser = window.TreeSitter;
await Parser.init()

const parser = new Parser;


const JavaScript = await Parser.Language.load(lively4url + "/src/external/tree-sitter/tree-sitter-javascript.wasm");


parser.setLanguage(JavaScript);


const sourceCode = 'let x = 1; console.log(x);';
const tree = parser.parse(sourceCode);


"RootNode: " +  tree.rootNode.toString()


</script>

It works....