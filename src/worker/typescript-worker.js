console.log("ts worker loaded!")

/* global ts */

/*MD
<a href="https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API" target="_blank">API</a>
https://cancerberosgx.github.io/typescript-in-the-browser/typescript-compiler/#example=typeChecker1

MD*/

importScripts('https://cdnjs.cloudflare.com/ajax/libs/typescript/4.8.4/typescript.js');

const editors = {}

function ensureEditor(id, code = '') {
  const tsCode = editors[id];
  if (tsCode) {
    return tsCode;
  } else {
    const cm = editors[id] = {};
    cm.id = id;
    cm.value = code;
    return cm
  }
}

const targetFolder = 'https://lively-kernel.org/lively4/aexpr/src/external/typescript/lib/';

class TS {

  static syncGETRequest(fileName) {
    var result;
    const req = new XMLHttpRequest();

    req.addEventListener("progress", updateProgress);
    req.addEventListener("load", transferComplete);
    req.addEventListener("error", transferFailed);
    req.addEventListener("abort", transferCanceled);

    req.open("GET", fileName, false);
    req.send();

    // ...

    // progress on transfers from the server to the client (downloads)
    function updateProgress(event) {
      if (event.lengthComputable) {
        const percentComplete = event.loaded / event.total * 100;
        postMessage(percentComplete + ' loadin ' + fileName);
      } else {
        // Unable to compute progress information since the total size is unknown
      }
    }

    function transferComplete(evt) {
      postMessage('file read ' + fileName);
    }

    function transferFailed(evt) {
      postMessage("ERROR: An error occurred while transferring the file.");
    }

    function transferCanceled(evt) {
      postMessage("ERROR: The transfer has been canceled by the user.");
    }

    return req.responseText;
  }

  static readFile(fileName) {
    if (this.isDOMReference(fileName)) {
      return readFromCM(fileName);
    }

    const result = this.syncGETRequest(fileName);
    if (!result) {
      throw new Error('could not load ' + fileName);
    }
    return result;
  }

  static syncOPTIONRequest(fileName) {
    var result;
    const req = new XMLHttpRequest();

    req.addEventListener("progress", updateProgress);
    req.addEventListener("load", transferComplete);
    req.addEventListener("error", transferFailed);
    req.addEventListener("abort", transferCanceled);

    req.open("OPTION", fileName, false);
    req.send();
    // lively.files.exist
    // ...

    // progress on transfers from the server to the client (downloads)
    function updateProgress(event) {
      if (event.lengthComputable) {
        const percentComplete = event.loaded / event.total * 100;
        postMessage(percentComplete + ' loadin ' + fileName);
      } else {
        // Unable to compute progress information since the total size is unknown
      }
    }

    function transferComplete(evt) {
      postMessage('file read ' + fileName);
    }

    function transferFailed(evt) {
      postMessage("ERROR: An error occurred while transferring the file.");
    }

    function transferCanceled(evt) {
      postMessage("ERROR: The transfer has been canceled by the user.");
    }

    return req.status === 200;
  }

  static fileExists(fileName) {
    if (this.isDOMReference(fileName)) {
      return cmExists(fileName);
    }

    return this.syncOPTIONRequest(fileName);
  }

  static isDOMReference(fileName) {
    return !(fileName.includes('https://') || fileName.startsWith('node_modules/'));
  }

}

// ts.ScriptSnapshot;
// ts.createLanguageService;
// ts.LanguageServiceHost;
// ts.factory;

function fileNameToSelector(fileName) {
  return '#' + fileName.replace(/\.d\.ts$/, '').replace(/\.ts$/, '').replace(/\.js$/, '');
}

function cmExists(fileName) {
  const selector = fileNameToSelector(fileName);
  return !!document.querySelector(selector);
}

function readFromCM(id) {
  const selector = fileNameToSelector(id);
  // postMessage(selector);
  const cm = document.querySelector(selector);
  // postMessage(!!cm);
  return cm && cm.value;
}

