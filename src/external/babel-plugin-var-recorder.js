const moduleNameToVarRecorderName = new Map();

export function getScopeIdForModule(moduleName) {
  // console.log("[babel-plugin-var-recorder] getScopeIdForModule", moduleName);
  if (!moduleNameToVarRecorderName.has(moduleName)) {
    var scopeId = (moduleName || "undefined").replace(lively4url, "").replace(/[^a-zA-Z0-9]/g, "_")
    moduleNameToVarRecorderName.set(moduleName, scopeId);
  }
    
  var result = moduleNameToVarRecorderName.get(moduleName);
  if (result === "_") {
      result = "_no_scope_id" // e.g. can happen in our byzantine workspace code, sorry... because there are no filenames for boundEval... 
    } 
  return result
  
}

/*MD ## Marking Nodes MD*/
const GENERATED = Symbol('generated');
// we could use WeakMaps instead?
function isMarked(node) {
  return node[GENERATED];
}
function mark(node) {
  node[GENERATED] = true;
  return node;
}



class VarRecorder {
    
  /*MD ## Visitor API MD*/
  enter(program, state) {
    this.program = program
    const file = state.file;
    state.var_recorder_info = {};
    this.filename = file.opts.filename

    this.initTemplates()
    this.splitUpVariableDeclarations()
    
    // this.rewriteExportVariableDeclarations()
    // this.rewriteGloablVariableDeclarations()
    
    this.rewriteBindings()

    this.removeTrashNodes()
  }

  // #Important qw
  exit(path, state) {
    const lazyInitializeModuleScopeTemplate = template(
      `${this.VAR_RECORDER_NAME}.${this.MODULE_IDENTIFIER} = ${this.VAR_RECORDER_NAME}.${this.MODULE_IDENTIFIER} || {}`);
    const lazyInitializeModuleScope = lazyInitializeModuleScopeTemplate();
    path.unshiftContainer('body', lazyInitializeModuleScope);
    path.unshiftContainer('body', template("const __SystemJSRewritingHack = {};")());
  }

  /*MD ## Implementation MD*/

  get MODULE_NAME() {
    if (!this._MODULE_NAME) {
      const DOIT_MATCHER = /^\/?workspace(async)?(js)?:/; // #TODO babel7 seems to add / as prefix
      const MODULE_MATCHER = /.js$/;

      if (window.__topLevelVarRecorder_ModuleNames__ && DOIT_MATCHER.test(this.filename) && !MODULE_MATCHER.test(this.filename)) {
        // workspace: becomes workspacejs... e.g. and we are only interested in the id ...
        var codeIdAndPath = this.filename.replace(DOIT_MATCHER, "") 
        // strip path... that we encoded.... 
        var codeId = codeIdAndPath.replace(/\/.*/, "") 

        codeId = codeId + "/" // see bound-eval.js 

        // (A) - filename
        // (B) - code id (per doit?) and a path....

        // TODO the path should be the module in the first place.....
        // why not: MODULE_NAME = codeIdAndPath.replace(/^[\/]*/,"")
        this._MODULE_NAME = window.__topLevelVarRecorder_ModuleNames__[codeId];
        // console.log("boundEval MODULE_NAME: " + MODULE_NAME + " codeId: " + codeId)
      } else if (!DOIT_MATCHER.test(this.filename) && MODULE_MATCHER.test(this.filename)) {
        // eval a .js file
        this._MODULE_NAME = this.filename;
      } else if (DOIT_MATCHER.test(this.filename) && MODULE_MATCHER.test(this.filename)) {
        // doits of in modules might take this path...
        // throw new Error("relative files loaded by workspace failed to resolve early: " + this.filename)
      } else {
        throw new Error(`Transpiling neither a .js module nor workspace code(${this._MODULE_NAME})`);
      }        
    }
    return this._MODULE_NAME
  }

  get VAR_RECORDER_NAME() {
    return '_recorder_'; 
  }

  get MODULE_IDENTIFIER() {
    var result =  getScopeIdForModule(this.MODULE_NAME); 
    if (result === "_") {
      debugger
    }
    return result
  }

  ensureVarRecorder() {
    return window[this.VAR_RECORDER_NAME] = window[this.VAR_RECORDER_NAME] || {};
  }

  ensureVarRecorderModule() {
    var rec = this.ensureVarRecorder() 
    return rec[this.MODULE_IDENTIFIER] = rec[this.MODULE_IDENTIFIER] || {};
  }
  
