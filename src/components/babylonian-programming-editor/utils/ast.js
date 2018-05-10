import { babel } from 'systemjs-babel-build';
const {
  traverse,
  template,
  types,
  transform,
  transformFromAst
} = babel;

import LocationConverter from "./location-converter.js";
import DefaultDict from "./default-dict.js";

/**
 * Creates a deep copy of arbitrary objects.
 * Does not copy functions!
 */
export const deepCopy = (obj) =>
  JSON.parse(JSON.stringify(obj));

/**
 * Generates a locationMap for the AST
 */
export const generateLocationMap = (ast) => {
  ast._locationMap = new DefaultDict(Object);

  traverse(ast, {
    enter(path) {
      let location = path.node.loc;
      // Some Nodes are exceptions
      if(path.isReturnStatement()) {
        // ReturnStatements are associated with the "return" keyword
        location.end.line = location.start.line;
        location.end.column = location.start.column + "return".length;
      } else if(path.isForStatement()) { //TODO: All loops
        // Loops are associated with their keywords
        location.end.line = location.start.line;
        location.end.column = location.start.column + "for".length;
      }
      
      ast._locationMap[LocationConverter.astToKey(location)] = path;
    }
  });
};

/**
 * Checks whether a path can be probed
 */
export const canBeProbed = (path) => {
  const isTrackableIdentifier = path.isIdentifier() && !path.parentPath.isMemberExpression();
  const isTrackableMemberExpression = path.isMemberExpression();
  const isTrackableReturnStatement = path.isReturnStatement();
  const isTrackableLoop = path.isLoop();
  return isTrackableIdentifier
         || isTrackableMemberExpression
         || isTrackableReturnStatement
         || isTrackableLoop;
}

/**
 * Checks whether a path can be an example
 */
export const canBeExample = (path) => {
  // We have to be the name of a function of class
  const functionParent = path.getFunctionParent();
  const isFunctionName = (functionParent
                          && (functionParent.get("id") === path
                              || functionParent.get("key") === path));
  const isClassName = (path.parentPath.isClassDeclaration() && path.parentKey === "id");
  return isFunctionName || isClassName;
}

/**
 * Checks whether a path can be replaced
 */
export const canBeReplaced = (path) => {
  // We have to be the righthand side of an assignment
  return ((path.parentPath.isVariableDeclarator() && path.parentKey === "init")
          || (path.parentPath.isAssignmentExpression() && path.parentKey === "right"));
}

/**
 * Generates a replacement node
 * (to be used as the righthand side of an assignment)
 */
export const replacementNodeForCode = (code) => {
  // The code we get here will be used as the righthand side of an Assignment
  // We we pretend that it is that while parsing
  code = `placeholder = ${code}`;
  try {
    const ast = astForCode(code);
    return ast.program.body[0].expression.right;
  } catch (e) {
    console.warn("Error parsing replacement node", e);
    return null;
  }
}

/**
 * Assigns IDs to add nodes of the AST
 */
export const assignIds = (ast) => {
  let idCounter = 1;
  traverse(ast, {
    enter(path) {
      path.node._id = idCounter++;
    }
  });
  return ast;
};


/**
 * Applies basic modifications to the given AST
 */
export const applyBasicModifications = (ast) => {
  traverse(ast, {
    Program(path) {
      // Add global example ID
      const globalExampleId = template("let __exampleId = 0")();
      path.unshiftContainer("body", globalExampleId);
    }
  });
}

/**
 * Applies replacement markers to the given AST
 */
export const applyReplacements = (ast, annotations) => {
  // TODO
}
export const applyReplacementMarkers = (ast, markers) => {
  // Apply the markers
  markers.forEach((marker) => {
    const replacementNode = marker.replacementNode;
    if(!replacementNode) {
      return;
    }
    const path = ast._locationMap[marker.loc];
    if(path.parentPath.isVariableDeclarator()) {
      path.parent.init = replacementNode;
    } else {
      path.replaceWith(replacementNode);
    }
  });
};

/**
 * Applies probe markers to the given AST
 */
export const applyProbes = (ast, annotations) => {
  const trackedNodes = annotations.map((a) => ast._locationMap[a.location].node);

  traverse(ast, {
    Identifier(path) {
      if(!trackedNodes.includes(path.node)) return;
      insertIdentifierTracker(path);
    },
    MemberExpression(path) {
      if(!trackedNodes.includes(path.node)) return;
      insertIdentifierTracker(path);
    },
    ReturnStatement(path) {
      if(!trackedNodes.includes(path.node)) return;
      insertReturnTracker(path);
    },
    BlockStatement(path) {
      insertBlockTracker(path);
    },
    Program(path) {
      insertBlockTracker(path);
    }
  });
};

/**
 * Applies example markers to the given AST
 */
