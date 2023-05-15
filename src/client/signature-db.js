import babelDefault from 'src/external/babel/babel7default.js';
const babel = babelDefault.babel;
import plugin from 'src/external/babel-plugin-syntax-all.js';

// #TODO check if babel7 works with this.... 

export const NodeTypes = Object.freeze({'FILE': "File",
                                        'VAR': "Var",
                                        'FUNCTION': "Function",
                                        'CLASS': "Class",
                                        'METHOD': "Method"});

export class SignatureManipulator {

  async parseAndExtractFile(name) {
    var file = await fetch(name).then( r => r);
    var text = await file.text();
    var versionNum = file.headers.get('fileversion');
    var ast =  this.astFromText(text);
    return {ast: ast, sigs: await this.getTopLevelSigs(ast, versionNum, name), content: text};
  }

  astFromText(text) {
    return babel.transform(text, {
        plugins: plugin,
        ast: true
      }).ast.program;
  }

  astFromMethod(text) {
    var wrappedText = `class Dummy { ${text} }`;
    return this.astFromText(wrappedText).body[0].body.body[0];
  }
  
  async setNewContent(filename, type, id, content, parentID='') {
    
    function replaceOrAppendChild(parent, newNode, childType='other') {
      var existing = false;
      for(var childIndex in parent) {
        var child = parent[childIndex];
        var replaceCondition;
        if(childType === NodeTypes.METHOD)
          replaceCondition = (child.key.name === id);
        else if(childType === NodeTypes.VAR)
          replaceCondition = (child.hasOwnProperty('declarations') && child.declarations[0].id.name === id);
        else
          replaceCondition = (child.hasOwnProperty('id') && child.id.name === id);
        if(replaceCondition) {
          parent[childIndex] = newNode;
          existing = true;
          break;
        }
      }
      if(!existing) {
          parent.push(newNode);
      }
    }
    
    var rootNode = await this.parseAndExtractFile(filename);
    rootNode = rootNode.ast;
    var code;
    switch (type) {
      case NodeTypes.METHOD:
        var newNode = this.astFromMethod(content);
        var parentClass = false;
        for (var declaration of rootNode.body) {
          if(declaration.hasOwnProperty('id') && declaration.id.name === parentID) {
            parentClass = declaration;
            break;
          }
        }
        if(!parentClass) 
          lively.notify('[Semantic Navigator] Could not find parent element, saving won\'t work!');
        else
          replaceOrAppendChild(parentClass.body.body, newNode, NodeTypes.METHOD)
        code = this.getNodeContent(rootNode);
        break;
      case NodeTypes.VAR:
      case NodeTypes.CLASS:
      case NodeTypes.FUNCTION:
        newNode = this.astFromText(content);
        replaceOrAppendChild(rootNode.body, newNode, type)
        code = this.getNodeContent(rootNode);
        break;
      case NodeTypes.FILE:
        code = content;
        break;
    }
    lively.files.saveFile(filename, code);
  }

  getNodeContent(node) {
    var wrapper = {
      directives: [],
      start: 0,
      end: 0,
      type: 'Program',
      sourceType: 'module',
      body: [node]
    };
    return babel.transformFromAst(wrapper, {sourceType: 'module'}).code;
  }

  /**
  Output of top-level signatures from file:
  {
    classes: [ {
      sig: 'class ExampleClass {',
      methods: ['static sampleMethods()']
      }],
     functions: ['function sampleTopLevelFunc()'],
     vars: ['var sampleVar']
  }
  **/
  async getTopLevelSigs(ast, versionNum, fileName) {
    var classes = [];
    var funcs = [];
    var variables = [];
    for (var declaration of ast.body) {
      if (declaration.type.includes('Export'))
        declaration = declaration.declaration
      if (declaration.type.includes('Class')) {
        classes.push(await this.extractClassAndMethods(declaration, versionNum,
                                                       fileName))
      }
      if (declaration.type.includes('Variable')) {
          variables.push.apply(variables, await this.extractSignature(declaration, versionNum,
                                                                      fileName, this.getNodeContent(declaration),
                                                                      NodeTypes.VAR));
      }
      if (declaration.type.includes('Function')) {
        funcs.push.apply(funcs, await this.extractSignature(declaration, versionNum,
                                                            fileName, this.getNodeContent(declaration),
                                                            NodeTypes.FUNCTION));
      }
    }
    return {[NodeTypes.CLASS]: classes, 
            [NodeTypes.FUNCTION]: funcs, 
            [NodeTypes.VAR]: variables};
  }
  
  /**
  Output of class and method signatures from file:
  {
    sig: 'class ExampleClass {',
    methods: ['static sampleMethods()']
  }
  **/
  async extractClassAndMethods(classDeclaration, versionNum, fileName) {
    var res = {'sig': '', 'methods': []};
    res['sig'] = (await this.extractSignature(classDeclaration, versionNum,
                                            fileName, this.getNodeContent(classDeclaration),
                                            NodeTypes.CLASS))[0];
    if(classDeclaration.body) {
      var childDeclarations = classDeclaration.body.body;
      for(var child of childDeclarations) {
        if(child.type.includes('Method')) {
          res['methods'].push.apply(res['methods'], await this.extractSignature(child, versionNum,
                                                                                fileName,
                                                                                this.getNodeContent(child),
                                                                                NodeTypes.METHOD));
        }
      }
    }
    return res;
  }
  
  async extractSignature(declaration, versionNum, fileName, content, type) {
    var sigs = [];
    var decls = type === NodeTypes.VAR ? declaration.declarations : [declaration];
    for(var decl of decls) {
      var sig = {
        version: versionNum,
        file: fileName,
        content: content};
      var identifier = type === NodeTypes.METHOD ? decl.key : decl.id;
      var stringDecl;
      switch (type) {
        case NodeTypes.METHOD:
        case NodeTypes.FUNCTION:
          stringDecl = `${decl.async ? 'async ' : ''}` + 
               `${identifier.name} ` + 
               `(${decl.params.map(t => t.name).join(',')})`;
          break;
        case NodeTypes.CLASS:
        case NodeTypes.VAR:
          stringDecl = `${type === NodeTypes.CLASS ? 'class' : declaration.kind} ${identifier.name}`;
          break;
      }
      sig.id = identifier.name;
      sig.declaration = stringDecl;
      sigs.push(sig);
    }
    return sigs;
  }
  
}
