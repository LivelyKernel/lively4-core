
class Case {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }

    applicable() {
        return this.from.every(layer => layer.isActive())
    }

    // TODO: do not activate and immediately deactivate again, if a layer is in 'from' and 'to'
    applyTransition() {
        this.from.forEach(requiredLayer => requiredLayer.deactivate());
        this.to.forEach(resultingLayer => resultingLayer.activate());
    }
}
class EventCapture {
    constructor(eventName, condition = () => true) {
        this.cases = [];
        this.eventType = eventName;
        this.listener = event => {
            // check whether the given condition is fulfilled
            if(!condition(event)) {
                return;
            }

            // semantics: Execute the first transitions that's requirement are fulfilled (i.e. the specified layers are active)
            var matchingCase = this.cases.find(c => c.applicable());

            if(matchingCase) {
                matchingCase.applyTransition();
            }
        };

        document.documentElement.addEventListener(eventName, this.listener, true);
    }

    transition(from, to) {
        this.cases.push(new Case(from, to));

        return this;
    }
    
    uninstall() {
        document.documentElement.removeEventListener(this.eventType, this.listener, true);

        return this;
    }
}

export default function onEvent(...args) {
    return new EventCapture(...args);
}
