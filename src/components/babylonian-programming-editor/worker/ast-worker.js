// Custom imports
import {
  deepCopy,
  generateLocationMap,
  astForCode,
  codeForAst,
  assignIds,
  applyReplacements,
  applyProbes,
  applyExamples,
  applyInstances,
  applyBasicModifications,
} from "../utils/ast.js";


/**
 * Receive message from the main thread
 */
export default onmessage = function(msg) {
  const { code, annotations } = JSON.parse(msg.data.payload);

  // Process the code
  try {
    const ast = parse(code);
    const originalAst = deepCopy(ast);

    // Process AST
    generateLocationMap(ast);
    applyBasicModifications(ast);
    if(annotations.replacements) {
      applyReplacements(ast, annotations.replacements);
    }
    if(annotations.probes) {
      applyProbes(ast, annotations.probes);
    }
    if(annotations.instances) {
      applyInstances(ast, annotations.instances);
    }
    
    // Add trackers for all examples
    if(annotations.examples) {
      applyExamples(ast, annotations.examples);
    }

    // Generate executable code
    const executableCode = codeForAst(ast);

    // Send result
    return respond(msg.data.id, originalAst, executableCode);
  } catch (e) {
    console.error(e);
    return respond(msg.data.id);
  }
};

/**
 * Sends a response to the main thread
 */
const respond = (id, ast = null, code = null) =>
  /*postMessage*/({
    id: id,
    payload: {
      ast: ast,
      code: code
    }
  })/*;*/
  

/**
 * Parses code and returns the corresponding AST
 */
const parse = (code) =>
  assignIds(astForCode(code));




