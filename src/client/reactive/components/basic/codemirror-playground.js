"enable aexpr";

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import { loc, range } from 'utils';
import { isAExpr, leakingBindings } from 'src/client/dependency-graph/ast-utils.js';
import { DependencyGraph } from 'src/client/dependency-graph/graph.js';
import { getDependencyMapForFile } from 'src/client/reactive/active-expression-rewriting/active-expression-rewriting.js';
import LivelyCodeMirrorCodeProvider from 'src/components/widgets/lively-code-mirror-code-provider.js';

import Morph from 'src/components/widgets/lively-morph.js';

const COMPONENT_URL = `${lively4url}/src/babylonian-programming-editor`;

export default class CodemirrorPlayground extends Morph {

  get editor() { return this.get('#editor'); }
  get lcm() { return this.editor.get("lively-code-mirror"); }
  get $() { return this.lcm.editor; }
  get dependencyGraph(){
    return this._deps || (this._deps =  new DependencyGraph(new LivelyCodeMirrorCodeProvider(this.lcm, this.lcm.editor)));
  }
  
  get aexprs() {
    return this._aexprs || (this._aexprs = this.collectAExpr());
  }
  
  set aexprs(arr) {
    this._aexprs = arr;
  }
  
  get textMarkers() { return this._textMarkers = this._textMarkers || [] }
  
  invalidateAST(){
    delete this._deps;
    delete this._aexprs;
  }

  async initialize() {
    this.windowTitle = "CodemirrorPlayground";

    
    // Inject styling into CodeMirror
    const livelyEditorStyle = <link rel="stylesheet" href={`${COMPONENT_URL}/lively-code-editor-inject-styles.css`}></link>;
    const codeMirrorStyle = <link rel="stylesheet" href={`${COMPONENT_URL}/codemirror-inject-styles.css`}></link>;
    
    this.editor.shadowRoot.prepend(livelyEditorStyle);    
    this.lcm.shadowRoot.prepend(codeMirrorStyle);
    await this.lcm.editorLoaded();
    
    const delayedUpdate = ((...args) => this.delayedUpdate(...args)).debounce(1000)
    this.lcm.addEventListener('change', () => {
      this.instantUpdate();
      delayedUpdate();
    });
    this.$.on('cursorActivity', () => {
      
    });
    
    this.$.addKeyMap({
      // #KeyboardShortcut Alt-A show additional info of this Active Expression
      "Alt-A": cm => {
        this.showAExprInfo();
      },
      // #KeyboardShortcut Alt-S snap to the next Active Expression
      "Alt-S": cm => {
        this.snapToNextAEXpr()
      },
      
      // #KeyboardShortcut Alt-I invalidate AST
      "Alt-I": cm => {
        this.invalidateAST()
      },
    });
  }
  
  collectAExpr() {
    return this.dependencyGraph.collectAExpr();
  }
  
  selectedAExpr() {
    const cursor = this.$.getCursor();
    return this.aexprs.find((path) => {
      return range(path.node.loc).contains(cursor);
    });
  }
  
  // TODO delete lel
  snapToNextAEXpr() {
    
    this.showAExprMarker()

    const cursor = this.$.getCursor();
    let aexprRanges = this.aexprs.map((path)=>range(path.node.loc));    
    if (!aexprRanges.length) { return; }

    const rangeToSelect = aexprRanges.find(r => r.contains(cursor)) ||
      aexprRanges.find(r => r.isBehind(cursor)) ||
      aexprRanges.last;
    
    rangeToSelect.selectInCM(this.$);
  }
  
  resetTextMarkers() {
    while (this.textMarkers.length) {
      this.textMarkers.pop().clear();
    }
  }
  
  
  showAExprInfo() {
    this.resetTextMarkers();
    
    // ToDo: find the members in the code and resolve the dependencies in the graph.
    const map = getDependencyMapForFile(this.editor.getURL().pathname);
    map.forEach((ae, dependency) => {
      const memberName = dependency.contextIdentifierValue()[1];
      let deps = this.dependencyGraph.resolveDependenciesForMember(memberName);  
      deps.forEach((path) => {
        const r = range(path.node.loc).asCM();
        this.textMarkers.push(this.$.markText(r[0], r[1], {
          css: "background-color: orange",
        }))
      });
    })
    // resolving should be as easy as calling the _resolveDependencies method with the path
    
    //ToDo: This approach is primarily usefull for linking related events to the code. We should probably save the location per dependency and then use the events just for linking with i.e. timeline
    /*let dynamicAES = AExprRegistry.allAsArray();
    var valueChangedEvents = dynamicAES.flatMap(ae => ae.meta().get("events")).filter(event => event.type === "changed value");
    valueChangedEvents.forEach(event => {   
      if(event.value.trigger.source.includes(this.editor.getURL().pathname)) {     
        const r = range([event.value.trigger, {line: event.value.trigger.line, column: event.value.trigger.column + 5}]).asCM();
        this.textMarkers.push(this.$.markText(r[0], r[1], {
          css: "background-color: orange",
      }))
      }
    });
    deps.forEach((path) => {
      const r = range(path.node.loc).asCM();
      this.textMarkers.push(this.$.markText(r[0], r[1], {
        css: "background-color: orange",
      }))
    });*/
  }
  
  
  showAExprMarker() {
    let dict = new Map();
    let lines = [];    
    
    this.aexprs.forEach((path)=> {
      let dependencies = this.dependencyGraph.resolveDependencies(path.get("arguments")[0]);
      
      dependencies.forEach(statement => {
        // keep node identity instead of nodepaths???
        if (!dict.get(statement)) {
          dict.set(statement, []);
        }
      
        //for now store the aExpr directly as dep of the line.
        let tmp = dict.get(statement);
        tmp.push(path);
      });
    });
    
    for ( let [statement,aExprs] of dict.entries()){
      let line = statement.node.loc.start.line - 1; 
      if (!lines[line]) {
        lines[line] = [];
      }
      for (let aExpr of aExprs ){
        lines[line].push(aExpr);
      }
    }
    
    this.$.doc.clearGutter('activeExpressionGutter');
    lines.forEach((deps, line) => {
      this.lcm.drawAExprGutter(line, deps);
    })
  }
  
