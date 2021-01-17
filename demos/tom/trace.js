import * as _ from 'src/external/lodash/lodash.js';
import loadPlugin from 'demos/tom/plugin-load-promise.js'

const excludedProperties = ['end', 'loc', 'start', 'traceID', 'type'];

class Event {
    constructor(type, data, position) {
        this.type = type;
        this.position = position;
        this.data = data;

        this.changes = [];
        this.hasChanges = false;

        this.__type__ = 'Event';
    }

    addChange(changeEvent) {
        this.hasChanges = true;
        this.changes.push(changeEvent);
    }

    apply(ast) {
        for (const change of this.changes) {
            change.apply(ast);
        }
    }

    visit(object) {
        object.visitEvent(this);
    }
}

class ASTChangeEvent {
    constructor(id, propertyName, oldValue, newValue) {
        this.objectID = id;
        this.propertyName = propertyName;
        this.oldValue = oldValue;
        this.newValue = newValue;

        this.__type__ = 'ASTChangeEvent';
    }

    getNode(id, astNode) {


        if (astNode.type) {
            const isSearchedNode = value => value && value.traceID !== undefined && value.traceID.nodeID === id.nodeID;

            if (isSearchedNode(astNode)) {
                return astNode;
            }

            const keys = Object.keys(astNode).filter(key => !excludedProperties.includes(key));
            for (const key of keys) {
                const value = astNode[key];


                if (Array.isArray(value)) {
                    for (const entry of value) {
                        const node = this.getNode(id, entry)
                        if (isSearchedNode(node)) {
                            return node;
                        }
                    }

                    continue;
                }

                if (!value) {
                    continue;
                }

                switch (typeof value) {
                    case 'function':
                        // ignore functions
                        break;
                    case 'object':
                        // assume it is an astNode
                        const node = this.getNode(id, value)
                        if (isSearchedNode(node)) {
                            return node;
                        }
                        // fallthrough as we want to know if a node is replaced
                    default:
                        // ignore value
                }
            }
        }
    }

    apply(ast) {
        let astNode = this.getNode(this.objectID, ast);
        if (this.arrayProperty) {
            astNode = astNode[this.arrayProperty];
        }
        astNode[this.propertyName] = this.newValue;
    }

    revert(ast) {

    }

    visit(object) {
        object.visitASTChangeEvent(this);
    }
}

const eventTypes = {
    ASTChangeEvent: ASTChangeEvent,
    Event: Event,
};

function clone(object) {
    if (object && object.constructor.name === 'NodePath') {
        return 'NodePath';
    }

    return _.cloneDeep(object);
}

class TraceSection {
    constructor(name, entries = []) {
        this.name = name;
        this.entries = entries;

        this.nodes = new Map();

        this.changes = [];
        this.hasChanges = false;
    }

    addEntry(entry) {
        this.entries.push(entry);
    }

    addChange(changeEvent) {
        this.hasChanges = true;
        if (this.entries.last) {
            this.entries.last.addChange(changeEvent);
        } else {
            const stub = new Event('stub');
            this.entries.push(stub);
            stub.addChange(changeEvent);
        }
        this.changes.push(changeEvent);

    }

    somethingHappened() {
        return this.hasChanges || this.entries.length > 0;
    }

    apply(ast) {
        for (const change of this.changes) {
            change.apply(ast);
        }
    }

    revert(ast) {

    }

    visit(object) {
        object.visitTraceSection(this);
    }
}

class Trace {
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
            nodeID: this.counter++
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
    
    static deserializedFrom(obj) {
        const trace = new Trace();
        
        trace._log = JSON.parse(obj._log);
        trace.locations = JSON.parse(obj.locations);
        trace.filenames = JSON.parse(obj.filenames);
        trace.astNodeRegistry = new Map(JSON.parse(obj.astNodeRegistry));
        
        return trace;
    }

    /* */

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
        return name;
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
        this.log(new Event('error', [error.stack]));
    }

    /* Analyzation */

    analyze() {
        this.sections = [];

        let startIndex = 0;
        while (this._log[startIndex].type !== 'startTraversion') {
            startIndex++;
        }
        startIndex++;

        const stack = [];
        let section;
        for (const entry of this._log.slice(startIndex)) {
            switch (entry.type) {
                case 'enterPlugin':
                    stack.push(new TraceSection(entry.data));
                    break;
                case 'leavePlugin':
                    section = stack.pop();
                    if (stack.last) {
                        stack.last.addEntry(section);
                    } else {
                        this.sections.push(section);
                    }
                    break;
                case 'error':
                    section = stack.pop();
                    section.addEntry(Object.assign(new Event(), entry));
                    this.sections.push(section);
                    break;
                default:
                    if (stack[stack.length - 1]) {
                        const eventClass = eventTypes[entry.__type__];
                        const event = Object.assign(new eventClass(), entry);
                        event.visit({
                            visitEvent(event) {
                                stack.last.addEntry(event);
                            },
                            visitASTChangeEvent(changeEvent) {
                                stack.last.addChange(changeEvent);
                            }
                        });

                    }
            }
        }

        this.sections.push(...stack);
        this.sections = this.sections.filter(section => section.somethingHappened());
    }
}

Trace.traceIdenifierName = '__currentTrace__';

Trace.on = async function(source, pluginsUrls) {
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

export default Trace;
