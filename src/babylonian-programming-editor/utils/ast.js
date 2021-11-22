import systemBabel from 'systemjs-babel-build';

//import { babel } from 'systemjs-babel-build';
const {
  traverse,
  template,
  types,
  transform,
  transformFromAst
} = systemBabel.babel;
import LocationConverter from "./location-converter.js";
import DefaultDict from "./default-dict.js";
import { defaultBabylonConfig } from "./defaults.js";
import { maybeUnpackString } from "./utils.js";

/**
 * Creates a deep copy of arbitrary objects.
 * Does not copy functions!
 */
export function /*example:*//*example:*//*example:*//*example:*/deepCopy/*{"id":"71d1_e842_c8af","name":{"mode":"input","value":"HTML"},"color":"hsl(60, 30%, 70%)","values":{"obj":{"mode":"select","value":"9055_2982_7d26"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"f2b6_66ad_4a31","name":{"mode":"input","value":"Plain"},"color":"hsl(160, 30%, 70%)","values":{"obj":{"mode":"input","value":"{name: \"My name\"}"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"1db1_7cc0_11c6","name":{"mode":"input","value":"Recursive"},"color":"hsl(10, 30%, 70%)","values":{"obj":{"mode":"select","value":"1558_7aa2_37fa"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"f8f5_227d_9e8d","name":{"mode":"input","value":"AST"},"color":"hsl(60, 30%, 70%)","values":{"obj":{"mode":"select","value":"8a96_17d6_1be7"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(obj) {
  try {
    /*probe:*/return/*{}*/ JSON.parse(JSON.stringify(obj));
  } catch(e) {
    console.warn("Could not deeply clone object", obj);
    /*probe:*/return/*{}*/ Object.assign({}, obj);
  }
}

/**
 * Generates a locationMap for the AST
 */
export function /*example:*//*example:*//*example:*/generateLocationMap/*{"id":"c328_5d11_5168","name":{"mode":"input","value":"Not an AST"},"color":"hsl(180, 30%, 70%)","values":{"ast":{"mode":"select","value":"9055_2982_7d26"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"4ebc_b290_28de","name":{"mode":"input","value":"Fibonacci"},"color":"hsl(10, 30%, 70%)","values":{"ast":{"mode":"select","value":"8a96_17d6_1be7"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"345b_37c4_c8b1","name":{"mode":"input","value":"Simple"},"color":"hsl(300, 30%, 70%)","values":{"ast":{"mode":"select","value":"35d8_cf9d_8ad4"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(ast) {
  ast._locationMap = new DefaultDict(Object);

  const keywords = {
    "ForStatement": "for",
    "ForInStatement": "for",
    "ForOfStatement": "for",
    "WhileStatement": "while",
    "DoWhileStatement": "do",
    "ReturnStatement": "return"
  };

  traverse(ast, {
    enter(path) {
      let location = path.node.loc;
      if(!location) {
        return;
      }

      // Some Nodes are only associated with their keywords
      const keyword = keywords[path.type];
      if(keyword) {
        location.end.line = location.start.line;
        location.end.column = location.start.column + keyword.length;
      }

      ast._locationMap[LocationConverter.astToKey(location)] = path;
    }
  });
}

/**
 * Checks whether a path can be probed
 */
