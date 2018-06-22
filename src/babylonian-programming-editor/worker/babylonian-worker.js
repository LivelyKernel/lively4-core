import boundEval from 'src/client/bound-eval.js';

import ASTWorkerWrapper from "./ast-worker-wrapper.js";
import {
  generateLocationMap
} from "../utils/ast.js";
import {
  defaultConnections
} from "../utils/defaults.js";
import Tracker from "../utils/tracker.js";


/**
 * The global Babylonian Worker
 */
class BabylonianWorker {
  constructor() {
    // List of all active editors
    this._editors = new Set();
    
    // Worker for parsing
    this._astWorker = new ASTWorkerWrapper();
    
    // Tracker
    this.tracker = new Tracker();
  }
  
  /**
   * Managing editors
   */
  
  registerEditor(editor) {
    if(!this._editors.has(editor)) {
      this._editors.add(editor);
    }
  }
  
  unregisterEditor(editor) {
    this._editors.delete(editor);
  }
  
  updateEditors() {
    for(let editor of this._editors) {
      editor.onTrackerChanged();
    }
  }
  
  /**
   * Evaluating
   */
  async evaluateEditor(editor, execute = true) {
    // Serialize annotations
    let serializedAnnotations = {};
    for(let key of ["probes", "sliders", "replacements", "instances"]) {
      serializedAnnotations[key] = editor.annotations[key].map((a) => a.serializeForWorker());
    }
    serializedAnnotations.examples = editor.activeExamples.map((a) => a.serializeForWorker());

    // Serialize context
    serializedAnnotations.context = editor.context;

    // Generate AST and modified code
    const { ast, code } = await this._astWorker.process(
      editor.value,
      serializedAnnotations,
      editor.customInstances.map(i => i.serializeForWorker()),
      editor.url
    );
    if(!ast) {
      editor.hadParseError = true;
    } else {
      editor.hadParseError = false;
      generateLocationMap(ast);
      editor.ast = ast;
      editor.code = code;

      if(!execute) {
        return;
      }

      // Execute all modules that have active examples
      this.tracker.reset();
      for(let someEditor of this._editors) {
        if(!someEditor.activeExamples.length) {
          continue;
        }

        console.log(`Executing ${someEditor.url}`);
        const evalResult = await boundEval(someEditor.code, {
          tracker: this.tracker,
          connections: defaultConnections(),
        });
        someEditor.hadEvalError = evalResult.isError;
        if(someEditor.hadEvalError) {
          someEditor.lastEvalError = evalResult.value.originalErr.message;
        }
      }
    }
  
    // Tell editors that the tracker has changed
    this.updateEditors();
  }
}


// Only export as Singleton
export default new BabylonianWorker();