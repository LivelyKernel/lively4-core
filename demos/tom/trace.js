import * as _ from 'src/external/lodash/lodash.js';

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
        
        this.hasChanges = false;
    }

    addEntry(entry) {
        this.entries.push(entry);
    }
    
    addChange(changeEvent) {
        this.hasChanges = true;
        this.entries.last.addChange(changeEvent);
    }
    
    visit(object) {
        object.visitTraceSection(this);
    }
}

class Trace {
    constructor() {
        this._log = [];
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

    /* AST changes */

    notify(key, oldValue, newValue) {
        this.log(new ASTChangeEvent(null, key, clone(oldValue), clone(newValue)));
    }

    /* Plugins */

    enterPlugin(name) {
        this.log(new Event('enterPlugin', name));
    }

    leavePlugin(name) {
        this.log(new Event('leavePlugin', name));
    }

    /* Functions */

    aboutToEnter(position, name, returnValue) {
        this.log(new Event('aboutToEnter', name, position));
        return returnValue;
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

    /* Analyzation */

    analyze() {
        this.sections = [];

        let startIndex = 0;
        while (this._log[startIndex].type !== 'startTraversion') {
            startIndex++;
        }
        startIndex++;

        const stack = [];
        console.log(startIndex);
        for (const entry of this._log.slice(startIndex)) {
            switch (entry.type) {
                case 'enterPlugin':
                    stack.push(new TraceSection(entry.data));
                    break;
                case 'leavePlugin':
                    const section = stack.pop();
                    if (stack.last) {
                        stack.last.addEntry(section);
                    } else {
                        this.sections.push(section);
                    }
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
        this.sections = this.sections.filter(section => section.entries.length > 0);
    }
}

Trace.traceIdenifierName = '__currentTrace__';
Trace.locations = [];
Trace.register = location => Trace.locations.push(location) - 1;
Trace.resolve = (number, locations) => locations[number];

export default Trace;
