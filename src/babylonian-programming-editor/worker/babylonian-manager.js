import boundEval from 'src/client/bound-eval.js'
import * as workspaces from 'src/client/workspaces.js'
import { generateLocationMap } from "../utils/ast.js"
import { defaultConnections, defaultExample } from "../utils/defaults.js"
import Tracker from "../utils/tracker.js"
import Performance from "../utils/performance.js"
import SystemjsWorker from "src/worker/systemjs-worker.js"
/*MD # BabylonianManager:  Proxy that delegates to the actual Work MD*/



class BabylonianManager {
  constructor() {
    // List of all active editors
    this._editors = new Set();

    // Worker for parsing
    this._worker = new SystemjsWorker("src/babylonian-programming-editor/worker/babylonian-worker.js");

    // Tracker
    this.tracker = new Tracker();

    // Currently active examples
    this.activeExamples = new Set([defaultExample()]);
    
    this.globalMsgId = 0;
  }

  /**
   * Managing editors
   */

  registerEditor(editor) {
    if (!this._editors.has(editor)) {
      this._editors.add(editor);
    }
  }

  unregisterEditor(editor) {
    this._editors.delete(editor);
  }

  updateEditors() {
    for (let editor of this._editors) {
      editor.onTrackerChanged();
    }
  }

  /*MD
  ## Evaluating
  MD*/
  // #important
  async evaluateEditor(editor, execute = true) {
    // console.log("BabylonianManager>>evaluateEditor")
    // lively.notify("BabylonianManager>>evaluateEditor")


    // Serialize annotations
    let serializedAnnotations = {};
    for (let key of ["probes", "sliders", "replacements", "instances"]) {
      serializedAnnotations[key] = editor.annotations[key].map((a) => a.serializeForWorker());
    }
    serializedAnnotations.examples = editor.activeExamples.map((a) => a.serializeForWorker());

    // Serialize context
    serializedAnnotations.context = editor.context;

    // Performance
    Performance.step("parse_and_transform");

    // Generate AST and modified code
    const result = await this.process(
      editor.value,
      serializedAnnotations,
      editor.customInstances.map(i => i.serializeForWorker()),
      editor.url,
      this._getReplacementUrls()
    );
    if (!result) {
      throw new Error("Bablonian AST Worker failed")
    }
    const { ast, loadableCode, executableCode } = result
    if (!ast) {
      editor.hadParseError = true;
      editor.loadableWorkspace = null;
    } else {
      editor.hadParseError = false;
      generateLocationMap(ast);
      editor.ast = ast;
      editor.loadableCode = loadableCode;
      editor.executableCode = executableCode;

      if (!execute) {
        return;
      }

      // Performance
      Performance.step("execute");

      // Reset the tracker to write new results
      this.tracker.reset();

      let loadResult = await this._load(editor.loadableCode, editor.url, {
        tracker: this.tracker,
        connections: defaultConnections(),
      });


      if (loadResult.isError) {
        editor.loadableWorkspace = null;
      } else {
        editor.loadableWorkspace = loadResult.path;
        lively.notify("loadableWorkspace: " + loadResult.path)
      }

      // Execute all modules that have active examples
      this.activeExamples = new Set([defaultExample()]);
      for (let someEditor of this._editors) {
        if (!someEditor.activeExamples || !someEditor.activeExamples.length) {
          continue;
        }
        someEditor.activeExamples.forEach(e => this.activeExamples.add(e));

        console.log(`BAB execute module with example: ${someEditor.url}`);
        const evalResult = await boundEval(someEditor.executableCode, {
          tracker: this.tracker,
          connections: defaultConnections(),
        });
        someEditor.hadEvalError = evalResult.isError;
        if (someEditor.hadEvalError) {
          var error = evalResult.value.originalErr || evalResult.value
          someEditor.lastEvalError = error.message || error;
        }
      }
    }


    // Performance
    Performance.step("update");

    // Tell editors that the tracker has changed
    this.updateEditors();

    // Performance
    Performance.stop();
  }

  async _load(code, url, thisReference) {
    // Based on boundEval() 
    const workspaceName = `${url}.babylonian`;
    const path = `workspace:${workspaceName}`;
    // Unload old version if there is one
    lively.unloadModule(path);

    // 'this' reference
    if (!self.__pluginDoitThisRefs__) {
      self.__pluginDoitThisRefs__ = {};
    }

    self.__pluginDoitThisRefs__[workspaceName] = thisReference;


    if (!self.__topLevelVarRecorder_ModuleNames__) {
      self.__topLevelVarRecorder_ModuleNames__ = {};
    }
    self.__topLevelVarRecorder_ModuleNames__[path] = workspaceName;

    try {
      workspaces.setCode(path, code);
      return await System.import(path).then(m => {
        return ({
          value: m.__result__,
          path: path
        })
      });

    } catch (err) {
      console.log("BAB _load error", err)
      return Promise.resolve({
        value: err,
        isError: true
      });
    }
  }

  _getReplacementUrls() {
    const replacementUrls = Array.from(this._editors).reduce((acc, editor) => {
      if (editor.loadableWorkspace) {
        acc[editor.url] = editor.loadableWorkspace;
      }
      return acc;
    }, {})
    return replacementUrls;
  }

  async process(code, annotations, customInstances, sourceUrl, replacementUrls) {
    // console.log("ast-worker-promise-wrapper.js process")

    const msgId = this.globalMsgId++;
    const msg = {
      id: msgId,
      payload: JSON.stringify({
        code: code,
        annotations: annotations,
        customInstances: customInstances,
        sourceUrl: sourceUrl,
        replacementUrls: replacementUrls
      })
    };

    return new Promise(async (resolve) => {
      await this.loaded
      this._worker.onmessage = (result) => {
        // console.log("ast-worker-promise-wrapper.js onmessage")
        resolve(result.data.payload);
      };
      // console.log("ast-worker-promise-wrapper.js postmessage")
      this._worker.postMessage(msg);
    });
  }
}


// Only export as Singleton
export default new BabylonianManager();
