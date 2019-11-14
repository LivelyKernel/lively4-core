"enable aexpr";

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

import { loc, range } from 'utils';
import {isAExpr} from 'src/client/ast-utils.js';

import Morph from 'src/components/widgets/lively-morph.js';

const COMPONENT_URL = `${lively4url}/src/babylonian-programming-editor`;

export default class CodemirrorPlayground extends Morph {

  get editor() { return this.get('#editor'); }
  get lcm() { return this.editor.get("lively-code-mirror"); }
  get $() { return this.lcm.editor; }

  async initialize() {
    this.windowTitle = "CodemirrorPlayground";

    const delayedUpdate = ((...args) => this.delayedUpdate(...args)).debounce(1000)
    this.lcm.addEventListener('change', () => {
      this.instantUpdate();
      delayedUpdate();
    })
    
    // Inject styling into CodeMirror
    const livelyEditorStyle = <link rel="stylesheet" href={`${COMPONENT_URL}/lively-code-editor-inject-styles.css`}></link>;
    const codeMirrorStyle = <link rel="stylesheet" href={`${COMPONENT_URL}/codemirror-inject-styles.css`}></link>;
    
    this.editor.shadowRoot.prepend(livelyEditorStyle);    
    this.lcm.shadowRoot.prepend(codeMirrorStyle);
    await this.lcm.editorLoaded();
    
    this.addExtragutter();
    
    this.$.addKeyMap({
      // #KeyboardShortcut Alt-A show additional info of this Active Expression
      "Alt-A": cm => {
        this.showAExprInfo();
      },
      // #KeyboardShortcut Alt-S snap to the next Active Expression
      "Alt-S": cm => {
        this.snapToNextAEXpr()
      },
    });
  }
  
  collectAExpr() {
    const allAExpr = [];
    
    this.lcm.value.traverseAsAST({
      CallExpression(path) {
        if (isAExpr(path) ) {
          allAExpr.push(path);
        }
      }
    });    
    return allAExpr;    
  }
  
  // TODO delete lel
  snapToNextAEXpr() {
    let aexprRanges = this.aexprs.map((path)=>range(path.node.loc));    
    if (!aexprRanges.length) { return; }
    
    const cursor = this.$.getCursor()
    const rangeToSelect = aexprRanges.find(r => r.contains(cursor)) ||
      aexprRanges.find(r => r.isBehind(cursor)) ||
      aexprRanges.last;
    
    rangeToSelect.selectInCM(this.$);
  }
  
  
  async showAExprInfo() {
    this.lcm.ternWrapper.then(tw => {
      
    });
    console.log(this.lcm);
    this.$.showHint({
      hint(...args) {
        lively.warn(args)
        return {
          list: [{
            text: 'gfoo',
            displayText: 'shows gfoo',
            className: 'cssClass',
            render(Element, self, data) {
              return Element.appendChild(<span><span style="color: green">hello: </span><span style="color: orange">Foo</span></span>);
            },
            hint(CodeMirror, self, data) {
              lively.success('selected', data.text)
            },
            from: {line:3, ch:5},
            to: {line:3, ch:10},
          }, 'bar'],
          from: {line:1, ch:5},
          to: {line:1, ch:10},
          selectedHint: 1
        };
      },
      completeSingle: false,
      alignWithWord: true,
      closeCharacters: /[\s()\[\]{};:>,]/,
      closeOnUnfocus: true,
      completeOnSingleClick: true,
      container: null,
      customKeys: null,
      extraKeys: null
    });
  }
  
  instantUpdate() {
    this.aexprs = this.collectAExpr();
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
    this.highlightText();
    this.setBookMark();
    
    this.showAExprMarker();
    
    
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

  /*MD ### Left Gutter MD*/
  addExtragutter() {
    const gutters = Array.from(this.$.options.gutters)
    if (!gutters.includes('extragutter')) {
      this.lcm.setCustomStyle(`
      .extragutter {
        width: 10px;

        transition: all 0.5s ease-in-out;
        transition-property: opacity;

        opacity: 0;
        background-color: lightgray;
        border-left: solid 0.3px gray;
        border-right: solid 0.3px gray;
      }
      .extragutter:hover {
        opacity: 0.4;
      }

      .extragutter-marker {
        width: 10px;
        cursor: pointer;
        box-sizing: content-box;

        transition: all 0.3s ease-in-out;
        transition-property: background-color, color;

        background-color: rgba(255,165,0,0.5);
        color: rgba(0,0,0,0.5);
        text-align: center;
        vertical-align: middle;
        line-height: normal;
        display: flex;
        justify-content: center; /* align horizontal */
        align-items: center; /* align vertical */
      }
      .extragutter-marker:hover {
        background-color: orange;
        color: black;
      }
      `)

      gutters.splice(gutters.indexOf('CodeMirror-linenumbers') + 1 || 0, 0, 'extragutter');
      this.lcm.setOption('gutters', gutters)
    }
  }
  
  showAExprMarker(){
    this.collectAExpr().forEach((path)=>{
      console.log(path);
      this.$.doc.setGutterMarker(
        path.node.loc.start.line-1,
        'extragutter',
        <div class="extragutter-marker" click={e => lively.notify('extra gutter marker clicked')}>0</div>// TODO render this without the "0"
      )
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