export function /*example:*//*example:*/canBeProbe/*{"id":"ced4_825a_793a","name":{"mode":"input","value":"Member Identifier"},"color":"hsl(330, 30%, 70%)","values":{"path":{"mode":"select","value":"d779_a710_b464"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*//*{"id":"6104_8577_2ac3","name":{"mode":"input","value":"Identifier"},"color":"hsl(190, 30%, 70%)","values":{"path":{"mode":"select","value":"1558_7aa2_37fa"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(path) {
  if(!path || !path.parentPath) {
    return false;
  }
  
  const /*probe:*/isTrackableIdentifier/*{}*/ = (path.isIdentifier() || path.isThisExpression())
                                 && (!path.parentPath.isMemberExpression()
                                     || path.parentKey === "object")
                                 && (path.parentPath !== path.getFunctionParent());
  const isTrackableParameter = path.getFunctionParent().node.params 
                               && (path.parentPath === path.getFunctionParent())
                               && (path.getFunctionParent().node.params.includes(path.node));
  const /*probe:*/isTrackableMemberExpression/*{}*/ = path.isMemberExpression();
  const /*probe:*/isTrackableReturnStatement/*{}*/ = path.isReturnStatement();
  /*probe:*/return/*{}*/ isTrackableIdentifier
         || isTrackableParameter
         || isTrackableMemberExpression
         || isTrackableReturnStatement;
}

/**
 * Checks whether a path can be a slider
 */
export function /*example:*/canBeSlider/*{"id":"4426_b3f0_d927","name":{"mode":"input","value":"Function Name"},"color":"hsl(130, 30%, 70%)","values":{"path":{"mode":"select","value":"d695_3c6c_89a9"}},"instanceId":{"mode":"input","value":""},"prescript":"","postscript":""}*/(path) {
  if(!path || !path.parentPath) {
    return false;
  }
  
  const isTrackableIdentifier = path.isIdentifier()
                                && path.parentPath === path.getFunctionParent();
  const isTrackableLoop = path.isLoop();
  return /*probe:*/isTrackableIdentifier/*{}*/ || /*probe:*/isTrackableLoop/*{}*/;
}

/**
 * Checks whether a path can be an example
 */
export const canBeExample = (path) => {
  if(!path || !path.getFunctionParent) {
    return false;
  }
  
  // We have to be the name of a function
  const functionParent = path.getFunctionParent();
  const isFunctionName = (functionParent
                          && (functionParent.get("id") === path
                              || functionParent.get("key") === path));
  return (isFunctionName && path.node.name !== "constructor")
         || isArrowFunctionName(path);
}

/**
 * Checks whether a path can be an instance
 */
export const canBeInstance  = (path) => {
  if(!path || !path.parentPath) {
    return false;
  }
  
  // We have to be the name of a class
  const isClassName = (path.parentPath.isClassDeclaration() && path.parentKey === "id");
  return isClassName;
}

/**
 * Checks whether a path can be replaced
 */
export const canBeReplacement = (path) => {
  if(!path || !path.parentPath) {
    return false;
  }
  
  // We have to be the righthand side of an assignment
  return ((path.parentPath.isVariableDeclarator() && path.parentKey === "init")
          || (path.parentPath.isAssignmentExpression() && path.parentKey === "right"));
}

/**
 * Assigns IDs to add nodes of the AST
 */
export const assignIds = (ast) => {
  traverse(ast, {
    enter(path) {
      path.node._id = nextId();
    }
  });
  return ast;
};
const assignId = (node) => {
  node._id = nextId();
  return node;
}
let ID_COUNTER = 1;
const nextId = () => ID_COUNTER++;

/**
 * Applies basic modifications to the given AST
 */