export const applyExamples = (ast, annotations) => {
  // TODO
}
export const applyExampleMarkers = (ast, markers) => {
  // Prepare templates to insert
  const functionCall = template("ID.apply(null, PARAMS)");
  const staticMethodCall = template("CLASS.ID.apply(null, PARAMS)");
  const objectMethodCall = template("CLASS.prototype.ID.apply(THIS, PARAMS)");
  
  // Distinguish between class- and function examples
  const functionMarkers = markers.filter(m => {
    const nodePath = ast._locationMap[m.loc];
    if(nodePath.parentPath.isClassDeclaration()) {
      nodePath.node._exampleInstance = m.replacementNode;
      return false;
    } else {
      return true;
    }
  })
  
  // Apply the markers
  functionMarkers.forEach((marker) => {
    let parametersNode = marker.replacementNode;
    if(!parametersNode) {
      parametersNode = types.nullLiteral();
    }
    const path = ast._locationMap[marker.loc];
    const functionParent = path.getFunctionParent()
    let nodeToInsert;
    
    // Distinguish between Methods and Functions
    if(functionParent.isClassMethod()) {
      // We have a method
      const classIdNode = functionParent.getStatementParent().get("id").node;
      
      // Distinguish between static and object methods
      if(functionParent.node.static) {
        nodeToInsert = staticMethodCall({
          CLASS: types.identifier(classIdNode.name),
          ID: types.identifier(path.node.name),
          PARAMS: parametersNode
        });
      } else {
        // Get the example instance
        nodeToInsert = objectMethodCall({
          CLASS: types.identifier(classIdNode.name),
          ID: types.identifier(path.node.name),
          THIS: classIdNode._exampleInstance,
          PARAMS: parametersNode
        });
      }
    } else {
      nodeToInsert = functionCall({
        ID: types.identifier(path.node.name),
        PARAMS: parametersNode
      });
    }
    
    // Insert a call at the end of the script
    if(nodeToInsert) {
      ast.program.body.push(nodeToInsert);
    }
  });
}

/**
 * Insers an appropriate tracker for the given identifier path
 */
const insertIdentifierTracker = (path) => {
  // Prepare Trackers
  const tracker = template("window.__tracker.id(__exampleId, ID, VALUE, __blockCount)")({
    ID: types.numericLiteral(path.node._id),
    VALUE: deepCopy(path.node)
  });

  // Find the closest parent statement
  let statementParentPath = path.getStatementParent();

  // We have to insert the tracker at different positions depending on
  // the context of the tracked Identifier
  // TODO: Handle switch
  if(path.parentKey === "params") {
    // We are in a parameter list
    // Prepend tracker to body of function
    const functionParentPath = path.getFunctionParent();
    functionParentPath.get("body").unshiftContainer("body", tracker);
  } else if(statementParentPath.isReturnStatement()) {
    // We are in a return statement
    // Prepend the tracker to the return
    statementParentPath.insertBefore(tracker);
  } else if(statementParentPath.isBlockParent()) {
    // We are in a block
    // Insert into the block body
    const body = statementParentPath.get("body");
    if(body instanceof Array) {
      body.unshift(tracker);
    } else if (body.isBlockStatement()) {
      body.unshiftContainer("body", tracker);
    } else {
      body.replaceWith(
        types.blockStatement([
          body
        ])
      );
      body.unshiftContainer("body", tracker);
    }
  } else if(statementParentPath.isIfStatement()) {
    // We are in an if
    // We have to insert the tracker before the if
    statementParentPath.insertBefore(tracker);
  } else {
    statementParentPath.insertAfter(tracker);
  }
};

/**
 * Insers an appropriate tracker for the given return statement
 */
const insertReturnTracker = (path) => {
  const returnTracker = template("window.__tracker.id(__exampleId, ID, VALUE)")({
    ID: types.numericLiteral(path.node._id),
    VALUE: path.node.argument
  });
  path.get("argument").replaceWith(returnTracker);
}

/**
 * Inserts a tracker to check whether a block was entered
 */
const insertBlockTracker = (path) => {
  const blockId = template("const __blockId = ID")({
    ID: types.numericLiteral(path.node._id)
  });
  const tracker = template("const __blockCount = window.__tracker.block(__blockId)")();
  path.unshiftContainer("body", tracker);
  path.unshiftContainer("body", blockId);
};

/**
 * Returns a list of parameter names for the given function Identifier
 */
export const parameterNamesForFunctionIdentifier = (path) => {
  let parameterIdentifiers = path.getFunctionParent().get("params");
  return parameterIdentifiers.map(id => id.node.name);
}

/**
 * All the standard parameters for babylon
 */
const BABYLON_CONFIG = {
  babelrc: false,
  plugins: [],
  presets: [],
  filename: undefined,
  sourceFileName: undefined,
  moduleIds: false,
  sourceMaps: false,
  compact: false,
  comments: false,
  resolveModuleSource: undefined
};

/**
 * Parses code and returns the AST
 */
export const astForCode = (code) =>
  transform(code, Object.assign({}, BABYLON_CONFIG, {
    code: false,
    ast: true
  })).ast

/**
 * Generates executable code for a given AST
 */
export const codeForAst = (ast) =>
  transformFromAst(ast, Object.assign({}, BABYLON_CONFIG, {
    code: true,
    ast: false
  })).code;
