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

    // #TODO: reinitiate after text changes
    this.editor.onTextChanged = () => {
      //this.augment()
    }
    
    // Inject styling into CodeMirror
    const livelyEditorStyle = <link rel="stylesheet" href={`${COMPONENT_URL}/lively-code-editor-inject-styles.css`}></link>;
    const codeMirrorStyle = <link rel="stylesheet" href={`${COMPONENT_URL}/codemirror-inject-styles.css`}></link>;
    this.editor.shadowRoot.prepend(livelyEditorStyle);
    this.lcm.shadowRoot.prepend(codeMirrorStyle);
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
    
    this.rightGutter();
    
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
        css: "background-color: rgba(255, 255, 0, 0.5)",
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

  addExtragutter() {
    const gutters = Array.from(this.$.options.gutters)
    if (!gutters.includes('extragutter')) {
      this.lcm.setCustomStyle(`
      .extragutter {
        width: 20px;
        background-color: lightblue;
        border-left: solid 2px gray;
        border-right: solid 2px gray;
      }
      `)

      gutters.splice(gutters.indexOf('CodeMirror-linenumbers') + 1 || 0, 0, 'extragutter');
      this.lcm.setOption('gutters', gutters)
    }
  }

  extragutterMarker() {
    this._extragutterMarker(2, <div style="background-color: azure; border-radius: 50%;"><span>x</span></div>)
    this._extragutterMarker(3, <span>y</span>)
  }

  _extragutterMarker(line, element) {
    this.$.doc.setGutterMarker(
      line, // line: integer|LineHandle,
      'extragutter', // gutterID: string,
      element, // value: Element
    )
  }

  rightGutter() {
    this._rightGutter(5, 'foo')
    this._rightGutter(6, 'bar')
    this._rightGutter(6, 'baz')
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
      lively.success('Rightgutter clicked')
        evt.stopPropagation()
    })
    markerLine.appendChild(resultNode)
  }
  
  lineWidget() {
    const element = <span class={"widget " + "kind"}>wdfdfwdw</span>;
    const line = 6;
    this.$.addLineWidget(line, element);
    const column = 5;
    const indentation = column;
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