export const applyBasicModifications = async (ast, replacementUrls = {}) => {
  const wrapPropertyOfPath = (path, property) => {
    const oldBody = path.get(property);
    const oldBodyNode = path.node[property];
    if(!oldBodyNode) {
      return;
    }
    if(oldBody.isBlockStatement && oldBody.isBlockStatement()) {
      // This is already a block
      return;
    } else if(oldBody instanceof Array) {
      const newBodyNode = prepForInsert(types.blockStatement(oldBodyNode));
      path.node[property] = [newBodyNode];
    } else {
      const newBodyNode = prepForInsert(types.blockStatement([maybeWrapInStatement(oldBodyNode)]));
      oldBody.replaceWith(newBodyNode);
    }
    return path;
  }

  // Prepare Tracker, enforce that all bodies are in BlockStatements, and collect imports
  const importNodes = [];
  traverse(ast, {
    BlockParent(path) {
      if(path.isProgram() || path.isBlockStatement() || path.isSwitchStatement()) {
        return;
      }
      if(!path.node.body) {
        console.warn("A BlockParent without body: ", path);
      }

      wrapPropertyOfPath(path, "body");
    },
    IfStatement(path) {
      for(let property of ["consequent", "alternate"]) {
        wrapPropertyOfPath(path, property);
      }
    },
    SwitchCase(path) {
      wrapPropertyOfPath(path, "consequent");
    },
    ImportDeclaration(path) {
      if(path.get("source").isStringLiteral() && ast._sourceUrl && ast._sourceUrl.length) {
        importNodes.push(path.node);
      }
    }
  });

  await Promise.all(importNodes.map(async (node) => {
    // Turn imports into absolute URLs so they work in the temporary workspace
    const importSource = node.source.value;
    const importUrl = await System.resolve(importSource, ast._sourceUrl);

    // Set either the real or the replacement URL
    if(replacementUrls[importUrl]) {
      node.source.value = replacementUrls[importUrl];
    } else {
      node.source.value = importUrl;
    }
  }));
}

export const applyTracker = (code) =>
  `const __connections = this.connections;
const __tracker = this.tracker;
${code};
__tracker.timer.reset();`;

export const applyContext = async (ast, context, replacementUrls) => {
  const prescriptNodes = astForCode(context.prescript).program.body;
  const postscriptNodes = astForCode(context.postscript).program.body;
  
  ast.program.body = prescriptNodes.concat(ast.program.body).concat(postscriptNodes);
  
  // Fix imports
  const importNodes = [];
  const collectImports = arr => {
    for(let i = 0; i < arr.length && arr[i].type === "ImportDeclaration"; i++) {
      importNodes.push(arr[i]);
    }
  };
  collectImports(prescriptNodes);
  collectImports(postscriptNodes);

  await Promise.all(importNodes.map(async (node) => {
    // Turn imports into absolute URLs so they work in the temporary workspace
    const importSource = node.source.value;
    const importUrl = await System.resolve(importSource, ast._sourceUrl);

    // Set either the real or the replacement URL
    if(replacementUrls[importUrl]) {
      node.source.value = replacementUrls[importUrl];
    } else {
      node.source.value = importUrl;
    }
  }));
  
  return ast;
}

/**
 * Applies replacement markers to the given AST
 */
export const applyReplacements = (ast, replacements) => {
  replacements.forEach((replacement) => {
    const replacementNode = replacementNodeForValue(replacement.value);
    if(!replacementNode) {
      return;
    }
    const path = ast._locationMap[replacement.location];
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
    ThisExpression(path) {
      if(!trackedNodes.includes(path.node)) return;
      insertIdentifierTracker(path);
    },
    ReturnStatement(path) {
      if(!trackedNodes.includes(path.node)) return;
      insertReturnTracker(path);
    },
    BlockStatement(path) {
      if(path.parentPath.isFunction() || path.parentPath.isLoop()) {
        insertIterationTracker(path, true);
      }
      insertBlockTracker(path);
      insertTimer(path);
    },
    Program(path) {
      insertIterationTracker(path, false);
      insertBlockTracker(path);
      insertTimer(path, true);
    }
  });
};

/**
 * Generates instances for the given AST
 */
export const applyInstances = (ast, instances, customInstances) => {
  const defaultInstanceNode = template(`const __0 = () => null;`)();
  ast.program.body.push(defaultInstanceNode);

  instances.forEach((instance) => {
    const path = ast._locationMap[instance.location];
    const className = path.node.name;

    let instanceNode = template(`const __${instance.id} = () => new CLASS(PARAMS);`)({
      CLASS: types.identifier(className),
      PARAMS: instance.values.map(replacementNodeForValue)
    });

    if(instanceNode) {
      ast.program.body.push(instanceNode);
    }
  });

  customInstances.forEach((instance) => {
    let instanceNode = template(`const __${instance.id} = () => { ${instance.code} }`)();

    if(instanceNode) {
      ast.program.body.push(instanceNode);
    }
  });
}

