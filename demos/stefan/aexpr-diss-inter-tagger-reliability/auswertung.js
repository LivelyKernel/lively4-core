import babelDefault from 'src/external/babel/babel7default.js'
const babel = babelDefault.babel;

async function pathsFromURL(url) {
  const textMain = await url.fetchText()
  const pathsMain = []
  textMain.traverseAsAST({
    enter(path) {
      pathsMain.push(path)
    },
  })
  return pathsMain
}

async function annotationsFromURL(url) {
  // color annotations are ordered and non-overlapping
  const text = await url.fetchText()
  const annotations = text.split('\n').map(line => JSON.parse(line)).filter(annotation => annotation.name === 'color')
  return annotations
}

function assignTags(paths, annotations, properpy) {
  paths.forEach(path => {
    const start = path.node.loc.start.index
    const end = path.node.loc.end.index
    
    const annoStart = annotations.toReversed().find(anno => anno.from <= start)
    const annoEnd = annotations.find(anno => end <= anno.to);
    
    if (annoStart.color !== annoEnd.color) {
      throw 'inconsistent tags'
    }
    path[properpy] = annoStart.color
  })
}

export function renderPaths(paths) {
  return <div style=''>{...paths.map(path => <div style={`display: inline-block; margin: 2px; width: 20px; height: 20px; background: linear-gradient(to right bottom, ${path.tom} 50%, ${path.stefan} 50%);`}></div>)}</div>
}
export async function runEvaluation(scriptElement) {
  const container = lively.ancestry(scriptElement).find(e => e && e.localName === 'lively-container')
  container.getBaseURL().replace('auswertung.md', 'task-curated/')
  
  const codeMain = 'https://lively-kernel.org/lively4/aexpr/demos/stefan/aexpr-diss-inter-tagger-reliability/task-curated/task-main.js'
  const codeSetup = 'https://lively-kernel.org/lively4/aexpr/demos/stefan/aexpr-diss-inter-tagger-reliability/task-curated/task-setup.js'
  
  const tomTagsMain = 'https://lively-kernel.org/lively4/aexpr/demos/stefan/aexpr-diss-inter-tagger-reliability/task-curated/task-main.js.l4a'
  const tomTagsSetup = 'https://lively-kernel.org/lively4/aexpr/demos/stefan/aexpr-diss-inter-tagger-reliability/task-curated/task-setup.js.l4a'
  
  const stefanTagsMain = 'https://lively-kernel.org/lively4/aexpr/demos/stefan/aexpr-diss-inter-tagger-reliability/reference/task-main.js.l4a'
  const stefanTagsSetup = 'https://lively-kernel.org/lively4/aexpr/demos/stefan/aexpr-diss-inter-tagger-reliability/reference/task-setup.js.l4a'
  
  const pathsMain = await pathsFromURL(codeMain)
  const pathsSetup = await pathsFromURL(codeSetup)
  
  const annotationsTomMain = await annotationsFromURL(tomTagsMain)
  const annotationsStefanMain = await annotationsFromURL(stefanTagsMain)
  const annotationsTomSetup = await annotationsFromURL(tomTagsSetup)
  const annotationsStefanSetup = await annotationsFromURL(stefanTagsSetup)
  
  assignTags(pathsMain, annotationsTomMain, 'tom')
  assignTags(pathsMain, annotationsStefanMain, 'stefan')
  assignTags(pathsSetup, annotationsTomSetup, 'tom')
  assignTags(pathsSetup, annotationsStefanSetup, 'stefan')
  
  return {
    pathsMain, pathsSetup
  }
}

const COLOR_CHANGE_DETECTION = '#fdd49e'
const COLOR_REACTIVE_BEHAVIOR = '#a1d99b'

export function cohensKappa({ pathsMain, pathsSetup }) {
  var TP = 0; // stefan: reaction, tom: reaction
  var TN = 0; // stefan: detection, tom: detection
  var FP = 0; // stefan: detection, tom: reaction
  var FN = 0; // stefan: reaction, tom: detection

  pathsMain.forEach(path => {
    if (path.stefan === COLOR_REACTIVE_BEHAVIOR && path.tom === COLOR_REACTIVE_BEHAVIOR) {
      TP++
    } else if (path.stefan === COLOR_CHANGE_DETECTION && path.tom === COLOR_CHANGE_DETECTION) {
      TN++
    } else if (path.stefan === COLOR_CHANGE_DETECTION && path.tom === COLOR_REACTIVE_BEHAVIOR) {
      FP++
    } else if (path.stefan === COLOR_REACTIVE_BEHAVIOR && path.tom === COLOR_CHANGE_DETECTION) {
      TN++
    }
  })

  var k = (2 * (TP * TN - FN * FP)) /
    (((TP + FP) * (FP + TN)) + ((TP + FN) * (FN + TN)));
  return k
}