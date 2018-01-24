import tern, * as t from 'src/external/aexpr/tern/tern.js';
import 'src/external/aexpr/tern/def.js';
import 'src/external/aexpr/tern/comment.js';
import 'src/external/aexpr/tern/infer.js';
import 'src/external/aexpr/tern/modules.js';
import 'src/external/aexpr/tern/es_modules.js';
t;

export class TernCodeMirrorWrapper {
  static loadDefinition(fileName) {
    return fetch(`src/external/aexpr/tern/${fileName}`).then(res => res.json());
  }
  static async initTernServer() {
    return new tern.Server({
      getFile(fileName, callback) {
        fetch(fileName)
          .then(res => res.text())
          .then(text => callback(null, text))
          .catch(callback);
      },
      async: true,
      // ecmaVersion: 6,
      defs: [
        await this.loadDefinition('browser.json'),
        await this.loadDefinition('chai.json'),
        await this.loadDefinition('ecmascript.json')
      ],
      plugins: {
        es_modules: true
      }
    });
  }
  static async ternServer() {
    return this._ternServerPromise = this._ternServerPromise || this.initTernServer();
  }
  
  static async request(req) {
    let ts = await this.ternServer();
    return new Promise((resolve, reject) => {
      ts.request(req, (error, response) => {
        if(error) {
          lively.error(error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
  
  static async showType(cmEditor, livelyCodeMirror) {
    let cursorPosition = cmEditor.getCursor();
    
    try {
      let response = await this.request({
        query: {
          type: "type",
          file: livelyCodeMirror.getTargetModule(),
          end: cursorPosition,
          start: undefined, // #TODO: improve by checking for selections first
          lineCharPositions: true
        },
        files: [{
          type: 'full',
          name: livelyCodeMirror.getTargetModule(),
          text: livelyCodeMirror.value
          
        }],
        //timeout: 10 * 1000
      });
      showContextInfo(cmEditor, response);
    } catch(error) {
      showError(cmEditor, error);
    }
  }
  static updateArgHints(cmEditor, livelyCodeMirror) {
    // #TODO: implement efficiently
    //updateArgHints(cmEditor, livelyCodeMirror, this)
  }
  
  static get jumpStack() {
    return this._jumpStack || (this._jumpStack = []);
  }
  static async inner(cmEditor, livelyCodeMirror, varName) {
    let cursorPosition = cmEditor.getCursor();
    
    try {
      let data = await this.request({
        query: {
          type: "definition",
          file: livelyCodeMirror.getTargetModule(),
          end: cursorPosition,
          start: undefined, // #TODO: improve by checking for selections first
          lineCharPositions: true
        },
        files: [{
          type: 'full',
          name: livelyCodeMirror.getTargetModule(),
          text: livelyCodeMirror.value
        }]
      });
      // lively.warn("start: " + data.start);
      // lively.warn("end: " + data.end);
      // lively.warn("file: " + data.file);
      // lively.warn("context: " + data.context);
      // lively.warn("contextOffset: " + data.contextOffset);
      // lively.warn("doc: " + data.doc);
      // lively.warn("url: " + data.url);
      // lively.warn("origin: " + data.origin);

      // #Whatever
      // if (!data.file && data.url) { window.open(data.url); return; }

      if (data.file) {
        this.jumpStack.push({
          file: livelyCodeMirror.getTargetModule(),
          start: cmEditor.getCursor("from"),
          end: cmEditor.getCursor("to")
        });
        // ### Stackpush, then moveTo
        this.moveTo(cmEditor, livelyCodeMirror, data, false);
      } else {
        showError(cmEditor, "Could not find a definition.");
      }
    } catch(error) {
      showError(cmEditor, error);
    }
  }
  static async moveTo(cmEditor, livelyCodeMirror, data, useDataDirectly) {
    let targetCM = cmEditor;

    // in same doc?
    if(livelyCodeMirror.getTargetModule() !== data.file) {
      let existingEditor = Array.from(document.querySelectorAll("body /deep/ lively-code-mirror"))
        .find(livelyCodeMirror => livelyCodeMirror.getTargetModule() === data.file);
      // jump to data.file
      if(existingEditor) {
        targetCM = existingEditor.editor;
      } else {
        let livelyEditor = await lively.openBrowser(data.file, true)
          .then(container => container.getEditor());
        targetCM = livelyEditor.currentEditor() //.editor;
      }
    }

    // #TODO: this does not break out of the shadowroot
    function findEnclosingWindow(element) {
      if(!element) { return undefined; }
      if(element.tagName === 'LIVELY-WINDOW') {
        return element;
      }
      if(element.tagName === 'BODY') {
        return undefined;
      }
      return findEnclosingWindow(element.parentElement);
    }
    let enclosingWindow = findEnclosingWindow(targetCM);
    if(enclosingWindow) {
      enclosingWindow.focus();
    }
    targetCM.focus();

    // go to correct location
    targetCM.setSelection(data.start, data.end);
  }
  static async jumpToDefinition(cmEditor, livelyCodeMirror) {
    if(!atInterestingExpression(cmEditor)) {
      showError(cmEditor, 'No interesting variable found');
    } else {
      this.inner(cmEditor, livelyCodeMirror);
    }
  }
  static async jumpBack(cmEditor, livelyCodeMirror) {
    jumpBack(cmEditor, livelyCodeMirror, this);
  }
  
  static async __temp__(cm) {
    let ts = await this.ternServer();
  
    //   server.addFile('https://lively-kernel.org/lively4/foo/foo.js', `
    // import { a } from './x';
    // var d = a();
    // d;`);
    //   server.addFile('src/client/reactive/tern-spike/a.js');
    //   server.addFile('https://lively-kernel.org/lively4/foo/x', `
    // export function a() {
    //   return document.createElement('span');
    // }`);

    server.request({
      query: {
        type: "definition",
        file: 'src/client/reactive/tern-spike/a.js',
        end: {
          line: 1,
          ch: 11
        },
        lineCharPositions: true
      },
      //files: [],
      //timeout: 10 * 1000
    }, (error, response) => {
      if(error) {
        lively.error(error);
        reject(error);
      } else {
        lively.notify(response, undefined, undefined, undefined, 'green');
        resolve(response);
      }
    });
  }
}

// ###############
// Show Type Query
// ###############

function showContextInfo(cm, data) {
  var tip = <span><strong>{data.type || 'not found'}</strong></span>;
  if(data.doc) {
    tip.appendChild(document.createTextNode(' - ' + data.doc));
  }
  if(data.url) {
    tip.appendChild(document.createTextNode(' '));
    tip.appendChild(<a href={data.url} target="_blank">[docs]</a>);
  }
  tempTooltip(cm, tip);
}

function showError(cm, msg) {
  tempTooltip(cm, String(msg));
}

function tempTooltip(cm, content) {
  if (cm.state.ternTooltip) remove(cm.state.ternTooltip);
  let { right, bottom } = cm.cursorCoords(undefined, 'local');
  let tip = cm.state.ternTooltip = makeTooltip(right + 1, bottom, content);
  cm.getWrapperElement().appendChild(tip);
  let mouseOnTip = false;
  let old = false;
  function maybeClear() {
    old = true;
    if (!mouseOnTip) clear();
  }
  function clear() {
    cm.state.ternTooltip = null;
    if (!tip.parentNode) return;
    cm.off("cursorActivity", clear);
    cm.off('blur', clear);
    cm.off('scroll', clear);
    fadeOut(tip);
  }
  CodeMirror.on(tip, 'mousemove', () => mouseOnTip = true);
  CodeMirror.on(tip, 'mouseout', e => {
    let targetElement = e.relatedTarget || e.toElement;
    if (targetElement && !CodeMirror.contains(tip, targetElement)) {
      if (old) {
        clear();
      } else {
        mouseOnTip = false;
      }
    }
  });
  setTimeout(maybeClear, 1700);
  cm.on("cursorActivity", clear);
  cm.on('blur', clear);
  cm.on('scroll', clear);
}

function makeTooltip(x, y, content) {
  var node = <div class="CodeMirror-Tern-tooltip">{content}</div>;
  node.style.left = x + 'px';
  node.style.top = y + 'px';
  return node;
}

function fadeOut(tooltip) {
  tooltip.style.opacity = "0";
  setTimeout(() => remove(tooltip), 1100);
}
function remove(node) {
  var parent = node && node.parentNode;
  if (parent) parent.removeChild(node);
}

// #####################################
// Moving to the definition of something
// #####################################

function jumpBack(cmEditor, livelyCodeMirror, ternServerWrapper) {
  let target = ternServerWrapper.jumpStack.pop();
  if(target) {
    ternServerWrapper.moveTo(cmEditor, livelyCodeMirror, target, true);
  }
}

function atInterestingExpression(cm) {
  var pos = cm.getCursor("end"), tok = cm.getTokenAt(pos);
  if (tok.start < pos.ch && tok.type == "comment") return false;
  return /[\w)\]]/.test(cm.getLine(pos.line).slice(Math.max(pos.ch - 1, 0), pos.ch + 1));
}
