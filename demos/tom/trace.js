class Event {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

class Trace {
    constructor() {
        this._log = [];
    }
    
    log(event) {
        this._log.push(event);
    }
    
    aboutToEnter(name) {
        this.log(new Event('aboutToEnter', name));
    }
    
    enterFunction(name) {
        this.log(new Event('enterFunction', name));
    }
    
    leave() {
        this.log(new Event('leave'));
    }
    
    return() {
        this.log(new Event('return'));
    }
}

Trace.traceIdenifierName = 'currentTrace';

export default Trace;