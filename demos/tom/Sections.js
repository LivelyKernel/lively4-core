import { Event } from 'demos/tom/Events.js';

export class TraceSection {
    constructor(name, entries = []) {
        this._name = name;
        this.entries = entries;

        this.nodes = new Map();

        this.changes = [];
        this.hasChanges = false;
        
        // gets set appropriately to the associated node
        this.position;
    }
    
    get name() {
        return this._name;
    }
    
    get isSection() {
        return true;
    }

    addEntry(entry) {
        this.entries.push(entry);
    }
    
    privateAddChange(changeEvent) {
        this.hasChanges = true;
        this.changes.push(changeEvent);
    }

    addChange(changeEvent) {
        if (this.entries.last) {
            this.entries.last.addChange(changeEvent);
        } else {
            const stub = new Event('stub');
            this.entries.push(stub);
            stub.addChange(changeEvent);
        }
        
        this.privateAddChange(changeEvent);
    }
    
    enterFunction() {}

    somethingHappened() {
        return this.hasChanges || this.entries.length > 0;
    }

    apply(ast) {
        for (const change of this.changes) {
            change.apply(ast);
        }
    }

    visit(object) {
        object.visitTraceSection(this);
    }
    
    isFunction() {
        return false;
    }
}

export class PluginSection extends TraceSection {
    constructor(name, nodeID, entries = []) {
        super(name, entries);
        
        this.nodeID = nodeID;
    }
}

export class FunctionSection extends TraceSection {
    constructor() {
        super(...arguments);
        this.enteredFunction = false;
        this.wasCalledByNativeCode = false;
    }
    
    get name() {
        let name = '';
        
        if(this.wasCalledByNativeCode) {
            name += 'called ';
        }
        if(!this.enteredFunction){
            name += 'native ';
        }
        
        return name + `function: ${this._name}`;
    }
        
    enterFunction() {
        this.enteredFunction = true;
    }
    
    calledByNativeCode() {
        this.enteredFunction = true;
        this.wasCalledByNativeCode = true;
    }
    
    addChange(changeEvent) {        
        if(this.enteredFunction) {
            if (this.entries.last) {
                this.entries.last.addChange(changeEvent);
            } else {
                const stub = new Event('stub');
                this.entries.push(stub);
                stub.addChange(changeEvent);
            }
        }
        
        this.privateAddChange(changeEvent);
    }
    
    isFunction() {
        return true;
    }
}