"enable aexpr";



/*MD # Import Widget 
 #Prototype #Unfinished #Witzig #AST #Sandblocks

![](lively-code-mirror-widget-import.png){width=400px}

MD*/
import Morph from 'src/components/widgets/lively-morph.js';
import babelDefault from 'src/external/babel/babel7default.js'
const babel = babelDefault.babel;


import { promisedEvent, through, uuid as generateUUID } from 'utils';

const filesPromise = new Promise(resolve => {
  return lively.files.walkDir(lively4url)
    .then(files => Object.keys(SystemJS['@@loader-config'].map)
      .concat(files
        .filter(file => file.endsWith('.js'))
        .map(file => file.replace(lively4url, ''))
      )
    )
    .then(resolve)
})

export default class LivelyCodeMirrorWidgetImport extends Morph {

  static getAST(src) {
    try {
      const filename = "tempfile.js"
      // get pure ast
      return babel.transform(src, {
          babelrc: false,
          plugins: [], // no need for any syntax plugins (other than the SystemJS internal) as we only parse import statements
          presets: [],
          filename: filename,
          sourceFileName: filename,
          moduleIds: false,
          sourceMaps: false,
          // inputSourceMap: load.metadata.sourceMap,
          compact: false,
          comments: false,
          code: false,
          ast: true
      }).ast;
    } catch(e) {
      lively.warn('could not get ast for import statement', e);
    }
  }
  
  
  static createWidgetContainer() {
    var widget = document.createElement("span")
    Object.assign(widget.style, {
      whiteSpace: "normal"
    });
    return widget;
  }
  
  static async importWidgetForRange(cm, m) {
    const ast = this.getAST(m[0]);
    if(!ast) { return; }

    const from = cm.editor.posFromIndex(m.index);
    const to = cm.editor.posFromIndex(m.index + m[0].length);
    
    let marks = cm.editor.findMarks(from, to)
    let existingMarker = marks.find(ea => ea.importWidget)
    if (existingMarker) {
      lively.notify("found import widget")
      // do we have to update it?
      return
    }

    var container = this.createWidgetContainer();
    // #TODO, we assume that it will keep the first widget, and further replacements do not work.... and get therefore thrown away
    var marker = cm.editor.doc.markText(from, to, {
      replacedWith: container
    });
    marker.importWidget = container
    // lively.warn('return after container replacement')
    // return;
    await lively.create('lively-code-mirror-widget-import', container)
      .then(importWidget => importWidget.initWidget(cm, m, ast, marker));
  }

  async initialize() {
    this.windowTitle = "LivelyCodeMirrorWidgetImport";
     
    this.modulePath.addEventListener("keydown", evt => this.onModulePathKeyDown(evt))
  }
  
  get fileList() { return this.get('#fileList'); }
  
  get modulePath() { return this.get('#modulePath'); }

  prepareFileList() {
    filesPromise.then(files => {
      const fileList = this.fileList;
      files.forEach(file => {
        fileList.appendChild(<option value={file}></option>);
      })
    })
  }
  
  onFileChanged() {
    lively.success('file changed to', this.modulePath.value)
  }
  
  onModulePathKeyDown(evt) {
    var input = this.modulePath
    var range = this.marker.find()
    if (evt.keyCode == 13) { // ENTER
      // #TODO how to replace // update text without replacing widgets
      // this.cm.editor.replaceRange(input.value, range.from, range.to) // @Stefan, your welcome! ;-)
      // this.wrapLinks() // don't wait and do what you can now
    }
    if (evt.keyCode == 37) { // Left
      if (input.selectionStart == 0) {
        this.cm.editor.setSelection(range.from, range.from)
        this.cm.focus()
      }
    }

    if (evt.keyCode == 39) { // Right
      if (input.selectionStart == input.value.length) {
        this.cm.editor.setSelection(range.to, range.to)
        this.cm.focus()
      }
    }    
  }
  
  async initWidget(cm, m, ast, marker) {
    this.cm = cm;
    this.ast = ast;
    this.marker = marker;
    
    // this.modulePath.onfocus= e => lively.notify('FOCUSSED')
    // this.modulePath.onblur = e =>{
    //   lively.notify('BLURRED')
    // } 
    
    this.prepareFileList();

    CodeMirror.on(marker, "beforeCursorEnter", e => {
      function posEq(a, b) {return a.line == b.line && a.ch == b.ch;}
      var direction = posEq(this.cm.editor.getCursor(), this.marker.find().from) ? 'left' : 'right';
      this.cm.editor.widgetEnter = () => this.onEnter(direction);
    });

    await lively.create('lively-inspector', this)
      .through(inspector => inspector.inspect(ast))
      .through(inspector => inspector.hideWorkspace())
    this.cm.editor.refresh()
  }
  
  onEnter(direction) {
    // lively.success('ENTER FROM ' + direction)
    if (!this.marker.find()) {
      this.cm.editor.refresh();
    } else {
      // setTimeout(() => {
       this.enter(direction);
      // }, 50);
    }
  }
  
  enter(direction) {
    var module = this.modulePath;
    // this.focus()
    module.focus();
    setTimeout(() => {
      module.focus(); // #Hack, code mirror itself (match-highlighter, etc will snatch the focus... ok, make thatt that the body has it
    }, 101);
    // const position = direction === 'left' ? 0 : module.value.length;
    // module.setSelectionRange(position, position);
  }
}
