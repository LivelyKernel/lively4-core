import Trace from 'demos/tom/trace.js';

const excludedProperties = ['end', 'loc', 'start', 'traceID', 'type'];

function copy(value) {
    return value; // JSON.parse(JSON.stringify(value));
}

function createObservingAccessorsOn(object, propertyName, observer) {
    const newPropertyName = '_' + propertyName;
    object[newPropertyName] = object[propertyName];
    Object.defineProperty(object, propertyName, {
        get() { return object[newPropertyName]; },
        set(value) {
            observer.notify(object.traceID, propertyName, object[newPropertyName], value);
            wrapAST(value, observer, true);
            object[newPropertyName] = value;
        }
    })
}

const handler = (observer) => {
    return {
        set: function(obj, prop, value) {
            // Todo: Reflect.set()
            if (Number.isInteger(Number.parseInt(prop))) {
                observer.notify(prop, copy(obj[prop]), copy(value));
                wrapAST(value, observer, true);
            }
            obj[prop] = value;
            return true;
        }
    }
};

function wrappedArray(array, observer) {
    return new Proxy(array, handler(observer));
}

export default function wrapAST(astNode, observer, onlyUnknownNodes) {
    // simply check if the object is an astNode
    if (astNode.type) {
        if (onlyUnknownNodes) {
            if (astNode.traceID) {
                return;
            } else {
                astNode.traceID = window[Trace.traceIdenifierName].createTraceID();
            }
        }

        const keys = Object.keys(astNode).filter(key => !excludedProperties.includes(key));
        for (const key of keys) {
            const value = astNode[key];


            if (Array.isArray(value)) {
                for (const entry of value) {
                    wrapAST(entry, observer, onlyUnknownNodes);
                }

                const arrayObserver = {
                    notify(key, oldValue, newValue) {
                        observer.notify(astNode.traceID, key, oldValue, newValue)
                    }
                };

                // Todo: do better handling
                astNode[key] = wrappedArray(value, arrayObserver);

                // notify if the array is replaced
                createObservingAccessorsOn(astNode, key, observer);

                continue;
            }

            if (value === null) {
                createObservingAccessorsOn(astNode, key, observer);
                continue;
            }

            switch (typeof value) {
                case 'function':
                    // ignore functions
                    break;
                case 'object':
                    // assume it is an astNode
                    wrapAST(value, observer, onlyUnknownNodes);
                    // fallthrough as we want to know if a node is replaced
                default:
                    createObservingAccessorsOn(astNode, key, observer);
            }
        }
    }
}
