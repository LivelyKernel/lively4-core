"enable aexpr";

import babelDefault from 'systemjs-babel-build';
const babel = babelDefault.babel;

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
    this.$.addKeyMap({
      // #KeyboardShortcut Alt-A show additional info of this Active Expression
      "Alt-A": cm => {
        this.showAExprInfo();
      },
    });

  }
  
  async showAExprInfo() {
    lively.notify('stuff');
    let that = this
    that.lcm.ternWrapper.then(tw => {
      
    });
    return;
    this.$.showHint({
      hint(...args) {
        lively.warn(args)
        return {
          list: [{
            text: 'gfoo',
            displayText: 'shows gfoo',
            className: 'cssClass',
            render(Element, self, data) {
              return Element.appendChild(<span><span style="color: blue">hello: </span><span style="color: orange">Foo</span></span>);
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
    
    this.addExtragutter();
    this.extragutterMarker()
    
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
      {line: ast_node.loc.start.line - 1, ch: ast_node.loc.start.column}, 
      {line: ast_node.loc.end.line - 1, ch: ast_node.loc.end.column}, 
      {
        isTraceMark: true,
        className: "marked " +  1,
        css: "background-color: rgba(255, 255, 0, 0.5); border: solid 1px red",
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

  extragutterMarker() {
    this.lcm.value.traverseAsAST({
      Identifier: path => {
        if (path.node.name === 'aexpr') {
          this._extragutterMarker(path.node.loc.start.line-1, <div class="extragutter-marker" click={e => lively.notify('extra gutter marker')}><span>{path.node.name}</span></div>)
          
        }
      }
    });
  }

  _extragutterMarker(line, element) {
    this.$.doc.setGutterMarker(
      line, // line: integer|LineHandle,
      'extragutter', // gutterID: string,
      element, // value: Element
    )
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
  
  lineWidget() {
    this.lcm.value.traverseAsAST({
      Identifier: path => {
        if (path.node.name === 'aexpr') {
          this._lineWidget(path.node.loc)
        }
      }
    });
    
  }
  
  _lineWidget(location) {
    const element = <span class={"widget " + "probe-example"}>wdfdfwdw</span>;
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