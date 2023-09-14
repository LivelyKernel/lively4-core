import AstInspector from "./lively-ast-inspector.js"

import {TreeSitterDomainObject, LetSmilyReplacementDomainObject, ConstSmilyReplacementDomainObject} from "src/client/domain-code.js"

await lively.loadJavaScriptThroughDOM("treeSitter", lively4url + "/src/external/tree-sitter/tree-sitter.js")

const Parser = window.TreeSitter;
await Parser.init()

const JavaScript = await Parser.Language.load(lively4url + "/src/external/tree-sitter/tree-sitter-javascript.wasm");


import LivelyCodeMirrorCodeProvider from 'src/components/widgets/lively-code-mirror-code-provider.js';

import { loc, range } from 'src/client/utils.js';

export default class AstDomainObjectInspector extends AstInspector {
 
  async treeSitterParse(sourceCode) {
    const parser = new Parser;

    parser.setLanguage(JavaScript);

    
    const tree = parser.parse(sourceCode);
    return tree
  }
  
  
  treeSitterNodeSummary(astNode, isExpanded) {
      if (astNode.id) return astNode.id.name;
      if (astNode.key) {
        return astNode.key.value || astNode.key.name;
      }
    //}
    return null;
  }
  
 
  
  
  domainObjectClassifications(node) {
    const classifications = {};
    const allKeys = this.allKeys(node);

    // const fields = t.NODE_FIELDS[node.type];
    // const visitorKeys = t.VISITOR_KEYS[node.type];
    allKeys.forEach(key => {
      classifications[key] = new Set();
      // if (this.isLocationKey(key)) return classifications[key].add("location");
      // if (this.isTypeKey(key)) return classifications[key].add("type");
      if (this.isChildKey(key)) {
        classifications[key].add("child");
      } else {
        classifications[key].add("field");    
      }
      
    });
    return classifications;
  }
  
  renderDomainObject(element, expanded) {
    const target = element.target;
    if (target.childCount > 0) {
      element.append(this.expansionIndicatorTemplate(element.isExpanded));
    }
    element.append(this.keyTemplate(element));
    if (target.isReplacement) {
      element.append(<span style="font-size:8pt;padding:0px 2px 0px 2px;margin:0px; border-radius:3px; background:green; color:white">Replacement:</span>);
    }
    element.append(this.labelTemplate(target.type));
    element.append(<span style="font-size:6pt;padding:0px 2px 0px 2px;margin:0px; border-radius:3px; background:lightgray; color:white">{target.treeSitter.id}</span>);
    element.append(<span style="font-size:6pt;padding:0px;margin:0px"> {target.treeSitter.startIndex}-{target.treeSitter.endIndex} </span>);
    element.append(<button class="inspect" style="font-size:6pt;padding:0px;margin:0px"
                     click={(evt) => lively.openInspector(element.target)}>inspect</button>);
    const summary = this.treeSitterNodeSummary(element.target, element.isExpanded);
    if (summary) element.append(this.summaryTemplate(summary));
    this.attachHandlers(element);
    if (element.isExpanded) {
      const content = this.contentTemplate();
      const classifications = this.domainObjectClassifications(target);
      for (const key in classifications) {
        const classification = classifications[key];
        if (this.isVisibleAstNodeKey(classification)) {
          content.append(this.display(this.getKey(target, key), 
                                      this.isFoldable(key), key, { classification }))
        }
      }
      element.append(content);
    }
  }
  
  // (A) handle children via key
  isChildKey(key) {
    return Number.isInteger(key)  || key.match(/^[0-9]+$/)
  }
  
  getKey(element, key) {
    if (this.isChildKey(key)) {
      return element.children[key]
    } else {
      return element.childForFieldName(key)
    }
    // return element[key]
  }
  
  allKeys(obj) {
    if (obj.isDomainObject) {
      var result = []
      for(let i=0; i < obj.children.length; i++) {
        // let child = obj.children[i] 
        let key = i
        result.push(key)
      }
      return result
    }
    return super.allKeys(obj)
  }
  
  
  // getChildren(node) {
  //   var children = super.getChildren(node)
  //   if(this.isTreeSitterNode(node)) {
  //     for(let i=0; i < node.childCount; i++) {
  //       children.push(node.child(i))
  //     }
  //   }
  //   return children
  // }

  getElementType(obj) {
    if (obj.isDomainObject) return "DomainObject";
    return super.getElementType(obj)
  }
 
  async initialize() {
    await super.initialize()
    this.windowTitle = "AST TreeSitter Inspector";
    if (this.editor) {
      this.connectEditor(this.editor)
    }
  }  
  
  
  livelyMigrate(other) {
    super.livelyMigrate(other)
    this.editor = other.editor
  }
  
  
  async livelyExample() {
    // const url = lively4url + "/src/components/tools/lively-ast-inspector.js";
    // const src = await fetch(url).then(r => r.text());
    
    const sourceCode = 'let x = 1; console.log(x);';
    var tree = await this.treeSitterParse(sourceCode)
    
    this.domainObject = TreeSitterDomainObject.fromTreeSitterAST(tree.rootNode)
    this.domainObject.replaceType('let', LetSmilyReplacementDomainObject)
    this.domainObject.replaceType('const', ConstSmilyReplacementDomainObject)
    
    const rootNode = tree.rootNode;
    this.inspect(this.domainObject);
  }

}