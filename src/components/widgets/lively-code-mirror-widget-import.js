"enable aexpr";

import Morph from 'src/components/widgets/lively-morph.js';
import { babel } from 'systemjs-babel-build';
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
          ast: true,
          resolveModuleSource: undefined
      }).ast;
    } catch(e) {
      lively.warn('could not get ast for import statement', e);
    }
  }
  static createWidgetContainer() {
    lively.warn('U there?')
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

    var container = this.createWidgetContainer();
    // #TODO, we assume that it will keep the first widget, and further replacements do not work.... and get therefore thrown away
    var marker = cm.editor.doc.markText(from, to, {
      replacedWith: container
    });
    // lively.warn('return after container replacement')
    // return;
    await lively.create('lively-code-mirror-widget-import', container)
      .then(importWidget => importWidget.initWidget(cm, m, ast, marker));
  }
  async initialize() {
    this.windowTitle = "LivelyCodeMirrorWidgetImport";
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
  async initWidget(cm, m, ast, marker) {
    this.cm = cm;
    this.ast = ast;
    this.marker = marker;
    
    this.modulePath.onfocus= e => lively.notify('FOCUSSED')
    this.modulePath.onblur = e =>{
      lively.notify('BLURRED')
      debugger;
    } 
    
    this.prepareFileList();

    CodeMirror.on(marker, "beforeCursorEnter", e => {
      lively.success('HERE!')
      function posEq(a, b) {return a.line == b.line && a.ch == b.ch;}
      var direction = posEq(this.cm.editor.getCursor(), this.marker.find().from) ? 'left' : 'right';
      this.cm.editor.widgetEnter = () => this.onEnter(direction);
    });
    await lively.create('lively-inspector', this)
      ::through(inspector => inspector.inspect(ast))
      ::through(inspector => inspector.hideWorkspace())
    this.appendChild(<button click={e => {
      if (this.marker) {
        lively.error('#TODO: remove the marker and the import statement');
        // var range = marker.find()
        // lively.warn("hello " + JSON.stringify(range))
        // cm.editor.replaceRange("import " + Math.random(), range.from, range.to)
        // cm.wrapImports() // don't wait and do what you can now
      }
    }}>xxx</button>)
    this.appendChild(<input type="text" value={m[0]}></input>)
    this.cm.editor.refresh()
  }
  onEnter(direction) {
    lively.success('ENTER FROM ' + direction)
    if (!this.marker.find()) {
      this.cm.editor.refresh();
    } else {
      setTimeout(() => {
        this.enter(direction);
      }, 50);
    }
  }
  enter(direction) {
    var module = this.modulePath;
    module.focus();
    // const position = direction === 'left' ? 0 : module.value.length;
    // module.setSelectionRange(position, position);
  }
}