function createCompilerHost(options, moduleSearchLocations) {
  return {
    getSourceFile,
    getDefaultLibFileName: () => 'https://lively-kernel.org/lively4/aexpr/src/external/typescript/lib/lib.d.ts',
    writeFile: (fileName, content) => {
      postMessage('writeFile' + fileName)
      debugger
      ensureEditor('ts-io', 'first line').value += `--- ${fileName} ---
${content}

`
    },
    getCurrentDirectory: () => '', //ts.sys.getCurrentDirectory(),
    getDirectories: path => ts.sys.getDirectories(path),
    getCanonicalFileName: fileName => fileName.toLowerCase(),
    getNewLine: () => '\n',
    useCaseSensitiveFileNames: () => true,
    fileExists,
    readFile,
    resolveModuleNames
  };

  function fileExists(fileName) {
    return TS.fileExists(fileName);
  }

  function readFile(fileName) {
    return TS.readFile(fileName);
  }

  function getSourceFile(fileName, languageVersion, onError) {
    const sourceText = TS.readFile(fileName);
    return sourceText !== undefined ? ts.createSourceFile(fileName, sourceText, languageVersion) : undefined;
  }

  function resolveModuleNames(moduleNames, containingFile) {
    console.log(`##############################################`);
    console.log(`XX resolve [${moduleNames}] in ${containingFile}`);
    const resolvedModules = [];
    for (const moduleName of moduleNames) {
      // try to use standard resolution
      let result = ts.resolveModuleName(moduleName, containingFile, options, {
        fileExists,
        readFile
      });
      console.log(`resolve [${moduleName}] in ${containingFile}`, result);
      if (result.resolvedModule) {
        resolvedModules.push(result.resolvedModule);
      } else {
        resolvedModules.push({
          resolvedFileName: SystemJS.normalizeSync(moduleName, containingFile)
        });
        continue;
        // check fallback locations, for simplicity assume that module at location
        // should be represented by '.d.ts' file
        for (const location of moduleSearchLocations) {
          const modulePath = path.join(location, moduleName + ".d.ts");
          if (fileExists(modulePath)) {
            resolvedModules.push({ resolvedFileName: modulePath });
          }
        }
      }
    }
    return resolvedModules;
  }
}

async function compile(fileNames, moduleSearchLocations) {
  const tsResult = await ensureEditor('ts-result', '');
  tsResult.value = '';
  const tsIO = await ensureEditor('ts-io', '');
  tsIO.value = '';

  const options = {
    // noEmitOnError: true,
    // noImplicitAny: true,
    allowJs: true,
    target: ts.ScriptTarget.ES2022,
    // module: ts.ModuleKind.CommonJS
  };

  const compilerHost = createCompilerHost(options, moduleSearchLocations);

  let program = ts.createProgram(fileNames, options, compilerHost);
  let emitResult = program.emit();

  const separatorMessage = { messageText: '---' };
  let allDiagnostics = [...ts.getPreEmitDiagnostics(program), (separatorMessage), ...emitResult.diagnostics, separatorMessage];

  function log(msg) {
    // @ts-ignore: Unreachable code error
    tsResult.value += msg + '\n';
  }

  // postMessage(allDiagnostics)
  try {
    allDiagnostics.forEach(diagnostic => {
      if (diagnostic.file) {
        let { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
        let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
        log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
      } else {
        log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      }
    });
    
    let exitCode = emitResult.emitSkipped ? 1 : 0;
    log(`Process exiting with code '${exitCode}'.`);
  } catch (e) {
    
  }
}




export async function onmessage(evt)    {
  await compile([lively4url + '/demos/typescript/app.ts'], []);
  
  // var path = SystemJS.normalizeSync(evt.data.urlString, lively4url)
  // const content = syncGETRequest(path)

  // Message received from main script'
  // var workerResult = 'TS-Result: ' + (evt.data[0] * evt.data[1]);
  // Posting message back to main script'
  console.log('ts-result: ' + ensureEditor('ts-result').value);
  console.log('ts-io: ' + ensureEditor('ts-io').value);
  
  postMessage('ts-result: ' + ensureEditor('ts-result').value);
  postMessage('ts-io: ' + ensureEditor('ts-io').value);
}


