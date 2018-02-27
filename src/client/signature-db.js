import {babel} from 'systemjs-babel-build';
import plugin from 'https://lively-kernel.org/lively4/foo/src/external/babel-plugin-syntax-all.js';

export const NodeTypes = Object.freeze({'FILE': 1,
                                        'VAR': 2,
                                        'FUNCTION': 3,
                                        'CLASS': 4,
                                        'METHOD': 5});

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
        plugins: plugin
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
        code = content
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
      if (declaration.type.includes('Class')) {
        classes.push(await this.extractClassAndMethods(declaration, versionNum,
                                                       fileName, this.getNodeContent(declaration)))
      }
      if (declaration.type.includes('ExportDefault') && declaration.declaration.type.includes('Class')) {
        classes.push(await this.extractClassAndMethods(declaration.declaration, versionNum,
                                                       fileName, this.getNodeContent(declaration)))
      }
      if (declaration.type.includes('Variable')) {
        for(var dec of declaration.declarations) {
          variables.push(await this.extractVariableSig(declaration.kind, dec, versionNum,
                                                       fileName, this.getNodeContent(declaration)));
        }
      }
      if (declaration.type.includes('Function')) {
        funcs.push(await this.extractFunctionSig(declaration, versionNum,
                                                 fileName, this.getNodeContent(declaration)));
      }
    }
    return {'classes': classes, 'functions': funcs, 'variables': variables};
  }
  
  /**
  Output of class and method signatures from file:
  {
    sig: 'class ExampleClass {',
    methods: ['static sampleMethods()']
  }
  **/
  async extractClassAndMethods(classDeclaration, versionNum, fileName, content) {
    var res = {'sig': '', 'methods': []};
    res['sig'] = await this.extractClassSig(classDeclaration, versionNum,
                                            fileName, this.getNodeContent(classDeclaration));
    if(classDeclaration.body) {
      var childDeclarations = classDeclaration.body.body;
      for(var child of childDeclarations) {
        if(child.type.includes('Method')) {
          res['methods'].push(await this.extractMethodSig(child, versionNum,
                                                          fileName, this.getNodeContent(child)));
        }
      }
    }
    return res;
  }

  async extractClassSig(declaration, versionNum, fileName, content) {
    return {
          declaration: `class ${declaration.id.name}`,
          id: declaration.id.name,
          version: versionNum,
          file: fileName,
          content: content
        }
  }

  async extractVariableSig(kind, declaration, versionNum, fileName, content) {
    return {
          declaration: `${kind} ${declaration.id.name}`,
          id: declaration.id.name,
          version: versionNum,
          file: fileName,
          content: content
    }
  }

  async extractMethodSig(declaration, versionNum, fileName, content) {
    return {
          declaration: `${declaration.async ? 'async ' : ''} ` + 
               `${declaration.key.name} ` + 
               `(${declaration.params.map(t => t.name).join(',')})`,
          id: declaration.key.name,
          version: versionNum,
          file: fileName,
          content: content
    }
  }

  async extractFunctionSig(declaration, versionNum, fileName, content) {
    return {
          declaration: `${declaration.async ? 'async ' : ''} ` + 
               `${declaration.id.name} ` + 
               `(${declaration.params.map(t => t.name).join(',')})`,
          id: declaration.id.name,
          version: versionNum,
          file: fileName,
          content: content
    }
  }
  
}