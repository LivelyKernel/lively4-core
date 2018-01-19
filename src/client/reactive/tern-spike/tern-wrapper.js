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
        //lively.notify(`tern.Server get ${fileName}`, undefined, undefined, undefined, 'gray');
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
          start: undefined,
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
