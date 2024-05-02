import diff from 'src/external/diff-match-patch.js';
const dmp = new diff.diff_match_patch();

const folderURL = 'https://lively-kernel.org/lively4/aexpr/demos/stefan/aexpr-diss-quantitative-evaluation/'
const allURL = folderURL + 'signals-plain.all.js'
const all = await allURL.fetchText()
const detectionURL = folderURL + 'signals-plain.detection.js'
const detection = await detectionURL.fetchText()

let textDiff = dmp.diff_main(all, detection);

textDiff

const annotations = []
function newAnnotation(from, to, color) {
  const anno = `{"from":${from},"to":${to},"name":"color","color":"${color}"}`
  annotations.push(anno)
}

const COLOR_REACTION = "#a1d99b"
const COLOR_DETECTION = "#fdd49e"

let pos = 0;
for (let change of textDiff) {
  debugger
  const { 0: type, 1: content } = change
  const isAdd = type === 1;
  if (isAdd) {
    break;
    // throw new Error(`Unexpected addition of '${content}'`)
  }

  const isDel = type === -1;
  const isSame = type === 0;
  
  const length = content.length;
  
  const newPos = pos + length;
  const delOrAdd = isDel ? -1 : 1;
  
  if (isSame) {
    newAnnotation(pos, newPos, COLOR_DETECTION)
    pos = newPos
    continue;
  }
  
  if (isDel) {
    newAnnotation(pos, newPos, COLOR_REACTION)
    pos = newPos
    continue;
  }
  
  throw new Error(`Unexpected type of change: ${type}`)
  
  if (isAdd || isDel) {
    for (const annotation of this.list) {

      // simplest implementation... just grow and shrink with the diff
      if (pos <= annotation.from) {
        annotation.from += delOrAdd * length;
      }
      if (pos <= annotation.to) {
        annotation.to += delOrAdd * length;
      }
    }
  }
}
await lively.files.saveFile(allURL + '.l4a', annotations.join('\n'))


