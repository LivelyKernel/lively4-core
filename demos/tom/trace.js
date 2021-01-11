import * as _ from 'src/external/lodash/lodash.js';
import loadPlugin from 'demos/tom/plugin-load-promise.js'

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
    
    apply(ast) {
        
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
        if(this.entries.last) {
            this.entries.last.addChange(changeEvent);
        }
        this.changes.push(changeEvent);
        
    }
    
    somethingHappened() {
        return this.hasChanges || this.entries.length > 0;
    }
    
    visit(object) {
        object.visitTraceSection(this);
    }
}

class Trace {
    constructor() {
        this._log = [];
        this.counter = 0;
    }

    register(name) {
        console.log(name);
    }

    log(event) {
        this._log.push(event);
    }

    startTraversion() {
        this.log(new Event('startTraversion'));
    }
    
    createTraceID() {
        return {
            sectionId: 0,
            nodeId: this.counter++
        }
    }

    /* AST changes */

    notify(objectID, key, oldValue, newValue) {
        this.log(new ASTChangeEvent(objectID, key, clone(oldValue), clone(newValue)));
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
                    section.addEntry(entry);
                    stack.last.addEntry(section)
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
Trace.locations = [];
Trace.register = location => Trace.locations.push(location) - 1;
Trace.resolve = (number, locations) => locations[number];

Trace.on = async function(source, pluginsUrls) {
    const data = await loadPlugin(source, pluginsUrls)
    const obj = {
        locations: data.locations,
        oldAST: JSON.parse(data.oldAST),
        transformedAST: JSON.parse(data.transformedAST || '{}'),
        trace: Object.assign(new Trace(), JSON.parse(data.trace)),
        transformedCode: data.transformedCode
    };
    
    const trace = obj.trace;

    for (const entry of trace._log) {
        entry.position = obj.locations[entry.position];
        //console.log(entry)
    }

    trace.oldAST = obj.oldAST;
    trace.transformedAST = obj.transformedAST;

    trace.analyze();
    return trace;            
}

export default Trace;
