import * as _ from 'src/external/lodash/lodash.js';
import loadPlugin from 'demos/tom/plugin-load-promise.js';
import { ErrorEvent, Event, ASTChangeEvent, eventTypes } from 'demos/tom/Events.js';
import TraceLogParser from 'demos/tom/TraceLogParser.js';

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
            sectionID: 0,
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

    static async on(source, pluginsUrls) {
        const data = await loadPlugin(source, pluginsUrls);
        const obj = {
            locations: data.locations,
            oldAST: JSON.parse(data.oldAST),
            transformedAST: JSON.parse(data.transformedAST || '{}'),
            trace: Trace.deserializedFrom(data.trace),
            transformedCode: data.transformedCode
        };

        const trace = obj.trace;

        trace.oldAST = obj.oldAST;
        trace.transformedAST = obj.transformedAST;


        trace.analyze();
        return trace;
    }

    /* Position tracking */

    register(astNode, state) {
        if (this.astNodeRegistry.has(astNode)) {
            return this.astNodeRegistry.get(astNode);
        }

        const filename = state.file.opts.filename;
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

    /* AST changes */

    notify(objectID, key, oldValue, newValue, arrayProperty) {
        const event = new ASTChangeEvent(objectID, key, clone(oldValue), clone(newValue));
        this.log(event);
        event.arrayProperty = arrayProperty;
    }

    /* Plugins */

    enterPlugin(name) {
        this.log(new Event('enterPlugin', name));
    }

    leavePlugin(name) {
        this.log(new Event('leavePlugin', name));
    }

    /* Functions */

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


    /* Loops */

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

    /* Conditions */

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

    /* Assignments */
    assignment(position, left, right) {
        this.log(new Event('assignment', [clone(left), clone(right)], position));
        return right;
    }

    /* Error */

    error(error) {
        this.log(new ErrorEvent('error', [error.stack]));
    }

    /* Analyzation */

    analyze() {
        const parser = new TraceLogParser(this);
        this.sections = parser.parse();
    }
}
