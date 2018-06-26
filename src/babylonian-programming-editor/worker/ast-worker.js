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
  applyTracker,
  applyContext,
} from "../utils/ast.js";


/**
 * Receive message from the main thread
 */
export default onmessage = async function(msg) {
  const {
    code, 
    annotations, 
    customInstances, 
    sourceUrl,
    replacementUrls } = JSON.parse(msg.data.payload);

  // Process the code
  try {
    const ast = parse(code);
    ast._sourceUrl = sourceUrl;
    await applyBasicModifications(ast, replacementUrls);
    const originalAst = deepCopy(ast);
    generateLocationMap(ast);

    // Apply Probes
    applyReplacements(ast, annotations.replacements);
    applyProbes(ast, annotations.probes);
    
    // Generate the code for module loading, but not for direct execution
    let loadableCode = codeForAst(ast);
    
    // Add trackers for all examples
    applyInstances(ast, annotations.instances, customInstances);
    applyExamples(ast, annotations.examples);
    
    // Apply context
    applyContext(ast, annotations.context);

    // Generate executable code
    let executableCode = codeForAst(ast);
    
    // Insert tracker codes
    loadableCode = applyTracker(loadableCode);
    executableCode = applyTracker(executableCode);

    // Send result
    return respond(msg.data.id, originalAst, loadableCode, executableCode);
  } catch (e) {
    console.error(e);
    return respond(msg.data.id);
  }
};

/**
 * Sends a response to the main thread
 */
const respond = (id, ast = null, loadableCode = null, executableCode) =>
  postMessage({
    id: id,
    payload: {
      ast: ast,
      loadableCode: loadableCode,
      executableCode: executableCode
    }
  });
  

/**
 * Parses code and returns the corresponding AST
 */
const parse = (code) =>
  assignIds(astForCode(code));

