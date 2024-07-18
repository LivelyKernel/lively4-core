# Number of AST Nodes


<script>
import sloc from 'https://cdn.jsdelivr.net/npm/sloc@0.3.2/+esm'

function countNodes(srcCode) {
  let nodeCount = 0
  srcCode.traverseAsAST({
    enter(path) {
      nodeCount++;
    }
  })
  return nodeCount
}

// const srcURL = lively4url + '/../active-expressions/src/';
// function skip(fileURL) {
//   return fileURL.endsWith('utils.js')
// }
// const srcURL = lively4url + '/../aexpr-ticking/src/';
// function skip(fileURL) {
//   return fileURL.endsWith('utils.js')
// }
const srcURL = lively4url + '/../aexpr-interpretation/src/';
function skip(fileURL) {
  return false && fileURL.includes('babelsberg') || fileURL.endsWith('utils.js')
}
// const srcURL = lively4url + '/../aexpr-source-transformation-propagation/src/';
// function skip(fileURL) {
//   return false
// }
// const srcURL = lively4url + '/../babel-plugin-aexpr-source-transformation/';
// function skip(fileURL) {
//   return !fileURL.endsWith('./index.js')
// }
const { contents: files } = await fetch(srcURL, {
  method: "OPTIONS",
  headers: {filelist: "true"}
}).then(r => r.json())

// lively.files.visualizeFileTreeMap(srcURL)


const metrics = []
for (let file of files) {
  const fileURL = srcURL + file.name;
  if (fileURL.endsWith('.js')  && !skip(fileURL)) {
    const code = await fileURL.fetchText();
    const numNodes = countNodes(code)
    const sLoc = sloc(code, 'js').source
    metrics.push([fileURL, `${numNodes} (${sLoc})`])
  }
}

<table>{...metrics.map(([file, numNodes]) => <tr><td>{file}</td><td>{numNodes}</td></tr>)}</table>
</script>