  initTemplates() {
    this.varToRecordTemplate = template(`
        Object.defineProperty(${this.VAR_RECORDER_NAME}.${this.MODULE_IDENTIFIER}, %%referenceString%%, { 
        get() { return %%reference%%; }, 
        set(thisIsVererySecretVariableName) {%%reference%% = thisIsVererySecretVariableName; return true }, 
        enumerable: true, 
        configurable: true})
      `)
    this.recordToVarTemplate = template(`%%reference%% = ${this.VAR_RECORDER_NAME}.${this.MODULE_IDENTIFIER}.%%reference%%`),
    this.referenceTemplate = template(`${this.VAR_RECORDER_NAME}.${this.MODULE_IDENTIFIER}.%%reference%%`);
  }

  replaceReference(ref) {
    ref.replaceWith(this.referenceTemplate({ reference: ref.node }).expression);
    ref.skip();
  }

  splitUpVariableDeclarations() {
    this.topLevelVariableDeclarations = new Set()
    this.topLevelVariableExportDeclarations = new Set()
    for (let binding of this.getAllBindings()) {
      var declarationPath = binding.path.parentPath
      if (declarationPath.parent.type == "ExportNamedDeclaration") {
        if (declarationPath.node.declarations && declarationPath.node.declarations.length > 0) {
          this.topLevelVariableExportDeclarations.add(declarationPath) // we need to split them up
        }
      } else if (declarationPath.node.declarations && declarationPath.node.declarations.length > 0) {
        this.topLevelVariableDeclarations.add(declarationPath) // we need to split them up
      }
    }
  }

  simpleExportDeclaration(name) {
    return  t.ExportNamedDeclaration(template(`var name`)({ name: name }), [], null)
  } 
  
  rewriteExportVariableDeclarations() {
    for (let declarationPath of Array.from(this.topLevelVariableExportDeclarations)) {
      var exportDeclaration = declarationPath.parentPath
      var declarations = declarationPath.get("declarations")
      declarations.forEach(declarator => {
        if (declarator.get("id").isIdentifier()) {
          exportDeclaration.insertBefore(this.simpleExportDeclaration( declarator.node.id))
        } else {
          declarator.get("id").traverse({
            Identifier: (path) => {                    
              if (path.parentPath.isObjectProperty() && path.parentKey == "key") return;
              exportDeclaration.insertBefore(this.simpleExportDeclaration( path.node))
            }
          })
        }
      })
      // insertAfter... will flip the order... so, we do it reverse and then the order will be fine ... fingers crossed! ;-)
      declarations.reverse().forEach(declarator => {
        if (declarator.node.init) {
          exportDeclaration.insertAfter(template(`name = init`)({name: declarator.node.id, init: declarator.node.init}))
        }
      })
      declarationPath.node.kind = "var" // asignments in const are a problem... 
      this.trashNode(exportDeclaration)
    }
  }

  rewriteGloablVariableDeclarations() {
    for (let declarationPath of Array.from(this.topLevelVariableDeclarations)) {
      declarationPath.get("declarations").forEach(declarator => {
        if (declarator.get("id").isIdentifier()) {                
          declarationPath.insertBefore(template(`var name`)({
            name: declarator.node.id
          }))
        } else {
          declarator.get("id").traverse({
            Identifier(path) {                    
              if (path.parentPath.isObjectProperty() && path.parentKey == "key") return;
              declarationPath.insertBefore(template(`var name`)({
                name: path.node
              }))  
            }
          })
        }
      })

      // insertAfter... will flip the order... so, we do it reverse and then the order will be fine ... fingers crossed! ;-)
      declarationPath.get("declarations").reverse().forEach(declarator => {
        if (declarator.get("id").isIdentifier()) {
          if (declarator.node.init) {
            declarationPath.insertAfter(template(`name = init`)({ name: declarator.node.id, init: declarator.node.init }))
          }
        } else {
          if (declarator.node.init) {
            var references = []
            declarator.get("id").traverse({
              Identifier(path) {                    
                if (path.parentPath.isObjectProperty() && path.parentKey == "key") return;
                references.push(path.node.name)
              }
            })
            // since templates don't support loops, we generate a string here...
            var refString = references.map(ea => `${this.VAR_RECORDER_NAME}.${this.MODULE_IDENTIFIER}.${ea} = ${ea}`).join("; ")
            declarationPath.insertAfter(template(`{let pattern = init; ${refString}}`)({ 
              pattern: declarator.get("id").node, 
              init: declarator.node.init 
            }))
          }
        }
      })
      this.trashNode(declarationPath)
    }
  }

