
import sourcemap from 'src/external/source-map.min.js';

/*MD # Stack MD*/
export default class Stack {
  static get defaultErrorMessage() {
    return 'Error for stack';
  }
  constructor({ omitFn = Stack, max }) {
    Error.stackTraceLimit = Infinity;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this._error = {}, omitFn);
    }
    
    if (!this._error || !this._error.stack) return
    this._frames = this._computeFrames(this._error.stack || [], max) || [];
  }
  _computeFrames(desc, max) {
    return desc.lines().slice(1, max).map(line => new Frame(line));
  }
  get frames() {
    return this._frames || [];
  }
  getFrame(id = 1) {
    return this.frames[id];
  }
  getFrames(from, to) {
    return this.frames.slice(from, to);
  }
  toString() {
    return this.frames.join('\n');
  }
}

/*MD # Frame
View some examples at [regex101](https://regex101.com/r/pSppPm/3)
MD*/
export class Frame {
  constructor(desc) {
    this._desc = desc;
    this._extractInfos(this._desc);
  }

  _extractInfos(desc) {
    // just file, transpiled, line, char given -> no parens around
    // " at https://lively-kernel.org/lively4/aexpr/src/external/mocha.js?1583757762700:4694:7"
    if (!this._desc.endsWith(')')) {
      const extractSourceInfo = /^\s+at\s(.*)$/;
      const result = extractSourceInfo.exec(desc);
      // lively.openInspector(result)
      const info = this._getFileLineChar(result[1]);
      this._applyLocationInfo(info);

      return;
    }

    // e.g. " at Function.stack (https://lively-kernel.org/lively4/aexpr/src/client/lively.js!transpiled:2548:19)"
    const isNamedCall = /^\s+at\s([^\(]*)\s\((.*)\)$/;
    let namedCall;
    if ((namedCall = isNamedCall.exec(desc)) !== null) {
      const [, funcDesc, location] = namedCall;

      let locations;
      // " at doEvaluate (eval at loadJavaScript (https://lively-kernel.org/lively4/aexpr/src/client/boot.js:25:3), &lt;anonymous>:1554:13)"
      // can also have no infos on function name of eval call:
      // "    at eval (eval at <anonymous> (https://lively-kernel.org/lively4/aexpr/test/stack-test.js!transpiled), <anonymous>:8:19)"
      const getLocations = /^(?:eval\sat\s(.*\)),\s)?(.*)$/;
      if ((locations = getLocations.exec(location)) !== null) {
        const [, evalInfo, sourceLocation] = locations;

        if (evalInfo) {
          this._extractEvalInfos(evalInfo);
        }

        const info = this._getFileLineChar(sourceLocation);
        this._applyLocationInfo(info);
      }

      const info2 = this._getFunction(funcDesc);
      this._applyFunctionInfo(info2);

      return;
    }

    lively.warn('could not analyse frame', desc);
  }

