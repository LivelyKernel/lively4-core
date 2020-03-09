/*MD # Stack MD*/
export default class Stack {
  static get defaultErrorMessage() {
    return 'Error for stack';
  }
  constructor(error) {
    this._error = error;
    this._frames = this._computeFrames(this._error.stack);
    // lively.openInspector(this);
  }
  _computeFrames(desc) {
    let lines = desc.lines();
    if (lines.length >= 1) {
      if (lines[0].startsWith('Error: ')) {
        lines.shift();
      }
      return lines.map(line => new Frame(line, this));
    } else {
      console.error('could not get Stack from Error');
      debugger;
      return [];
    }
  }
  get frames() {
    return this._frames;
  }
  getFrame(id = 1) {
    return this.frames[id];
  }
  getFrames(from, to) {
    return this.frames.slice(from, to);
  }
}

/*MD # Frame
[regex101](https://regex101.com/)
MD*/
export class Frame {
  constructor(descPart, stack) {
    this._stack = stack;
    this._desc = descPart;

    this._extractInfos(this._desc)
  }

  _extractInfos(desc) {
    // " at doEvaluate (eval at loadJavaScript (https://lively-kernel.org/lively4/aexpr/src/client/boot.js:25:3), &lt;anonymous>:1554:13)"
    // can also have no infos on location of eval call:
    // "    at eval (eval at <anonymous> (https://lively-kernel.org/lively4/aexpr/test/stack-test.js!transpiled), <anonymous>:8:19)"
    const namedOuterEvalAnonymousFileLineChar = /^\s+at\s(.*)\s\(eval\sat\s(.*)\s\((.*)\)\,\s(.*)\:(\d+)\:(\d+)\)$/;
    let result2;
    if ((result2 = namedOuterEvalAnonymousFileLineChar.exec(desc)) !== null) {
      this._async = false
      this._func = result2[1];
      this._evalFunc = result2[2];
      this._evalFile = result2[3];
      // #TODO: get line/char of eval call if present (+ strip them from file name)
      // this._evalLine = result2[2];
      // this._evalChar = result2[3];
      this._file = result2[4];
      this._line = parseInt(result2[5]);
      this._char = parseInt(result2[6]);
      return;
    }
    // " at Function.stack (https://lively-kernel.org/lively4/aexpr/src/client/lively.js!transpiled:2548:19)"
    const namedFileLineChar = /^\s*at?(\sasync)?\s([\.a-zA-Z1-9]*)\s\((.*)\:(\d+)\:(\d+)\)$/
    let result;
    if ((result = namedFileLineChar.exec(desc)) !== null) {
      this._async = result[1] === ' async' ? true : false;
      this._func = result[2];
      this._file = result[3];
      this._line = parseInt(result[4]);
      this._char = parseInt(result[5]);
      return;
    }
    
    // " at https://lively-kernel.org/lively4/aexpr/src/external/mocha.js?1583757762700:4694:7"
    if (!this._desc.endsWith(')')) {
      const noNameFileLineChar = /^\s*at\s(.*)\:(\d+)\:(\d+)$/;
      let result = noNameFileLineChar.exec(desc);
      this._file = result[1];
      this._line = parseInt(result[2]);
      this._char = parseInt(result[3]);
      return;
    }

    lively.warn('could not analyse frame', desc)
    debugger
  }

  /**
   * returns Bool
   */
  get async() {
    return this._async;
  }

  get func() {
    return this._func;
  }

  get file() {
    return this._file;
  }

  get line() {
    return this._line;
  }

  get char() {
    return this._char;
  }

  get evalFunc() {
    return this._evalFunc;
  }

  get evalFile() {
    return this._evalFile;
  }

  // #TODO: implement
  openInBrowser(browser) {
    // #TODO: requires back mapping of source code information #SourceMaps
  }

}