  partOfForStatement(binding) {
    const parentPath = binding.path.parentPath;
    const shouldSortOut = binding.path.isVariableDeclarator() &&
      parentPath.isVariableDeclaration() &&
      parentPath.node.kind === "var" && ((
        (
          parentPath.parentPath.isForAwaitStatement() ||
          parentPath.parentPath.isForInStatement() ||
          parentPath.parentPath.isForOfStatement()
        ) && parentPath.parentKey === "left"
      ) || (
        parentPath.parentPath.isForStatement() &&
        parentPath.parentKey === "init"
      ));
    return shouldSortOut;
  }

  bubbleThroughPattern(path) {
    if (path.parentPath.isArrayPattern() && path.parentKey === 'elements') 
      return this.bubbleThroughPattern(path.parentPath);
    if (path.parentPath.isRestElement() && path.parentKey === 'argument') 
      return this.bubbleThroughPattern(path.parentPath);
    if (path.parentPath.isObjectPattern() && path.parentKey === 'properties') 
      return this.bubbleThroughPattern(path.parentPath);
    if (path.parentPath.isObjectProperty() && path.parentKey === 'value') 
      return this.bubbleThroughPattern(path.parentPath);
    if (path.parentPath.isRestProperty() && path.parentKey === 'argument') 
      return this.bubbleThroughPattern(path.parentPath);
    return path;
  }

  rewriteBinding(binding) {
    if (this.partOfForStatement(binding)) {
      binding.__ignoreRecorder__ = true;
      return;
    } 

    binding.referencePaths
      .filter(ref => {
        // ExportNamedDeclarations should not be rewritten as reference
        // they are already rewritten as binding

        if (ref.isExportNamedDeclaration()) {
          return false;
        }
        // Same for declaring the default export
        if (ref.isExportDefaultDeclaration()) {
          return false;
        }

        // handle named exports special
        if (ref.parentPath.isExportSpecifier() && ref.parentKey === 'local') {
          ref
            .find(path => path.parentPath.isProgram())
            .insertBefore(this.recordToVarTemplate({ reference: mark(t.identifier(binding.identifier.name)) }))
            .forEach(newPath => newPath.skip());
          ref.skip();
          return false;
        }

        // ObjectPatterns and ArrayPatterns in VariableDeclarations do not accept MemberExpressions.
        // Thus, we have to filter out these cases explicitly.
        if (ref.findParent(p => p.isPattern()) && ref.findParent(p => p.isDeclaration())) {
          let pattern = this.bubbleThroughPattern(ref);
          if (pattern.parentPath.isVariableDeclarator() && pattern.parentKey === 'id') return false;
        }
        return true;
      })
      // .forEach(ea => this.replaceReference(ea)); 

    
    // dealing with the declaration of the binding
    let varToRecord = this.varToRecordTemplate({ reference: t.identifier(binding.identifier.name),
      referenceString: t.stringLiteral(binding.identifier.name), });
    // Add location position for AE Debugging
    varToRecord.expression.arguments[2].properties[1].body.body[0].expression.loc = binding.identifier.loc;

    varToRecord.markedAsMeta = true


    if (binding.kind === 'hoisted' /* || binding.kind === 'module'*/ ) {
      binding.path
        .find(path => path.isProgram())
        .unshiftContainer('body', varToRecord);
    } else {
      // #DesignQuestion
      // a) should we add a guard here and check if the variable was recorded and we are reloaded
      // b) change the semantics of variable declarations to be assigned with "undefined" if first time loaded [as implemented below]
      if (!binding.path.node.init)
        binding.path.node.init = this.referenceTemplate({
          reference: t.identifier(binding.identifier.name)
        }).expression;
      binding.path
        .getStatementParent()
        .insertAfter(varToRecord)
        .forEach(newPath => newPath.skip());
    }
  }
  