  instantUpdate() {
    this.invalidateAST();
    try{
      this.showAExprMarker();
    } catch (e) {
      console.error(e);
    }
    this.resetTextMarkers();
    lively.warn('instant update');
  }

  delayedUpdate() {
    lively.warn('delayed update');
    // #TODO: reinitiate after text changes
  }

  async loadFile(urlString) {
    this.editor.setURL(urlString)
    await this.editor.loadFile()
    await this.augment()
  }

  async augment() {
    this.invalidateAST();
    this.highlightText();
    this.setBookMark();
    
    this.identifierToRightGutter();
    
    this.lineWidget();

    lively.notify(this.$.getAllMarks())
  }
  
  highlightText() {
    const ast_node = {
      loc: {
        start: { line: 1, column: 1 },
        end: { line: 1, column: 13 }
      }
    }
    const marker = this.$.markText(
      ...range(ast_node.loc).asCM(),
      {
        isTraceMark: true,
        className: "marked " +  1,
        css: "background-color: rgba(255, 255, 0, 0.5); border: solid 0.1px red",
        title: 'This is some type'
      });
  }
  
  setBookMark() {
    const widget = <span click={evt => lively.success('click')} mouseenter={evt => widget.style.backgroundColor = 'green'} mouseleave={evt => widget.style.backgroundColor = 'red'} style="width:20px; height:20px; background-color: red; border-radius: 3px;" title="This is a Bookmark">bookmark</span>;
    const bookmark = this.$.setBookmark({line: 2, ch: 3}, {
      widget,
      insertLeft: true,
      handleMouseEvents: true
    })
    
  }

  /*MD #### Right Gutter MD*/
  identifierToRightGutter() {
    this.lcm.value.traverseAsAST({
      Identifier: path => {
        this._rightGutter(path.node.loc.start.line-1, path.node.name)
      }
    });
  }

  _rightGutter(line, text) {
    var info = this.$.lineInfo(line);
    var gutterMarkers = info && info.gutterMarkers;
    var markerLine = gutterMarkers && gutterMarkers.rightgutter
    if (!markerLine) {
        markerLine = document.createElement("div")
        // markerLine.style.backgroundColor = "rgb(240,240,240)"
        markerLine.style.fontSize = "8pt"
        markerLine.style.whiteSpace = "nowrap"
        // markerLine.style.overflow = "hidden"
        markerLine.classList.add("markerLine")  // markerLine
        this.$.setGutterMarker(line, "rightgutter", markerLine)
    }
    var resultNode = document.createElement("span");
    resultNode.classList.add("markerResult")
    resultNode.classList.add("markId_" + 1)
    
    resultNode.textContent = text
    
    resultNode.addEventListener("click", (evt) => {
      lively.success('Rightgutter clicked: ' + text)
        evt.stopPropagation()
    })
    markerLine.appendChild(resultNode)
  }
  
  /*MD ## Line Widget MD*/
  lineWidget() {
    this.lcm.value.traverseAsAST({
      CallExpression: path => {
        const callee = path.get('callee');
        if (!callee) { return; }
        
        if (callee.isIdentifier() && callee.node.name === 'aexpr') {
          const arrowFunction = path.get('arguments')[0];
          if (arrowFunction.isArrowFunctionExpression()) {
            const expression = arrowFunction.get('body');
            expression.traverse({
              Identifier: path => {
                const clickCallback = async e => {
                  this.lcm.ternWrapper.then(async tw => {
                    const data = await tw.playgroundGetDefinition(
                      this.$,
                      this.lcm,
                      path.node.loc
                    );
                    if (data) {
                      range(data).selectInCM(this.$)
                    }
                  });
                };

                const element = <span
                  class={"widget " + "probe-example"}
                  click={clickCallback}
                >find definition of {path.node.name}</span>;
                this._lineWidget(path.node.loc, element);
              }
            });
          }
        }
      }
    });
  }
  
  _lineWidget(location, element) {
    const line = location.start.line - 1;
    this.$.addLineWidget(line, element);
    const indentation = location.start.column;
    element.style.left = `${indentation}ch`;
  }
  
  /* Lively-specific API */

  livelyPreMigrate() {
    // is called on the old object before the migration
  }
  
  livelyMigrate(other) {
    this.loadFile(other.editor.getURL());
  }
  
  livelyInspect(contentNode, inspector) {
    // do nothing
  }
  
  livelyPrepareSave() {
  }
  
  async livelyExample() {
    this.loadFile(lively4url + "/src/client/reactive/components/basic/codemirror-playground-example.js")
  }
  
  
}