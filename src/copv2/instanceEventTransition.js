
import notify from './activeEventTracking.js';

// TODO: structure duplicated with global eventTransition
class InstanceCase {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }

    applicableTo(obj) {
        return this.from.every(layer => layer.isActiveFor(obj));
    }

    // TODO: do not activate and immediately deactivate again, if a layer is in 'from' and 'to'
    applyTransitionFor(obj) {
        this.from.forEach(requiredLayer => requiredLayer.deactivateFor(obj));
        this.to.forEach(resultingLayer => resultingLayer.activateFor(obj));
    }
}

class InstanceEventCapture {
    constructor(eventName, selector, condition = () => true) {
        var cases = this.cases = [];
        this.notifier = notify(eventName, selector, function(event) {
            // check whether the given condition is fulfilled
            // 'this' is the dom element on which the event is applied on
            if(!condition(event, this)) {
                return;
            }

            // semantics: Execute the first transitions that's requirement are fulfilled (i.e. the specified layers are active)
            var matchingCase = cases.find(c => c.applicableTo(this));

            if(matchingCase) {
                matchingCase.applyTransitionFor(this);
            }
        });
    }

    transition(from, to) {
        this.cases.push(new InstanceCase(from, to));

        return this;
    }

    uninstall() {
        this.notifier.uninstall();

        return this;
    }
}

export default function onInstanceEvent(...args) {
    return new InstanceEventCapture(...args);
}