/**
 * Applies example markers to the given AST
 */
export const applyExamples = (ast, examples) => {
  // Prepare templates to insert
  const functionCall = template("ID.apply(this, PARAMS)");
  const staticMethodCall = template("CLASS.ID.apply(this, PARAMS)");
  const objectMethodCall = template("CLASS.prototype.ID.apply(this, PARAMS)");

  // Apply the markers
  examples.forEach((example) => {
    const path = ast._locationMap[example.location];
    let instanceNode = replacementNodeForValue(example.instanceId);
    let parametersValuesNode = types.arrayExpression(
      example.values.map(replacementNodeForValue)
    );
    let parametersNames = parameterNamesForFunctionIdentifier(path);
    let parametersNamessNode = types.arrayExpression(
      parametersNames.map((s) => types.identifier(s))
    );

    if(!parametersValuesNode) {
      parametersValuesNode = types.nullLiteral();
    }

    const functionParent = path.getFunctionParent()
    let exampleCallNode;

    // Distinguish between Methods and Functions
    if(functionParent.isClassMethod()) {
      // We have a method
      const classIdNode = functionParent.findParent(p => p.type === "ClassDeclaration").get("id").node;

      // Distinguish between static and object methods
      if(functionParent.node.static) {
        exampleCallNode = staticMethodCall({
          CLASS: types.identifier(classIdNode.name),
          ID: types.identifier(path.node.name),
          PARAMS: parametersNamessNode
        });
      } else {
        // Get the example instance
        exampleCallNode = objectMethodCall({
          CLASS: types.identifier(classIdNode.name),
          ID: types.identifier(path.node.name),
          PARAMS: parametersNamessNode
        });
      }
    } else {
      exampleCallNode = functionCall({
        ID: types.identifier(path.node.name),
        PARAMS: parametersNamessNode
      });
    }

    // Insert a call at the end of the script
    if(exampleCallNode) {
      ast.program.body.push(
        template(`
          try {
            __tracker.example("${example.id}");
            const example = function(${parametersNames.join(", ")}) {
              ${example.prescript};
              EXAMPLECALL;
              ${example.postscript};
            };
            example.apply(INSTANCE, PARAMS);
          } catch(e) {
            __tracker.error(e.message);
          }`)({
          EXAMPLECALL: exampleCallNode,
          INSTANCE: instanceNode,
          PARAMS: parametersValuesNode
        })
      );
    }
  });
}

/**
 * Inserts an appropriate tracker for the given identifier path
 */
