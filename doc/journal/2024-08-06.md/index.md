## 2024-08-06 Creating the Lively BundleView
*Author: @onsetsu*

- Showing <a id='top-level-url'>fooo</a> as a bundleview.
- Edges show import dependencies.
  - Only dynamic dependencies within the top-level folder are shown.

<div>
  <d3-bundleview id='bundleview' width='600px' height='400px'></d3-bundleview>
</div>

<script>
// const topLevelURL = lively4url;
// const topLevelURL = lively4url + '/src';
const topLevelURL = lively4url + '/src/client';

const topLevelHandle = lively.query(this, '#top-level-url')
topLevelHandle.innerHTML = topLevelURL

const fileTree = await lively.files.fileTree(topLevelURL + '/')

const topLevelName = topLevelURL.split('/').last
Object.assign(fileTree, {
  modified: fileTree.children.maxProp('modified'),
  name: topLevelName,
  size: fileTree.children.sumBy(item => parseInt(item.size)),
  type: 'directory',
  url: topLevelURL,
})

async function walk(tree, callback) {
  const childrenResults = []
  if (tree.children) {
    for (let item of tree.children) {
      await walk(item, callback)
    }
  }
  return await callback(tree, childrenResults)
}

const fileURLToID = new Map()

const progress = await lively.showProgress('rename global');
progress.value = 0;

setID: await walk(fileTree, item => {
  const id = item.name;
  if (item.type === 'file') {
    fileURLToID.set(item.url, id)
  }

  Object.assign(item, {
    id,
    label: item.name,
    attributes: {
      size: item.name.endsWith('.js') ? parseInt(item.size) : 0,
      // modified: item.modified,
    }
  })
})

let currentFileIndex = 0;
const relations = [];
collectRelations: await walk(fileTree, async item => {
  if (item.type !== 'file') {
    return
  }
  
  progress.value = currentFileIndex++ / fileURLToID.size;
  
  const dependencies = await lively.findDependentModules(item.url, false, true) || []
  if (dependencies) {
    relations.push(...dependencies.filter(dep => fileURLToID.has(dep)).map(dep => {
      return {
        source: item.id,
        target: fileURLToID.get(dep)
      }
    }))
  }
})
progress.remove();

const fileTreeWithRelations = {
  nodes: fileTree,
  relations: relations
};

const bundleview = lively.query(this, '#bundleview')
bundleview.display(_.cloneDeep(fileTreeWithRelations));
<button click={async evt => {
  const bundleview = await lively.openComponentInWindow('d3-bundleview')
  bundleview.display(_.cloneDeep(fileTreeWithRelations))
  }} style='margin-top: 60px;'>Open in resizable Window</button>
</script>

preview image:

![](./bundleview.png){ width=600px}
