## 2022-05-18 poor man's rename global

*Author: @onsetsu*

```JavaScript
import { range } from 'utils';

async function renameGlobalInFile(from, to, file) {
  // if (file.endsWith('gs-simulator.js')) {
  //   return 
  // }

  lively.notify(file.replace(/.*\//, ''));

  var lcm = document.querySelector('#renaming-editor');
  var cm = lcm.editor;

  const text = await file.fetchText();
  lcm.value = text
  await lively.sleep(10)

  var count = 10000;
  while (true) {
    await lively.sleep(1)
    var gsRef;
    lcm.value.traverseAsAST({
      Program(path) {
        gsRef = path.scope.globals.gs;
      }
    });
    if (gsRef) {
      const [start, end] = range(gsRef.loc).asCM();
      lcm.astCapabilities.underlineText(cm, start, end);
      cm.replaceRange('GSim', start, end);
    } else {
      break;
    }
    if (count-- < 0) {
      lively.notify('break by limit')
      break;
    }
  }
  
  if (text !== lcm.value) {
    lively.success('change in ' + file.replace(/.*\//, ''))
    await lively.files.saveFile(file, lcm.value)
  }
}
async function renameGlobalInDir(from, to, filePath) {
  const progress = await lively.showProgress('rename global');
  progress.value = 0;

  try {
    const files = await lively.files.walkDir(filePath);
    const jsFiles = files.filter(file => file.endsWith('.js'));

    lively.notify(files.length);

    for (let [index, file] of Object.entries(jsFiles)) {
      progress.value = index / jsFiles.length;
      // await lively.sleep(100)
      await renameGlobalInFile(from, to, file);
    }
  } finally {
    progress.remove();
  }
}
// lively.files.loadFile(url, version)

renameGlobalInDir('gs', 'GSim', 'https://lively-kernel.org/lively4/gs/');
```