const insertIdentifierTracker = (path) => {
  // Prepare Trackers
  const trackerTemplate = template("__tracker.id(ID, __tracker.exampleId, __iterationId, __iterationCount, VALUE, NAME, KEYWORD)");
  const trackerBuilder = (keyword = "after") => trackerTemplate({
    ID:      types.numericLiteral(path.node._id),
    VALUE:   deepCopy(path.node),
    NAME:    types.stringLiteral(stringForPath(path)),
    KEYWORD: types.stringLiteral(keyword),
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
    functionParentPath.get("body").unshiftContainer("body", trackerBuilder());
  } else if(statementParentPath.isReturnStatement()) {
    // We are in a return statement
    // Prepend the tracker to the return
    statementParentPath.insertBefore(trackerBuilder());
  } else if(statementParentPath.isBlockParent()) {
    // We are in a block
    // Insert into the block body
    const body = statementParentPath.get("body");
    if(body instanceof Array) {
      body.unshift(trackerBuilder());
    } else if (body.isBlockStatement()) {
      body.unshiftContainer("body", trackerBuilder());
    } else {
      body.replaceWith(
        types.blockStatement([
          body
        ])
      );
      body.unshiftContainer("body", trackerBuilder());
    }
  } else if(statementParentPath.isIfStatement()) {
    // We are in an if
    // We have to insert the tracker before the if
    statementParentPath.insertBefore(trackerBuilder());
  } else if(path.parentPath.isVariableDeclarator()
            && path.parentKey === "id") {
    // Declaration - only track value after
    statementParentPath.insertAfter(trackerBuilder());
  } else {
    // Normal statement - track value before and after
    statementParentPath.insertBefore(trackerBuilder("before"));
    statementParentPath.insertAfter(trackerBuilder("after"));
  }
};

/**
 * Insers an appropriate tracker for the given return statement
 */
const insertReturnTracker = (path) => {
const returnTracker = template("__tracker.id(ID, __tracker.exampleId, __iterationId, __iterationCount, VALUE, NAME)")({
    ID: types.numericLiteral(path.node._id),
    VALUE: path.node.argument,
    NAME: types.stringLiteral("return")
  });
  path.get("argument").replaceWith(returnTracker);
}

/**
 * Inserts a tracker to check whether a block was entered
 */
const insertBlockTracker = (path) => {
  if(typeof path.node._id === "undefined") {
    return;
  }
  const blockId = template("const __blockId = ID")({
    ID: types.numericLiteral(path.node._id)
  });
  const tracker = template("__tracker.block(__blockId)")();
  path.unshiftContainer("body", tracker);
  path.unshiftContainer("body", blockId);
};

/**
 * Inserts a tracker to count iterations
 */
const insertIterationTracker = (path) => {
  if(typeof path.node._id === "undefined") {
    return;
  }
  
  const iterationId = template("const __iterationId = ID")({
    ID: types.numericLiteral(path.node._id)
  });
  const iterationCounter = template("const __iterationCount = __tracker.iteration(__iterationId)")();
  
  path.unshiftContainer("body", iterationCounter);
  path.unshiftContainer("body", iterationId);
};


/**
 * Inserts a timer check
 */
const insertTimer = (path, isStart = false) => {
  if(typeof path.node._id === "undefined") {
    return;
  }
  const code = `__tracker.timer.${isStart ? "start" : "check"}()`;
  path.unshiftContainer("body", template(code)());
};

/**
 * Returns a list of parameter names for the given function Identifier
 */
export const parameterNamesForFunctionIdentifier = (path) => {
  let parameterPaths = [];
  if(isArrowFunctionName(path)) {
    parameterPaths = path.parentPath.get("init").get("params");
  } else {
    parameterPaths = path.getFunctionParent().get("params");
  }

  return parameterPaths.map(parameterPath => {
    if(parameterPath.isIdentifier()) {
      return parameterPath.node.name;
    } else if(parameterPath.isAssignmentPattern()) {
      return parameterPath.node.left.name;
    }
    return null;
  }).filter(name => !!name);
}

/**
 * Returns a list of parameter names for the constructor of given class Identifier
 */
export const constructorParameterNamesForClassIdentifier = (path) => {
  const functions = path.parentPath.get("body").get("body");
  for(let f of functions) {
    let idPath = f.get("key");
    if(idPath.node.name === "constructor") {
      return parameterNamesForFunctionIdentifier(idPath);
    }
  }
  return [];
}

/**
 * Generates a replacement node
 * (to be used as the righthand side of an assignment)
 */
export const replacementNodeForCode = (code) => {
  // The code we get here will be used as the righthand side of an Assignment
  // We we pretend that it is that while parsing

  if(!code || !code.length) {
    return types.nullLiteral();
  }

  code = `placeholder = ${code}`;
  try {
    const ast = astForCode(code);
    return ast.program.body[0].expression.right;
  } catch (e) {
    console.error("Error parsing replacement node", e);
    return null;
  }
}

const wrapPrePostScript = (name, args, code) => {
  code = `const ${name} = function(${args.join(", ")}) { ${code} };`;
  try {
    const ast = astForCode(code);
    return ast.program.body[0];
  } catch (e) {
    console.error("Error parsing replacement node", e);
    return null;
  }
}

const replacementNodeForValue = (value) => {
    switch(value.mode) {
      case "input":
        return replacementNodeForCode(value.value);
      case "select":
        return replacementNodeForCode(instanceTemplate(value.value));
      case "connect":
        return replacementNodeForCode(connectorTemplate(value.value));
    }
  };

/**
 * Parses code and returns the AST
 */
export const astForCode = (code) =>
  transform(code, Object.assign({}, defaultBabylonConfig(), {
    code: false,
    ast: true
  })).ast

/**
 * Generates executable code for a given AST
 */
export const codeForAst = (ast) =>
  transformFromAst(ast, Object.assign({}, defaultBabylonConfig(), {
    code: true,
    ast: false
  })).code;


const stringForPath = (path) => {
  if(path.isIdentifier()) {
    return path.node.name;
  } else if(path.isThisExpression()) {
    return "this";
  } else if(path.isMemberExpression()) {
    return `${stringForPath(path.get("object"))}.${stringForPath(path.get("property"))}`;
  } else {
    return "";
  }
}

export const bodyForPath = (path) => {
  if(path.node && path.node.body) {
    return path.get("body");
  } else if(path.parentPath && path.parentPath.node && path.parentPath.node.body) {
    return path.parentPath.get("body");
  }
  return null;
}

const assignLocationToBlockStatement = (node) => {
  if(node.body.length) {
    node.loc = {
      start: node.body[0].loc.start,
      end: node.body[node.body.length - 1].loc.end
    }
  } else {
    node.loc = {
      start: { line: 1, column: 0 },
      end: { line: 1, column: 0 }
    };
  }
  return node;
}

const prepForInsert = (node) => {
  assignId(node);
  if(node.type === "BlockStatement") {
    assignLocationToBlockStatement(node);
  }
  return node;
}

const maybeWrapInStatement = (node) => {
  if(types.isStatement(node)) {
    return node;
  } else if(types.isExpression(node)) {
    const expressionNode = types.expressionStatement(node);
    expressionNode.loc = node.loc;
    return expressionNode;
  } else {
    console.error("Tried to wrap something unknown:", node);
    return node;
  }
}

const connectorTemplate = (id) => `__connections["${id}"]`;

const instanceTemplate = (id) => `__${id}()`;

const isArrowFunctionName = path =>
  (path.isIdentifier()
   && path.parentPath.isVariableDeclarator()
   && path.parentPath.get("id") === path
   && path.parentPath.get("init").isArrowFunctionExpression());


/* Context: {"context":{"prescript":"","postscript":""},"customInstances":[{"id":"35d8_cf9d_8ad4","name":"Simple AST","code":"return transform(\"const i = 0\").ast;"},{"id":"9055_2982_7d26","name":"<div>","code":"return document.createElement(\"div\");"},{"id":"8a96_17d6_1be7","name":"Fibonacci AST","code":"const code = `\nfunction fib(i) {\n  if(i <= 1) return 1;\n  return fib(i-1) + fib(i-2);\n}`\n\nreturn transform(code).ast;"},{"id":"1558_7aa2_37fa","name":"Identifier Path","code":"const ast = transform(\"const i = 0\").ast;\nlet id = null;\ntraverse(ast, {\n  Identifier(path) {\n    id = path;\n  } \n})\nreturn id;"},{"id":"d779_a710_b464","name":"Member Identifier Path","code":"const ast = transform(\"this.test = 0\").ast;\nlet id = null;\ntraverse(ast, {\n  Identifier(path) {\n    id = path;\n  } \n})\nreturn id;"},{"id":"d695_3c6c_89a9","name":"Function Name Path","code":"const ast = transform(\"function test() {}\").ast;\nlet id = null;\ntraverse(ast, {\n  Identifier(path) {\n    id = path;\n  } \n})\nreturn id;"}]} */