  // TODO: is there a general way to exclude non-variables?
  isVariable(path) {
    // - filter out with negative conditions
    if (t.isLabeledStatement(path.parent) && path.parentKey === 'label') return false;
    if (t.isBreakStatement(path.parent) && path.parentKey === 'label') return false;
    if (t.isForInStatement(path.parent) && path.parentKey === 'left') return false;
    if (t.isFunctionExpression(path.parent) && path.parentKey === 'id') return false;
    if (t.isImportDefaultSpecifier(path.parent) && path.parentKey === 'local') return false;
    if (t.isCatchClause(path.parent) && path.parentKey === 'param') return false;
    if (t.isObjectProperty(path.parent) && path.parentKey === 'key') return false;
    if (t.isClassDeclaration(path.parent)) return false;
    if (t.isClassMethod(path.parent)) return false;
    if (t.isImportSpecifier(path.parent)) return false; // correct?
    if (t.isMemberExpression(path.parent) && path.parentKey === 'property' && !path.parent.computed) return false; // TODO: correct?
    if (t.isObjectMethod(path.parent)) return false;
    if (t.isFunctionDeclaration(path.parent)) return false;
    if ((t.isArrowFunctionExpression(path.parent) && path.parentKey === 'params')) return false;
    if ((t.isFunctionExpression(path.parent) && path.parentKey === 'params')) return false;
    if (t.isRestElement(path.parent)) return false;

    // TODO: 2nd stage:
    // - return true on known conditions
    return true;

    // - throw error at others
  }

   rewriteIdentifiers(path) {
    if (isMarked(path.node)) return;
    if (!this.isVariable(path)) return;

    // special case of assigning to a reference
    let pattern = this.bubbleThroughPattern(path);
    if (pattern.parentPath.isAssignmentExpression() && pattern.parentKey === 'left') {
      let par = path.find(parent => parent.scope.hasOwnBinding(path.node.name));
      // is our binding scope the module-wide scope?
      if (par && par.scope === this.program.scope) {

        // is it part of a for in declaration
        const binding = par.scope.getOwnBinding(path.node.name)
        if (binding && binding.__ignoreRecorder__) { return; }

        if (!path.find(p => p.node.markedAsMeta)) {
          this.replaceReference(path);
        }

        return path.skip();
      }
    }

    // Distinguish between module-bound variables and real globals
    if (
      path.scope.hasGlobal(path.node.name) &&
      this.moduleBoundGlobals.includes(path.node.name)
    ) {
      this.replaceReference(path);
      return path.skip();
    }
  }

  
  
  
  rewriteAllIdentifiers(path) {
    if (isMarked(path.node)) return;
    if (!this.isVariable(path)) return;

    // special case of assigning to a reference
    let pattern = this.bubbleThroughPattern(path);
    if (pattern.parentPath.isAssignmentExpression() && pattern.parentKey === 'left') {
      let par = path.find(parent => parent.scope.hasOwnBinding(path.node.name));
      // is our binding scope the module-wide scope?
      if (par && par.scope === this.program.scope) {

        // is it part of a for in declaration
        const binding = par.scope.getOwnBinding(path.node.name)
        if (binding && binding.__ignoreRecorder__) { return; }

        if (!path.find(p => p.node.markedAsMeta)) {
          this.replaceReference(path);
        }

        return path.skip();
      }
    }

    // Distinguish between module-bound variables and real globals
    if (
      path.scope.hasGlobal(path.node.name) &&
      this.moduleBoundGlobals.includes(path.node.name)
    ) {
      this.replaceReference(path);
      return path.skip();
    }
  }

  get moduleBoundGlobals() {
    if(!this._moduleBoundGlobals) {
      this._moduleBoundGlobals = Object.keys(this.ensureVarRecorderModule());
    }
    return this._moduleBoundGlobals
  } 

  getAllBindings() {
    return Object.values(this.program.scope.getAllBindings())
  }

  rewriteBindings() {
    this.getAllBindings().forEach(binding => this.rewriteBinding(binding));   
    this.program.traverse({
      Identifier: (path) => this.rewriteIdentifiers(path)
    })
  }

  trashNode(node) {
    if (!this.toBeRemoved) this.toBeRemoved = new Set() 
    this.toBeRemoved.add(node)
  }

  removeTrashNodes() {
    if (!this.toBeRemoved) return;
    this.toBeRemoved.forEach(ea => {
      ea.remove()
    })
    this.toBeRemoved = new Set() // just in case...
  }
}


let t, template;

/*MD # Plugin Function MD*/

export default function({ types: _types, template: _template }) {
  t = _types;
  template = _template;

  return {
    name: "top-level-var-recorder",
    visitor: {
      Program: {
        enter(program, state) {
          state.var_recorder = new VarRecorder()
          state.var_recorder.enter(program, state)
        },
        exit(path, state) {
          state.var_recorder.exit(path, state)
        },
      },
    }
  };

}
