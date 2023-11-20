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
} from "../utils/ast.js"
import Performance from "../utils/performance.js"


/**
 * Receive message from the main thread
 */
export async function onrequest(payload) {

  // Performance
  Performance.step("parse")
  const {
    code,
    annotations,
    customInstances,
    sourceUrl,
    replacementUrls
  } = JSON.parse(payload)

  // Process the code
  try {
    const ast = parse(code)

    // Performance
    Performance.step("transform")

    ast._sourceUrl = sourceUrl
    await applyBasicModifications(ast, replacementUrls)
    const originalAst = deepCopy(ast)

    generateLocationMap(ast)

    // Apply Probes

    applyReplacements(ast, annotations.replacements)
    applyProbes(ast, annotations.probes)


    let locationMap = ast._locationMap
    ast._locationMap = null // DefaultDict can not be deepCopy'ed by babel7

    // Generate the code for module loading, but not for direct execution
    let loadableCode = codeForAst(ast)


    ast._locationMap = locationMap
    // Add trackers for all examples
    applyInstances(ast, annotations.instances, customInstances)
    applyExamples(ast, annotations.examples)

    // Apply context
    await applyContext(ast, annotations.context, replacementUrls)


    ast._locationMap = null
    // Generate executable code
    let executableCode = codeForAst(ast)
    ast._locationMap = locationMap

    // Insert tracker codes
    loadableCode = applyTracker(loadableCode)
    executableCode = applyTracker(executableCode)

    // Performance
    Performance.stop()

    // Send result
    return { ast: originalAst, loadableCode, executableCode }
  } catch (e) {
    console.error("Errorp in Babylonian worker")
    throw e
  }
}


/**
 * Parses code and returns the corresponding AST
 */
function parse(code) {
  return assignIds(astForCode(code))
}
