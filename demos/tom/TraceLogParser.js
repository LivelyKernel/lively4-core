import { Event, eventTypes } from 'demos/tom/Events.js';
import { FunctionSection, PluginSection, TraceSection } from 'demos/tom/Sections.js';

class EarlyReturn {
    constructor(type) {
        this.type = type;
        this.isEarlyReturn = true;
    }
}

export default class TraceLogParser {
    constructor(trace) {
        this.trace = trace;
        this.index = 0;
    }
    
    get log() {
        return this.trace._log;
    }
    
    /* Parsing primitives */
    
    peek() {
        if(this.index < this.log.length) {
            return this.log[this.index];
        }
        
        return null;
    }
    
    consume() {
        const result = this.peek();
        this.index++;
        return result;
    }
    
    consumeAsEvent() {
        return this.instantiateEvent(this.consume());
    }
    
    match(expected) {
        const result = this.matchPeek(expected);
        if(result) {
            this.consume();
        }        
        return result;
    }
    
    matchPeek(expected) {
        const next = this.peek();
        if(next && next.type === expected) {            
            return true;
        }
        
        return false;
    }
    
    matchEarlyReturn(object, type) {
        return object.isEarlyReturn && object.type === type;
    }
    
    /* Parse methods */
    
    instantiateEvent(entry) {
        const eventClass = eventTypes[entry.__type__];
        const event = Object.assign(new eventClass(), entry);
        
        return event;
    }
    
    defaultParse(section, higherSections) {
        while(this.peek()) {
            if(this.match('leavePlugin')) {
                return section;
            } else if(this.matchPeek('return')) {
                const returnEntry = this.consume();
                section.addEntry(this.instantiateEvent(returnEntry));
                
                throw new EarlyReturn('function');
            } else if(this.matchPeek('leave')) {
                const leaveEntry = this.consume();
                if(leaveEntry.position === this.peek().position) {
                    this.match('left');
                }
                return section;
            }
            else if(this.matchPeek('enterPlugin')) {
                section.addEntry(this.parsePlugin());
            } else if(this.matchPeek('aboutToEnter')) {
                this.parseFunction(section, [...higherSections, section]);
            } else if(this.matchPeek('enterFunction')) {
                if(!section.isFunction() || (section.isFunction() && section._name !== this.peek().data)) {
                    // entered a function that got called from native code or babel

                    this.parseFunction(section, [...higherSections, section], false);
                } else {
                    this.match('enterFunction');
                }
            } else if(this.matchPeek('beginCondition')) {
                this.parseCondition(section, [...higherSections, section]);
            } else if(this.matchPeek('enterTraversePlugin')) {
                this.parseTraversePlugin(section, [...higherSections, section]);
            } else if(this.match('leaveTraversePlugin')) {
                return section;
            } else if(this.matchPeek('astChangeEvent')) {
                const change = this.consumeAsEvent();
                
                for(const sec of higherSections) {
                    sec.privateAddChange(change);
                }
                
                section.addChange(change);
            } else if(this.matchPeek('error')) {
                section.addEntry(this.consumeAsEvent());

                throw new EarlyReturn('error');
            } else if(this.match('endCondition')) {
                return section;
            } else if(this.match('left')) {
                return section;
            } else {
                section.addEntry(this.consumeAsEvent());
            }
        }
        
        return section;
    }
    
    parseTraversePlugin(section, higherSections) {
        const entry = this.consume();
        const plugin = new TraceSection('TraversePlugin:' + entry.data);
        
        section.addEntry(plugin);
        
        this.defaultParse(plugin, higherSections);
        
        return plugin;
    }
    
    parseCondition(section, higherSections) {
        const entry = this.consume();
        const condition = new TraceSection('Condition');
        condition.position = entry.position;
        
        section.addEntry(condition);
        
        this.defaultParse(condition, higherSections);
        
        return condition;
    }
    
    parseFunction(section, higherSections, calledByNonNativeCode = true) {
        const entry = calledByNonNativeCode ? this.consume() : this.peek();
        const fun = new FunctionSection(entry.data);
        fun.position = entry.position;
        
        if(!calledByNonNativeCode) {
            fun.calledByNativeCode();
        }
        
        section.addEntry(fun);
        
        try {
            this.defaultParse(fun, higherSections);
        } catch(e) {
            if(this.matchEarlyReturn(e, 'function')) {
                // triggered by return events
            } else {
                throw e;
            }
        }
        
        // Functions that got entered from native code or babel get not left event
        if(fun.position === this.peek().position) {
            this.match('left');
        }
        
        return fun;
    }
    
    parsePlugin(sections) {
        const plugin = new PluginSection(this.consume().data);
        sections.push(plugin);
        this.defaultParse(plugin, []);
        return plugin;
    }
    
    parse() {
        const sections = [];
        
        
        // ignores everything before the actual start of the traversion
        while(!this.match('startTraversion')) {
            this.consume();
        }
        
        try {
            while(this.peek()) {
                if(this.matchPeek('enterPlugin')) {
                    this.parsePlugin(sections);
                } else {
                    // ignore all unwanted entries
                    this.consume();
                }
            }
        } catch(e) {
            if (this.matchEarlyReturn(e, 'error')) {
                // triggered by error events
            } else {
                throw e;
            } 
        }
        
        return sections;
    }
}