  _extractEvalInfos(desc) {
    const isNamedCall = /^([^\(]*)\s\((.*)\)$/;
    let namedCall;
    if ((namedCall = isNamedCall.exec(desc)) !== null) {
      const [, funcDesc, location] = namedCall;

      const info = this._getFileLineChar(location);
      this._applyEvalLocationInfo(info);

      const info2 = this._getFunction(funcDesc);
      this._applyEvalFunctionInfo(info2);
    }
  }

  /*MD ## location utils MD*/
  _getFileLineChar(locationDesc) {
    function reverseString(str) {
      return str.split('').reverse().join('');
    }

    const reversedDesc = reverseString(locationDesc);
    const reversedFileLineChar = /^(?:(\d+):)?(?:(\d+):)?(?:(delipsnart)!)?(.*)$/;

    const [, char, line, transpiled, file] = reversedFileLineChar.exec(reversedDesc);

    return {
      char: char && parseInt(reverseString(char)),
      line: line && parseInt(reverseString(line)),
      transpiled: !!transpiled,
      file: reverseString(file)
    };
  }

  _applyLocationInfo({ char, line, transpiled, file }) {
    this._char = char;
    this._line = line;
    this._transpiled = transpiled;
    this._file = file;
  }

  _applyEvalLocationInfo({ char, line, transpiled, file }) {
    this._evalChar = char;
    this._evalLine = line;
    this._evalTranspiled = transpiled;
    this._evalFile = file;
  }

  /*MD ## func utils MD*/
  _getFunction(desc) {
    const newAsyncFunc = /^(?:(new)\s)?(?:(async)\s)?(.+)$/;

    const [, isNew, isAsync, func] = newAsyncFunc.exec(desc);

    return {
      isNew: !!isNew,
      isAsync: !!isAsync,
      func
    };
  }

  _applyFunctionInfo({ isNew, isAsync, func }) {
    this._new = isNew;
    this._async = isAsync;
    this._func = func;
  }

  _applyEvalFunctionInfo({ isNew, isAsync, func }) {
    this._evalNew = isNew;
    this._evalAsync = isAsync;
    this._evalFunc = func;
  }
  
  async _determineSourceInfo() {
    const sourceMappingURL = this.sourceMapURL();
    if(!sourceMappingURL || !(await lively.files.exists(sourceMappingURL))) {
      if(this._file !== "<anonymous>") {
        this._sourceLoc = { line: this._line, column: this._char, source: this._file };
      }
      return;
    } 

    var sourceMap = await sourceMappingURL.fetchJSON();
    // guard against trash source map
    if (sourceMap == null) {
      this._sourceLoc = { line: this._line, column: this._char, source: this._file };
      return 
    }
    
    var smc = sourcemap.SourceMapConsumer(sourceMap);
    this._sourceLoc = smc.originalPositionFor({
      line: parseInt(this._line),
      column: parseInt(this._char)
    });
  }

  sourceMapURL() {
    if (this._file === "<anonymous>") return;

    const [livelyPath, srcPath] = this._file.split("/src/");

    if (!srcPath) {
      return;
    }

    const sourceMappingURL = livelyPath + "/.transpiled/" + ("src/" + srcPath).replaceAll("/", "_") + ".map.json";
    // return "cached://" + sourceMappingURL; // #TODO bug with markus?
    return sourceMappingURL;
  }

  /*MD ## func MD*/
  /**
   * returns Bool
   */

  get async() {
    return this._async || false;
  }

  get new() {
    return this._new || false;
  }

  get func() {
    return this._func;
  }

  /*MD ## location MD*/
  get file() {
    return this._file;
  }

  get transpiled() {
    return this._transpiled || false;
  }

  get line() {
    return this._line;
  }

  get char() {
    return this._char;
  }

  async getSourceLocBabelStyle() {
    if (!this._sourceLoc) {
      await this._determineSourceInfo();
      if (!this._sourceLoc) return undefined;
    }
    const location = { line: this._sourceLoc.line, column: this._sourceLoc.column };
    return { start: location, end: location, file: this._sourceLoc.source };
  }

  async getSourceLoc() {
    if (!this._sourceLoc) {
      await this._determineSourceInfo();
    }
    return this._sourceLoc;
  }

  async getSourceLine() {
    if (!this._sourceLoc.line) {
      await this._determineSourceInfo();
    }
    return this._sourceLoc.line;
  }

  async getSourceChar() {
    if (!this._sourceLoc.character) {
      await this._determineSourceInfo();
    }
    return this._sourceLoc.column;
  }

  /*MD ## eval func MD*/
  /**
   * returns Bool
   */
  get evalAsync() {
    return this._evalAsync || false;
  }

  get evalNew() {
    return this._evalNew || false;
  }

  get evalFunc() {
    return this._evalFunc;
  }

  /*MD ## eval location MD*/
  get evalFile() {
    return this._evalFile;
  }

  get evalTranspiled() {
    return this._evalTranspiled;
  }

  get evalLine() {
    return this._evalLine;
  }

  get evalChar() {
    return this._evalChar;
  }

  /*MD ## utils MD*/
  // #TODO: implement
  openInBrowser(browser) {
    // #TODO: requires back mapping of source code information #SourceMaps
  }

  toString() {
    return this._desc.replace(/\s+at\s/, '');
  }

}