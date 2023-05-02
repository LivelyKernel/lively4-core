import * as _ from 'src/external/lodash/lodash.js';
import loadPlugin from 'demos/tom/plugin-load-promise.js';
import { ErrorEvent, Event, ASTChangeEvent } from 'demos/tom/Events.js';
import TraceLogParser from 'demos/tom/TraceLogParser.js';

// #TODO get it to work because @onsetsu needs it.... #LivePluginExplorer


function clone(object) {
  if (object && object.constructor.name === 'NodePath') {
    return 'NodePath';
  }

  return _.cloneDeep(object);
}

export default class Trace {
  constructor() {
    this._log = [];

    this.counter = 0;
    this.pluginRound = 0;

    this.locations = [];
    this.filenames = [];
    this.fileRegistry = new Map();
    this.astNodeRegistry = new Map();
  }

  log(event) {
    this._log.push(event);
  }

  startTraversion() {
    this.log(new Event('startTraversion'));
  }

  createTraceID() {
    return {
      // plugin round not needed, but nice for debugging
      pluginRound: this.pluginRound,
      nodeID: this.counter++,
      isTraceID: true
    }
  }

  serialize() {
    const serialized = {};

    serialized._log = JSON.stringify(this._log);
    serialized.locations = JSON.stringify(this.locations);
    serialized.filenames = JSON.stringify(this.filenames);
    serialized.astNodeRegistry = JSON.stringify([...this.astNodeRegistry]);

    return serialized;
  }

  static get traceIdentifierName() {
    return '__currentTrace__';
  }

  static deserializedFrom(obj) {
    const trace = new Trace();

    trace._log = JSON.parse(obj._log);
    trace.locations = JSON.parse(obj.locations);
    trace.filenames = JSON.parse(obj.filenames);
    trace.astNodeRegistry = new Map(JSON.parse(obj.astNodeRegistry));

    return trace;
  }

  static async on(source, pluginData) {
    const data = await loadPlugin(source, pluginData);
    const obj = {
      oldAST: JSON.parse(data.oldAST),
      trace: Trace.deserializedFrom(data.trace),
    };

    const trace = obj.trace;
    
    trace.oldAST = obj.oldAST;
    trace.transformedAST = obj.transformedAST;


    trace.analyze();
    return trace;
  }

  /*MD ## Position tracking MD*/

  register(astNode, state) {
    if (this.astNodeRegistry.has(astNode)) {
      return this.astNodeRegistry.get(astNode);
    }
    let filename = state.file.opts.filename;
    
    // #TODO #HACK, babel7 adds "/" before path somehow.... internally into it's state 
    filename = filename.replace(/^\//,"")
    
    
    let fileID;

    if (this.fileRegistry.has(filename)) {
      fileID = this.fileRegistry.get(filename)
    } else {
      fileID = this.filenames.push(filename) - 1;
      this.fileRegistry.set(filename, fileID);
    }

    const start = astNode.loc.start;
    const end = astNode.loc.end;

    const location = [
      fileID,
      start.line,
      start.column,
      end.line,
      end.column
    ];

    const id = this.locations.push(location) - 1;
    this.astNodeRegistry.set(astNode, id);

    return id;
  }

  resolve(locationID) {
    const location = this.locations[locationID];
    return {
      filename: this.filenames[location[0]],
      startLine: location[1],
      startColumn: location[2],
      endLine: location[3],
      endColumn: location[4]
    }
  }

  /*MD ## AST changes MD*/

  notify(objectID, key, oldValue, newValue, arrayProperty) {
    const event = new ASTChangeEvent(objectID, key, oldValue, newValue);
    this.log(event);
    event.arrayProperty = arrayProperty;
  }

  /*MD ## Plugins MD*/

  enterPlugin(name, traceID) {
    this.log(new Event('enterPlugin', [name, traceID]));
    this.pluginRound++;
  }

  leavePlugin(name) {
    this.log(new Event('leavePlugin', name));
  }

  startTraversePlugin(name, traceID) {
    this.log(new Event('enterTraversePlugin', [name, traceID]));
  }

  endTraversePlugin(name) {
    this.log(new Event('leaveTraversePlugin', name));
  }

  /*MD ## Functions MD*/

  aboutToEnter(position, name) {
    this.log(new Event('aboutToEnter', name, position));
  }

  left(position, value) {
    this.log(new Event('left', undefined, position));
    return value;
  }

  enterFunction(position, name) {
    this.log(new Event('enterFunction', name, position));
  }

  leave(position) {
    this.log(new Event('leave', undefined, position));
  }

  return (position, returnValue) {
    this.log(new Event('return', clone(returnValue), position));
    return returnValue;
  }


  /*MD ## Loops MD*/

  beginLoop(position, loopType) {
    this.log(new Event('beginLoop', loopType, position));
  }

  nextLoopIteration(position, ...args) {
    this.log(new Event('nextLoopIteration', args.map(clone), position));
  }

  forIterator(position, iterator) {
    this.log(new Event('forIterator', iterator, position));
    return iterator;
  }

  forKeys(position, keys) {
    this.log(new Event('forKeys', keys, position));
    return keys;
  }

  endLoop(position) {
    this.log(new Event('endLoop', undefined, position));
  }

  /*MD ## Conditions MD*/

  beginCondition(position, conditionType) {
    this.log(new Event('beginCondition', conditionType, position));
  }

  conditionTest(position, value) {
    this.log(new Event('conditionTest', clone(value), position));
    return value;
  }

  endCondition(position) {
    this.log(new Event('endCondition', undefined, position));
  }

  /*MD ## Assignments MD*/
  assignment(position, left, right) {
    this.log(new Event('assignment', [clone(left), clone(right)], position));
    return right;
  }

  /*MD ## Error MD*/

  error(error) {
    this.log(new ErrorEvent('error', [error.stack]));
  }

  /*MD ## Analyzation MD*/

  analyze() {
    const parser = new TraceLogParser(this);
    this.sections = parser.parse();
  }
}
